import { BLACK, INVALID, RED, WHITE, type ExportSettings, type IndexedBitmap, type PaletteIndex } from "./types";
import { planeByteSize } from "./profiles";
import { transformIndexed } from "./geometry";

/** Výchozí mapování v0.1/v0.2: bílá A=1 B=1, černá A=0 B=1, červená A=0 B=0. A=1 B=0 je neplatné. */
export function colorToPlanes(index: PaletteIndex): { a: 0 | 1; b: 0 | 1 } {
  if (index === WHITE) return { a: 1, b: 1 };
  if (index === BLACK) return { a: 0, b: 1 };
  return { a: 0, b: 0 };
}

export function planesToColor(a: 0 | 1, b: 0 | 1): PaletteIndex | typeof INVALID {
  if (a === 1 && b === 1) return WHITE;
  if (a === 0 && b === 1) return BLACK;
  if (a === 0 && b === 0) return RED;
  return INVALID;
}

/**
 * Logické mapování CoG EDG2-0260-A: rovina A = 0x10, rovina B = 0x13.
 * Bílá 0/0, černá 1/0, červená 0/1. Kombinace 1/1 je neplatná.
 * 0x10 a 0x13 jsou identifikátory příkazů CoG, ne bajty vkládané do BIN.
 */
export function colorToCogPlanes(index: PaletteIndex): { a: 0 | 1; b: 0 | 1 } {
  if (index === WHITE) return { a: 0, b: 0 };
  if (index === BLACK) return { a: 1, b: 0 };
  return { a: 0, b: 1 };
}

export function cogPlanesToColor(a: 0 | 1, b: 0 | 1): PaletteIndex | typeof INVALID {
  if (a === 0 && b === 0) return WHITE;
  if (a === 1 && b === 0) return BLACK;
  if (a === 0 && b === 1) return RED;
  return INVALID;
}

function mapper(settings: ExportSettings) {
  if (settings.planeMap === "cog-edg2-0260-a") {
    return { toPlanes: colorToCogPlanes, fromPlanes: cogPlanesToColor };
  }
  return { toPlanes: colorToPlanes, fromPlanes: planesToColor };
}

export function bitMask(bitInByte: number, msbFirst: boolean): number {
  const bit = msbFirst ? 7 - bitInByte : bitInByte;
  return 1 << bit;
}

/** bits[0] je první pixel vlevo. */
export function packByte(bits: Array<0 | 1>, bitOrder: ExportSettings["bitOrder"]): number {
  let v = 0;
  for (let i = 0; i < 8; i++) {
    const bit = bits[i] ?? 0;
    if (bitOrder === "msb-first") v |= bit << (7 - i);
    else v |= bit << i;
  }
  return v;
}

export function unpackByte(value: number, bitOrder: ExportSettings["bitOrder"]): Array<0 | 1> {
  const bits: Array<0 | 1> = [];
  for (let i = 0; i < 8; i++) {
    if (bitOrder === "msb-first") bits.push(((value >> (7 - i)) & 1) as 0 | 1);
    else bits.push(((value >> i) & 1) as 0 | 1);
  }
  return bits;
}

function planeFromBitmap(bitmap: IndexedBitmap, which: "a" | "b", settings: ExportSettings): Uint8Array {
  const totalBits = bitmap.width * bitmap.height;
  const bytes = new Uint8Array(planeByteSize(bitmap.width, bitmap.height));
  const msb = settings.bitOrder === "msb-first";
  const invert = which === "a" ? settings.invertA : settings.invertB;
  const toPlanes = mapper(settings).toPlanes;
  for (let i = 0; i < totalBits; i++) {
    const planes = toPlanes(bitmap.pixels[i] as PaletteIndex);
    let bit: 0 | 1 = which === "a" ? planes.a : planes.b;
    if (invert) bit = bit ? 0 : 1;
    if (bit) bytes[i >> 3] |= bitMask(i & 7, msb);
  }
  return bytes;
}

export function encodeSizeAfterTransform(
  width: number,
  height: number,
  rotate: ExportSettings["rotate"],
): { width: number; height: number } {
  if (rotate === 90 || rotate === 270) return { width: height, height: width };
  return { width, height };
}

export function expectedBinSize(width: number, height: number, rotate: ExportSettings["rotate"]): number {
  const s = encodeSizeAfterTransform(width, height, rotate);
  return planeByteSize(s.width, s.height) * 2;
}

function applyGeometry(bitmap: IndexedBitmap, settings: ExportSettings): IndexedBitmap {
  return transformIndexed(bitmap, {
    rotate: settings.rotate,
    flipX: settings.flipX,
    flipY: settings.flipY,
  });
}

export function encodePlanes(bitmap: IndexedBitmap, settings: ExportSettings): Uint8Array {
  const geo = applyGeometry(bitmap, settings);
  const planeA = planeFromBitmap(geo, "a", settings);
  const planeB = planeFromBitmap(geo, "b", settings);
  const out = new Uint8Array(planeA.length + planeB.length);
  if (settings.planeOrder === "a-then-b") {
    out.set(planeA, 0);
    out.set(planeB, planeA.length);
  } else {
    out.set(planeB, 0);
    out.set(planeA, planeB.length);
  }
  return out;
}

export interface DecodeResult {
  bitmap: IndexedBitmap;
  invalidCount: number;
  width: number;
  height: number;
}

export function decodePlanes(bytes: Uint8Array, width: number, height: number, settings: ExportSettings): DecodeResult {
  const encoded = encodeSizeAfterTransform(width, height, settings.rotate);
  const pw = encoded.width;
  const ph = encoded.height;
  const psz = planeByteSize(pw, ph);
  if (bytes.length < psz * 2) {
    throw new Error(`BIN má ${bytes.length} B, po transformaci očekáváno ${psz * 2} B.`);
  }

  const aBytes = settings.planeOrder === "a-then-b" ? bytes.subarray(0, psz) : bytes.subarray(psz, psz * 2);
  const bBytes = settings.planeOrder === "a-then-b" ? bytes.subarray(psz, psz * 2) : bytes.subarray(0, psz);

  const fromPlanes = mapper(settings).fromPlanes;
  const pixels = new Uint8Array(pw * ph);
  const totalBits = pw * ph;
  const msb = settings.bitOrder === "msb-first";
  let invalidCount = 0;
  for (let i = 0; i < totalBits; i++) {
    const mask = bitMask(i & 7, msb);
    let a: 0 | 1 = aBytes[i >> 3] & mask ? 1 : 0;
    let b: 0 | 1 = bBytes[i >> 3] & mask ? 1 : 0;
    if (settings.invertA) a = a ? 0 : 1;
    if (settings.invertB) b = b ? 0 : 1;
    const color = fromPlanes(a, b);
    if (color === INVALID) invalidCount += 1;
    pixels[i] = color;
  }

  let bitmap: IndexedBitmap = { width: pw, height: ph, pixels };
  if (settings.rotate) {
    const inv = settings.rotate === 90 ? 270 : settings.rotate === 270 ? 90 : 180;
    bitmap = transformIndexed(bitmap, { rotate: inv, flipX: false, flipY: false });
  }
  if (settings.flipY) bitmap = transformIndexed(bitmap, { rotate: 0, flipX: false, flipY: true });
  if (settings.flipX) bitmap = transformIndexed(bitmap, { rotate: 0, flipX: true, flipY: false });

  return { bitmap, invalidCount, width: bitmap.width, height: bitmap.height };
}
