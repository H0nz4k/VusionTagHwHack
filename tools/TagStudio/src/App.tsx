import { useCallback, useEffect, useRef, useState } from "react";
import type { IndexedBitmap, Layer, Orientation, ProfileId, Project } from "./core/types";
import { bitmapsEqual, createIndexed } from "./core/palette";
import { canvasSizeFor, validateCustomSize } from "./core/profiles";
import {
  applyProfileChange,
  cloneProject,
  createImageLayer,
  createLineLayer,
  createProject,
  createRectLayer,
  createTextLayer,
  duplicateLayer,
  findLayer,
  parseProjectJson,
  ProjectError,
  reorderLayers,
  serializeProject,
  updateLayer,
} from "./core/project";
import { decodeDataUrlImage, decodeImageFile } from "./core/imageIO";
import { rasterizeTextLayers, renderProject, type ImageCache } from "./core/render";
import { diagnosticDecode, defaultExportStem, downloadBytes, downloadText, exportBin, exportC, exportPng } from "./core/exportAll";
import { clearAutosave, readAutosave, writeAutosave } from "./core/autosave";
import { formatProjectFolderName, uniqueName } from "./core/folder";
import { createProjectFromTemplate, type TemplateId } from "./core/templates";
import { TemplateGallery } from "./ui/TemplateGallery";
import { maskToPreview } from "./core/bwr";
import { IdbHandleStore, isFsAccessAvailable, pickRootDirectory } from "./fs/access";
import { FsAbortError, FsNotAllowedError, writeFileAtomic, type FsDirectoryHandle } from "./fs/types";
import { buildProjectFiles, writeAllToDir, writeNamed, zipAll, type ConflictChoice } from "./fs/projectIo";
import { Toolbar, type FolderStatus } from "./ui/Toolbar";
import { LeftPanel } from "./ui/LeftPanel";
import { RightPanel } from "./ui/RightPanel";
import { StatusBar } from "./ui/StatusBar";
import { CanvasStage } from "./ui/CanvasStage";
import { blitIndexed } from "./ui/blit";

const MAX_UNDO = 40;

export function App() {
  const [project, setProject] = useState<Project>(() => createProject());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [past, setPast] = useState<Project[]>([]);
  const [future, setFuture] = useState<Project[]>([]);
  const [dirty, setDirty] = useState(false);
  const [zoom, setZoom] = useState(2);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [bitmap, setBitmap] = useState<IndexedBitmap>(() => createIndexed(296, 152));
  const [redMask, setRedMask] = useState<Uint8Array | null>(null);
  const [previewMode, setPreviewMode] = useState<"result" | "mask">("result");
  const [diag, setDiag] = useState<{ bitmap: IndexedBitmap; invalid: number; match: boolean } | null>(null);
  const [restore, setRestore] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<FsDirectoryHandle | null>(null);
  const [projectDir, setProjectDir] = useState<FsDirectoryHandle | null>(null);
  const [fsSupported, setFsSupported] = useState(false);
  const [perm, setPerm] = useState<"granted" | "denied" | "prompt">("prompt");
  const [conflict, setConflict] = useState<{ names: string[]; resolve: (c: ConflictChoice) => void } | null>(null);
  const [writeLog, setWriteLog] = useState<string | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const handleStore = useRef(new IdbHandleStore());
  const [profileDlg, setProfileDlg] = useState<{
    profileId: ProfileId;
    orientation: Orientation;
    customWidth: number;
    customHeight: number;
  } | null>(null);
  const fileOpenRef = useRef<HTMLInputElement>(null);
  const imageOpenRef = useRef<HTMLInputElement>(null);
  const cacheRef = useRef<ImageCache>(new Map());
  const gestureBase = useRef<Project | null>(null);
  const projectRef = useRef(project);
  projectRef.current = project;

  useEffect(() => {
    const rec = readAutosave();
    if (rec?.projectJson) setRestore(rec.projectJson);
    const e2e = window.__TAGSTUDIO_E2E__;
    const supported = e2e?.disableFs ? false : isFsAccessAvailable();
    setFsSupported(supported);
    if (!supported) return;
    void handleStore.current.loadRoot().then(async (h) => {
      if (!h) return;
      const p = await h.queryPermission();
      setPerm(p);
      setWorkspace(h);
    });
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => writeAutosave(serializeProject(project)), 800);
    return () => window.clearTimeout(t);
  }, [project]);

  useEffect(() => {
    const fn = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", fn);
    return () => window.removeEventListener("beforeunload", fn);
  }, [dirty]);

  const selected = findLayer(project, selectedId);

  const commit = useCallback((next: Project, base?: Project) => {
    const stamped = { ...next, modifiedAt: new Date().toISOString() };
    setPast((p) => [...p.slice(-(MAX_UNDO - 1)), cloneProject(base ?? projectRef.current)]);
    setFuture([]);
    setProject(stamped);
    setDirty(true);
    setError(null);
    setDiag(null);
  }, []);

  const live = useCallback((next: Project) => {
    if (!gestureBase.current) gestureBase.current = cloneProject(projectRef.current);
    setProject(next);
    setDiag(null);
  }, []);

  const finishGesture = useCallback(() => {
    const base = gestureBase.current;
    gestureBase.current = null;
    if (!base) return;
    setPast((p) => [...p.slice(-(MAX_UNDO - 1)), base]);
    setFuture([]);
    setDirty(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      try {
        await document.fonts.ready;
        const cache = cacheRef.current;
        for (const layer of project.layers) {
          if (layer.type !== "image") continue;
          if (!cache.has(layer.id)) {
            cache.set(layer.id, await decodeDataUrlImage(layer.dataUrl));
          }
        }
        for (const key of [...cache.keys()]) {
          if (!project.layers.some((l) => l.id === key)) cache.delete(key);
        }
        const text = rasterizeTextLayers(project);
        const { bitmap: next, redMask: mask } = renderProject(project, cache, text);
        if (!cancelled) {
          setBitmap(next);
          setRedMask(mask);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    }, 50);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [project]);

  const confirmLose = () => {
    if (!dirty) return true;
    return window.confirm("Máte neuložené změny. Pokračovat a zahodit je?");
  };

  const askConflict = (names: string[]) =>
    new Promise<ConflictChoice>((resolve) => setConflict({ names, resolve }));

  const ensureWorkspace = async (): Promise<FsDirectoryHandle | null> => {
    if (!fsSupported) return null;
    if (workspace) {
      const p = await workspace.requestPermission();
      setPerm(p);
      if (p === "granted") return workspace;
      setError("Přístup ke složce nebyl udělen.");
      return null;
    }
    const ok = window.confirm(
      "TAG Studio potřebuje vybrat hlavní pracovní složku. V ní se budou vytvářet projektové podsložky a ukládat PNG, BIN, C a JSON. Pokračovat výběrem složky?",
    );
    if (!ok) return null;
    try {
      const root = await pickRootDirectory();
      setWorkspace(root);
      const p = await root.requestPermission();
      setPerm(p);
      if (p !== "granted") {
        setError("Přístup ke složce nebyl udělen.");
        return null;
      }
      await handleStore.current.saveRoot(root);
      return root;
    } catch (e) {
      if (e instanceof FsAbortError) return null;
      if (e instanceof FsNotAllowedError) {
        setPerm("denied");
        setError(e.message);
        return null;
      }
      setError(e instanceof Error ? e.message : "Výběr složky selhal.");
      return null;
    }
  };

  const resetEditor = (next: Project, connected: FsDirectoryHandle | null) => {
    cacheRef.current.clear();
    setProject(next);
    setProjectDir(connected);
    setSelectedId(null);
    setPast([]);
    setFuture([]);
    setDiag(null);
    setZoom(2);
    setPanX(0);
    setPanY(0);
  };

  const onNew = () => {
    if (!confirmLose()) return;
    setGalleryOpen(true);
  };

  const applyNewProject = async (next: ReturnType<typeof createProject>) => {
    if (fsSupported) {
      const root = await ensureWorkspace();
      if (!root) return;
      try {
        const names = await root.listNames();
        const now = new Date();
        const folderName = uniqueName(formatProjectFolderName(now), names);
        const dir = await root.getDirectoryHandle(folderName, { create: true });
        const stamped = { ...next, folderName, createdAt: now.toISOString(), modifiedAt: now.toISOString() };
        try {
          await writeFileAtomic(dir, "project.tagstudio.json", serializeProject(stamped));
          resetEditor(stamped, dir);
          setDirty(false);
        } catch (e) {
          resetEditor(stamped, dir);
          setDirty(true);
          setError(e instanceof Error ? e.message : "Počáteční JSON se nepodařilo zapsat.");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Vytvoření složky selhalo.");
      }
      return;
    }
    resetEditor(next, null);
    setDirty(false);
  };

  const onPickTemplate = async (id: TemplateId) => {
    setGalleryOpen(false);
    const next = createProjectFromTemplate(id);
    await applyNewProject(next);
  };

  const onOpenFile = async (file: File) => {
    try {
      const text = await file.text();
      const loaded = parseProjectJson(text);
      cacheRef.current.clear();
      setProject(loaded);
      setProjectDir(null);
      setSelectedId(null);
      setPast([]);
      setFuture([]);
      setDirty(false);
      setError(null);
    } catch (e) {
      setError(e instanceof ProjectError ? e.message : "Soubor projektu se nepodařilo otevřít.");
    }
  };

  const onSave = async () => {
    if (projectDir && perm === "granted") {
      try {
        const names = await projectDir.listNames();
        let conflictChoice: ConflictChoice = "overwrite";
        if (names.includes("project.tagstudio.json")) {
          conflictChoice = await askConflict(["project.tagstudio.json"]);
          if (conflictChoice === "cancel") return;
        }
        const res = await writeNamed(projectDir, "project.tagstudio.json", serializeProject(project), names, conflictChoice);
        if (!res.ok) setError(res.error ?? "Uložení selhalo.");
        else {
          setDirty(false);
          setWriteLog(`Uloženo: ${res.name}`);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Uložení selhalo.");
      }
      return;
    }
    if (fsSupported) {
      const root = await ensureWorkspace();
      if (root) {
        try {
          const dir = await root.getDirectoryHandle(project.folderName, { create: true });
          setProjectDir(dir);
          await writeFileAtomic(dir, "project.tagstudio.json", serializeProject(project));
          setDirty(false);
          setWriteLog(`Uloženo do ${project.folderName}`);
          return;
        } catch (e) {
          if (e instanceof FsAbortError) return;
          setError(e instanceof Error ? e.message : "Uložení selhalo.");
        }
      }
    }
    downloadText("project.tagstudio.json", serializeProject(project), "application/json");
    setDirty(false);
  };

  const writeOneExport = async (name: string, data: Uint8Array | string) => {
    if (projectDir && perm === "granted") {
      const names = await projectDir.listNames();
      let choice: ConflictChoice = "overwrite";
      if (names.includes(name)) {
        choice = await askConflict([name]);
        if (choice === "cancel") return;
      }
      const res = await writeNamed(projectDir, name, data, names, choice);
      if (!res.ok) setError(res.error ?? "Zápis selhal.");
      else setWriteLog(`Zapsáno: ${res.name}`);
      return;
    }
    if (typeof data === "string") downloadText(name, data, "text/plain");
    else downloadBytes(name, data, name.endsWith(".png") ? "image/png" : "application/octet-stream");
  };

  const undo = () => {
    setPast((p) => {
      if (!p.length) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [cloneProject(projectRef.current), ...f]);
      setProject(prev);
      setDirty(true);
      return p.slice(0, -1);
    });
  };

  const redo = () => {
    setFuture((f) => {
      if (!f.length) return f;
      const [next, ...rest] = f;
      setPast((p) => [...p, cloneProject(projectRef.current)]);
      setProject(next);
      setDirty(true);
      return rest;
    });
  };

  const addFiles = async (files: File[]) => {
    let next = projectRef.current;
    const cache = cacheRef.current;
    for (const file of files) {
      if (!isRaster(file)) continue;
      try {
        const decoded = await decodeImageFile(file);
        const layer = createImageLayer(next, {
          dataUrl: decoded.dataUrl,
          srcWidth: decoded.bitmap.width,
          srcHeight: decoded.bitmap.height,
          name: file.name.replace(/\.[^.]+$/, ""),
        });
        cache.set(layer.id, decoded.bitmap);
        next = { ...next, layers: [...next.layers, layer] };
        setSelectedId(layer.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Obrázek se nepodařilo načíst.");
      }
    }
    if (next !== projectRef.current) commit(next);
  };

  const requestProfile = (profileId: ProfileId, orientation: Orientation, customWidth: number, customHeight: number) => {
    const cur = canvasSizeFor(project.profileId, project.orientation, project.customWidth, project.customHeight);
    const next = canvasSizeFor(profileId, orientation, customWidth, customHeight);
    if (profileId === "custom") {
      const err = validateCustomSize(customWidth, customHeight);
      if (err) {
        setError(err);
        return;
      }
    }
    if (cur.width === next.width && cur.height === next.height) {
      commit({ ...project, profileId, orientation, customWidth: profileId === "custom" ? customWidth : null, customHeight: profileId === "custom" ? customHeight : null });
      return;
    }
    setProfileDlg({ profileId, orientation, customWidth, customHeight });
  };

  const applyProfile = (mode: "fit" | "keep") => {
    if (!profileDlg) return;
    try {
      commit(applyProfileChange(project, profileDlg, mode));
      setProfileDlg(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const changeLayer = (id: string, patch: Partial<Layer>, recordUndo: boolean) => {
    const next = updateLayer(projectRef.current, id, patch);
    if (recordUndo) {
      finishGesture();
      setProject(next);
    } else live(next);
  };

  const exportKind = (kind: "png" | "bin" | "c" | "diag") => {
    const stem = defaultExportStem(project);
    if (kind === "png") void writeOneExport(`${stem}.png`, exportPng(bitmap));
    if (kind === "bin") void writeOneExport(`${stem}.bin`, exportBin(bitmap, project));
    if (kind === "c") void writeOneExport(`${stem}.c`, exportC(bitmap, project));
    if (kind === "diag") {
      const d = diagnosticDecode(bitmap, project);
      setDiag({ bitmap: d.bitmap, invalid: d.invalidCount, match: bitmapsEqual(bitmap, d.bitmap) });
    }
  };

  const exportAll = async () => {
    const files = buildProjectFiles(project, bitmap);
    if (projectDir && perm === "granted") {
      const existing = await projectDir.listNames();
      const hits = [files.jsonName, files.pngName, files.binName, files.cName].filter((n) => existing.includes(n));
      let choice: ConflictChoice = "overwrite";
      if (hits.length) {
        choice = await askConflict(hits);
        if (choice === "cancel") return;
      }
      const results = await writeAllToDir(projectDir, files, choice);
      const ok = results.filter((r) => r.ok).map((r) => r.name);
      const fail = results.filter((r) => !r.ok);
      if (fail.length) setError(`Zapsáno: ${ok.join(", ") || "—"}. Selhalo: ${fail.map((f) => `${f.name} (${f.error})`).join(", ")}`);
      else {
        setDirty(false);
        setWriteLog(`Exportováno: ${ok.join(", ")}`);
      }
      return;
    }
    if (fsSupported) {
      const root = await ensureWorkspace();
      if (root) {
        const dir = await root.getDirectoryHandle(project.folderName, { create: true });
        setProjectDir(dir);
        const results = await writeAllToDir(dir, files, "overwrite");
        const fail = results.filter((r) => !r.ok);
        if (fail.length) setError(`Částečné selhání: ${fail.map((f) => f.name).join(", ")}`);
        else {
          setDirty(false);
          setWriteLog("Exportováno vše do projektové složky.");
        }
        return;
      }
    }
    const z = zipAll(project.folderName, files);
    downloadBytes(z.filename, z.bytes, "application/zip");
    setWriteLog("Prohlížeč nemůže vytvořit složku — stažen ZIP.");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT");
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        onSave();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
        e.preventDefault();
        fileOpenRef.current?.click();
        return;
      }
      if (typing) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId) deleteSelected();
      }
      if (e.key.startsWith("Arrow") && selectedId) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        const layer = findLayer(projectRef.current, selectedId);
        if (!layer || layer.locked) return;
        if (layer.type === "line") {
          commit(updateLayer(projectRef.current, selectedId, { x1: layer.x1 + dx, y1: layer.y1 + dy, x2: layer.x2 + dx, y2: layer.y2 + dy }));
        } else {
          commit(updateLayer(projectRef.current, selectedId, { x: layer.x + dx, y: layer.y + dy }));
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // Klávesové zkratky čtou aktuální projectRef; záměrně jen selectedId.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const deleteSelected = () => {
    if (!selectedId) return;
    const layer = findLayer(project, selectedId);
    if (!layer) return;
    if (!window.confirm(`Smazat vrstvu „${layer.name}“?`)) return;
    commit({ ...project, layers: project.layers.filter((l) => l.id !== selectedId) });
    setSelectedId(null);
  };

  const onOpenFolder = async () => {
    if (!confirmLose()) return;
    if (!fsSupported) return;
    try {
      const dir = await pickRootDirectory();
      const p = await dir.requestPermission();
      setPerm(p);
      if (p !== "granted") {
        setError("Přístup ke složce nebyl udělen.");
        return;
      }
      const names = await dir.listNames();
      if (!names.includes("project.tagstudio.json")) {
        setError("Ve zvolené složce není project.tagstudio.json. Vyberte existující projektovou složku.");
        return;
      }
      const fh = await dir.getFileHandle("project.tagstudio.json");
      const text = fh.readText ? await fh.readText() : new TextDecoder().decode((await fh.readBytes?.()) ?? new Uint8Array());
      const loaded = parseProjectJson(text);
      resetEditor(loaded, dir);
      setDirty(false);
      setWriteLog(`Otevřeno: ${dir.name}`);
    } catch (e) {
      if (e instanceof FsAbortError) return;
      setError(e instanceof Error ? e.message : "Otevření složky selhalo.");
    }
  };

  const onChangeWorkspace = async () => {
    if (!fsSupported) return;
    try {
      const root = await pickRootDirectory();
      setWorkspace(root);
      const p = await root.requestPermission();
      setPerm(p);
      if (p !== "granted") {
        setError("Přístup ke složce nebyl udělen.");
        return;
      }
      await handleStore.current.saveRoot(root);
      setWriteLog(`Pracovní složka: ${root.name}`);
    } catch (e) {
      if (e instanceof FsAbortError) return;
      if (e instanceof FsNotAllowedError) {
        setPerm("denied");
        setError(e.message);
        return;
      }
      setError(e instanceof Error ? e.message : "Změna složky selhala.");
    }
  };

  const onReenable = async () => {
    const h = workspace ?? projectDir;
    if (!h) {
      await ensureWorkspace();
      return;
    }
    const p = await h.requestPermission();
    setPerm(p);
    if (p !== "granted") setError("Přístup ke složce nebyl udělen.");
    else {
      setError(null);
      setWriteLog("Přístup ke složce je obnoven.");
    }
  };

  let folderStatus: FolderStatus;
  if (!fsSupported) folderStatus = "zip";
  else if (perm === "denied") folderStatus = "denied";
  else if (perm === "prompt" && workspace) folderStatus = "prompt";
  else if (projectDir && perm === "granted") folderStatus = "ok";
  else folderStatus = "unlinked";

  const folderLabel = projectDir?.name || project.folderName;
  const viewBitmap =
    previewMode === "mask" && redMask && project.dither.mode === "bwr-two-phase"
      ? maskToPreview(bitmap.width, bitmap.height, redMask)
      : bitmap;

  return (
    <div className="app">
      <Toolbar
        project={project}
        canUndo={past.length > 0}
        canRedo={future.length > 0}
        folderStatus={folderStatus}
        folderLabel={folderLabel}
        fsSupported={fsSupported}
        onNew={() => void onNew()}
        onOpen={() => {
          if (!confirmLose()) return;
          fileOpenRef.current?.click();
        }}
        onOpenFolder={() => void onOpenFolder()}
        onSave={() => void onSave()}
        onExportAll={() => void exportAll()}
        onChangeWorkspace={() => void onChangeWorkspace()}
        onReenable={() => void onReenable()}
        onUndo={undo}
        onRedo={redo}
        onExport={exportKind}
        onRequestProfile={requestProfile}
      />
      <div className="workspace">
        <LeftPanel
          project={project}
          selectedId={selectedId}
          onAddImage={() => imageOpenRef.current?.click()}
          onAddText={() => {
            const layer = createTextLayer(project);
            commit({ ...project, layers: [...project.layers, layer] });
            setSelectedId(layer.id);
          }}
          onAddRect={() => {
            const layer = createRectLayer(project);
            commit({ ...project, layers: [...project.layers, layer] });
            setSelectedId(layer.id);
          }}
          onAddLine={() => {
            const layer = createLineLayer(project);
            commit({ ...project, layers: [...project.layers, layer] });
            setSelectedId(layer.id);
          }}
          onSelect={setSelectedId}
          onToggle={(id, field) => {
            const layer = findLayer(project, id);
            if (!layer) return;
            commit(updateLayer(project, id, { [field]: !layer[field] }));
          }}
          onDuplicate={() => {
            if (!selected) return;
            const copy = duplicateLayer(selected);
            if (copy.type === "image") {
              const src = cacheRef.current.get(selected.id);
              if (src) cacheRef.current.set(copy.id, src);
            }
            commit({ ...project, layers: [...project.layers, copy] });
            setSelectedId(copy.id);
          }}
          onDelete={deleteSelected}
          onReorder={(dir) => {
            if (!selectedId) return;
            commit({ ...project, layers: reorderLayers(project.layers, selectedId, dir) });
          }}
        />
        <CanvasStage
          project={project}
          bitmap={viewBitmap}
          selectedId={selectedId}
          zoom={zoom}
          panX={panX}
          panY={panY}
          onZoom={(z, x, y) => {
            setZoom(z);
            setPanX(x);
            setPanY(y);
          }}
          onPan={(x, y) => {
            setPanX(x);
            setPanY(y);
          }}
          onSelect={setSelectedId}
          onHover={setHover}
          onChangeLayer={changeLayer}
          onFiles={addFiles}
        />
        <RightPanel
          project={project}
          selected={selected}
          advanced={advanced}
          onAdvanced={setAdvanced}
          onProjectPatch={(patch) => commit({ ...project, ...patch })}
          onLayerPatch={(patch) => {
            if (!selectedId) return;
            commit(updateLayer(project, selectedId, patch));
          }}
          previewMode={previewMode}
          onPreviewMode={setPreviewMode}
        />
      </div>
      <StatusBar
        project={project}
        bitmap={bitmap}
        hover={hover}
        zoom={zoom}
        dirty={dirty}
        error={error}
        notice={writeLog}
        invalidCount={diag?.invalid ?? 0}
        previewMask={previewMode === "mask" && project.dither.mode === "bwr-two-phase"}
      />

      <input
        ref={fileOpenRef}
        type="file"
        accept=".json,.tagstudio.json,application/json"
        hidden
        data-testid="open-file"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void onOpenFile(f);
        }}
      />
      <input
        ref={imageOpenRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        hidden
        multiple
        data-testid="image-file"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])];
          e.target.value = "";
          if (files.length) void addFiles(files);
        }}
      />

      {galleryOpen && <TemplateGallery onPick={(id) => void onPickTemplate(id)} onCancel={() => setGalleryOpen(false)} />}

      {restore && (
        <div className="modal-backdrop">
          <div className="modal">
            <h2>Obnovit automatickou zálohu?</h2>
            <p>Našla se poslední lokální kopie projektu. Ruční soubor se bez vašeho potvrzení nenačte.</p>
            <div className="row">
              <button
                type="button"
                className="primary"
                data-testid="restore-yes"
                onClick={() => {
                  try {
                    const loaded = parseProjectJson(restore);
                    cacheRef.current.clear();
                    setProject(loaded);
                    setDirty(true);
                    setRestore(null);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Zálohu nelze načíst.");
                    setRestore(null);
                  }
                }}
              >
                Obnovit
              </button>
              <button type="button" data-testid="restore-no" onClick={() => setRestore(null)}>
                Nechat jak je
              </button>
              <button
                type="button"
                data-testid="restore-clear"
                onClick={() => {
                  clearAutosave();
                  setRestore(null);
                }}
              >
                Vymazat zálohu
              </button>
            </div>
          </div>
        </div>
      )}

      {profileDlg && (
        <div className="modal-backdrop">
          <div className="modal" data-testid="profile-dialog">
            <h2>Změna plátna</h2>
            <p>Nový profil má jiné rozměry. Jak naložit se stávající kompozicí?</p>
            <div className="row">
              <button type="button" className="primary" data-testid="profile-fit" onClick={() => applyProfile("fit")}>
                Přizpůsobit
              </button>
              <button type="button" data-testid="profile-keep" onClick={() => applyProfile("keep")}>
                Změnit plátno bez škálování
              </button>
              <button type="button" data-testid="profile-cancel" onClick={() => setProfileDlg(null)}>
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}

      {diag && (
        <div className="modal-backdrop" onClick={() => setDiag(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} data-testid="diag-modal">
            <h2>Zpětné dekódování rovin</h2>
            <p>
              {diag.match ? "PNG/náhled a BIN reprezentují stejný obraz." : "Náhled a dekódované roviny se liší."}
              {diag.invalid ? ` Neplatné pixely A=1 B=0: ${diag.invalid} (magenta).` : ""}
            </p>
            <DiagCanvas bitmap={diag.bitmap} />
            <button type="button" onClick={() => setDiag(null)}>
              Zavřít
            </button>
          </div>
        </div>
      )}
      {conflict && (
        <div className="modal-backdrop">
          <div className="modal" data-testid="conflict-dialog">
            <h2>Soubor už existuje</h2>
            <p>Přepsat, uložit jako novou verzi, nebo zrušit?</p>
            <p className="muted">{conflict.names.join(", ")}</p>
            <div className="row">
              <button
                type="button"
                className="primary"
                data-testid="conflict-overwrite"
                onClick={() => {
                  conflict.resolve("overwrite");
                  setConflict(null);
                }}
              >
                Přepsat
              </button>
              <button
                type="button"
                data-testid="conflict-version"
                onClick={() => {
                  conflict.resolve("version");
                  setConflict(null);
                }}
              >
                Uložit jako novou verzi
              </button>
              <button
                type="button"
                data-testid="conflict-cancel"
                onClick={() => {
                  conflict.resolve("cancel");
                  setConflict(null);
                }}
              >
                Zrušit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DiagCanvas({ bitmap }: { bitmap: IndexedBitmap }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) blitIndexed(ref.current, bitmap);
  }, [bitmap]);
  return <canvas ref={ref} className="diag-preview" style={{ width: Math.min(640, bitmap.width * 2), height: "auto" }} />;
}

function isRaster(file: File): boolean {
  if (file.type.startsWith("image/")) return /png|jpeg|jpg|webp/i.test(file.type);
  return /\.(png|jpe?g|webp)$/i.test(file.name);
}
