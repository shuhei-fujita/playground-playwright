import { test, expect } from "./fixtures/TestFixtures";
import { LibecityPage } from "./pages/LibecityPage";

/**
 * リベシティサイトのテスト（Role-basedセレクター版）
 *
 * 【なぜsample-リベ.spec.tsと分離するか】
 * 1. 比較検証: CSSセレクターとRole-basedセレクターの動作比較
 * 2. 冗長性回避: 将来的にどちらか一方に統合予定
 * 3. 学習目的: 異なるセレクター戦略の効果を検証
 *
 * 【このテストの改善ポイント】
 * ✅ 環境変数管理による認証情報の安全化
 * ✅ Page Objectパターンによる保守性向上
 * ✅ 統合ログシステムによるデバッグ容易性
 * ✅ Role-basedセレクター優先使用（rules.mdc準拠）
 */
test.describe("リベシティ（Role-basedセレクター版）", () => {
  test.beforeEach(async ({ config }) => {
    if (config.debugMode) {
      config.displayConfig();
    }
  });

  test("Role-basedセレクターでリアクション操作ができること", async ({
    pageWithLogging,
    config,
    logger,
  }) => {
    // 【なぜ同じ認証情報チェックを行うか】
    // 各テストファイルは独立して実行される可能性があるため、
    // それぞれで前提条件を確認する必要がある
    if (!config.hasLibecityCredentials()) {
      test.skip(
        true,
        "環境変数 LIBECITY_EMAIL と LIBECITY_PASSWORD が設定されていません。\n" +
          ".envファイルを作成し、リベシティの認証情報を設定してください。\n" +
          "セキュリティ上の理由により、ハードコーディングされた認証情報は削除されました。\n" +
          "参考: .env.example を確認してください。"
      );
    }

    logger.info("=== リベシティRole-basedセレクターテスト開始 ===");

    const libecityPage = new LibecityPage(pageWithLogging);

    /**
     * 【なぜ処理を分離するか】
     * 1. 責任分離: ログインとリアクションを独立してテスト
     * 2. エラー特定: どの段階で失敗したかを明確に把握
     * 3. 再利用性: ログインのみ、リアクションのみでも使用可能
     */

    // ステップ1: ログイン処理
    await libecityPage.loginFlow(config.libecityEmail, config.libecityPassword);

    // ステップ2: Role-basedセレクターによるリアクション
    // 【なぜRole-basedセレクターを優先するか】
    // 1. アクセシビリティ対応: スクリーンリーダー等の支援技術との互換性
    // 2. セマンティック: ボタンの意味・役割が明確
    // 3. 保守性: UI変更に対する耐性が高い
    await libecityPage.performReactions(5, 10);

    logger.info("=== リベシティRole-basedセレクターテスト完了 ===");
  });
});
