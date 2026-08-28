import { describe, expect, it } from "vitest";
import { createProject, createRectLayer, createLineLayer } from "../src/core/project";
import { overlaySharpLayers, ditherRaster, renderRasterRgb } from "../src/core/render";
import { BLACK, RED } from "../src/core/types";

describe("ostré tvary po ditheringu", () => {
  it("obdélník a čára použijí jen paletové indexy", () => {
    let project = createProject("EDG2-0260-A", "landscape");
    const rect = createRectLayer(project);
    rect.x = 10;
    rect.y = 10;
    rect.width = 20;
    rect.height = 10;
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
    expect(out.pixels[10 * 296 + 10]).toBe(BLACK);
    expect(out.pixels[40 * 296 + 10]).toBe(RED);
    for (const p of out.pixels) expect([0, 1, 2]).toContain(p);
  });
});
