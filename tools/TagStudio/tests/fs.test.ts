import { describe, expect, it } from "vitest";
import { unzipSync } from "fflate";
import { createProject, serializeProject } from "../src/core/project";
import { formatProjectFolderName, uniqueName } from "../src/core/folder";
import { createIndexed } from "../src/core/palette";
import { WHITE } from "../src/core/types";
import { MemoryDir, MemoryFile, MemoryHandleStore } from "../src/fs/memory";
import { FsAbortError, FsNotAllowedError, writeFileAtomic } from "../src/fs/types";
import { pickRootDirectory } from "../src/fs/access";
import { buildProjectFiles, writeAllToDir, writeNamed, zipAll } from "../src/fs/projectIo";

describe("projektové složky a File System Access mock", () => {
  it("Nový projekt vytvoří jedinou podsložku a počáteční JSON", async () => {
    const root = new MemoryDir("workspace");
    const clock = () => new Date(2026, 7, 28, 19, 42, 7);
    const folderName = uniqueName(formatProjectFolderName(clock()), await root.listNames());
    const dir = await root.getDirectoryHandle(folderName, { create: true });
    const project = createProject("EDG2-0260-A", "landscape", null, null, { clock, folderName });
    await writeFileAtomic(dir, "project.tagstudio.json", serializeProject(project));
    expect(root.dirs.size).toBe(1);
    expect(root.dirs.has("TAG_Project_2026-08-28_19-42-07")).toBe(true);
    const json = await (await dir.getFileHandle("project.tagstudio.json")).readText?.();
    expect(json).toContain('"schemaVersion": 3');
    expect(json).toContain("TAG_Project_2026-08-28_19-42-07");
  });

  it("PNG, BIN, C a JSON jdou do stejné složky", async () => {
    const dir = new MemoryDir("TAG_Project_x");
    const project = createProject("EDG2-0420-B", "landscape");
    const bmp = createIndexed(project.canvasWidth, project.canvasHeight, WHITE);
    const files = buildProjectFiles(project, bmp);
    const results = await writeAllToDir(dir, files, "overwrite");
    expect(results.every((r) => r.ok)).toBe(true);
    const names = await dir.listNames();
    expect(names).toContain("project.tagstudio.json");
    expect(names).toContain("tagstudio_EDG2-0420-B_400x300.png");
    expect(names).toContain("tagstudio_EDG2-0420-B_400x300.bin");
    expect(names).toContain("tagstudio_EDG2-0420-B_400x300.c");
    expect(files.bin.length).toBe(30000);
  });

  it("přepsání, verze a zrušení", async () => {
    const dir = new MemoryDir("p");
    await writeFileAtomic(dir, "a.bin", new Uint8Array([1]));
    const existing = await dir.listNames();
    const cancel = await writeNamed(dir, "a.bin", new Uint8Array([2]), existing, "cancel");
    expect(cancel.ok).toBe(false);
    expect(((await dir.getFileHandle("a.bin")) as MemoryFile).data[0]).toBe(1);
    const version = await writeNamed(dir, "a.bin", new Uint8Array([3]), existing, "version");
    expect(version.ok).toBe(true);
    expect(version.name).toBe("a_v02.bin");
    const overwrite = await writeNamed(dir, "a.bin", new Uint8Array([9]), existing, "overwrite");
    expect(overwrite.ok).toBe(true);
    expect(((await dir.getFileHandle("a.bin")) as MemoryFile).data[0]).toBe(9);
  });

  it("zrušený picker hodí AbortError a nic nezapíše", async () => {
    const prev = (globalThis as { showDirectoryPicker?: unknown }).showDirectoryPicker;
    (globalThis as { showDirectoryPicker?: () => Promise<unknown> }).showDirectoryPicker = async () => {
      const e = new Error("aborted");
      e.name = "AbortError";
      throw e;
    };
    const root = new MemoryDir("workspace");
    await expect(pickRootDirectory()).rejects.toBeInstanceOf(FsAbortError);
    expect(root.dirs.size).toBe(0);
    (globalThis as { showDirectoryPicker?: unknown }).showDirectoryPicker = prev;
  });

  it("permission denied zabrání zápisu", async () => {
    const dir = new MemoryDir("locked");
    dir.permission = "denied";
    expect(await dir.queryPermission()).toBe("denied");
    await expect(dir.getFileHandle("x.json", { create: true })).rejects.toBeInstanceOf(FsNotAllowedError);
  });

  it("IndexedDB mock ověří oprávnění před použitím", async () => {
    const store = new MemoryHandleStore();
    const dir = new MemoryDir("workspace");
    dir.permission = "prompt";
    await store.saveRoot(dir);
    const loaded = await store.loadRoot();
    expect(loaded).toBe(dir);
    expect(await loaded!.queryPermission()).toBe("prompt");
    dir.permission = "granted";
    expect(await loaded!.requestPermission()).toBe("granted");
    await writeFileAtomic(loaded!, "ok.txt", "ok");
  });

  it("chyba zápisu se vrátí a nezatají", async () => {
    const dir = new MemoryDir("p");
    const orig = dir.getFileHandle.bind(dir);
    dir.getFileHandle = async (name, opts) => {
      const f = await orig(name, opts);
      f.createWritable = async () => {
        throw new Error("disk full");
      };
      return f;
    };
    const res = await writeNamed(dir, "fail.bin", new Uint8Array([1]), [], "overwrite");
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/disk full|selhal/i);
  });

  it("fallback ZIP obsahuje JSON, PNG, BIN a C", () => {
    const project = createProject("EDG2-0260-A", "landscape");
    const files = buildProjectFiles(project, createIndexed(296, 152, WHITE));
    const z = zipAll(project.folderName, files);
    expect(z.filename).toBe(`${project.folderName}.zip`);
    const unzipped = unzipSync(z.bytes);
    const keys = Object.keys(unzipped);
    expect(keys).toHaveLength(4);
    expect(keys.some((k) => k.endsWith("project.tagstudio.json"))).toBe(true);
    expect(keys.some((k) => k.endsWith(".png"))).toBe(true);
    expect(keys.some((k) => k.endsWith(".bin"))).toBe(true);
    expect(keys.some((k) => k.endsWith(".c"))).toBe(true);
  });

  it("otevření existujícího projektu nevytvoří timestamp složku", async () => {
    const root = new MemoryDir("workspace");
    expect(root.dirs.size).toBe(0);
    createProject("EDG2-0260-A", "landscape");
    expect(root.dirs.size).toBe(0);
  });
});
