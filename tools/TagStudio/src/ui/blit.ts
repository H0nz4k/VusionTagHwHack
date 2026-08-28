import { indexToRgb } from "../core/palette";
import type { DecodedIndex, IndexedBitmap } from "../core/types";

export function blitIndexed(canvas: HTMLCanvasElement, bitmap: IndexedBitmap): void {
  if (canvas.width !== bitmap.width) canvas.width = bitmap.width;
  if (canvas.height !== bitmap.height) canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = ctx.createImageData(bitmap.width, bitmap.height);
  for (let i = 0; i < bitmap.pixels.length; i++) {
    const rgb = indexToRgb(bitmap.pixels[i] as DecodedIndex);
    const o = i * 4;
    img.data[o] = rgb[0];
    img.data[o + 1] = rgb[1];
    img.data[o + 2] = rgb[2];
    img.data[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}
