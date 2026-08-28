import { describe, expect, it } from "vitest";
import { ditherRgb, ditherRgbDetailed } from "../src/core/dither";
import { BURKES_KERNEL, SIERRA_LITE_KERNEL, kernelWeightSum, mirrorTaps } from "../src/core/ditherKernels";
import { DITHER_ALGORITHMS } from "../src/core/ditherRegistry";
import { overlaySharpLayers, ditherRaster, renderRasterRgb } from "../src/core/render";
import { createLineLayer, createProject, createRectLayer } from "../src/core/project";
import { BLACK, RED, WHITE, defaultBwrSettings, type DitherId } from "../src/core/types";

function solid(w: number, h: number, r: number, g: number, b: number): Uint8Array {
  const data = new Uint8Array(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    data[i * 3] = r;
    data[i * 3 + 1] = g;
    data[i * 3 + 2] = b;
  }
  return data;
}

function noise(w: number, h: number, seed = 13): Uint8Array {
  const data = new Uint8Array(w * h * 3);
  for (let i = 0; i < data.length; i++) data[i] = (i * seed + 7) & 255;
  return data;
}

const ALL_IDS = DITHER_ALGORITHMS.map((a) => a.id);

function run(mode: DitherId, w: number, h: number, data: Uint8Array) {
  return ditherRgb(
    {
      width: w,
      height: h,
      data,
      redSensitivity: 45,
      blueNoiseStrength: 50,
      bwr: defaultBwrSettings(),
    },
    mode,
  );
}

describe("Sierra Lite a Burkes kernel", () => {
  it("Sierra Lite používá 2/4, 1/4, 1/4", () => {
    expect(SIERRA_LITE_KERNEL.denom).toBe(4);
    expect(SIERRA_LITE_KERNEL.taps).toEqual([
      { dx: 1, dy: 0, w: 2 },
      { dx: -1, dy: 1, w: 1 },
      { dx: 0, dy: 1, w: 1 },
    ]);
    expect(kernelWeightSum(SIERRA_LITE_KERNEL)).toBe(4);
  });

  it("Burkes používá jmenovatel 32 a standardní váhy", () => {
    expect(BURKES_KERNEL.denom).toBe(32);
    expect(BURKES_KERNEL.taps).toEqual([
      { dx: 1, dy: 0, w: 8 },
      { dx: 2, dy: 0, w: 4 },
      { dx: -2, dy: 1, w: 2 },
      { dx: -1, dy: 1, w: 4 },
      { dx: 0, dy: 1, w: 8 },
      { dx: 1, dy: 1, w: 4 },
      { dx: 2, dy: 1, w: 2 },
    ]);
    expect(kernelWeightSum(BURKES_KERNEL)).toBe(32);
  });

  it("zrcadlení kernelu při směru zprava doleva", () => {
    const mirrored = mirrorTaps(SIERRA_LITE_KERNEL.taps, -1);
    expect(mirrored).toEqual([
      { dx: -1, dy: 0, w: 2 },
      { dx: 1, dy: 1, w: 1 },
      { dx: 0, dy: 1, w: 1 },
    ]);
    const burkes = mirrorTaps(BURKES_KERNEL.taps, -1);
    expect(burkes[0]).toEqual({ dx: -1, dy: 0, w: 8 });
    expect(burkes[1]).toEqual({ dx: -2, dy: 0, w: 4 });
    expect(burkes[2]).toEqual({ dx: 2, dy: 1, w: 2 });
  });

  it("serpentinový Sierra Lite není shodný s jednosměrným opakováním sudého řádku", () => {
    const data = noise(16, 4, 41);
    const a = run("sierra-lite", 16, 4, data);
    const b = run("sierra-lite", 16, 4, new Uint8Array(data));
    expect(Buffer.from(a.pixels)).toEqual(Buffer.from(b.pixels));
    const row0 = a.pixels.slice(0, 16);
    const row1 = a.pixels.slice(16, 32);
    expect(Buffer.from(row0).equals(Buffer.from(row1))).toBe(false);
  });
});

describe("Bayer 2×2 / 4×4 / 8×8", () => {
  it("ordered (4×4) je deterministický a odlišný od 2×2 a 8×8", () => {
    const w = 64;
    const h = 8;
    const data = new Uint8Array(w * h * 3);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = Math.round((x / (w - 1)) * 255);
        const o = (y * w + x) * 3;
        data[o] = v;
        data[o + 1] = v;
        data[o + 2] = v;
      }
    }
    const b2 = run("bayer-2x2", w, h, data);
    const b4 = run("ordered", w, h, data);
    const b8 = run("bayer-8x8", w, h, data);
    expect(Buffer.from(b4.pixels)).toEqual(Buffer.from(run("ordered", w, h, new Uint8Array(data)).pixels));
    expect(Buffer.from(b2.pixels).equals(Buffer.from(b4.pixels))).toBe(false);
    expect(Buffer.from(b8.pixels).equals(Buffer.from(b4.pixels))).toBe(false);
    expect(new Set([...b2.pixels]).size).toBeGreaterThan(1);
  });
});

describe("Blue noise", () => {
  it("je deterministický a síla mění výsledek", () => {
    const data = solid(32, 32, 187, 187, 187);
    const a = ditherRgb({ width: 32, height: 32, data, redSensitivity: 45, blueNoiseStrength: 50 }, "blue-noise");
    const b = ditherRgb({ width: 32, height: 32, data: new Uint8Array(data), redSensitivity: 45, blueNoiseStrength: 50 }, "blue-noise");
    const weak = ditherRgb({ width: 32, height: 32, data, redSensitivity: 45, blueNoiseStrength: 0 }, "blue-noise");
    const strong = ditherRgb({ width: 32, height: 32, data, redSensitivity: 45, blueNoiseStrength: 100 }, "blue-noise");
    expect(Buffer.from(a.pixels)).toEqual(Buffer.from(b.pixels));
    expect(Buffer.from(weak.pixels).equals(Buffer.from(strong.pixels))).toBe(false);
  });
});

describe("všechny algoritmy v0.2", () => {
  it("vrací jen WHITE/BLACK/RED a stejný vstup je bitově totožný", () => {
    const data = noise(24, 18, 19);
    for (const id of ALL_IDS) {
      const a = run(id, 24, 18, data);
      const b = run(id, 24, 18, new Uint8Array(data));
      for (const p of a.pixels) expect([WHITE, BLACK, RED]).toContain(p);
      expect(Buffer.from(a.pixels)).toEqual(Buffer.from(b.pixels));
      expect(a.width).toBe(24);
      expect(a.height).toBe(18);
    }
  });

  it("zachová 296×152 a 400×300", () => {
    for (const [w, h] of [
      [296, 152],
      [400, 300],
    ] as const) {
      const data = solid(w, h, 200, 200, 200);
      for (const id of ["sierra-lite", "burkes", "blue-noise", "bwr-two-phase", "bayer-8x8"] as DitherId[]) {
        const bmp = run(id, w, h, data);
        expect(bmp.width).toBe(w);
        expect(bmp.height).toBe(h);
        expect(bmp.pixels.length).toBe(w * h);
      }
    }
  });

  it("landscape i portrait zachovají rozměry plátna", () => {
    const land = createProject("EDG2-0260-A", "landscape");
    const port = createProject("EDG2-0260-A", "portrait");
    expect(land.canvasWidth).toBe(296);
    expect(land.canvasHeight).toBe(152);
    expect(port.canvasWidth).toBe(152);
    expect(port.canvasHeight).toBe(296);
    const rgb = new Uint8Array(port.canvasWidth * port.canvasHeight * 3).fill(90);
    const bmp = run("burkes", port.canvasWidth, port.canvasHeight, rgb);
    expect(bmp.width).toBe(152);
    expect(bmp.height).toBe(296);
  });

  it("text a tvary zůstanou ostré a paletové ve všech režimech", () => {
    for (const id of ALL_IDS) {
      let project = createProject("EDG2-0260-A", "landscape");
      project = { ...project, dither: { ...project.dither, mode: id } };
      const rect = createRectLayer(project);
      rect.x = 8;
      rect.y = 8;
      rect.width = 24;
      rect.height = 12;
      rect.fill = { kind: "solid", color: "black" };
      rect.stroke = { kind: "none" };
      const line = createLineLayer(project);
      line.x1 = 0;
      line.y1 = 40;
      line.x2 = 40;
      line.y2 = 40;
      line.color = "red";
      line.thickness = 2;
      project = { ...project, layers: [rect, line] };
      const rgb = renderRasterRgb(project, new Map());
      const dithered = ditherRaster(project, rgb);
      const out = overlaySharpLayers(dithered.bitmap, project, null);
      expect(out.pixels[8 * 296 + 8]).toBe(BLACK);
      expect(out.pixels[40 * 296 + 10]).toBe(RED);
      for (const p of out.pixels) expect([0, 1, 2]).toContain(p);
    }
  });
});

describe("ditherRgbDetailed", () => {
  it("u ne-BWR režimů vrací redMask null", () => {
    const data = solid(4, 4, 10, 10, 10);
    expect(ditherRgbDetailed({ width: 4, height: 4, data, redSensitivity: 45 }, "atkinson").redMask).toBeNull();
  });
});
