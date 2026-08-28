import { describe, expect, it } from "vitest";
import { ditherRgb } from "../src/core/dither";
import { WHITE, BLACK, RED } from "../src/core/types";

function solid(w: number, h: number, r: number, g: number, b: number): Uint8Array {
  const data = new Uint8Array(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    data[i * 3] = r;
    data[i * 3 + 1] = g;
    data[i * 3 + 2] = b;
  }
  return data;
}

describe("dithering", () => {
  const modes = ["none", "floyd-steinberg", "atkinson", "ordered"] as const;

  it("čistá paleta zůstane paletou ve všech režimech", () => {
    for (const mode of modes) {
      for (const [rgb, idx] of [
        [[255, 255, 255], WHITE],
        [[0, 0, 0], BLACK],
        [[255, 0, 0], RED],
      ] as const) {
        const bmp = ditherRgb(
          { width: 8, height: 8, data: solid(8, 8, rgb[0], rgb[1], rgb[2]), redSensitivity: 45 },
          mode,
        );
        expect([...new Set(bmp.pixels)]).toEqual([idx]);
      }
    }
  });

  it("výstup obsahuje jen 0/1/2", () => {
    const data = new Uint8Array(16 * 8 * 3);
    for (let i = 0; i < data.length; i++) data[i] = (i * 37) & 255;
    for (const mode of modes) {
      const bmp = ditherRgb({ width: 16, height: 8, data, redSensitivity: 45 }, mode);
      for (const p of bmp.pixels) expect([0, 1, 2]).toContain(p);
    }
  });

  it("stejný vstup → stejný výstup (determinismus)", () => {
    const data = new Uint8Array(24 * 12 * 3);
    for (let i = 0; i < data.length; i++) data[i] = (i * 13 + 7) & 255;
    for (const mode of modes) {
      const a = ditherRgb({ width: 24, height: 12, data, redSensitivity: 40 }, mode);
      const b = ditherRgb({ width: 24, height: 12, data: new Uint8Array(data), redSensitivity: 40 }, mode);
      expect(Buffer.from(a.pixels)).toEqual(Buffer.from(b.pixels));
    }
  });

  it("normalizuje hodnoty odchýlené o 1", () => {
    const bmp = ditherRgb(
      { width: 2, height: 1, data: new Uint8Array([254, 255, 255, 255, 1, 0]), redSensitivity: 0 },
      "none",
    );
    expect(bmp.pixels[0]).toBe(WHITE);
    expect(bmp.pixels[1]).toBe(RED);
  });
});
