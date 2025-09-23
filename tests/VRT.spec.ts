import { test, expect } from "./fixtures/TestFixtures";
import { PlaywrightDevPage } from "./pages/PlaywrightDevPage";
import { LocatorTestPage } from "./pages/LocatorTestPage";
import { LogCategory } from "./types";

test("Playwright.devページのスクリーンショットが正常に撮影できること", async ({
  pageWithLogging,
  logManager,
}, testInfo) => {
  const playwrightPage = new PlaywrightDevPage(pageWithLogging, logManager);

  // テスト開始ログ
  logManager.startTest(testInfo.title);

  try {
    // === GIVEN: テスト前提条件の設定 ===
    logManager.info(
      "🏁 === GIVEN: テスト前提条件の設定 ===",
      LogCategory.TEST_EXECUTION
    );
    await playwrightPage.navigate();

    // === WHEN: テスト対象の操作実行 ===
    logManager.info(
      "⚡ === WHEN: VRTスクリーンショット撮影実行 ===",
      LogCategory.TEST_EXECUTION
    );
    // Visual Regression Testing用のスクリーンショット撮影
    // 初回起動時に画像が配置されていないことでエラーが起こるが正しい挙動
    // ディレクトリに正しい画像を配置しておくことが、正しい運用
    await playwrightPage.takeVRTScreenshot();

    // === THEN: 期待結果の検証 ===
    logManager.info(
      "✅ === THEN: VRTスクリーンショット撮影成功 ===",
      LogCategory.TEST_EXECUTION
    );
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
  pageWithLogging,
  logManager,
}, testInfo) => {
  const playwrightPage = new PlaywrightDevPage(pageWithLogging, logManager);

  // テスト開始ログ
  logManager.startTest(testInfo.title);

  try {
    // === GIVEN: テスト前提条件の設定 ===
    logManager.info(
      "🏁 === GIVEN: ページナビゲーション ===",
      LogCategory.TEST_EXECUTION
    );
    await playwrightPage.navigate(); // 基本成功確認済み

    // === WHEN & THEN: テスト固有の詳細検証 ===
    logManager.info(
      "⚡ === WHEN & THEN: タイトル検証実行 ===",
      LogCategory.TEST_EXECUTION
    );
    // 公式パターン: テスト固有の期待値をテストファイル内で検証
    await expect(pageWithLogging).toHaveTitle(
      /Fast and reliable end-to-end testing for modern web apps/
    );

    const title = await pageWithLogging.title();
    logManager.info("✅ タイトル検証成功", LogCategory.TEST_EXECUTION, {
      page: { url: pageWithLogging.url() },
      customData: { actualTitle: title },
    });
    console.log(`✅ 期待されるタイトルを確認: ${title}`);
  } catch (error) {
    await playwrightPage.handleError(`タイトル検証でエラーが発生: ${error}`);
    throw error;
  }
});

test("Playwright.devページのメイン要素が表示されること", async ({ page }) => {
  const playwrightPage = new PlaywrightDevPage(page);

  try {
    // === GIVEN: テスト前提条件の設定 ===
    await playwrightPage.navigate(); // 基本成功確認済み

    // === WHEN & THEN: テスト固有の詳細検証 ===
    // 公式パターン: 詳細検証メソッド + テスト固有確認
    await playwrightPage.verifyMainElements(); // 基本要素確認

    // テスト固有の詳細確認
    await expect(page.locator("h1")).toContainText("Playwright");
    await expect(page.locator("footer")).toBeVisible();

    console.log("✅ メイン要素の詳細確認が完了しました");
  } catch (error) {
    await playwrightPage.handleError(`要素表示確認でエラーが発生: ${error}`);
    throw error;
  }
});

test("Get Startedボタンの動作確認", async ({ page }) => {
  const playwrightPage = new PlaywrightDevPage(page);

  try {
    // === GIVEN: テスト前提条件の設定 ===
    await playwrightPage.navigate(); // 基本成功確認済み

    // === WHEN: アクション実行 ===
    await playwrightPage.clickGetStarted(); // アクション成功確認済み

    // === THEN: テスト固有の詳細検証 ===
    // 公式パターン: テスト固有の期待値検証
    await expect(page.locator("h1")).toContainText("Installation");
    await expect(page.locator("nav .active, nav [aria-current]")).toContainText(
      "Getting"
    );

    console.log("✅ Get Startedボタンの動作確認が完了しました");
  } catch (error) {
    await playwrightPage.handleError(
      `Get Started動作確認でエラーが発生: ${error}`
    );
    throw error;
  }
});

test("LocatorTestPageのテスト", async ({
  pageWithLogging,
  logManager,
}, testInfo) => {
  const locatorTestPage = new LocatorTestPage(pageWithLogging, logManager);

  // テスト開始ログ
  logManager.startTest(testInfo.title);
  logManager.info(
    "🎯 === セレクター戦略包括テスト開始 ===",
    LogCategory.TEST_EXECUTION
  );

  await locatorTestPage.testRoleBasedSelector();
  await locatorTestPage.testTextBasedSelector();
  await locatorTestPage.testLabelBasedSelector();
  await locatorTestPage.demonstrateSafeLoginForm();

  logManager.info(
    "✅ === セレクター戦略テスト完了 ===",
    LogCategory.TEST_EXECUTION
  );
});
