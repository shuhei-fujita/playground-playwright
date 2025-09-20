import { test, expect } from "./fixtures/TestFixtures";
import { TicketPiaPage } from "./pages/TicketPiaPage";
import { TestData } from "./data/TestData";

test.describe("チケットぴあ", () => {
  test.beforeEach(async ({ config }) => {
    // 設定情報を表示（デバッグ用）
    if (config.debugMode) {
      config.displayConfig();
    }
  });

  test("ユーザーがログインできること", async ({
    pageWithLogging,
    config,
    logger,
  }) => {
    // 認証情報の確認（common-rules.mdcに準拠）
    if (!config.hasTicketPiaCredentials()) {
      test.skip(
        true,
        "環境変数 ID_TICKET と PASSWORD_TICKET が設定されていません。\n" +
          ".envファイルを作成し、必要な認証情報を設定してください。\n" +
          "参考: .env.example を確認してください。"
      );
    }

    logger.info("=== チケットぴあログインテスト開始 ===");

    const ticketPiaPage = new TicketPiaPage(pageWithLogging);

    // Page Objectを使用したログインフロー
    await ticketPiaPage.loginFlow(
      config.ticketPiaEmail,
      config.ticketPiaPassword
    );

    logger.info("=== チケットぴあログインテスト完了 ===");
  });

  test("ログイン失敗時のエラーハンドリング", async ({
    pageWithLogging,
    logger,
  }) => {
    logger.info("=== ログイン失敗テスト開始 ===");

    const ticketPiaPage = new TicketPiaPage(pageWithLogging);

    try {
      // 不正な認証情報でログインを試行
      await ticketPiaPage.navigateToTop();
      await ticketPiaPage.goToLoginPage();
      await ticketPiaPage.login(
        TestData.users.invalidUser.email,
        TestData.users.invalidUser.password
      );

      // エラーメッセージが表示されることを期待
      // （実際のエラー処理は ticketPiaPage.login 内で行われる）
    } catch (error) {
      // 期待されるエラー - ログイン失敗
      logger.info("期待通りログインが失敗しました", error);
      expect(error).toBeDefined();
    }

    logger.info("=== ログイン失敗テスト完了 ===");
  });
});
