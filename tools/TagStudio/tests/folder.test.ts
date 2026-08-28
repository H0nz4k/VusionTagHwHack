import { describe, expect, it } from "vitest";
import { formatProjectFolderName, sanitizeFileName, uniqueName, versionedFileName } from "../src/core/folder";

describe("názvy projektových složek", () => {
  it("použije místní čas a formát bez dvojteček", () => {
    const date = new Date(2026, 7, 28, 19, 42, 7);
    expect(formatProjectFolderName(date)).toBe("TAG_Project_2026-08-28_19-42-07");
    expect(formatProjectFolderName(date)).not.toContain(":");
  });

  it("s injektovanými hodinami vznikne přesný název", () => {
    const clock = () => new Date(2026, 0, 2, 3, 4, 5);
    expect(formatProjectFolderName(clock())).toBe("TAG_Project_2026-01-02_03-04-05");
  });

  it("kolize přidá _02, _03", () => {
    const base = "TAG_Project_2026-08-28_19-42-07";
    expect(uniqueName(base, [])).toBe(base);
    expect(uniqueName(base, [base])).toBe(`${base}_02`);
    expect(uniqueName(base, [base, `${base}_02`])).toBe(`${base}_03`);
  });

  it("sanitizace zakáže neplatné znaky a path traversal", () => {
    expect(sanitizeFileName("a/../b:c*?.png")).not.toMatch(/[<>:"/\\|?*]/);
    expect(sanitizeFileName("..")).toBe("_");
    expect(sanitizeFileName("foo/../../etc")).not.toContain("..");
  });

  it("verze souboru použije _v02", () => {
    expect(versionedFileName("a.png", ["a.png"])).toBe("a_v02.png");
    expect(versionedFileName("a.png", ["a.png", "a_v02.png"])).toBe("a_v03.png");
  });
});
