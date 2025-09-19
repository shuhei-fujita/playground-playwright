// Playwrightに標準的実装されているlocaterのテスト

// Quick Guide
// These are the recommended built-in locators.

// page.getByRole() to locate by explicit and implicit accessibility attributes.
// page.getByText() to locate by text content.
// page.getByLabel() to locate a form control by associated label's text.
// page.getByPlaceholder() to locate an input by placeholder.
// page.getByAltText() to locate an element, usually image, by its text alternative.
// page.getByTitle() to locate an element by its title attribute.
// page.getByTestId() to locate an element based on its data-testid attribute (other attributes can be configured).

// Example
// await page.getByLabel("User Name").fill("John");
// 【セキュリティ重要】ハードコーディング例を削除
// await page.getByLabel("Password").fill(process.env.YOUR_PASSWORD || "");
// await page.getByRole("button", { name: "Sign in" }).click();
// await expect(page.getByText("Welcome, John!")).toBeVisible();

import { test, expect } from "@playwright/test";

// getByRole
// ある要素がボタンなのかチェックボックスなのかなど、ユーザや支援技術がページをどのように認識
test("Role-basedセレクターでボタンを取得できること", async ({ page }) => {
  await page.setContent(`
    <button>Click me</button>
  `);

  const button = await page.getByRole("button");
  await expect(button).toBeVisible();
});

// getByText
// その要素が含むテキストで検索します
// 部分文字列、完全な文字列、正規表現でマッチさせることができます
test("Text-basedセレクターで要素を取得できること", async ({ page }) => {
  await page.setContent(`
    <button>Click me</button>
  `);

  const button = await page.getByText("Click me");
  await expect(button).toBeVisible();
});

// getByLabel
test("Label-basedセレクターで入力フィールドを取得できること", async ({
  page,
}) => {
  await page.setContent(`
    <label for="username">User Name</label>
    <input id="username" />
  `);

  const input = await page.getByLabel("User Name");
  await expect(input).toBeVisible();
});

// getByPlaceholder
