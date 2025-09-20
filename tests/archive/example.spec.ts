import { test, expect } from "@playwright/test";

test("タイトルが存在すること", async ({ page }) => {
  await page.goto("https://playwright.dev/");

  // タイトルが指定の文字列を含むことを期待します。
  await expect(page).toHaveTitle(/Playwright/);
  await page.screenshot({ path: "test-results/screenshots/screenshot.png" });

  // toHaveScreenshotとは、ページのスクリーンショットが一致することを期待する関数です。
  await expect(page).toHaveScreenshot();
});

test("タイトル部分のコンポーネントが存在すること", async ({ page }) => {
  await page.goto("https://playwright.dev/");

  // タイトル部分のコンポーネントが存在することを期待します。
  const locator_title = page.locator(".hero__title");
  await expect(locator_title).toBeVisible();
  await locator_title.screenshot({
    path: "test-results/screenshots/screenshot_component.png",
  });
});

test("Get startedリンクを取得すること", async ({ page }) => {
  await page.goto("https://playwright.dev/");

  // Get startedリンクをクリックします。
  await page.getByRole("link", { name: "Get started" }).click();

  // ページには「Installation」という名前の見出しを持つことを期待します。
  await expect(
    page.getByRole("heading", { name: "Installation" })
  ).toBeVisible();
});
