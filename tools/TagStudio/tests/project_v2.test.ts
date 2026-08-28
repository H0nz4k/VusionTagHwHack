import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createProject, parseProjectJson, ProjectError, serializeProject } from "../src/core/project";
import { SCHEMA_VERSION } from "../src/core/types";
import { formatCFile } from "../src/core/cFile";
import { encodePlanes } from "../src/core/codec";
import { createIndexed } from "../src/core/palette";
import { BLACK, defaultExportSettings } from "../src/core/types";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("schema 1 → 2", () => {
  it("migrace zachová vrstvy, profil a export a doplní výchozí BWR", () => {
    const v1 = readFileSync(path.join(root, "projekt.tagstudio.json"), "utf8");
    const clock = () => new Date(2026, 5, 1, 12, 0, 0);
    const loaded = parseProjectJson(v1, clock);
    expect(loaded.schemaVersion).toBe(SCHEMA_VERSION);
    expect(loaded.profileId).toBe("EDG2-0260-A");
    expect(loaded.canvasWidth).toBe(296);
    expect(loaded.canvasHeight).toBe(152);
    expect(loaded.layers.length).toBeGreaterThanOrEqual(3);
    expect(loaded.layers[0].type).toBe("text");
    expect(loaded.dither.mode).toBe("floyd-steinberg");
    expect(loaded.dither.redSensitivity).toBe(45);
    expect(loaded.dither.blueNoiseStrength).toBe(50);
    expect(loaded.dither.bwr.bwPhase).toBe("atkinson");
    expect(loaded.dither.bwr.protectNeutrals).toBe(true);
    expect(loaded.projectId).toBeTruthy();
    expect(loaded.folderName).toBe("TAG_Project_2026-06-01_12-00-00");
    expect(loaded.export.cArrayName).toBe("gImage");
    expect(JSON.parse(v1).schemaVersion).toBe(1);
  });

  it("původní ID ditheringu ordered zůstane ordered", () => {
    const json = JSON.stringify({
      schemaVersion: 1,
      canvasWidth: 8,
      canvasHeight: 8,
      layers: [],
      dither: { mode: "ordered", brightness: 0, contrast: 0, saturation: 0, redSensitivity: 45 },
    });
    expect(parseProjectJson(json).dither.mode).toBe("ordered");
  });

  it("novější schema odmítne", () => {
    expect(() => parseProjectJson(JSON.stringify({ schemaVersion: 9, canvasWidth: 8, canvasHeight: 8, layers: [] }))).toThrow(
      ProjectError,
    );
  });

  it("uložení schema 3 obsahuje nová metadata", () => {
    const p = createProject("EDG2-0260-A", "landscape", null, null, {
      clock: () => new Date(2026, 7, 28, 1, 2, 3),
      projectId: "11111111-1111-4111-8111-111111111111",
    });
    const obj = JSON.parse(serializeProject(p));
    expect(obj.schemaVersion).toBe(3);
    expect(obj.projectId).toBe("11111111-1111-4111-8111-111111111111");
    expect(obj.folderName).toBe("TAG_Project_2026-08-28_01-02-03");
    expect(obj.dither.bwr.bwPhase).toBe("atkinson");
  });
});

describe("SDCC __code", () => {
  it("přidá kvalifikátor bez změny bajtů", () => {
    const bmp = createIndexed(8, 8, BLACK);
    const settings = { ...defaultExportSettings(), sdccCode: true };
    const bin = encodePlanes(bmp, settings);
    const c = formatCFile(bin, { profileId: "custom", width: 8, height: 8, arrayName: "gImage" }, settings);
    expect(c).toContain("const unsigned char __code gImage[]");
  });
});
