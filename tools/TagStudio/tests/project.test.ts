import { describe, expect, it } from "vitest";
import {
  applyProfileChange,
  createImageLayer,
  createProject,
  parseProjectJson,
  ProjectError,
  serializeProject,
} from "../src/core/project";
import { SCHEMA_VERSION } from "../src/core/types";

describe("projekt", () => {
  it("serializace a načtení zachová vrstvy a nastavení", () => {
    let project = createProject("EDG2-0260-A", "landscape");
    project.dither.mode = "atkinson";
    project.dither.redSensitivity = 70;
    project.safeMargin = 8;
    project.export.invertA = true;
    project.export.cArrayName = "tagBits";
    const img = createImageLayer(project, {
      dataUrl: "data:image/png;base64,AAAA",
      srcWidth: 100,
      srcHeight: 50,
      name: "Foto",
    });
    project = { ...project, layers: [img] };
    const json = serializeProject(project);
    const loaded = parseProjectJson(json);
    expect(loaded.schemaVersion).toBe(SCHEMA_VERSION);
    expect(loaded.dither.mode).toBe("atkinson");
    expect(loaded.dither.redSensitivity).toBe(70);
    expect(loaded.safeMargin).toBe(8);
    expect(loaded.export.invertA).toBe(true);
    expect(loaded.export.cArrayName).toBe("tagBits");
    expect(loaded.layers).toHaveLength(1);
    expect(loaded.layers[0].type).toBe("image");
    if (loaded.layers[0].type === "image") {
      expect(loaded.layers[0].dataUrl).toContain("base64");
      expect(loaded.layers[0].srcWidth).toBe(100);
    }
  });

  it("novější schema odmítne bez poškození", () => {
    expect(() => parseProjectJson(JSON.stringify({ schemaVersion: 99, canvasWidth: 10, canvasHeight: 10, layers: [] }))).toThrow(
      ProjectError,
    );
  });

  it("přepnutí profilu fit škáluje, keep nemění vrstvy", () => {
    let project = createProject("EDG2-0260-A", "landscape");
    const img = createImageLayer(project, { dataUrl: "data:,", srcWidth: 296, srcHeight: 152 });
    img.x = 10;
    img.y = 20;
    img.width = 100;
    img.height = 50;
    project = { ...project, layers: [img] };
    const fit = applyProfileChange(project, { profileId: "EDG2-0420-B", orientation: "landscape" }, "fit");
    expect(fit.canvasWidth).toBe(400);
    expect(fit.canvasHeight).toBe(300);
    expect(fit.layers[0].type).toBe("image");
    if (fit.layers[0].type === "image") {
      expect(fit.layers[0].width).toBeCloseTo(100 * (400 / 296), 5);
    }
    const keep = applyProfileChange(project, { profileId: "EDG2-0420-B", orientation: "landscape" }, "keep");
    if (keep.layers[0].type === "image") {
      expect(keep.layers[0].width).toBe(100);
      expect(keep.layers[0].x).toBe(10);
    }
  });
});
