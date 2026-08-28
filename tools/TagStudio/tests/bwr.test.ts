import { describe, expect, it } from "vitest";
import { buildRedMask, maskToPreview, redAffinity } from "../src/core/bwr";
import { ditherRgb, ditherRgbDetailed } from "../src/core/dither";
import { buildProjectFiles } from "../src/fs/projectIo";
import { createProject } from "../src/core/project";
import { pngToIndexed } from "../src/core/pngCodec";
import { decodePlanes } from "../src/core/codec";
import { bytesFromCInitializer } from "../src/core/cFile";
import { bitmapsEqual, paletteStats } from "../src/core/palette";
import { BW_PHASE_IDS } from "../src/core/ditherRegistry";
import { BLACK, RED, WHITE, defaultBwrSettings, type BwPhaseId } from "../src/core/types";

function fill(w: number, h: number, r: number, g: number, b: number): Uint8Array {
  const data = new Uint8Array(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    data[i * 3] = r;
    data[i * 3 + 1] = g;
    data[i * 3 + 2] = b;
  }
  return data;
}

function gradientGray(w: number, h: number): Uint8Array {
  const data = new Uint8Array(w * h * 3);
  const n = w * h;
  for (let i = 0; i < n; i++) {
    const v = Math.round((i / Math.max(1, n - 1)) * 255);
    data[i * 3] = v;
    data[i * 3 + 1] = v;
    data[i * 3 + 2] = v;
  }
  return data;
}

function bwrInput(w: number, h: number, data: Uint8Array, patch: Partial<ReturnType<typeof defaultBwrSettings>> = {}) {
  return {
    width: w,
    height: h,
    data,
    redSensitivity: 45,
    blueNoiseStrength: 50,
    bwr: { ...defaultBwrSettings(), ...patch },
  };
}

describe("BWR dvoufázový režim", () => {
  it("šedý gradient, černá a bílá nemají žádný červený pixel", () => {
    expect(paletteStats(ditherRgb(bwrInput(32, 16, gradientGray(32, 16)), "bwr-two-phase")).red).toBe(0);
    expect(paletteStats(ditherRgb(bwrInput(16, 8, fill(16, 8, 0, 0, 0)), "bwr-two-phase")).red).toBe(0);
    expect(paletteStats(ditherRgb(bwrInput(16, 8, fill(16, 8, 255, 255, 255)), "bwr-two-phase")).red).toBe(0);
  });

  it("červená, tmavě červená a oranžová vytvoří masku", () => {
    const red = buildRedMask({ width: 4, height: 1, data: fill(4, 1, 255, 0, 0) }, defaultBwrSettings(), 45);
    const dark = buildRedMask({ width: 4, height: 1, data: fill(4, 1, 120, 12, 12) }, defaultBwrSettings(), 45);
    const orange = buildRedMask({ width: 4, height: 1, data: fill(4, 1, 220, 90, 20) }, defaultBwrSettings(), 45);
    expect(red.mask.every((v) => v === 1)).toBe(true);
    expect(dark.mask.some((v) => v === 1)).toBe(true);
    expect(orange.mask.some((v) => v === 1)).toBe(true);
  });

  it("zelená, modrá a neutrální se při výchozím nastavení nestanou červenými", () => {
    const settings = defaultBwrSettings();
    expect(redAffinity(20, 180, 30, settings, 45)).toBe(0);
    expect(redAffinity(20, 30, 200, settings, 45)).toBe(0);
    expect(redAffinity(128, 128, 128, settings, 45)).toBe(0);
    expect(paletteStats(ditherRgb(bwrInput(8, 8, fill(8, 8, 20, 180, 30)), "bwr-two-phase")).red).toBe(0);
    expect(paletteStats(ditherRgb(bwrInput(8, 8, fill(8, 8, 20, 30, 200)), "bwr-two-phase")).red).toBe(0);
  });

  it("citlivost a práh masky mají monotónní dopad", () => {
    const data = fill(8, 8, 160, 40, 30);
    const lowSens = buildRedMask({ width: 8, height: 8, data }, { ...defaultBwrSettings(), maskThreshold: 70 }, 10);
    const highSens = buildRedMask({ width: 8, height: 8, data }, { ...defaultBwrSettings(), maskThreshold: 70 }, 100);
    const lowThr = buildRedMask({ width: 8, height: 8, data }, { ...defaultBwrSettings(), maskThreshold: 10 }, 45);
    const highThr = buildRedMask({ width: 8, height: 8, data }, { ...defaultBwrSettings(), maskThreshold: 90 }, 45);
    const sum = (m: Uint8Array) => m.reduce((s, v) => s + v, 0);
    expect(sum(highSens.mask)).toBeGreaterThanOrEqual(sum(lowSens.mask));
    expect(sum(lowThr.mask)).toBeGreaterThanOrEqual(sum(highThr.mask));
  });

  it("druhá fáze mimo masku vrací jen černou/bílou", () => {
    const data = new Uint8Array(16 * 8 * 3);
    for (let i = 0; i < 16 * 8; i++) {
      const redPix = i < 20;
      data[i * 3] = redPix ? 255 : (i * 17) & 255;
      data[i * 3 + 1] = redPix ? 0 : (i * 9) & 255;
      data[i * 3 + 2] = redPix ? 0 : (i * 5) & 255;
    }
    for (const phase of BW_PHASE_IDS) {
      const detailed = ditherRgbDetailed(bwrInput(16, 8, data, { bwPhase: phase as BwPhaseId }), "bwr-two-phase");
      expect(detailed.redMask).not.toBeNull();
      for (let i = 0; i < detailed.bitmap.pixels.length; i++) {
        if (detailed.redMask![i]) {
          expect(detailed.bitmap.pixels[i]).toBe(RED);
        } else {
          expect([WHITE, BLACK]).toContain(detailed.bitmap.pixels[i]);
        }
      }
    }
  });

  it("náhled masky odpovídá červeným pixelům výsledku", () => {
    const data = new Uint8Array(12 * 6 * 3);
    for (let i = 0; i < 12 * 6; i++) {
      const redPix = i % 7 === 0;
      data[i * 3] = redPix ? 230 : 80;
      data[i * 3 + 1] = redPix ? 10 : 80;
      data[i * 3 + 2] = redPix ? 10 : 80;
    }
    const detailed = ditherRgbDetailed(bwrInput(12, 6, data), "bwr-two-phase");
    const preview = maskToPreview(12, 6, detailed.redMask!);
    for (let i = 0; i < preview.pixels.length; i++) {
      const isRed = detailed.bitmap.pixels[i] === RED;
      expect(preview.pixels[i] === RED).toBe(isRed);
      expect(Boolean(detailed.redMask![i])).toBe(isRed);
    }
  });

  it("export PNG/BIN/C odpovídá autoritativnímu bitmapu", () => {
    const project = createProject("EDG2-0260-A", "landscape");
    project.dither.mode = "bwr-two-phase";
    const data = fill(296, 152, 40, 40, 40);
    data[0] = 255;
    data[1] = 0;
    data[2] = 0;
    const bitmap = ditherRgb(bwrInput(296, 152, data), "bwr-two-phase");
    const files = buildProjectFiles(project, bitmap);
    const pngBack = pngToIndexed(files.png);
    expect(bitmapsEqual(bitmap, pngBack)).toBe(true);
    const decoded = decodePlanes(files.bin, 296, 152, project.export);
    expect(decoded.invalidCount).toBe(0);
    expect(bitmapsEqual(bitmap, decoded.bitmap)).toBe(true);
    const cBytes = bytesFromCInitializer(files.c);
    expect([...cBytes]).toEqual([...files.bin]);
  });
});
