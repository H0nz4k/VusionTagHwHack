import { describe, expect, it } from "vitest";
import { colorToCogPlanes, colorToPlanes, cogPlanesToColor, encodePlanes, decodePlanes } from "../src/core/codec";
import { BLACK, RED, WHITE, defaultExportSettings } from "../src/core/types";
import { createIndexed } from "../src/core/palette";

describe("CoG mapování 0x10 / 0x13", () => {
  it("logická tabulka W/B/R", () => {
    expect(colorToCogPlanes(WHITE)).toEqual({ a: 0, b: 0 });
    expect(colorToCogPlanes(BLACK)).toEqual({ a: 1, b: 0 });
    expect(colorToCogPlanes(RED)).toEqual({ a: 0, b: 1 });
    expect(cogPlanesToColor(0, 0)).toBe(WHITE);
    expect(cogPlanesToColor(1, 0)).toBe(BLACK);
    expect(cogPlanesToColor(0, 1)).toBe(RED);
    expect(cogPlanesToColor(1, 1)).toBe(3);
  });

  it("legacy mapování zůstává A=1 B=1 pro bílou", () => {
    expect(colorToPlanes(WHITE)).toEqual({ a: 1, b: 1 });
    expect(colorToPlanes(BLACK)).toEqual({ a: 0, b: 1 });
    expect(colorToPlanes(RED)).toEqual({ a: 0, b: 0 });
  });

  it("předvolba CoG round-trip a liší se od legacy BIN", () => {
    const bmp = createIndexed(8, 8, WHITE);
    bmp.pixels[0] = BLACK;
    bmp.pixels[1] = RED;
    const legacy = defaultExportSettings();
    const cog = { ...legacy, planeMap: "cog-edg2-0260-a" as const };
    const a = encodePlanes(bmp, legacy);
    const b = encodePlanes(bmp, cog);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
    const dec = decodePlanes(b, 8, 8, cog);
    expect(dec.invalidCount).toBe(0);
    expect(dec.bitmap.pixels[0]).toBe(BLACK);
    expect(dec.bitmap.pixels[1]).toBe(RED);
    expect(dec.bitmap.pixels[2]).toBe(WHITE);
  });
});
