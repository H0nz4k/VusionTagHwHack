import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { bytesFromCInitializer, declaredArraySize, formatCFile } from "../src/core/cFile";
import { decodePlanes, encodePlanes } from "../src/core/codec";
import { bitmapsEqual } from "../src/core/palette";
import { encodeIndexedPng, pngToIndexed, uniqueRgbInPng } from "../src/core/pngCodec";
import { defaultExportSettings } from "../src/core/types";
import { createIndexed } from "../src/core/palette";
import { BLACK, RED, WHITE } from "../src/core/types";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("C export", () => {
  it("inicializátor má stejný počet bajtů jako BIN a pole je bez hardcoded velikosti", () => {
    const bmp = createIndexed(16, 8, WHITE);
    bmp.pixels[0] = BLACK;
    bmp.pixels[1] = RED;
    const settings = defaultExportSettings();
    const bin = encodePlanes(bmp, settings);
    const c = formatCFile(bin, { profileId: "custom", width: 16, height: 8, arrayName: "gImage" }, settings);
    expect(c).toContain("const unsigned char gImage[] = {");
    expect(c).not.toMatch(/gImage\[\d+\]/);
    expect(c).toContain("const unsigned int gImageSize = sizeof(gImage);");
    const parsed = bytesFromCInitializer(c);
    expect(parsed.length).toBe(bin.length);
    expect([...parsed]).toEqual([...bin]);
  });
});

describe("PNG export", () => {
  it("má přesné rozměry a jen tři barvy palety", () => {
    const bmp = createIndexed(24, 16, WHITE);
    bmp.pixels[5] = BLACK;
    bmp.pixels[6] = RED;
    const png = encodeIndexedPng(bmp);
    const colors = uniqueRgbInPng(png);
    expect(colors.sort((a, b) => a[0] - b[0] || a[1] - b[1])).toEqual(
      [
        [0, 0, 0],
        [255, 0, 0],
        [255, 255, 255],
      ].sort((a, b) => a[0] - b[0] || a[1] - b[1]),
    );
    const back = pngToIndexed(png);
    expect(back.width).toBe(24);
    expect(back.height).toBe(16);
    expect(bitmapsEqual(bmp, back)).toBe(true);
  });
});

describe("referenční fixture", () => {
  it("C roviny po dekódování odpovídají dithered_image.png", () => {
    const pngBytes = new Uint8Array(readFileSync(path.join(root, "dithered_image.png")));
    const cText = readFileSync(path.join(root, "image_data_array.c"), "utf8");
    const cBytes = bytesFromCInitializer(cText);
    expect(cBytes.length).toBe(11248);
    expect(declaredArraySize(cText)).toBe(240000);

    const fromPng = pngToIndexed(pngBytes);
    expect(fromPng.width).toBe(296);
    expect(fromPng.height).toBe(152);
    expect(fromPng.pixels.length).toBe(44992);

    const decoded = decodePlanes(cBytes, 296, 152, defaultExportSettings());
    expect(decoded.invalidCount).toBe(0);
    expect(decoded.bitmap.width).toBe(296);
    expect(decoded.bitmap.height).toBe(152);
    expect(bitmapsEqual(fromPng, decoded.bitmap)).toBe(true);
  });
});
