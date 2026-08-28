import type { Layer, Project } from "../core/types";

interface Props {
  project: Project;
  selectedId: string | null;
  onAddImage: () => void;
  onAddText: () => void;
  onAddRect: () => void;
  onAddLine: () => void;
  onSelect: (id: string) => void;
  onToggle: (id: string, field: "visible" | "locked") => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onReorder: (dir: -1 | 1) => void;
}

export function LeftPanel({
  project,
  selectedId,
  onAddImage,
  onAddText,
  onAddRect,
  onAddLine,
  onSelect,
  onToggle,
  onDuplicate,
  onDelete,
  onReorder,
}: Props) {
  const layersTopFirst = [...project.layers].reverse();
  return (
    <aside className="panel">
      <h2>Přidat</h2>
      <div className="row">
        <button type="button" onClick={onAddImage} data-testid="add-image">
          Obrázek
        </button>
        <button type="button" onClick={onAddText} data-testid="add-text">
          Text
        </button>
      </div>
      <div className="row">
        <button type="button" onClick={onAddRect} data-testid="add-rect">
          Obdélník
        </button>
        <button type="button" onClick={onAddLine} data-testid="add-line">
          Čára
        </button>
      </div>
      <h2>Vrstvy</h2>
      <div className="layer-list" data-testid="layer-list">
        {layersTopFirst.map((layer) => (
          <div
            key={layer.id}
            className={`layer-item${layer.id === selectedId ? " selected" : ""}`}
            onClick={() => onSelect(layer.id)}
          >
            <span>
              {layerName(layer)}
              {!layer.visible ? " (skrytá)" : ""}
            </span>
            <button
              type="button"
              title="Viditelnost"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(layer.id, "visible");
              }}
            >
              {layer.visible ? "👁" : "–"}
            </button>
            <button
              type="button"
              title="Zámek"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(layer.id, "locked");
              }}
            >
              {layer.locked ? "🔒" : "○"}
            </button>
          </div>
        ))}
        {project.layers.length === 0 && <div className="muted">Žádné vrstvy</div>}
      </div>
      <div className="row">
        <button type="button" onClick={() => onReorder(1)} title="Výš">
          Nahoru
        </button>
        <button type="button" onClick={() => onReorder(-1)} title="Níž">
          Dolů
        </button>
      </div>
      <div className="row">
        <button type="button" onClick={onDuplicate}>
          Duplikovat
        </button>
        <button type="button" onClick={onDelete} data-testid="delete-layer">
          Smazat
        </button>
      </div>
    </aside>
  );
}

function layerName(layer: Layer): string {
  if (layer.type === "text") return `${layer.name}: ${layer.text.slice(0, 18)}`;
  return layer.name;
}
