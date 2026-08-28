import { srgbToLinear } from "./palette";
import type { BwrSettings } from "./types";

export interface BwrMaskResult {
  mask: Uint8Array;
  scores: Float64Array;
}

export interface RgbGrid {
  width: number;
  height: number;
  data: Uint8Array;
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

/** Příslušnost k červenému/oranžovému akcentu 0–1. Neutrální tóny → 0 při zapnuté ochraně. */
export function redAffinity(r: number, g: number, b: number, bwr: BwrSettings, redSensitivity: number): number {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const maxc = Math.max(lr, lg, lb);
  const minc = Math.min(lr, lg, lb);
  const chroma = maxc - minc;
  const luma = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
  const minChroma = Math.min(100, Math.max(0, bwr.minChroma)) / 100;

  if (bwr.protectNeutrals && chroma < minChroma) return 0;
  if (chroma < 0.02) return 0;

  const rb = lr - lb;
  const rg = lr - lg;
  const gb = lg - lb;
  const redHue = rb > 0.02 && rg > -0.08;
  const orangeHue = rb > 0.08 && gb > 0.02 && rg < 0.25;
  if (!redHue && !orangeHue) return 0;

  const redness = Math.max(0, 0.7 * rb + 0.35 * Math.max(0, rg) - 0.2 * Math.max(0, -rg));
  const sens = Math.min(100, Math.max(0, redSensitivity)) / 100;
  let score = redness * (0.35 + 0.65 * chroma);
  score *= 0.45 + 0.7 * sens;

  if (luma < 0.28 && lr > lg * 1.25 && lr > lb * 1.35 && chroma > Math.min(0.05, minChroma)) {
    score = Math.max(score, 0.42 + sens * 0.35);
  }

  if (!bwr.protectNeutrals && chroma < minChroma) {
    score *= chroma / Math.max(minChroma, 1e-6);
  }

  return clamp01(score);
}

export function buildRedMask(input: RgbGrid, bwr: BwrSettings, redSensitivity: number): BwrMaskResult {
  const n = input.width * input.height;
  const mask = new Uint8Array(n);
  const scores = new Float64Array(n);
  const thr = Math.min(100, Math.max(0, bwr.maskThreshold)) / 100;
  for (let i = 0; i < n; i++) {
    const o = i * 3;
    const s = redAffinity(input.data[o], input.data[o + 1], input.data[o + 2], bwr, redSensitivity);
    scores[i] = s;
    mask[i] = s >= thr ? 1 : 0;
  }
  return { mask, scores };
}

export function maskToPreview(width: number, height: number, mask: Uint8Array): { width: number; height: number; pixels: Uint8Array } {
  const pixels = new Uint8Array(width * height);
  for (let i = 0; i < pixels.length; i++) pixels[i] = mask[i] ? 2 : 0;
  return { width, height, pixels };
}
