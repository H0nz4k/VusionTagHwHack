import type { IndexedBitmap, PaletteIndex } from "./types";
import { BLACK, RED, WHITE } from "./types";

export interface Transform2D {
  rotate: 0 | 90 | 180 | 270;
  flipX: boolean;
  flipY: boolean;
}

export function transformIndexed(bitmap: IndexedBitmap, t: Transform2D): IndexedBitmap {
  let out = bitmap;
  if (t.flipX) out = flipX(out);
  if (t.flipY) out = flipY(out);
  if (t.rotate) out = rotateIndexed(out, t.rotate);
  return out;
}

export function rotateIndexed(bitmap: IndexedBitmap, deg: 0 | 90 | 180 | 270): IndexedBitmap {
  if (deg === 0) return bitmap;
  const { width: w, height: h, pixels } = bitmap;
  if (deg === 180) {
    const out = new Uint8Array(pixels.length);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        out[(h - 1 - y) * w + (w - 1 - x)] = pixels[y * w + x];
      }
    }
    return { width: w, height: h, pixels: out };
  }
  const nw = h;
  const nh = w;
  const out = new Uint8Array(nw * nh);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = pixels[y * w + x];
      if (deg === 90) out[x * nw + (h - 1 - y)] = v;
      else out[(w - 1 - x) * nw + y] = v;
    }
  }
  return { width: nw, height: nh, pixels: out };
}

export function flipX(bitmap: IndexedBitmap): IndexedBitmap {
  const { width: w, height: h, pixels } = bitmap;
  const out = new Uint8Array(pixels.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      out[y * w + (w - 1 - x)] = pixels[y * w + x];
    }
  }
  return { width: w, height: h, pixels: out };
}

export function flipY(bitmap: IndexedBitmap): IndexedBitmap {
  const { width: w, height: h, pixels } = bitmap;
  const out = new Uint8Array(pixels.length);
  for (let y = 0; y < h; y++) {
    out.set(pixels.subarray((h - 1 - y) * w, (h - y) * w), y * w);
  }
  return { width: w, height: h, pixels: out };
}

export function sampleBilinear(
  data: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  sx: number,
  sy: number,
): [number, number, number, number] {
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = Math.min(srcW - 1, x0 + 1);
  const y1 = Math.min(srcH - 1, y0 + 1);
  const fx = sx - x0;
  const fy = sy - y0;
  const c00 = pixelAt(data, srcW, x0, y0);
  const c10 = pixelAt(data, srcW, x1, y0);
  const c01 = pixelAt(data, srcW, x0, y1);
  const c11 = pixelAt(data, srcW, x1, y1);
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  return [
    mix(mix(c00[0], c10[0], fx), mix(c01[0], c11[0], fx), fy),
    mix(mix(c00[1], c10[1], fx), mix(c01[1], c11[1], fx), fy),
    mix(mix(c00[2], c10[2], fx), mix(c01[2], c11[2], fx), fy),
    mix(mix(c00[3], c10[3], fx), mix(c01[3], c11[3], fx), fy),
  ];
}

function pixelAt(
  data: Uint8ClampedArray,
  w: number,
  x: number,
  y: number,
): [number, number, number, number] {
  const i = (y * w + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
}

export function rotatePoint(x: number, y: number, cx: number, cy: number, deg: number): [number, number] {
  if (!deg) return [x, y];
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = x - cx;
  const dy = y - cy;
  return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
}

export function inverseRotatePoint(x: number, y: number, cx: number, cy: number, deg: number): [number, number] {
  return rotatePoint(x, y, cx, cy, -deg);
}

export function layerBBox(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
): { x: number; y: number; width: number; height: number } {
  if (!rotation) return { x, y, width, height };
  const cx = x + width / 2;
  const cy = y + height / 2;
  const pts: Array<[number, number]> = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
  ].map(([px, py]) => rotatePoint(px, py, cx, cy, rotation));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}

export function fillIndexRect(
  bitmap: IndexedBitmap,
  x: number,
  y: number,
  w: number,
  h: number,
  color: PaletteIndex,
): void {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(bitmap.width, Math.ceil(x + w));
  const y1 = Math.min(bitmap.height, Math.ceil(y + h));
  for (let py = y0; py < y1; py++) {
    const row = py * bitmap.width;
    for (let px = x0; px < x1; px++) bitmap.pixels[row + px] = color;
  }
}

export function drawIndexLine(
  bitmap: IndexedBitmap,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  color: PaletteIndex,
  thickness: number,
): void {
  const t = Math.max(1, Math.round(thickness));
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len = Math.max(1, Math.hypot(dx, dy));
  const steps = Math.ceil(len);
  const nx = -dy / len;
  const ny = dx / len;
  const half = (t - 1) / 2;
  for (let i = 0; i <= steps; i++) {
    const x = x0 + (dx * i) / steps;
    const y = y0 + (dy * i) / steps;
    for (let k = -Math.ceil(half); k <= Math.ceil(half); k++) {
      const px = Math.round(x + nx * k);
      const py = Math.round(y + ny * k);
      if (px >= 0 && py >= 0 && px < bitmap.width && py < bitmap.height) {
        bitmap.pixels[py * bitmap.width + px] = color;
      }
    }
  }
}

export type PixelSampler = (canvasX: number, canvasY: number) => PaletteIndex | null;

export function fillRotatedRect(
  bitmap: IndexedBitmap,
  x: number,
  y: number,
  w: number,
  h: number,
  rotation: number,
  fill: PixelSampler | PaletteIndex | null,
  stroke: PixelSampler | PaletteIndex | null,
  strokeWidth: number,
): void {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const sw = Math.max(0, strokeWidth);
  const x0 = Math.max(0, Math.floor(Math.min(x, x + w)) - sw - 2);
  const y0 = Math.max(0, Math.floor(Math.min(y, y + h)) - sw - 2);
  const x1 = Math.min(bitmap.width, Math.ceil(Math.max(x, x + w)) + sw + 2);
  const y1 = Math.min(bitmap.height, Math.ceil(Math.max(y, y + h)) + sw + 2);

  const contains = (lx: number, ly: number, rw: number, rh: number) =>
    lx >= 0 && ly >= 0 && lx < rw && ly < rh;

  const sample = (src: PixelSampler | PaletteIndex | null, px: number, py: number): PaletteIndex | null => {
    if (src === null) return null;
    if (typeof src === "function") return src(px, py);
    return src;
  };

  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const [ix, iy] = inverseRotatePoint(px + 0.5, py + 0.5, cx, cy, rotation);
      const lx = ix - x;
      const ly = iy - y;
      const fillIdx = sample(fill, px, py);
      if (fillIdx !== null && contains(lx, ly, w, h)) {
        bitmap.pixels[py * bitmap.width + px] = fillIdx;
      }
      const strokeIdx = sample(stroke, px, py);
      if (strokeIdx !== null && sw > 0) {
        const insideOuter = contains(lx + sw, ly + sw, w + sw * 2, h + sw * 2)
          ? lx >= -sw && ly >= -sw && lx < w + sw && ly < h + sw
          : false;
        const inner = lx >= sw && ly >= sw && lx < w - sw && ly < h - sw;
        if (insideOuter && !inner) bitmap.pixels[py * bitmap.width + px] = strokeIdx;
      }
    }
  }
}

export { WHITE, BLACK, RED };
