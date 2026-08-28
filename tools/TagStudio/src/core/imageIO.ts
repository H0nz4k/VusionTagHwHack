import { decodePngToRgba } from "./pngCodec";
import type { RgbaBitmap } from "./types";

const DATA_URL_RE = /^data:([^;]+);base64,/;

export function dataUrlToBytes(dataUrl: string): { mime: string; bytes: Uint8Array } {
  const m = dataUrl.match(DATA_URL_RE);
  if (!m) throw new Error("Neplatný data URL.");
  const b64 = dataUrl.slice(m[0].length);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { mime: m[1], bytes };
}

export function bytesToDataUrl(bytes: Uint8Array, mime: string): string {
  let s = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:${mime};base64,${btoa(s)}`;
}

export async function decodeImageFile(file: File): Promise<{ dataUrl: string; bitmap: RgbaBitmap }> {
  const buf = new Uint8Array(await file.arrayBuffer());
  const mime = file.type || guessMime(file.name);
  if (mime === "image/png") {
    const bitmap = decodePngToRgba(buf);
    return { dataUrl: bytesToDataUrl(buf, "image/png"), bitmap };
  }
  return decodeViaBrowser(buf, mime);
}

export async function decodeDataUrlImage(dataUrl: string): Promise<RgbaBitmap> {
  if (dataUrl.startsWith("data:image/png")) {
    try {
      const { bytes } = dataUrlToBytes(dataUrl);
      return decodePngToRgba(bytes);
    } catch {
      /* fall through */
    }
  }
  return decodeViaBrowserDataUrl(dataUrl);
}

function guessMime(name: string): string {
  const n = name.toLowerCase();
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

async function decodeViaBrowser(bytes: Uint8Array, mime: string): Promise<{ dataUrl: string; bitmap: RgbaBitmap }> {
  const dataUrl = bytesToDataUrl(bytes, mime);
  const bitmap = await decodeViaBrowserDataUrl(dataUrl);
  return { dataUrl, bitmap };
}

async function decodeViaBrowserDataUrl(dataUrl: string): Promise<RgbaBitmap> {
  const img = await loadHtmlImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D není dostupný.");
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { width: imageData.width, height: imageData.height, data: imageData.data };
}

function loadHtmlImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Nepodařilo se načíst obrázek."));
    img.src = src;
  });
}

export function rgbaFromRgb(width: number, height: number, rgb: Uint8Array): RgbaBitmap {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, j = 0; i < rgb.length; i += 3, j += 4) {
    data[j] = rgb[i];
    data[j + 1] = rgb[i + 1];
    data[j + 2] = rgb[i + 2];
    data[j + 3] = 255;
  }
  return { width, height, data };
}
