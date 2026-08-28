/** Úpravy v sRGB před ditheringem. Hodnoty jasu/kontrastu/sytosti: −100…100. */

export function applyAdjustments(
  r: number,
  g: number,
  b: number,
  brightness: number,
  contrast: number,
  saturation: number,
): [number, number, number] {
  let rr = r;
  let gg = g;
  let bb = b;

  if (brightness) {
    const add = (brightness / 100) * 255;
    rr += add;
    gg += add;
    bb += add;
  }

  if (contrast) {
    const c = (contrast + 100) / 100;
    rr = (rr - 128) * c + 128;
    gg = (gg - 128) * c + 128;
    bb = (bb - 128) * c + 128;
  }

  if (saturation) {
    const gray = 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
    const s = (saturation + 100) / 100;
    rr = gray + (rr - gray) * s;
    gg = gray + (gg - gray) * s;
    bb = gray + (bb - gray) * s;
  }

  return [clamp255(rr), clamp255(gg), clamp255(bb)];
}

export function clamp255(v: number): number {
  if (v < 0) return 0;
  if (v > 255) return 255;
  return v;
}

export function compositeOnWhite(r: number, g: number, b: number, a: number): [number, number, number] {
  const t = a / 255;
  return [Math.round(r * t + 255 * (1 - t)), Math.round(g * t + 255 * (1 - t)), Math.round(b * t + 255 * (1 - t))];
}
