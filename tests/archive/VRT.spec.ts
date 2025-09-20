import { test, expect } from "@playwright/test";

test("Visual Regression Testingが正常に動作すること", async ({ page }) => {
  await page.goto("https://playwright.dev");

  // 初回起動時に画像が配置されていないことでエラーが起こるが正い挙動
  // ディレクトリに正い画像を配置しておくことが、正い運用？
  await expect(page).toHaveScreenshot();
});
