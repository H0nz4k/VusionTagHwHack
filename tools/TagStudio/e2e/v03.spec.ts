import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
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
    /* no conflict */
  }
}

test.describe("šablony a BWR paleta", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript({ path: mockFs });
    await page.addInitScript(() => {
      localStorage.removeItem("tagstudio.autosave.v1");
    });
    page.on("dialog", (d) => d.accept());
  });

  test("galerie, BWR test šablona, změna vzoru, export vše", async ({ page }) => {
    await page.goto("./");
    await dismissRestore(page);
    await expect(page.getByText("TAG Studio 0.3.0")).toBeVisible();
    await page.getByTestId("new-project").click();
    await expect(page.getByTestId("template-gallery")).toBeVisible();
    await page.getByTestId("template-bwr-color-test-01-16").click();
    await expect(page.getByTestId("layer-list")).toContainText("Pole 01");
    await page.getByTestId("layer-list").getByText("Pole 01", { exact: true }).click();
    await page.getByTestId("bwr-patterns-toggle-fill").click();
    await page.getByTestId("pattern-fill-bwr-08-red-50").click();
    await exportAllThroughConflict(page);
    const files = await dumpFs(page);
    expect(files.some((f) => f.endsWith("project.tagstudio.json"))).toBe(true);
    expect(files.some((f) => f.endsWith(".png"))).toBe(true);
    expect(files.some((f) => f.endsWith(".bin"))).toBe(true);
    expect(files.some((f) => f.endsWith(".c"))).toBe(true);
  });
});

test.describe("šablony ZIP fallback", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem("tagstudio.autosave.v1");
      window.__TAGSTUDIO_E2E__ = { disableFs: true };
    });
  });

  test("šablona a ZIP download", async ({ page }) => {
    await page.goto("./");
    await dismissRestore(page);
    await page.getByTestId("new-project").click();
    await page.getByTestId("template-product-price").click();
    await expect(page.getByTestId("layer-list")).toContainText("Cena");
    const download = page.waitForEvent("download");
    await page.getByTestId("export-all").click();
    expect((await download).suggestedFilename()).toMatch(/\.zip$/);
  });
});
