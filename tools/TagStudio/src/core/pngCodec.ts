import { decode as decodePng, encode as encodePng } from "fast-png";
import { indexedToRgb, nearestPalette, snapChannelToPalette } from "./palette";
import { createIndexed } from "./palette";
import type { IndexedBitmap, PaletteIndex, RgbaBitmap } from "./types";
import { WHITE } from "./types";

export function encodeIndexedPng(bitmap: IndexedBitmap): Uint8Array {
  const rgb = indexedToRgb(bitmap);
  return encodePng({
    width: rgb.width,
    height: rgb.height,
    data: rgb.data,
    channels: 3,
    depth: 8,
  });
}

export function decodePngToRgba(bytes: Uint8Array): RgbaBitmap {
  const img = decodePng(bytes);
  const { width, height } = img;
  const src = img.data;
  const channels = img.channels ?? (src.length / (width * height) === 3 ? 3 : 4);
  const data = new Uint8ClampedArray(width * height * 4);
  if (channels === 3) {
    for (let i = 0, j = 0; i < src.length; i += 3, j += 4) {
      data[j] = src[i];
      data[j + 1] = src[i + 1];
      data[j + 2] = src[i + 2];
      data[j + 3] = 255;
    }
  } else if (channels === 4) {
    data.set(src);
  } else if (channels === 1) {
    for (let i = 0, j = 0; i < src.length; i++, j += 4) {
      data[j] = data[j + 1] = data[j + 2] = src[i];
      data[j + 3] = 255;
    }
  } else {
    throw new Error(`Nepodporovaný počet kanálů PNG: ${channels}`);
  }
  return { width, height, data };
}

export function pngToIndexed(bytes: Uint8Array, redSensitivity = 45): IndexedBitmap {
  const rgba = decodePngToRgba(bytes);
  return rgbaToIndexed(rgba, redSensitivity);
}

export function rgbaToIndexed(rgba: RgbaBitmap, redSensitivity = 45): IndexedBitmap {
  const out = createIndexed(rgba.width, rgba.height, WHITE);
  const n = rgba.width * rgba.height;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const a = rgba.data[o + 3];
    const r = Math.round(rgba.data[o] * (a / 255) + 255 * (1 - a / 255));
    const g = Math.round(rgba.data[o + 1] * (a / 255) + 255 * (1 - a / 255));
    const b = Math.round(rgba.data[o + 2] * (a / 255) + 255 * (1 - a / 255));
    const snapped = snapChannelToPalette(r, g, b);
    out.pixels[i] = (snapped ?? nearestPalette(r, g, b, redSensitivity)) as PaletteIndex;
  }
  return out;
}

export function uniqueRgbInPng(bytes: Uint8Array): Array<[number, number, number]> {
  const img = decodePng(bytes);
  const src = img.data;
  const channels = img.channels ?? 3;
  const seen = new Map<string, [number, number, number]>();
  for (let i = 0; i < src.length; i += channels) {
    const r = src[i];
    const g = channels > 1 ? src[i + 1] : r;
    const b = channels > 2 ? src[i + 2] : r;
    seen.set(`${r},${g},${b}`, [r, g, b]);
  }
  return [...seen.values()];
}
