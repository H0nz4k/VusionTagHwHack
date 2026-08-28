import { inverseRotatePoint, layerBBox } from "../core/geometry";
import type { Layer } from "../core/types";

export function layerFrame(layer: Layer): { x: number; y: number; width: number; height: number; rotation: number } {
  if (layer.type === "line") {
    const x = Math.min(layer.x1, layer.x2);
    const y = Math.min(layer.y1, layer.y2);
    return {
      x,
      y,
      width: Math.max(1, Math.abs(layer.x2 - layer.x1)),
      height: Math.max(1, Math.abs(layer.y2 - layer.y1)),
      rotation: 0,
    };
  }
  return { x: layer.x, y: layer.y, width: layer.width, height: layer.height, rotation: layer.rotation };
}

export function hitLayer(layer: Layer, px: number, py: number, slop: number): boolean {
  if (layer.type === "line") {
    const d = distToSegment(px, py, layer.x1, layer.y1, layer.x2, layer.y2);
    return d <= Math.max(slop, layer.thickness);
  }
  const { x, y, width, height, rotation } = layerFrame(layer);
  const cx = x + width / 2;
  const cy = y + height / 2;
  const [lx, ly] = inverseRotatePoint(px, py, cx, cy, rotation);
  return lx >= x - slop && ly >= y - slop && lx <= x + width + slop && ly <= y + height + slop;
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

export function rotatedBBox(layer: Layer) {
  const f = layerFrame(layer);
  return layerBBox(f.x, f.y, f.width, f.height, f.rotation);
}
