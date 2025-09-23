import { test, expect } from "@playwright/test";
import { PlaywrightDevPage } from "./pages/PlaywrightDevPage";
import { LocatorTestPage } from "./pages/LocatorTestPage";

test("Playwright.devページのスクリーンショットが正常に撮影できること", async ({
  page,
}) => {
  const playwrightPage = new PlaywrightDevPage(page);

  try {
    // === GIVEN: テスト前提条件の設定 ===
    await playwrightPage.navigate();

    // === WHEN: テスト対象の操作実行 ===
    // Visual Regression Testing用のスクリーンショット撮影
    // 初回起動時に画像が配置されていないことでエラーが起こるが正しい挙動
    // ディレクトリに正しい画像を配置しておくことが、正しい運用
    await playwrightPage.takeVRTScreenshot();

    // === THEN: 期待結果の検証 ===
    // スクリーンショット撮影が正常に完了（例外が発生しなければ成功）
    console.log("✅ スクリーンショット撮影が正常に完了しました");
  } catch (error) {
    await playwrightPage.handleError(
      `スクリーンショット撮影でエラーが発生: ${error}`
    );
    throw error;
  }
});

test("Playwright.devページのタイトルが正しく表示されること", async ({
  page,
}) => {
  const playwrightPage = new PlaywrightDevPage(page);

  try {
    // === GIVEN: テスト前提条件の設定 ===
    await playwrightPage.navigate();

    // === WHEN: テスト対象の操作実行 ===
    // Page Objectメソッドを使用（POMパターン準拠）
    await playwrightPage.verifyPageTitle();

    // === THEN: 期待結果の検証 ===
    // Page Object内で検証が完了（POMパターンによる実装の一貫性）
    console.log("✅ ページタイトル検証が完了しました");
  } catch (error) {
    await playwrightPage.handleError(`タイトル検証でエラーが発生: ${error}`);
    throw error;
  }
});

test("Playwright.devページのメイン要素が表示されること", async ({ page }) => {
  const playwrightPage = new PlaywrightDevPage(page);

  try {
    // === GIVEN: テスト前提条件の設定 ===
    await playwrightPage.navigate();

    // === WHEN: テスト対象の操作実行 ===
    // Page Objectメソッドを使用（POMパターン準拠）
    await playwrightPage.verifyMainElements();

    // === THEN: 期待結果の検証 ===
    // Page Object内で検証が完了（POMパターンによる実装の一貫性）
    console.log("✅ メイン要素の表示確認が完了しました");
  } catch (error) {
    await playwrightPage.handleError(`要素表示確認でエラーが発生: ${error}`);
    throw error;
  }
});

test("LocatorTestPageのテスト", async ({ page }) => {
  const locatorTestPage = new LocatorTestPage(page);

  await locatorTestPage.testRoleBasedSelector();
  await locatorTestPage.testTextBasedSelector();
  await locatorTestPage.testLabelBasedSelector();
  await locatorTestPage.demonstrateSafeLoginForm();
});
