import { APP_CREDIT, APP_NAME, APP_VERSION } from "../core/types";
import type { Orientation, ProfileId, Project } from "../core/types";
import { PROFILE_LIST, physicalMm, profileLabel } from "../core/profiles";

export type FolderStatus = "none" | "ok" | "prompt" | "denied" | "unlinked" | "zip";

interface Props {
  project: Project;
  canUndo: boolean;
  canRedo: boolean;
  folderStatus: FolderStatus;
  folderLabel: string;
  fsSupported: boolean;
  onNew: () => void;
  onOpen: () => void;
  onOpenFolder: () => void;
  onSave: () => void;
  onExportAll: () => void;
  onChangeWorkspace: () => void;
  onReenable: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: (kind: "png" | "bin" | "c" | "diag") => void;
  onRequestProfile: (profileId: ProfileId, orientation: Orientation, customW: number, customH: number) => void;
}

const STATUS_TEXT: Record<FolderStatus, string> = {
  none: "Projektová složka není připojena",
  ok: "Složka připojena",
  prompt: "Je potřeba znovu povolit přístup",
  denied: "Přístup zamítnut",
  unlinked: "Projektová složka není připojena",
  zip: "ZIP / stažení (prohlížeč nemůže vytvořit složku)",
};

export function Toolbar({
  project,
  canUndo,
  canRedo,
  folderStatus,
  folderLabel,
  fsSupported,
  onNew,
  onOpen,
  onOpenFolder,
  onSave,
  onExportAll,
  onChangeWorkspace,
  onReenable,
  onUndo,
  onRedo,
  onExport,
  onRequestProfile,
}: Props) {
  return (
    <header className="toolbar">
      <span className="brand">
        {APP_NAME} {APP_VERSION}
      </span>
      <button type="button" onClick={onNew} data-testid="new-project">
        Nový
      </button>
      <button type="button" onClick={onOpen} data-testid="open-project">
        Otevřít
      </button>
      {fsSupported && (
        <button type="button" onClick={onOpenFolder} data-testid="open-folder">
          Otevřít složku
        </button>
      )}
      <button type="button" onClick={onSave} data-testid="save-project">
        Uložit projekt
      </button>
      <button type="button" onClick={onExportAll} data-testid="export-all">
        Exportovat vše
      </button>
      <span className="sep" />
      <button type="button" onClick={onUndo} disabled={!canUndo} title="Ctrl+Z">
        Zpět
      </button>
      <button type="button" onClick={onRedo} disabled={!canRedo} title="Ctrl+Y">
        Znovu
      </button>
      <span className="sep" />
      <select
        data-testid="profile-select"
        value={project.profileId}
        onChange={(e) =>
          onRequestProfile(e.target.value as ProfileId, project.orientation, project.customWidth ?? 296, project.customHeight ?? 152)
        }
        style={{ width: 180 }}
      >
        {PROFILE_LIST.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
        <option value="custom">Vlastní</option>
      </select>
      <select
        data-testid="orientation-select"
        value={project.orientation}
        onChange={(e) =>
          onRequestProfile(project.profileId, e.target.value as Orientation, project.customWidth ?? 296, project.customHeight ?? 152)
        }
        style={{ width: 88 }}
      >
        <option value="landscape">Na šířku</option>
        <option value="portrait">Na výšku</option>
      </select>
      {project.profileId === "custom" && (
        <>
          <input
            type="number"
            style={{ width: 58 }}
            value={project.customWidth ?? 0}
            onChange={(e) =>
              onRequestProfile("custom", project.orientation, Number(e.target.value), project.customHeight ?? 1)
            }
            title="Šířka"
          />
          <input
            type="number"
            style={{ width: 58 }}
            value={project.customHeight ?? 0}
            onChange={(e) =>
              onRequestProfile("custom", project.orientation, project.customWidth ?? 1, Number(e.target.value))
            }
            title="Výška"
          />
        </>
      )}
      <span className="sep" />
      <button type="button" className="primary" onClick={() => onExport("png")} data-testid="export-png">
        PNG
      </button>
      <button type="button" onClick={() => onExport("bin")} data-testid="export-bin">
        BIN
      </button>
      <button type="button" onClick={() => onExport("c")} data-testid="export-c">
        C
      </button>
      <button type="button" onClick={() => onExport("diag")} data-testid="export-diag">
        Diagnostika
      </button>
      <span className="sep" />
      {fsSupported && (
        <>
          <button type="button" onClick={onChangeWorkspace} data-testid="change-workspace">
            Změnit pracovní složku
          </button>
          {(folderStatus === "prompt" || folderStatus === "denied") && (
            <button type="button" onClick={onReenable} data-testid="reenable-fs">
              Znovu povolit přístup
            </button>
          )}
        </>
      )}
      <span className="folder-chip" data-testid="folder-status" title={STATUS_TEXT[folderStatus]}>
        {folderLabel || STATUS_TEXT[folderStatus]}
        {` · ${STATUS_TEXT[folderStatus]}`}
      </span>
      <span style={{ marginLeft: "auto" }} className="muted">
        {profileLabel(project.profileId)}
        {physicalMm(project.profileId, project.orientation)
          ? ` · ${physicalMm(project.profileId, project.orientation)!.width}×${physicalMm(project.profileId, project.orientation)!.height} mm`
          : ""}
      </span>
      <span className="credit">{APP_CREDIT}</span>
    </header>
  );
}
