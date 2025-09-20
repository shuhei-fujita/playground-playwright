import { test, expect } from "@playwright/test";

test("フォーム入力のデモンストレーション", async ({ page }) => {
  // W3Schoolsのフォームページに移動
  await page.goto(
    "https://www.w3schools.com/html/tryit.asp?filename=tryhtml_form_submit"
  );

  // iframeにアクセス
  const frame = page.frameLocator("#iframeResult");

  // First nameフィールドに入力
  await frame.locator("#fname").fill("田中");

  // Last nameフィールドに入力
  await frame.locator("#lname").fill("太郎");

  // 入力値の検証
  await expect(frame.locator("#fname")).toHaveValue("田中");
  await expect(frame.locator("#lname")).toHaveValue("太郎");

  // フォームを送信
  await frame.locator('input[type="submit"]').click();

  // 送信後の結果を確認（URLにパラメータが含まれていることを確認）
  await expect(page).toHaveURL(/.*fname=田中.*lname=太郎/);
});
