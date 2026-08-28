import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const jpg = path.join(dir, "..", "testPIC", "small_296x152", "takemoney.jpg");
const schema1 = path.join(dir, "..", "projekt.tagstudio.json");
const mockFs = path.join(dir, "mockFs.js");

async function dismissRestore(page: import("@playwright/test").Page) {
  const btn = page.getByTestId("restore-no");
  if (await btn.isVisible().catch(() => false)) await btn.click();
}

async function dumpFs(page: import("@playwright/test").Page): Promise<string[]> {
  return page.evaluate(() => window.__TAGSTUDIO_E2E__?.dump?.() ?? []);
}

async function exportAllThroughConflict(page: import("@playwright/test").Page) {
  await page.getByTestId("export-all").click();
  const overwrite = page.getByTestId("conflict-overwrite");
  try {
    await overwrite.waitFor({ state: "visible", timeout: 2500 });
    await overwrite.click();
  } catch {
    /* první zápis bez konfliktu */
  }
}

test.describe("File System Access", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript({ path: mockFs });
    await page.addInitScript(() => {
      localStorage.removeItem("tagstudio.autosave.v1");
    });
    page.on("dialog", (d) => d.accept());
  });

  test("nový projekt vytvoří timestamp podsložku", async ({ page }) => {
    await page.goto("./");
    await dismissRestore(page);
    await expect(page.getByText("TAG Studio 0.3.0")).toBeVisible();
    await page.getByTestId("new-project").click();
    await page.getByTestId("template-blank").click();
    await expect(page.getByTestId("folder-status")).toContainText(/TAG_Project_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/);
    const files = await dumpFs(page);
    expect(files.some((f) => f.endsWith("project.tagstudio.json"))).toBe(true);
    expect(files.filter((f) => f.includes("TAG_Project_")).length).toBeGreaterThanOrEqual(1);
  });

  test("obrázek, BWR Atkinson, export vše do stejné složky", async ({ page }) => {
    await page.goto("./");
    await dismissRestore(page);
    await page.getByTestId("new-project").click();
    await page.getByTestId("template-blank").click();
    await page.getByTestId("image-file").setInputFiles(jpg);
    await expect(page.getByTestId("layer-list")).toContainText("takemoney", { timeout: 15_000 });
    await page.getByTestId("dither-mode").selectOption("bwr-two-phase");
    await expect(page.getByTestId("bwr-controls")).toBeVisible();
    await expect(page.getByTestId("bwr-bw-phase")).toHaveValue("atkinson");
    await exportAllThroughConflict(page);
    await expect(page.getByTestId("status-bar")).toContainText(/Exportováno|Zapsáno/, { timeout: 15_000 });
    const files = await dumpFs(page);
    expect(files.some((f) => f.endsWith("project.tagstudio.json"))).toBe(true);
    expect(files.some((f) => f.endsWith(".png"))).toBe(true);
    expect(files.some((f) => f.endsWith(".bin"))).toBe(true);
    expect(files.some((f) => f.endsWith(".c"))).toBe(true);
  });

  test("přepnutí mask/result nemění export", async ({ page }) => {
    await page.goto("./");
    await dismissRestore(page);
    await page.getByTestId("new-project").click();
    await page.getByTestId("template-blank").click();
    await page.getByTestId("dither-mode").selectOption("bwr-two-phase");
    await exportAllThroughConflict(page);
    const before = (await dumpFs(page)).filter((f) => f.endsWith(".bin")).sort();
    await page.getByTestId("preview-mask").click();
    await expect(page.getByTestId("status-bar")).toContainText("červená maska");
    await exportAllThroughConflict(page);
    const after = (await dumpFs(page)).filter((f) => f.endsWith(".bin")).sort();
    expect(after).toEqual(before);
    await page.getByTestId("preview-result").click();
    await expect(page.getByTestId("status-bar")).not.toContainText("červená maska");
  });

  test("schema 1 se otevře bez nové timestamp složky a uloží do vybrané složky", async ({ page }) => {
    await page.goto("./");
    await dismissRestore(page);
    expect(await dumpFs(page)).toEqual([]);
    await page.getByTestId("open-file").setInputFiles(schema1);
    await expect(page.getByTestId("layer-list")).toContainText("TagStudio v0.1");
    expect(await dumpFs(page)).toEqual([]);
    await page.getByTestId("save-project").click();
    await expect(page.getByTestId("status-bar")).toContainText(/Uloženo/, { timeout: 10_000 });
    const files = await dumpFs(page);
    expect(files.some((f) => f.endsWith("project.tagstudio.json"))).toBe(true);
  });

  test("zamítnutí oprávnění a znovupřipojení", async ({ page }) => {
    await page.addInitScript(() => {
      if (window.__TAGSTUDIO_E2E__) window.__TAGSTUDIO_E2E__.permission = "denied";
    });
    await page.goto("./");
    await dismissRestore(page);
    await page.getByTestId("new-project").click();
    await page.getByTestId("template-blank").click();
    await expect(page.getByTestId("folder-status")).toContainText("zamítnut");
    await page.evaluate(() => {
      if (window.__TAGSTUDIO_E2E__) window.__TAGSTUDIO_E2E__.permission = "granted";
    });
    await page.getByTestId("reenable-fs").click();
    await page.getByTestId("new-project").click();
    await page.getByTestId("template-blank").click();
    await expect(page.getByTestId("folder-status")).toContainText("TAG_Project_");
    expect((await dumpFs(page)).some((f) => f.endsWith("project.tagstudio.json"))).toBe(true);
  });

  test("zrušený picker nezničí projekt", async ({ page }) => {
    await page.goto("./");
    await dismissRestore(page);
    await page.getByTestId("add-text").click();
    await page.getByTestId("text-content").fill("Ponechat");
    await page.evaluate(() => {
      if (window.__TAGSTUDIO_E2E__) window.__TAGSTUDIO_E2E__.abortPicker = true;
    });
    await page.getByTestId("new-project").click();
    await expect(page.getByTestId("layer-list")).toContainText("Ponechat");
  });
});

test.describe("ZIP fallback", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("tagstudio.autosave.v1");
      window.__TAGSTUDIO_E2E__ = { disableFs: true };
    });
  });

  test("Exportovat vše stáhne ZIP", async ({ page }) => {
    await page.goto("./");
    await dismissRestore(page);
    await expect(page.getByTestId("folder-status")).toContainText("ZIP");
    const download = page.waitForEvent("download");
    await page.getByTestId("export-all").click();
    const file = await download;
    expect(file.suggestedFilename()).toMatch(/TAG_Project_.*\.zip$/);
  });
});
