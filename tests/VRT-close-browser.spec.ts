import { test, expect, chromium } from "@playwright/test";

test("ブラウザを閉じた状態でのVRTテスト", async ({}) => {
  const browser = await chromium.launch();
  // 新しいブラウザコンテキストを作成
  const context = await browser.newContext();

  // 新しいページを作成
  const page = await context.newPage();

  await page.goto("https://playwright.dev");

  // 初回起動時に画像が配置されていないことでエラーが起こるが正い挙動
  // ディレクトリに正い画像を配置しておくことが、正い運用
  await expect(page).toHaveScreenshot();

  await browser.close();
});
