import { test, expect } from "./fixtures/TestFixtures";
import { LibecityPage } from "./pages/LibecityPage";

/**
 * リベシティサイトのテスト
 *
 * 【なぜこのテストが重要か】
 * 1. 実用性: 実際のWebサービスでのログイン・操作テスト
 * 2. 複雑性: SPA（Single Page Application）での非同期処理検証
 * 3. 実践性: 実際の業務で使用するサイトでの自動化検証
 *
 * 【リファクタリング前の問題点】
 * ❌ 認証情報のハードコーディング（セキュリティリスク）
 * ❌ エラーハンドリングの不備
 * ❌ ログ出力の不足（デバッグ困難）
 * ❌ Page Objectパターン未使用（保守性低下）
 */
test.describe("リベシティ", () => {
  test.beforeEach(async ({ config }) => {
    // デバッグモード時の設定表示
    if (config.debugMode) {
      config.displayConfig();
    }
  });

  test("ユーザーがログインしてリアクションできること", async ({
    pageWithLogging,
    config,
    logger,
  }) => {
    // 【なぜ認証情報チェックが必要か】
    // 1. セキュリティ: ハードコーディングを完全に排除
    // 2. 運用性: 環境変数未設定時の適切なエラーメッセージ
    // 3. CI/CD: 継続的インテグレーションでの安全な実行
    if (!config.hasLibecityCredentials()) {
      test.skip(
        true,
        "環境変数 LIBECITY_EMAIL と LIBECITY_PASSWORD が設定されていません。\n" +
          ".envファイルを作成し、リベシティの認証情報を設定してください。\n" +
          "セキュリティ上の理由により、ハードコーディングされた認証情報は削除されました。\n" +
          "参考: .env.example を確認してください。"
      );
    }

    logger.info("=== リベシティログイン＋リアクションテスト開始 ===");

    const libecityPage = new LibecityPage(pageWithLogging);

    // 【なぜPage Objectパターンを使用するか】
    // 1. 保守性: UI変更時の修正箇所を限定
    // 2. 再利用性: 他のテストでも同じ操作を使用可能
    // 3. 可読性: テストの意図が明確
    // 4. テスタビリティ: 各ステップを個別にテスト可能
    await libecityPage.loginAndReact(
      config.libecityEmail,
      config.libecityPassword,
      5, // 開始インデックス
      10 // 実行回数
    );

    logger.info("=== リベシティログイン＋リアクションテスト完了 ===");
  });
});

/**
 * 【このヘルパー関数は削除されました】
 *
 * 削除理由:
 * 1. Page Objectパターンに統合済み（LibecityPage.performReactions）
 * 2. ハードコーディング削除（環境変数管理に移行）
 * 3. エラーハンドリング強化（統合ログシステム導入）
 * 4. 保守性向上（クラスメソッドとして体系化）
 *
 * 新しい実装場所: LibecityPage.performReactionsWithCSSSelector()
 */
