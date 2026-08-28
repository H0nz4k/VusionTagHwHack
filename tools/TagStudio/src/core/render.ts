import type { ImageLayer, IndexedBitmap, Project, RgbaBitmap, TextLayer } from "./types";
import { INDEX_FROM_COLOR, WHITE } from "./types";
import { applyAdjustments, compositeOnWhite } from "./adjust";
import { ditherRgbDetailed } from "./dither";
import { createIndexed, nearestPalette, normalizeIndexed } from "./palette";
import { drawIndexLine, fillRotatedRect, inverseRotatePoint, sampleBilinear } from "./geometry";
import { FONT_FAMILY } from "./font";
import { sampleFill, WHITE_FILL } from "./fillStyle";

export type ImageCache = Map<string, RgbaBitmap>;

export interface RenderResult {
  bitmap: IndexedBitmap;
  rasterRgb: Uint8Array;
  redMask: Uint8Array | null;
}

function sourceRect(layer: ImageLayer): { sx: number; sy: number; sw: number; sh: number } {
  if (layer.crop && layer.crop.width > 0 && layer.crop.height > 0) {
    return { sx: layer.crop.x, sy: layer.crop.y, sw: layer.crop.width, sh: layer.crop.height };
  }
  const { srcWidth: iw, srcHeight: ih, width: dw, height: dh, fit } = layer;
  if (fit === "manual" || dw <= 0 || dh <= 0) {
    return { sx: 0, sy: 0, sw: iw, sh: ih };
  }
  const scaleContain = Math.min(dw / iw, dh / ih);
  const scaleCover = Math.max(dw / iw, dh / ih);
  const scale = fit === "cover" ? scaleCover : scaleContain;
  const usedW = dw / scale;
  const usedH = dh / scale;
  const sx = (iw - usedW) / 2;
  const sy = (ih - usedH) / 2;
  return { sx, sy, sw: usedW, sh: usedH };
}

function compositeImageLayer(
  rgb: Uint8Array,
  canvasW: number,
  canvasH: number,
  layer: ImageLayer,
  src: RgbaBitmap,
  globalBright: number,
  globalContrast: number,
  globalSat: number,
  covered: Uint8Array | null,
): void {
  const { x, y, width: lw, height: lh, rotation, flipX, flipY } = layer;
  if (lw <= 0 || lh <= 0) return;
  const cx = x + lw / 2;
  const cy = y + lh / 2;
  const { sx, sy, sw, sh } = sourceRect(layer);
  const pad = Math.ceil(Math.hypot(lw, lh) / 2) + 2;
  const minX = Math.max(0, Math.floor(cx - pad));
  const maxX = Math.min(canvasW, Math.ceil(cx + pad));
  const minY = Math.max(0, Math.floor(cy - pad));
  const maxY = Math.min(canvasH, Math.ceil(cy + pad));

  for (let py = minY; py < maxY; py++) {
    for (let px = minX; px < maxX; px++) {
      const [ix, iy] = inverseRotatePoint(px + 0.5, py + 0.5, cx, cy, rotation);
      let lx = ix - x;
      let ly = iy - y;
      if (flipX) lx = lw - lx;
      if (flipY) ly = lh - ly;
      if (lx < 0 || ly < 0 || lx >= lw || ly >= lh) continue;
      const u = lx / lw;
      const v = ly / lh;
      const srcX = sx + u * sw;
      const srcY = sy + v * sh;
      if (srcX < -0.5 || srcY < -0.5 || srcX >= src.width + 0.5 || srcY >= src.height + 0.5) continue;
      const [sr, sg, sb, sa] = sampleBilinear(
        src.data,
        src.width,
        src.height,
        Math.min(src.width - 1, Math.max(0, srcX)),
        Math.min(src.height - 1, Math.max(0, srcY)),
      );
      if (sa < 1) continue;
      let [r, g, b] = compositeOnWhite(sr, sg, sb, sa);
      [r, g, b] = applyAdjustments(
        r,
        g,
        b,
        layer.brightness + globalBright,
        layer.contrast + globalContrast,
        layer.saturation + globalSat,
      );
      if (!layer.ditherEnabled) {
        const idx = nearestPalette(r, g, b, layer.redSensitivity);
        const pal = idx === 1 ? [0, 0, 0] : idx === 2 ? [255, 0, 0] : [255, 255, 255];
        r = pal[0];
        g = pal[1];
        b = pal[2];
      }
      const o = (py * canvasW + px) * 3;
      const a = sa / 255;
      rgb[o] = Math.round(r * a + rgb[o] * (1 - a));
      rgb[o + 1] = Math.round(g * a + rgb[o + 1] * (1 - a));
      rgb[o + 2] = Math.round(b * a + rgb[o + 2] * (1 - a));
      if (covered) covered[py * canvasW + px] = 1;
    }
  }
}

function drawShapes(bitmap: IndexedBitmap, project: Project): void {
  for (const layer of project.layers) {
    if (!layer.visible) continue;
    if (layer.type === "rect") {
      fillRotatedRect(
        bitmap,
        layer.x,
        layer.y,
        layer.width,
        layer.height,
        layer.rotation,
        (px, py) => sampleFill(layer.fill, px, py),
        (px, py) => sampleFill(layer.stroke, px, py),
        layer.strokeWidth,
      );
    } else if (layer.type === "line") {
      drawIndexLine(
        bitmap,
        layer.x1,
        layer.y1,
        layer.x2,
        layer.y2,
        INDEX_FROM_COLOR[layer.color],
        layer.thickness,
      );
    }
  }
}

export function renderRasterRgb(project: Project, cache: ImageCache, covered?: Uint8Array | null): Uint8Array {
  const { canvasWidth: w, canvasHeight: h } = project;
  const rgb = new Uint8Array(w * h * 3);
  rgb.fill(255);
  for (const layer of project.layers) {
    if (!layer.visible || layer.type !== "image") continue;
    const src = cache.get(layer.id);
    if (!src) continue;
    compositeImageLayer(
      rgb,
      w,
      h,
      layer,
      src,
      project.dither.brightness,
      project.dither.contrast,
      project.dither.saturation,
      covered ?? null,
    );
  }
  return rgb;
}

export function ditherRaster(project: Project, rgb: Uint8Array) {
  return ditherRgbDetailed(
    {
      width: project.canvasWidth,
      height: project.canvasHeight,
      data: rgb,
      redSensitivity: project.dither.redSensitivity,
      blueNoiseStrength: project.dither.blueNoiseStrength,
      bwr: project.dither.bwr,
    },
    project.dither.mode,
  );
}

export function overlaySharpLayers(
  bitmap: IndexedBitmap,
  project: Project,
  textPixels?: IndexedBitmap | null,
  covered?: Uint8Array | null,
): IndexedBitmap {
  const out: IndexedBitmap = {
    width: bitmap.width,
    height: bitmap.height,
    pixels: new Uint8Array(bitmap.pixels),
  };
  const bg = project.background ?? WHITE_FILL;
  const customBg = !(bg.kind === "solid" && bg.color === "white");
  if (customBg) {
    for (let y = 0; y < out.height; y++) {
      for (let x = 0; x < out.width; x++) {
        const i = y * out.width + x;
        if (covered && covered[i]) continue;
        const v = sampleFill(bg, x, y);
        if (v !== null) out.pixels[i] = v;
      }
    }
  }
  drawShapes(out, project);
  if (textPixels && textPixels.width === out.width && textPixels.height === out.height) {
    for (let i = 0; i < out.pixels.length; i++) {
      const v = textPixels.pixels[i];
      if (v !== 255) out.pixels[i] = v;
    }
  }
  return normalizeIndexed(out);
}

/** Text se rasterizuje v UI přes Canvas (maska + práh). Node testy tvary zvládnou bez fontu. */
export function renderProject(project: Project, cache: ImageCache, textMask?: IndexedBitmap | null): RenderResult {
  const covered = new Uint8Array(project.canvasWidth * project.canvasHeight);
  const rasterRgb = renderRasterRgb(project, cache, covered);
  const dithered = ditherRaster(project, rasterRgb);
  const bitmap = overlaySharpLayers(dithered.bitmap, project, textMask ?? null, covered);
  return { bitmap, rasterRgb, redMask: dithered.redMask };
}

export function emptyWhite(width: number, height: number): IndexedBitmap {
  return createIndexed(width, height, WHITE);
}

export function rasterizeTextLayers(project: Project): IndexedBitmap | null {
  if (typeof document === "undefined") return null;
  const layers = project.layers.filter((l): l is TextLayer => l.type === "text" && l.visible);
  if (!layers.length) return null;
  const canvas = document.createElement("canvas");
  canvas.width = project.canvasWidth;
  canvas.height = project.canvasHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const mask = createIndexed(project.canvasWidth, project.canvasHeight, WHITE);
  mask.pixels.fill(255);

  for (const layer of layers) {
    const tmp = document.createElement("canvas");
    tmp.width = project.canvasWidth;
    tmp.height = project.canvasHeight;
    const tctx = tmp.getContext("2d", { willReadFrequently: true });
    if (!tctx) continue;
    tctx.clearRect(0, 0, tmp.width, tmp.height);
    tctx.save();
    const cx = layer.x + layer.width / 2;
    const cy = layer.y + layer.height / 2;
    tctx.translate(cx, cy);
    tctx.rotate((layer.rotation * Math.PI) / 180);
    tctx.translate(-cx, -cy);
    tctx.font = `${layer.bold ? 700 : 400} ${layer.fontSize}px ${FONT_FAMILY}`;
    tctx.textBaseline = "top";
    tctx.textAlign = layer.align;
    tctx.imageSmoothingEnabled = true;
    const lines = layer.text.replace(/\r\n/g, "\n").split("\n");
    const lh = layer.fontSize * (layer.lineHeight || 1.15);
    let tx = layer.x;
    if (layer.align === "center") tx = layer.x + layer.width / 2;
    if (layer.align === "right") tx = layer.x + layer.width;
    tctx.fillStyle = "#ffffff";
    tctx.strokeStyle = "#ffffff";
    tctx.lineJoin = "round";
    tctx.miterLimit = 2;
    if (layer.outline && layer.outlineWidth > 0) {
      tctx.lineWidth = layer.outlineWidth * 2;
      lines.forEach((line, i) => tctx.strokeText(line, tx, layer.y + i * lh));
    }
    lines.forEach((line, i) => tctx.fillText(line, tx, layer.y + i * lh));
    tctx.restore();
    const img = tctx.getImageData(0, 0, tmp.width, tmp.height);
    const w = tmp.width;
    for (let i = 0; i < mask.pixels.length; i++) {
      const a = img.data[i * 4 + 3];
      if (a < 128) continue;
      const x = i % w;
      const y = (i / w) | 0;
      const idx = sampleFill(layer.fill, x, y);
      mask.pixels[i] = idx ?? INDEX_FROM_COLOR[layer.color];
    }
  }
  return mask;
}
