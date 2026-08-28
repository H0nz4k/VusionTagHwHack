import { useEffect, useRef, useState, type PointerEvent as REPointerEvent, type WheelEvent } from "react";
import type { Layer, Project } from "../core/types";
import { blitIndexed } from "./blit";
import { hitLayer, layerFrame } from "./hitTest";
import type { IndexedBitmap } from "../core/types";

interface Props {
  project: Project;
  bitmap: IndexedBitmap;
  selectedId: string | null;
  zoom: number;
  panX: number;
  panY: number;
  onZoom: (zoom: number, panX: number, panY: number) => void;
  onPan: (panX: number, panY: number) => void;
  onSelect: (id: string | null) => void;
  onHover: (pt: { x: number; y: number } | null) => void;
  onChangeLayer: (id: string, patch: Partial<Layer>, recordUndo: boolean) => void;
  onFiles: (files: File[]) => void;
}

type Drag =
  | { kind: "pan"; sx: number; sy: number; panX: number; panY: number }
  | { kind: "move"; id: string; sx: number; sy: number; orig: Layer }
  | { kind: "resize"; id: string; handle: string; orig: Layer; sx: number; sy: number }
  | { kind: "line"; id: string; end: 1 | 2; orig: Extract<Layer, { type: "line" }> };

export function CanvasStage({
  project,
  bitmap,
  selectedId,
  zoom,
  panX,
  panY,
  onZoom,
  onPan,
  onSelect,
  onHover,
  onChangeLayer,
  onFiles,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<Drag | null>(null);
  const [dropping, setDropping] = useState(false);
  const space = useRef(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space") space.current = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") space.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) blitIndexed(canvasRef.current, bitmap);
  }, [bitmap]);

  const artboard = artboardStyle(project.canvasWidth, project.canvasHeight, zoom, panX, panY, wrapRef.current);

  function clientToPixel(clientX: number, clientY: number): { x: number; y: number } {
    const el = wrapRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    const ax = artboard.left + r.left;
    const ay = artboard.top + r.top;
    return { x: (clientX - ax) / zoom, y: (clientY - ay) / zoom };
  }

  function pick(px: number, py: number): Layer | null {
    const slop = 4 / zoom;
    for (let i = project.layers.length - 1; i >= 0; i--) {
      const layer = project.layers[i];
      if (!layer.visible) continue;
      if (hitLayer(layer, px, py, slop)) return layer;
    }
    return null;
  }

  function onWheel(e: WheelEvent<HTMLDivElement>) {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const next = Math.min(32, Math.max(0.25, zoom * factor));
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    const wx = (cx - artboard.left) / zoom;
    const wy = (cy - artboard.top) / zoom;
    const left = cx - wx * next;
    const top = cy - wy * next;
    const centered = artboardStyle(project.canvasWidth, project.canvasHeight, next, 0, 0, el);
    onZoom(next, left - centered.left, top - centered.top);
  }

  function onPointerDown(e: REPointerEvent) {
    if (e.button === 1 || space.current || e.button === 2) {
      drag.current = { kind: "pan", sx: e.clientX, sy: e.clientY, panX, panY };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    if (e.button !== 0) return;
    const pt = clientToPixel(e.clientX, e.clientY);
    const handle = (e.target as HTMLElement).dataset.handle;
    const lineEnd = (e.target as HTMLElement).dataset.lineEnd;
    const selected = project.layers.find((l) => l.id === selectedId) ?? null;
    if (handle && selected && selected.type !== "line") {
      drag.current = { kind: "resize", id: selected.id, handle, orig: structuredClone(selected), sx: pt.x, sy: pt.y };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    if (lineEnd && selected?.type === "line") {
      drag.current = { kind: "line", id: selected.id, end: Number(lineEnd) as 1 | 2, orig: structuredClone(selected) };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }
    const hit = pick(pt.x, pt.y);
    onSelect(hit?.id ?? null);
    if (hit && !hit.locked) {
      drag.current = { kind: "move", id: hit.id, sx: pt.x, sy: pt.y, orig: structuredClone(hit) };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  }

  function onPointerMove(e: REPointerEvent) {
    const pt = clientToPixel(e.clientX, e.clientY);
    onHover({ x: Math.floor(pt.x), y: Math.floor(pt.y) });
    const d = drag.current;
    if (!d) return;
    if (d.kind === "pan") {
      onPan(d.panX + (e.clientX - d.sx), d.panY + (e.clientY - d.sy));
      return;
    }
    if (d.kind === "move") {
      const dx = pt.x - d.sx;
      const dy = pt.y - d.sy;
      onChangeLayer(d.id, offsetLayer(d.orig, dx, dy), false);
      return;
    }
    if (d.kind === "line") {
      const patch = d.end === 1 ? { x1: pt.x, y1: pt.y } : { x2: pt.x, y2: pt.y };
      onChangeLayer(d.id, patch, false);
      return;
    }
    if (d.kind === "resize") {
      onChangeLayer(d.id, resizeLayer(d.orig, d.handle, pt.x, pt.y), false);
    }
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d || d.kind === "pan") return;
    const layer = project.layers.find((l) => l.id === d.id);
    if (layer) onChangeLayer(d.id, layer, true);
  }

  const selected = project.layers.find((l) => l.id === selectedId) ?? null;
  const z = zoom;

  return (
    <div
      className="stage-wrap"
      ref={wrapRef}
      data-testid="stage"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => onHover(null)}
      onDragOver={(e) => {
        e.preventDefault();
        setDropping(true);
      }}
      onDragLeave={() => setDropping(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDropping(false);
        onFiles([...e.dataTransfer.files]);
      }}
    >
      <div className="stage-inner">
        <div className="artboard" style={{ left: artboard.left, top: artboard.top, width: artboard.width, height: artboard.height }}>
          <canvas ref={canvasRef} data-testid="preview-canvas" />
          {project.showPixelGrid && z >= 8 && (
            <div className="pixel-grid" style={{ backgroundSize: `${z}px ${z}px` }} />
          )}
          {project.showSafeMargin && (
            <div
              className="safe-margin"
              style={{
                left: project.safeMargin * z,
                top: project.safeMargin * z,
                width: Math.max(0, (project.canvasWidth - project.safeMargin * 2) * z),
                height: Math.max(0, (project.canvasHeight - project.safeMargin * 2) * z),
              }}
            />
          )}
          {selected && selected.visible && (
            <SelectionOverlay layer={selected} zoom={z} />
          )}
        </div>
      </div>
      {dropping && <div className="drop-hint">Přetáhněte PNG, JPEG nebo WebP</div>}
    </div>
  );
}

function SelectionOverlay({ layer, zoom: z }: { layer: Layer; zoom: number }) {
  if (layer.type === "line") {
    return (
      <>
        <div
          className="handle"
          data-line-end="1"
          style={{ left: layer.x1 * z - 4, top: layer.y1 * z - 4, cursor: "grab", pointerEvents: "auto" }}
        />
        <div
          className="handle"
          data-line-end="2"
          style={{ left: layer.x2 * z - 4, top: layer.y2 * z - 4, cursor: "grab", pointerEvents: "auto" }}
        />
      </>
    );
  }
  const f = layerFrame(layer);
  const box = {
    left: f.x * z,
    top: f.y * z,
    width: f.width * z,
    height: f.height * z,
    transform: f.rotation ? `rotate(${f.rotation}deg)` : undefined,
    transformOrigin: "center center",
  };
  const handles = ["nw", "ne", "se", "sw"] as const;
  const pos: Record<string, { left: number; top: number; cursor: string }> = {
    nw: { left: -4, top: -4, cursor: "nwse-resize" },
    ne: { left: f.width * z - 4, top: -4, cursor: "nesw-resize" },
    se: { left: f.width * z - 4, top: f.height * z - 4, cursor: "nwse-resize" },
    sw: { left: -4, top: f.height * z - 4, cursor: "nesw-resize" },
  };
  return (
    <div className="sel-box" style={{ ...box, pointerEvents: "none" }}>
      {handles.map((h) => (
        <div key={h} className="handle" data-handle={h} style={{ ...pos[h], pointerEvents: "auto" }} />
      ))}
    </div>
  );
}

function artboardStyle(
  cw: number,
  ch: number,
  zoom: number,
  panX: number,
  panY: number,
  wrap: HTMLDivElement | null,
) {
  const vw = wrap?.clientWidth ?? 800;
  const vh = wrap?.clientHeight ?? 600;
  const width = cw * zoom;
  const height = ch * zoom;
  return {
    left: panX + (vw - width) / 2,
    top: panY + (vh - height) / 2,
    width,
    height,
  };
}

function offsetLayer(layer: Layer, dx: number, dy: number): Partial<Layer> {
  if (layer.type === "line") {
    return { x1: layer.x1 + dx, y1: layer.y1 + dy, x2: layer.x2 + dx, y2: layer.y2 + dy };
  }
  return { x: layer.x + dx, y: layer.y + dy };
}

function resizeLayer(layer: Layer, handle: string, px: number, py: number): Partial<Layer> {
  if (layer.type === "line") return {};
  let { x, y, width, height } = layer;
  const r = x + width;
  const b = y + height;
  if (handle.includes("n")) {
    y = py;
    height = b - y;
  }
  if (handle.includes("s")) height = py - y;
  if (handle.includes("w")) {
    x = px;
    width = r - x;
  }
  if (handle.includes("e")) width = px - x;
  if (width < 2) width = 2;
  if (height < 2) height = 2;
  if (layer.type === "image" && layer.keepAspect && layer.srcWidth && layer.srcHeight) {
    const ar = layer.srcWidth / layer.srcHeight;
    height = width / ar;
    if (height < 2) height = 2;
  }
  return { x, y, width, height };
}
