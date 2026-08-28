import { describe, expect, it } from "vitest";
import {
  colorToPlanes,
  decodePlanes,
  encodePlanes,
  expectedBinSize,
  packByte,
  unpackByte,
} from "../src/core/codec";
import { bitmapsEqual, createIndexed } from "../src/core/palette";
import { BLACK, RED, WHITE, defaultExportSettings, type ExportSettings, type PaletteIndex } from "../src/core/types";

function settings(patch: Partial<ExportSettings> = {}): ExportSettings {
  return { ...defaultExportSettings(), ...patch };
}

describe("packování bitů", () => {
  it("MSB-first: první pixel je bit 7", () => {
    expect(packByte([1, 0, 1, 0, 0, 0, 0, 1], "msb-first")).toBe(0b10100001);
    expect(unpackByte(0b10100001, "msb-first")).toEqual([1, 0, 1, 0, 0, 0, 0, 1]);
  });

  it("LSB-first: první pixel je bit 0", () => {
    expect(packByte([1, 0, 1, 0, 0, 0, 0, 1], "lsb-first")).toBe(0b10000101);
    expect(unpackByte(0b10000101, "lsb-first")).toEqual([1, 0, 1, 0, 0, 0, 0, 1]);
  });
});

describe("mapování palety", () => {
  it("výchozí A/B", () => {
    expect(colorToPlanes(WHITE)).toEqual({ a: 1, b: 1 });
    expect(colorToPlanes(BLACK)).toEqual({ a: 0, b: 1 });
    expect(colorToPlanes(RED)).toEqual({ a: 0, b: 0 });
  });
});

function fillPattern(w: number, h: number): ReturnType<typeof createIndexed> {
  const bmp = createIndexed(w, h, WHITE);
  const colors: PaletteIndex[] = [WHITE, BLACK, RED];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      bmp.pixels[y * w + x] = colors[(x + y) % 3];
    }
  }
  return bmp;
}

describe("kodek rovin", () => {
  it("296×152 → 11 248 B", () => {
    const bmp = createIndexed(296, 152, WHITE);
    const bin = encodePlanes(bmp, settings());
    expect(bin.length).toBe(11248);
    expect(expectedBinSize(296, 152, 0)).toBe(11248);
  });

  it("400×300 → 30 000 B", () => {
    const bmp = createIndexed(400, 300, BLACK);
    expect(encodePlanes(bmp, settings()).length).toBe(30000);
    expect(expectedBinSize(400, 300, 0)).toBe(30000);
  });

  it("round-trip bez změny pixelů", () => {
    const src = fillPattern(32, 16);
    const bin = encodePlanes(src, settings());
    const dec = decodePlanes(bin, 32, 16, settings());
    expect(dec.invalidCount).toBe(0);
    expect(bitmapsEqual(src, dec.bitmap)).toBe(true);
  });

  it("inverze, prohození rovin, otočení a převrácení round-trip", () => {
    const src = fillPattern(24, 16);
    const variants: Partial<ExportSettings>[] = [
      { invertA: true },
      { invertB: true },
      { invertA: true, invertB: true },
      { planeOrder: "b-then-a" },
      { bitOrder: "lsb-first" },
      { rotate: 90 },
      { rotate: 180 },
      { rotate: 270 },
      { flipX: true },
      { flipY: true },
      { flipX: true, flipY: true, rotate: 90, invertA: true, planeOrder: "b-then-a", bitOrder: "lsb-first" },
    ];
    for (const patch of variants) {
      const s = settings(patch);
      const bin = encodePlanes(src, s);
      const dec = decodePlanes(bin, src.width, src.height, s);
      expect(dec.invalidCount, JSON.stringify(patch)).toBe(0);
      expect(bitmapsEqual(src, dec.bitmap), JSON.stringify(patch)).toBe(true);
    }
  });

  it("běžný export nevytváří A=1 B=0", () => {
    const src = fillPattern(16, 8);
    const bin = encodePlanes(src, settings());
    const plane = bin.length / 2;
    for (let i = 0; i < plane; i++) {
      const a = bin[i];
      const b = bin[plane + i];
      expect((a & ~b) & 0xff).toBe(0);
    }
  });
});
