import {
  BLACK,
  INVALID,
  PALETTE_RGB,
  RED,
  WHITE,
  type DecodedIndex,
  type IndexedBitmap,
  type PaletteIndex,
  type RgbBitmap,
} from "./types";

export function srgbToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function linearToSrgb(l: number): number {
  const c = l <= 0.0031308 ? 12.92 * l : 1.055 * l ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(255, Math.max(0, c * 255)));
}

export const LINEAR_PALETTE: Record<PaletteIndex, readonly [number, number, number]> = {
  [WHITE]: [1, 1, 1],
  [BLACK]: [0, 0, 0],
  [RED]: [srgbToLinear(255), 0, 0],
};

const SNAP = 1;

export function snapChannelToPalette(r: number, g: number, b: number): PaletteIndex | null {
  const near = (a: number, t: number) => Math.abs(a - t) <= SNAP;
  if (near(r, 255) && near(g, 255) && near(b, 255)) return WHITE;
  if (near(r, 0) && near(g, 0) && near(b, 0)) return BLACK;
  if (near(r, 255) && near(g, 0) && near(b, 0)) return RED;
  return null;
}

export function rgbDistance2(
  lr: number,
  lg: number,
  lb: number,
  index: PaletteIndex,
): number {
  const p = LINEAR_PALETTE[index];
  const dr = lr - p[0];
  const dg = lg - p[1];
  const db = lb - p[2];
  return dr * dr + dg * dg + db * db;
}

/**
 * Nejbližší barva palety v lineárním RGB.
 * redSensitivity 0–100: vyšší hodnota preferuje červenou u pixelů s převažujícím R kanálem.
 */
export function nearestPalette(
  r: number,
  g: number,
  b: number,
  redSensitivity = 45,
): PaletteIndex {
  const snapped = snapChannelToPalette(r, g, b);
  if (snapped !== null) return snapped;

  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const chroma = Math.max(0, lr - Math.max(lg, lb));
  const boost = (Math.min(100, Math.max(0, redSensitivity)) / 100) * 0.85;

  let best: PaletteIndex = WHITE;
  let bestD = Infinity;
  ([WHITE, BLACK, RED] as PaletteIndex[]).forEach((idx) => {
    let d = rgbDistance2(lr, lg, lb, idx);
    if (idx === RED) d *= 1 - boost * chroma;
    if (d < bestD) {
      bestD = d;
      best = idx;
    }
  });
  return best;
}

export function indexToRgb(index: DecodedIndex): readonly [number, number, number] {
  if (index === INVALID) return [255, 0, 255];
  return PALETTE_RGB[index];
}

export function indexedToRgb(bitmap: IndexedBitmap): RgbBitmap {
  const data = new Uint8Array(bitmap.width * bitmap.height * 3);
  for (let i = 0; i < bitmap.pixels.length; i++) {
    const rgb = indexToRgb(bitmap.pixels[i] as DecodedIndex);
    const o = i * 3;
    data[o] = rgb[0];
    data[o + 1] = rgb[1];
    data[o + 2] = rgb[2];
  }
  return { width: bitmap.width, height: bitmap.height, data };
}

export function createIndexed(width: number, height: number, fill: PaletteIndex = WHITE): IndexedBitmap {
  const pixels = new Uint8Array(width * height);
  if (fill !== WHITE) pixels.fill(fill);
  return { width, height, pixels };
}

export function paletteStats(bitmap: IndexedBitmap): {
  white: number;
  black: number;
  red: number;
  invalid: number;
  total: number;
} {
  let white = 0;
  let black = 0;
  let red = 0;
  let invalid = 0;
  for (let i = 0; i < bitmap.pixels.length; i++) {
    const v = bitmap.pixels[i];
    if (v === WHITE) white += 1;
    else if (v === BLACK) black += 1;
    else if (v === RED) red += 1;
    else invalid += 1;
  }
  return { white, black, red, invalid, total: bitmap.pixels.length };
}

export function usedPaletteCount(bitmap: IndexedBitmap): number {
  const s = paletteStats(bitmap);
  return (s.white ? 1 : 0) + (s.black ? 1 : 0) + (s.red ? 1 : 0);
}

export function cloneIndexed(bitmap: IndexedBitmap): IndexedBitmap {
  return { width: bitmap.width, height: bitmap.height, pixels: new Uint8Array(bitmap.pixels) };
}

export function bitmapsEqual(a: IndexedBitmap, b: IndexedBitmap): boolean {
  if (a.width !== b.width || a.height !== b.height) return false;
  if (a.pixels.length !== b.pixels.length) return false;
  for (let i = 0; i < a.pixels.length; i++) {
    if (a.pixels[i] !== b.pixels[i]) return false;
  }
  return true;
}

export function normalizeIndexed(bitmap: IndexedBitmap): IndexedBitmap {
  const pixels = new Uint8Array(bitmap.pixels.length);
  for (let i = 0; i < bitmap.pixels.length; i++) {
    const v = bitmap.pixels[i];
    pixels[i] = v === BLACK || v === RED ? v : WHITE;
  }
  return { width: bitmap.width, height: bitmap.height, pixels };
}
