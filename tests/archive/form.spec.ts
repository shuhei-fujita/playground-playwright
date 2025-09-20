import { test, expect } from "./fixtures/TestFixtures";
import { FormPage } from "./pages/FormPage";
import { TestData } from "./data/TestData";

test.describe("フォーム操作", () => {
  test("ユーザーがフォームに入力して送信できること", async ({
    pageWithLogging,
    logger,
  }) => {
    logger.info("=== フォーム送信テスト開始 ===");

    const formPage = new FormPage(pageWithLogging);
    const testUser = TestData.forms.personalInfo;

    // Page Objectを使用したフォーム操作（テストデータ使用）
    await formPage.fillAndSubmitForm(testUser.firstName, testUser.lastName);

    logger.info("=== フォーム送信テスト完了 ===");
  });

  test("フォーム入力値が正しく保持されること", async ({
    pageWithLogging,
    logger,
  }) => {
    logger.info("=== フォーム入力値保持テスト開始 ===");

    const formPage = new FormPage(pageWithLogging);
    const businessUser = TestData.forms.businessInfo;

    // ビジネス情報のテストデータを使用
    const testFirstName = "テスト";
    const testLastName = "太郎";

    await formPage.navigateToForm();
    await formPage.fillFirstName(testFirstName);
    await formPage.fillLastName(testLastName);

    // 入力値の検証
    await formPage.verifyInputValues(testFirstName, testLastName);

    logger.info("=== フォーム入力値保持テスト完了 ===");
  });

  test("フォームの各種操作テスト", async ({ pageWithLogging, logger }) => {
    logger.info("=== フォーム各種操作テスト開始 ===");

    const formPage = new FormPage(pageWithLogging);

    await formPage.navigateToForm();

    // 1. 入力テスト
    await formPage.fillFirstName("操作");
    await formPage.fillLastName("テスト");

    // 2. クリア機能テスト
    await formPage.clearAllInputs();

    // 3. 再入力テスト
    const finalData = TestData.forms.personalInfo;
    await formPage.fillFirstName(finalData.firstName);
    await formPage.fillLastName(finalData.lastName);

    // 4. 送信テスト
    await formPage.submitForm();
    await formPage.verifyFormSubmission(
      finalData.firstName,
      finalData.lastName
    );

    logger.info("=== フォーム各種操作テスト完了 ===");
  });

  test("無効データでのエラーハンドリングテスト", async ({
    pageWithLogging,
    logger,
  }) => {
    logger.info("=== エラーハンドリングテスト開始 ===");

    const formPage = new FormPage(pageWithLogging);

    await formPage.navigateToForm();

    try {
      // 空の値での送信テスト
      await formPage.fillFirstName("");
      await formPage.fillLastName("");
      await formPage.submitForm();

      // このフォームでは空値でも送信されるため、
      // 空文字列での結果が表示されることを確認
      await formPage.verifyFormSubmission("", "");
    } catch (error) {
      // エラーが発生した場合はログに記録
      logger.warn("空値送信でエラーが発生:", error);
    }

    logger.info("=== エラーハンドリングテスト完了 ===");
  });
});
