import { describe, expect, it } from "vitest";
import {
  BWR_PATTERNS,
  getBwrPattern,
  isBwrPatternId,
  sampleBwrPattern,
  tileHasOnlyWbr,
} from "../src/core/bwrPatterns";
import { BLACK, RED, WHITE } from "../src/core/types";
import { createProject, createRectLayer, parseProjectJson, serializeProject } from "../src/core/project";
import { overlaySharpLayers, ditherRaster, renderRasterRgb, renderProject } from "../src/core/render";
import { buildProjectFiles } from "../src/fs/projectIo";
import { pngToIndexed } from "../src/core/pngCodec";
import { decodePlanes } from "../src/core/codec";
import { bytesFromCInitializer } from "../src/core/cFile";
import { bitmapsEqual, paletteStats } from "../src/core/palette";
import { createProjectFromTemplate } from "../src/core/templates";
import { patternFill } from "../src/core/fillStyle";

describe("BWR registr vzorů", () => {
  it("obsahuje přesně 16 stabilních ID 01–16", () => {
    expect(BWR_PATTERNS).toHaveLength(16);
    expect(BWR_PATTERNS.map((p) => p.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
    expect(BWR_PATTERNS[0].id).toBe("bwr-01-white");
    expect(BWR_PATTERNS[15].id).toBe("bwr-16-red50");
    expect(isBwrPatternId("bwr-05-gray-50")).toBe(true);
    expect(isBwrPatternId("grey")).toBe(false);
  });

  it("každý tile obsahuje jen W/B/R a deklarovaný poměr", () => {
    const expected: Array<[number, number, number]> = [
      [100, 0, 0],
      [0, 100, 0],
      [0, 0, 100],
      [75, 25, 0],
      [50, 50, 0],
      [25, 75, 0],
      [75, 0, 25],
      [50, 0, 50],
      [25, 0, 75],
      [0, 75, 25],
      [0, 50, 50],
      [0, 25, 75],
      [100 / 3, 100 / 3, 100 / 3],
      [50, 25, 25],
      [25, 50, 25],
      [25, 25, 50],
    ];
    BWR_PATTERNS.forEach((p, i) => {
      expect(tileHasOnlyWbr(p.tile)).toBe(true);
      expect(p.ratio.w).toBeCloseTo(expected[i][0], 5);
      expect(p.ratio.b).toBeCloseTo(expected[i][1], 5);
      expect(p.ratio.r).toBeCloseTo(expected[i][2], 5);
    });
  });

  it("vzory 04–16 mají kanonickou periodu a fázi", () => {
    expect(getBwrPattern("bwr-04-gray-25").tile).toEqual(["..", "#."]);
    expect(getBwrPattern("bwr-05-gray-50").tile).toEqual([".#", "#."]);
    expect(getBwrPattern("bwr-06-gray-75").tile).toEqual([".#", "##"]);
    expect(getBwrPattern("bwr-07-pink-25").tile).toEqual(["..", ".@"]);
    expect(getBwrPattern("bwr-08-red-50").tile).toEqual(["@.", ".@"]);
    expect(getBwrPattern("bwr-09-red-75").tile).toEqual(["@@", "@."]);
    expect(getBwrPattern("bwr-10-darkred-25").tile).toEqual(["##", "@#"]);
    expect(getBwrPattern("bwr-11-redblack-50").tile).toEqual(["@#", "#@"]);
    expect(getBwrPattern("bwr-12-red-black-25").tile).toEqual(["@@", "#@"]);
    expect(getBwrPattern("bwr-13-rgb-33").tile).toEqual(["#@.", "@.#", ".#@"]);
    expect(getBwrPattern("bwr-14-w50-b25-r25").tile).toEqual(["..", "#@"]);
    expect(getBwrPattern("bwr-15-w25-b50-r25").tile).toEqual(["##", "@."]);
    expect(getBwrPattern("bwr-16-red50").tile).toEqual(["@@", ".#"]);
    expect(sampleBwrPattern("bwr-05-gray-50", 0, 0)).toBe(WHITE);
    expect(sampleBwrPattern("bwr-05-gray-50", 1, 0)).toBe(BLACK);
    expect(sampleBwrPattern("bwr-05-gray-50", 0, 1)).toBe(BLACK);
    expect(sampleBwrPattern("bwr-05-gray-50", 1, 1)).toBe(WHITE);
  });

  it("globální ukotvení: sousední objekty sdílejí fázi plátna", () => {
    let project = createProject("EDG2-0260-A", "landscape");
    const a = createRectLayer(project);
    a.x = 10;
    a.y = 10;
    a.width = 8;
    a.height = 8;
    a.fill = patternFill("bwr-05-gray-50");
    a.stroke = { kind: "none" };
    const b = createRectLayer(project);
    b.x = 18;
    b.y = 10;
    b.width = 8;
    b.height = 8;
    b.fill = patternFill("bwr-05-gray-50");
    b.stroke = { kind: "none" };
    project = { ...project, layers: [a, b] };
    const rgb = renderRasterRgb(project, new Map());
    const out = overlaySharpLayers(ditherRaster(project, rgb).bitmap, project, null);
    expect(out.pixels[10 * 296 + 17]).toBe(sampleBwrPattern("bwr-05-gray-50", 17, 10));
    expect(out.pixels[10 * 296 + 18]).toBe(sampleBwrPattern("bwr-05-gray-50", 18, 10));
    expect(out.pixels[10 * 296 + 16]).toBe(out.pixels[10 * 296 + 18]);
  });

  it("výsledný bitmap nemá čtvrtou barvu", () => {
    const project = createProjectFromTemplate("bwr-color-test-01-16");
    const out = overlaySharpLayers(ditherRaster(project, renderRasterRgb(project, new Map())).bitmap, project, null);
    for (const p of out.pixels) expect([WHITE, BLACK, RED]).toContain(p);
  });
});

describe("šablona BWR test 01–16", () => {
  it("má 296×152, mřížku 4×4 a správné pořadí vzorů", () => {
    const project = createProjectFromTemplate("bwr-color-test-01-16");
    expect(project.canvasWidth).toBe(296);
    expect(project.canvasHeight).toBe(152);
    expect(project.profileId).toBe("EDG2-0260-A");
    const fields = project.layers.filter((l) => l.type === "rect" && l.name.startsWith("Pole "));
    expect(fields).toHaveLength(16);
    const labels = project.layers.filter((l) => l.type === "text" && l.name.startsWith("Číslo "));
    expect(labels).toHaveLength(16);
    const frames = project.layers.filter((l) => l.type === "rect" && l.name.startsWith("Rámeček "));
    expect(frames).toHaveLength(16);
    const rgb = renderRasterRgb(project, new Map());
    const out = overlaySharpLayers(ditherRaster(project, rgb).bitmap, project, null);
    expect(out.width).toBe(296);
    expect(out.height).toBe(152);
    BWR_PATTERNS.forEach((pat, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const x = col * 74 + 40;
      const y = row * 38 + 24;
      expect(out.pixels[y * 296 + x]).toBe(sampleBwrPattern(pat.id, x, y));
    });
    expect(frames[0].type).toBe("rect");
    if (frames[0].type === "rect") {
      expect(out.pixels[Math.floor(frames[0].y + 2) * 296 + Math.floor(frames[0].x + 2)]).toBeDefined();
    }
  });

  it("PNG/BIN/C odpovídají autoritativnímu bitmapu a jsou deterministické", () => {
    const project = createProjectFromTemplate("bwr-color-test-01-16");
    const a = renderProject(project, new Map()).bitmap;
    const b = renderProject(project, new Map()).bitmap;
    expect(bitmapsEqual(a, b)).toBe(true);
    const files = buildProjectFiles(project, a);
    expect(files.bin.length).toBe(11248);
    expect(bitmapsEqual(a, pngToIndexed(files.png))).toBe(true);
    expect(decodePlanes(files.bin, 296, 152, project.export).invalidCount).toBe(0);
    expect(bitmapsEqual(a, decodePlanes(files.bin, 296, 152, project.export).bitmap)).toBe(true);
    expect([...bytesFromCInitializer(files.c)]).toEqual([...files.bin]);
    const stats = paletteStats(a);
    expect(stats.invalid).toBe(0);
    expect(stats.white + stats.black + stats.red).toBe(296 * 152);
  });

  it("uložení a otevření zachová vzory", () => {
    const project = createProjectFromTemplate("three-color-split");
    const json = serializeProject(project);
    const loaded = parseProjectJson(json);
    expect(loaded.schemaVersion).toBe(3);
    const rects = loaded.layers.filter((l) => l.type === "rect");
    expect(rects[2].type).toBe("rect");
    if (rects[2].type === "rect") {
      expect(rects[2].fill).toEqual({ kind: "bwr-pattern", patternId: "bwr-05-gray-50" });
    }
    const a = overlaySharpLayers(ditherRaster(project, renderRasterRgb(project, new Map())).bitmap, project, null);
    const b = overlaySharpLayers(ditherRaster(loaded, renderRasterRgb(loaded, new Map())).bitmap, loaded, null);
    expect(bitmapsEqual(a, b)).toBe(true);
  });
});
