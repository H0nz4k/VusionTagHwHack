import { nearestPalette, srgbToLinear, LINEAR_PALETTE, createIndexed } from "./palette";
import { BLACK, RED, WHITE, type BwrSettings, type DitherId, type IndexedBitmap, type PaletteIndex } from "./types";
import {
  ATKINSON_KERNEL,
  BURKES_KERNEL,
  FLOYD_STEINBERG_KERNEL,
  SIERRA_LITE_KERNEL,
  mirrorTaps,
  type ErrorKernel,
} from "./ditherKernels";
import { BLUE_NOISE_SIZE, getBlueNoiseTile } from "./blueNoise";
import { buildRedMask, type BwrMaskResult } from "./bwr";

export interface DitherInput {
  width: number;
  height: number;
  data: Uint8Array;
  redSensitivity: number;
  blueNoiseStrength?: number;
  bwr?: BwrSettings;
}

export interface DitherResult {
  bitmap: IndexedBitmap;
  redMask: Uint8Array | null;
}

const BAYER2 = [
  [0, 2],
  [3, 1],
];

const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

const BAYER8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

function paletteLinear(index: PaletteIndex): readonly [number, number, number] {
  return LINEAR_PALETTE[index];
}

function toLinearPixel(r: number, g: number, b: number): [number, number, number] {
  return [srgbToLinear(r), srgbToLinear(g), srgbToLinear(b)];
}

function linearApproxSrgb(l: number): number {
  const x = Math.min(1, Math.max(0, l));
  const c = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
  return Math.round(c * 255);
}

function quantizeRgb(lr: number, lg: number, lb: number, redSensitivity: number): PaletteIndex {
  return nearestPalette(linearApproxSrgb(lr), linearApproxSrgb(lg), linearApproxSrgb(lb), redSensitivity);
}

function quantizeBw(lr: number, lg: number, lb: number): PaletteIndex {
  const y = 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
  return y >= 0.5 ? WHITE : BLACK;
}

function lumaSrgb(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function buildLinearBuffer(input: DitherInput): Float64Array {
  const n = input.width * input.height;
  const lin = new Float64Array(n * 3);
  for (let i = 0; i < n; i++) {
    const o = i * 3;
    const [lr, lg, lb] = toLinearPixel(input.data[o], input.data[o + 1], input.data[o + 2]);
    lin[o] = lr;
    lin[o + 1] = lg;
    lin[o + 2] = lb;
  }
  return lin;
}

function addErr(lin: Float64Array, w: number, h: number, x: number, y: number, err: [number, number, number], factor: number): void {
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const o = (y * w + x) * 3;
  lin[o] += err[0] * factor;
  lin[o + 1] += err[1] * factor;
  lin[o + 2] += err[2] * factor;
}

function ditherErrorKernel(
  input: DitherInput,
  kernel: ErrorKernel,
  quantize: (lr: number, lg: number, lb: number) => PaletteIndex,
): IndexedBitmap {
  const lin = buildLinearBuffer(input);
  const { width: w, height: h } = input;
  const out = createIndexed(w, h);
  const inv = 1 / kernel.denom;
  for (let y = 0; y < h; y++) {
    const dir: 1 | -1 = y % 2 === 1 ? -1 : 1;
    const taps = mirrorTaps(kernel.taps, dir);
    const xStart = dir === 1 ? 0 : w - 1;
    const xEnd = dir === 1 ? w : -1;
    for (let x = xStart; x !== xEnd; x += dir) {
      const i = y * w + x;
      const o = i * 3;
      const lr = lin[o];
      const lg = lin[o + 1];
      const lb = lin[o + 2];
      const q = quantize(lr, lg, lb);
      out.pixels[i] = q;
      const p = paletteLinear(q);
      const err: [number, number, number] = [lr - p[0], lg - p[1], lb - p[2]];
      for (const t of taps) addErr(lin, w, h, x + t.dx, y + t.dy, err, t.w * inv);
    }
  }
  return out;
}

export function ditherNone(input: DitherInput): IndexedBitmap {
  const out = createIndexed(input.width, input.height);
  const n = input.width * input.height;
  for (let i = 0; i < n; i++) {
    const o = i * 3;
    out.pixels[i] = nearestPalette(input.data[o], input.data[o + 1], input.data[o + 2], input.redSensitivity);
  }
  return out;
}

export function ditherFloydSteinberg(input: DitherInput): IndexedBitmap {
  return ditherErrorKernel(input, FLOYD_STEINBERG_KERNEL, (lr, lg, lb) => quantizeRgb(lr, lg, lb, input.redSensitivity));
}

export function ditherAtkinson(input: DitherInput): IndexedBitmap {
  return ditherErrorKernel(input, ATKINSON_KERNEL, (lr, lg, lb) => quantizeRgb(lr, lg, lb, input.redSensitivity));
}

export function ditherSierraLite(input: DitherInput): IndexedBitmap {
  return ditherErrorKernel(input, SIERRA_LITE_KERNEL, (lr, lg, lb) => quantizeRgb(lr, lg, lb, input.redSensitivity));
}

export function ditherBurkes(input: DitherInput): IndexedBitmap {
  return ditherErrorKernel(input, BURKES_KERNEL, (lr, lg, lb) => quantizeRgb(lr, lg, lb, input.redSensitivity));
}

function ditherBayerMatrix(input: DitherInput, matrix: number[][], levels: number): IndexedBitmap {
  const { width: w, height: h } = input;
  const out = createIndexed(w, h);
  const n = w * h;
  const maskX = matrix[0].length - 1;
  const maskY = matrix.length - 1;
  const amp = 48;
  for (let i = 0; i < n; i++) {
    const x = i % w;
    const y = (i / w) | 0;
    const o = i * 3;
    const t = (matrix[y & maskY][x & maskX] + 0.5) / levels - 0.5;
    const r = Math.min(255, Math.max(0, input.data[o] + t * amp));
    const g = Math.min(255, Math.max(0, input.data[o + 1] + t * amp));
    const b = Math.min(255, Math.max(0, input.data[o + 2] + t * amp));
    out.pixels[i] = nearestPalette(r, g, b, input.redSensitivity);
  }
  return out;
}

export function ditherOrdered(input: DitherInput): IndexedBitmap {
  return ditherBayerMatrix(input, BAYER4, 16);
}

export function ditherBayer2(input: DitherInput): IndexedBitmap {
  return ditherBayerMatrix(input, BAYER2, 4);
}

export function ditherBayer8(input: DitherInput): IndexedBitmap {
  return ditherBayerMatrix(input, BAYER8, 64);
}

export function ditherBlueNoise(input: DitherInput): IndexedBitmap {
  const tile = getBlueNoiseTile();
  const { width: w, height: h } = input;
  const out = createIndexed(w, h);
  const n = w * h;
  const strength = Math.min(100, Math.max(0, input.blueNoiseStrength ?? 50));
  const amp = (strength / 100) * 96;
  for (let i = 0; i < n; i++) {
    const x = i % w;
    const y = (i / w) | 0;
    const o = i * 3;
    const t = (tile[(y & (BLUE_NOISE_SIZE - 1)) * BLUE_NOISE_SIZE + (x & (BLUE_NOISE_SIZE - 1))] + 0.5) / 256 - 0.5;
    const r = Math.min(255, Math.max(0, input.data[o] + t * amp));
    const g = Math.min(255, Math.max(0, input.data[o + 1] + t * amp));
    const b = Math.min(255, Math.max(0, input.data[o + 2] + t * amp));
    out.pixels[i] = nearestPalette(r, g, b, input.redSensitivity);
  }
  return out;
}

function ditherBwNone(input: DitherInput): IndexedBitmap {
  const out = createIndexed(input.width, input.height);
  const n = input.width * input.height;
  for (let i = 0; i < n; i++) {
    const o = i * 3;
    const [lr, lg, lb] = toLinearPixel(input.data[o], input.data[o + 1], input.data[o + 2]);
    out.pixels[i] = quantizeBw(lr, lg, lb);
  }
  return out;
}

function ditherBwBayer(input: DitherInput, matrix: number[][], levels: number): IndexedBitmap {
  const { width: w, height: h } = input;
  const out = createIndexed(w, h);
  const n = w * h;
  const maskX = matrix[0].length - 1;
  const maskY = matrix.length - 1;
  const amp = 48;
  for (let i = 0; i < n; i++) {
    const x = i % w;
    const y = (i / w) | 0;
    const o = i * 3;
    const t = (matrix[y & maskY][x & maskX] + 0.5) / levels - 0.5;
    const yv = lumaSrgb(input.data[o], input.data[o + 1], input.data[o + 2]) + t * amp;
    out.pixels[i] = yv >= 128 ? WHITE : BLACK;
  }
  return out;
}

function ditherBwBlue(input: DitherInput): IndexedBitmap {
  const tile = getBlueNoiseTile();
  const { width: w, height: h } = input;
  const out = createIndexed(w, h);
  const n = w * h;
  const strength = Math.min(100, Math.max(0, input.blueNoiseStrength ?? 50));
  const amp = (strength / 100) * 96;
  for (let i = 0; i < n; i++) {
    const x = i % w;
    const y = (i / w) | 0;
    const o = i * 3;
    const t = (tile[(y & (BLUE_NOISE_SIZE - 1)) * BLUE_NOISE_SIZE + (x & (BLUE_NOISE_SIZE - 1))] + 0.5) / 256 - 0.5;
    const yv = lumaSrgb(input.data[o], input.data[o + 1], input.data[o + 2]) + t * amp;
    out.pixels[i] = yv >= 128 ? WHITE : BLACK;
  }
  return out;
}

export function ditherBwPhase(input: DitherInput, phase: DitherId): IndexedBitmap {
  const q = quantizeBw;
  switch (phase) {
    case "none":
      return ditherBwNone(input);
    case "floyd-steinberg":
      return ditherErrorKernel(input, FLOYD_STEINBERG_KERNEL, q);
    case "atkinson":
      return ditherErrorKernel(input, ATKINSON_KERNEL, q);
    case "sierra-lite":
      return ditherErrorKernel(input, SIERRA_LITE_KERNEL, q);
    case "burkes":
      return ditherErrorKernel(input, BURKES_KERNEL, q);
    case "bayer-2x2":
      return ditherBwBayer(input, BAYER2, 4);
    case "ordered":
      return ditherBwBayer(input, BAYER4, 16);
    case "bayer-8x8":
      return ditherBwBayer(input, BAYER8, 64);
    case "blue-noise":
      return ditherBwBlue(input);
    default:
      return ditherBwNone(input);
  }
}

export function ditherBwrTwoPhase(input: DitherInput): DitherResult {
  const bwr = input.bwr ?? {
    minChroma: 18,
    maskThreshold: 48,
    protectNeutrals: true,
    bwPhase: "atkinson" as const,
  };
  const maskRes: BwrMaskResult = buildRedMask(input, bwr, input.redSensitivity);
  const maskedRgb = new Uint8Array(input.data);
  for (let i = 0; i < maskRes.mask.length; i++) {
    if (!maskRes.mask[i]) continue;
    const o = i * 3;
    maskedRgb[o] = 255;
    maskedRgb[o + 1] = 255;
    maskedRgb[o + 2] = 255;
  }
  const bw = ditherBwPhase({ ...input, data: maskedRgb }, bwr.bwPhase);
  const out = createIndexed(input.width, input.height);
  for (let i = 0; i < out.pixels.length; i++) {
    out.pixels[i] = maskRes.mask[i] ? RED : bw.pixels[i] === BLACK ? BLACK : WHITE;
  }
  return { bitmap: out, redMask: maskRes.mask };
}

export function ditherRgbDetailed(input: DitherInput, mode: DitherId): DitherResult {
  switch (mode) {
    case "none":
      return { bitmap: ditherNone(input), redMask: null };
    case "floyd-steinberg":
      return { bitmap: ditherFloydSteinberg(input), redMask: null };
    case "atkinson":
      return { bitmap: ditherAtkinson(input), redMask: null };
    case "sierra-lite":
      return { bitmap: ditherSierraLite(input), redMask: null };
    case "burkes":
      return { bitmap: ditherBurkes(input), redMask: null };
    case "ordered":
      return { bitmap: ditherOrdered(input), redMask: null };
    case "bayer-2x2":
      return { bitmap: ditherBayer2(input), redMask: null };
    case "bayer-8x8":
      return { bitmap: ditherBayer8(input), redMask: null };
    case "blue-noise":
      return { bitmap: ditherBlueNoise(input), redMask: null };
    case "bwr-two-phase":
      return ditherBwrTwoPhase(input);
    default:
      return { bitmap: ditherNone(input), redMask: null };
  }
}

export function ditherRgb(input: DitherInput, mode: DitherId): IndexedBitmap {
  return ditherRgbDetailed(input, mode).bitmap;
}

export { WHITE, BLACK, RED };
