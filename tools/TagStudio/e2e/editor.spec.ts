import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const jpg = path.join(dir, "..", "testPIC", "small_296x152", "takemoney.jpg");

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.removeItem("tagstudio.autosave.v1");
    window.__TAGSTUDIO_E2E__ = { disableFs: true };
  });
});

test("základní průchod: obrázek, dithering, text, export", async ({ page }) => {
  await page.goto("./");
  await dismissRestore(page);
  await expect(page.getByText("TAG Studio")).toBeVisible();
  await page.getByTestId("image-file").setInputFiles(jpg);
  await expect(page.getByTestId("layer-list")).toContainText("takemoney", { timeout: 15_000 });
  await page.getByTestId("dither-mode").selectOption("floyd-steinberg");
  await page.getByTestId("add-text").click();
  await page.getByTestId("text-content").fill("Cena 12 Kč");
  const png = page.waitForEvent("download");
  await page.getByTestId("export-png").click();
  const pngFile = await png;
  expect(pngFile.suggestedFilename()).toMatch(/\.png$/);
  const bin = page.waitForEvent("download");
  await page.getByTestId("export-bin").click();
  expect((await bin).suggestedFilename()).toMatch(/\.bin$/);
  const c = page.waitForEvent("download");
  await page.getByTestId("export-c").click();
  expect((await c).suggestedFilename()).toMatch(/\.c$/);
});

test("uložení a opětovné otevření projektu", async ({ page }) => {
  await page.goto("./");
  await dismissRestore(page);
  await page.getByTestId("add-text").click();
  await page.getByTestId("text-content").fill("Roundtrip");
  const save = page.waitForEvent("download");
  await page.getByTestId("save-project").click();
  const file = await save;
  const p = await file.path();
  await page.getByTestId("new-project").click();
  const gallery = page.getByTestId("template-gallery");
  if (await gallery.isVisible().catch(() => false)) await page.getByTestId("template-blank").click();
  await page.getByTestId("open-file").setInputFiles(p);
  await expect(page.getByTestId("layer-list")).toContainText("Roundtrip");
  await page.getByTestId("layer-list").locator(".layer-item").first().click();
  await expect(page.getByTestId("text-content")).toHaveValue("Roundtrip");
});

test("přepnutí na velký tag s potvrzením", async ({ page }) => {
  await page.goto("./");
  await dismissRestore(page);
  await page.getByTestId("add-rect").click();
  await page.getByTestId("profile-select").selectOption("EDG2-0420-B");
  await expect(page.getByTestId("profile-dialog")).toBeVisible();
  await page.getByTestId("profile-fit").click();
  await expect(page.getByTestId("status-bar")).toContainText("400 × 300");
});

test("pokročilý export a diagnostický náhled", async ({ page }) => {
  await page.goto("./");
  await dismissRestore(page);
  await page.getByTestId("add-rect").click();
  await page.getByTestId("advanced-export").click();
  await page.getByLabel("Inverze A").check();
  await page.getByTestId("export-diag").click();
  await expect(page.getByTestId("diag-modal")).toBeVisible();
  await expect(page.getByTestId("diag-modal")).toContainText("stejný obraz");
});

async function dismissRestore(page: import("@playwright/test").Page) {
  const btn = page.getByTestId("restore-no");
  if (await btn.isVisible().catch(() => false)) await btn.click();
}
