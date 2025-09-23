/**
 * 新ログシステム移行ガイド
 * 既存コードから新しいログシステムへの移行例とベストプラクティス
 */

import { LogLevel, LogCategory } from "../../../types";
import {
  initializeLoggingSystem,
  createQuickLogger,
  logger as compatibilityLogger,
  LogManager,
} from "../index";

/**
 * 【移行パターン1】既存コードの最小変更
 *
 * 既存のloggerインスタンスをそのまま使用しつつ、
 * 内部で新しいログシステムを利用
 */
export async function example1_MinimalChange() {
  console.log("\n=== 移行パターン1: 最小変更 ===");

  // 既存コード（変更なし）
  compatibilityLogger.info("テスト開始");
  compatibilityLogger.startStep("ページ移動", "ログインページに移動");
  compatibilityLogger.endStep("ページ移動", 1200);
  compatibilityLogger.error("ログインに失敗", { username: "test@example.com" });

  console.log("✅ 既存コードをそのまま使用可能");
}

/**
 * 【移行パターン2】段階的移行
 *
 * 新機能は新しいAPIを使用し、
 * 既存コードは互換性レイヤーで維持
 */
export async function example2_GradualMigration() {
  console.log("\n=== 移行パターン2: 段階的移行 ===");

  // 新しいログシステム初期化
  const logManager = await initializeLoggingSystem({
    level: LogLevel.DEBUG,
    enableConsole: true,
    enableFile: true,
  });

  // 新機能：構造化ログの活用
  logManager.startTest("ユーザーログインテスト", {
    testInfo: {
      title: "ユーザーログインテスト",
      file: "login.spec.ts",
      sessionId: "session_123",
    },
    browser: {
      name: "chromium",
      version: "120.0.0",
    },
  });

  // 新機能：パフォーマンス追跡
  logManager.performance("ページロード完了", {
    duration: 2400,
    memory: 45.2,
    networkRequests: 12,
  });

  // 新機能：セキュリティログ
  logManager.security("認証試行", {
    authAttempt: true,
    sensitiveDataAccess: false,
  });

  logManager.endTest("ユーザーログインテスト", "passed", 3600);

  console.log("✅ 新機能を段階的に導入");
}

/**
 * 【移行パターン3】完全移行
 *
 * 全面的に新しいAPIを使用し、
 * 高度なログ機能をフル活用
 */
export async function example3_FullMigration() {
  console.log("\n=== 移行パターン3: 完全移行 ===");

  // 本番環境レベルの設定
  const logManager = await initializeLoggingSystem({
    level: LogLevel.INFO,
    enableConsole: true,
    enableFile: true,
    enableStructured: true,
    enableMetrics: true,
    fileConfig: {
      directory: "test-results/logs",
      maxFileSize: 100,
      maxFiles: 50,
      compress: true,
    },
  });

  // テストシナリオ全体のログ
  const testContext = {
    testInfo: {
      title: "E2Eテスト：商品購入フロー",
      file: "e2e/purchase-flow.spec.ts",
      sessionId: logManager.getSessionId(),
    },
    browser: {
      name: "chromium",
      version: "120.0.0",
      platform: "darwin",
      viewport: { width: 1920, height: 1080 },
    },
  };

  try {
    // 1. テスト開始
    logManager.startTest("E2Eテスト：商品購入フロー", testContext);

    // 2. ページ操作のログ
    logManager.pageAction("navigate", "https://example.com/products", {
      ...testContext,
      page: { url: "https://example.com/products" },
    });

    // 3. パフォーマンス測定
    logManager.performance(
      "商品一覧ページロード",
      {
        duration: 1800,
        memory: 52.1,
        networkRequests: 8,
        domContentLoaded: 1200,
        firstContentfulPaint: 900,
      },
      testContext
    );

    // 4. ユーザーアクション
    logManager.info("商品を選択", LogCategory.USER_ACTION, {
      ...testContext,
      customData: { productId: "product_123", price: 2980 },
    });

    // 5. カート操作
    logManager.pageAction("click", "https://example.com/cart", {
      ...testContext,
      page: { url: "https://example.com/cart", title: "ショッピングカート" },
    });

    // 6. 決済処理（セキュリティログ）
    logManager.security(
      "決済情報入力",
      {
        authAttempt: false,
        sensitiveDataAccess: true,
        permissionRequest: "payment_info",
      },
      testContext
    );

    // 7. 成功完了
    logManager.endTest(
      "E2Eテスト：商品購入フロー",
      "passed",
      8500,
      testContext
    );
  } catch (error) {
    // 8. エラーハンドリング
    logManager.fatal(
      "テスト実行中に致命的エラー",
      LogCategory.ERROR_HANDLING,
      testContext,
      error as Error
    );
    logManager.endTest(
      "E2Eテスト：商品購入フロー",
      "failed",
      4200,
      testContext
    );
  }

  console.log("✅ 完全移行：全機能をフル活用");
}

/**
 * 【比較】既存システム vs 新システム
 */
export function comparisonExample() {
  console.log("\n=== 既存システム vs 新システム比較 ===");

  console.log("\n📊 既存システム（TestLogger）:");
  console.log("- シンプルなコンソール出力");
  console.log("- メモリ内ログ蓄積");
  console.log("- 手動ファイル保存");
  console.log("- 基本的なログレベル");

  console.log("\n🚀 新システム（LogManager + Emitters）:");
  console.log("- 📱 構造化JSON Lines形式");
  console.log("- 🔄 自動ファイルローテーション");
  console.log("- 📊 リアルタイムメトリクス収集");
  console.log("- 🎯 カテゴリ別ログ分類");
  console.log("- 🔒 機密データ自動マスキング");
  console.log("- ⚡ 非同期バッチ処理");
  console.log("- 📈 トレンド分析");
  console.log("- 🚨 自動アラート");
  console.log("- 🌍 環境別設定");
  console.log("- 🔍 高速検索用インデックス");
}

/**
 * 【実用例】Playwright testでの使用方法
 */
export function playwrightIntegrationExample() {
  return `
// tests/example-with-new-logging.spec.ts
import { test, expect } from '@playwright/test';
import { LogCategory } from '../../../types';
import { initializeLoggingSystem } from '../index';

test.describe('新ログシステム統合例', () => {
  let logManager: LogManager;

  test.beforeAll(async () => {
    // テスト開始時にログシステム初期化
    logManager = await initializeLoggingSystem({
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: true,
      enableStructured: true
    });
  });

  test('商品検索機能のテスト', async ({ page }, testInfo) => {
    const testContext = {
      testInfo: {
        title: testInfo.title,
        file: testInfo.file,
        sessionId: logManager.getSessionId()
      },
      browser: {
        name: 'chromium',
        version: '120.0.0'
      }
    };

    try {
      // テスト開始ログ
      logManager.startTest(testInfo.title, testContext);

      // ページ移動
      await page.goto('https://example.com');
      logManager.pageAction('navigate', 'https://example.com', {
        ...testContext,
        page: { url: page.url() }
      });

      // 検索実行
      const startTime = Date.now();
      await page.fill('[data-testid="search-input"]', '商品名');
      await page.click('[data-testid="search-button"]');
      const duration = Date.now() - startTime;

      logManager.performance('検索実行', { duration }, testContext);

      // 結果検証
      await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
      
      // テスト成功
      logManager.endTest(testInfo.title, 'passed', Date.now() - testContext.testInfo.sessionId);

    } catch (error) {
      // エラーログ
      logManager.error('テスト失敗', LogCategory.ERROR_HANDLING, testContext, error);
      logManager.endTest(testInfo.title, 'failed');
      throw error;
    }
  });

  test.afterAll(async () => {
    // ログシステムのクリーンアップ
    await logManager.flush();
    await logManager.close();
  });
});
`;
}

/**
 * サンプル実行関数
 */
export async function runMigrationExamples() {
  console.log("🚀 新ログシステム移行ガイドの実行開始\n");

  await example1_MinimalChange();
  await example2_GradualMigration();
  await example3_FullMigration();

  comparisonExample();

  console.log("\n📝 Playwright統合例:");
  console.log(playwrightIntegrationExample());

  console.log("\n✅ 移行ガイドの実行完了");
  console.log("\n次のステップ:");
  console.log("1. 既存のTestLoggerを段階的に置き換え");
  console.log("2. 環境別設定の調整");
  console.log("3. CI/CDパイプラインでのログ活用");
  console.log("4. メトリクス・アラートの監視設定");
}

// 直接実行時のサンプル
if (require.main === module) {
  runMigrationExamples().catch(console.error);
}
