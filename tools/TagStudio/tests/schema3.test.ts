import { describe, expect, it } from "vitest";
import { parseProjectJson, ProjectError, serializeProject, createProject } from "../src/core/project";
import { SCHEMA_VERSION } from "../src/core/types";

describe("schema 2 → 3", () => {
  it("převede solidní výplně a doplní pozadí", () => {
    const json = JSON.stringify({
      schemaVersion: 2,
      projectId: "abc",
      createdAt: "2026-08-28T00:00:00.000Z",
      modifiedAt: "2026-08-28T00:00:00.000Z",
      folderName: "TAG_Project_2026-08-28_00-00-00",
      canvasWidth: 296,
      canvasHeight: 152,
      profileId: "EDG2-0260-A",
      orientation: "landscape",
      layers: [
        {
          type: "rect",
          id: "r1",
          name: "Obdélník 1",
          visible: true,
          locked: false,
          x: 0,
          y: 0,
          width: 10,
          height: 10,
          rotation: 0,
          fill: "black",
          stroke: "none",
          strokeWidth: 0,
        },
        {
          type: "text",
          id: "t1",
          name: "Text 1",
          visible: true,
          locked: false,
          x: 0,
          y: 0,
          width: 40,
          height: 16,
          rotation: 0,
          text: "Hi",
          color: "red",
          fontSize: 12,
          bold: false,
          align: "left",
          lineHeight: 1.15,
          outline: false,
          outlineWidth: 1,
        },
      ],
      dither: { mode: "atkinson", brightness: 0, contrast: 0, saturation: 0, redSensitivity: 45 },
      export: { bitOrder: "msb-first", planeOrder: "a-then-b", invertA: false, invertB: false, rotate: 0, flipX: false, flipY: false, cArrayName: "gImage", sdccCode: false },
    });
    const loaded = parseProjectJson(json);
    expect(loaded.schemaVersion).toBe(SCHEMA_VERSION);
    expect(loaded.background).toEqual({ kind: "solid", color: "white" });
    expect(loaded.export.planeMap).toBe("legacy");
    const rect = loaded.layers[0];
    expect(rect.type).toBe("rect");
    if (rect.type === "rect") {
      expect(rect.fill).toEqual({ kind: "solid", color: "black" });
      expect(rect.stroke).toEqual({ kind: "none" });
    }
    const text = loaded.layers[1];
    expect(text.type).toBe("text");
    if (text.type === "text") {
      expect(text.fill).toEqual({ kind: "solid", color: "red" });
    }
    expect(JSON.parse(json).schemaVersion).toBe(2);
    expect(JSON.parse(serializeProject(loaded)).schemaVersion).toBe(3);
  });

  it("schema > 3 odmítne", () => {
    expect(() => parseProjectJson(JSON.stringify({ schemaVersion: 4, canvasWidth: 8, canvasHeight: 8, layers: [] }))).toThrow(
      ProjectError,
    );
  });

  it("nový projekt je schema 3", () => {
    expect(createProject().schemaVersion).toBe(3);
    expect(createProject().background.kind).toBe("solid");
  });
});
