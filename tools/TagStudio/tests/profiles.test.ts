import { describe, expect, it } from "vitest";
import { canvasSizeFor, dualPlaneByteSize, planeByteSize, PROFILES, validateCustomSize } from "../src/core/profiles";

describe("profily displejů", () => {
  it("EDG2-0260-A landscape 296×152", () => {
    expect(PROFILES["EDG2-0260-A"].landscape).toEqual({ width: 296, height: 152 });
    expect(canvasSizeFor("EDG2-0260-A", "landscape")).toEqual({ width: 296, height: 152 });
    expect(planeByteSize(296, 152)).toBe(5624);
    expect(dualPlaneByteSize(296, 152)).toBe(11248);
  });

  it("EDG2-0260-A portrait 152×296", () => {
    expect(canvasSizeFor("EDG2-0260-A", "portrait")).toEqual({ width: 152, height: 296 });
    expect(planeByteSize(152, 296)).toBe(5624);
  });

  it("EDG2-0420-B landscape 400×300", () => {
    expect(canvasSizeFor("EDG2-0420-B", "landscape")).toEqual({ width: 400, height: 300 });
    expect(planeByteSize(400, 300)).toBe(15000);
    expect(dualPlaneByteSize(400, 300)).toBe(30000);
  });

  it("EDG2-0420-B portrait 300×400", () => {
    expect(canvasSizeFor("EDG2-0420-B", "portrait")).toEqual({ width: 300, height: 400 });
    expect(planeByteSize(300, 400)).toBe(15000);
    expect(dualPlaneByteSize(300, 400)).toBe(30000);
  });

  it("vlastní rozměr validuje kladná celá čísla", () => {
    expect(validateCustomSize(10, 8)).toBeNull();
    expect(validateCustomSize(0, 8)).not.toBeNull();
    expect(validateCustomSize(1.5, 8)).not.toBeNull();
  });
});
