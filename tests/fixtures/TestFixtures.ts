import { test as base, Browser, BrowserContext, Page } from "@playwright/test";
import { BasePage } from "../pages/BasePage";
import { TestLogger, logger } from "../utils/TestLogger";
import { TestConfig, config } from "../utils/TestConfig";
import {
  LogManager,
  initializeLoggingSystem,
  LogLevel,
  LogCategory,
} from "../utils/logging";
import fs from "fs";
import path from "path";

/**
 * 拡張テストフィクスチャ
 * 共通機能を全てのテストで利用可能にする
 */

export interface TestFixtures {
  // 基本のPlaywrightオブジェクト（拡張）
  contextWithAuth: BrowserContext;
  pageWithLogging: Page;

  // カスタムユーティリティ
  logger: TestLogger;
  config: TestConfig;
  logManager: LogManager; // 新ログシステム

  // ページオブジェクト用のベースページ
  basePage: BasePage;
}

// テストフィクスチャを拡張
export const test = base.extend<TestFixtures>({
  // 認証済みコンテキスト
  contextWithAuth: async ({ browser }, use) => {
    const context = await browser.newContext({
      // 認証ファイルが存在する場合は読み込み
      storageState: fs.existsSync(config.authFilePath)
        ? config.authFilePath
        : undefined,

      // 視覚的設定
      viewport: { width: 1920, height: 1080 },

      // テスト用の追加設定
      extraHTTPHeaders: {
        "Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
      },

      // プライバシー設定
      // 【なぜclipboard権限を削除するか】
      // WebKitブラウザでclipboard-write権限がサポートされていないため
      // 必要な場合のみ個別のテストで設定
      // permissions: ["clipboard-read", "clipboard-write"],

      // デバッグ設定
      recordVideo:
        config.video !== "off"
          ? {
              dir: path.join(__dirname, "../test-results/videos/"),
              size: { width: 1920, height: 1080 },
            }
          : undefined,

      recordHar: config.debugMode
        ? {
            path: path.join(__dirname, "../test-results/har/trace.har"),
          }
        : undefined,
    });

    logger.info("テストコンテキストを作成しました");

    await use(context);

    await context.close();
    logger.info("テストコンテキストを閉じました");
  },

  // ロギング機能付きページ
  pageWithLogging: async ({ contextWithAuth }, use, testInfo) => {
    const page = await contextWithAuth.newPage();

    // ページイベントのログ記録
    page.on("console", (msg) => {
      if (config.verboseLogging) {
        logger.info(`Console [${msg.type()}]: ${msg.text()}`);
      }
    });

    page.on("pageerror", (error) => {
      logger.error(`Page Error: ${error.message}`, { stack: error.stack });
    });

    page.on("requestfailed", (request) => {
      logger.warn(`Request Failed: ${request.method()} ${request.url()}`, {
        failure: request.failure()?.errorText,
      });
    });

    // ページ作成をログ記録
    logger.info(`ページを作成しました: ${testInfo.title}`);

    await use(page);

    // テスト終了時のスクリーンショット（失敗時）
    if (testInfo.status !== testInfo.expectedStatus) {
      const screenshotPath = path.join(
        "test-results/screenshots",
        `failure-${testInfo.title}-${Date.now()}.png`
      );
      await page.screenshot({ path: screenshotPath, fullPage: true });
      logger.error(`テスト失敗時のスクリーンショットを保存: ${screenshotPath}`);
    }

    await page.close();
    logger.info("ページを閉じました");
  },

  // ロガーインスタンス（既存）
  logger: async ({}, use) => {
    await use(logger);
  },

  // 新ログシステム
  logManager: async ({}, use, testInfo) => {
    const logManager = await initializeLoggingSystem({
      level:
        process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO,
      enableConsole: true,
      enableFile: process.env.NODE_ENV !== "test",
      enableStructured: process.env.NODE_ENV === "production",
      enableMetrics:
        process.env.NODE_ENV === "production" || !!process.env.ENABLE_METRICS,
      fileConfig: {
        directory: "test-results/logs",
        maxFileSize: 50,
        maxFiles: 30,
        compress: true,
      },
    });

    // テストスイート開始ログ
    logManager.info("🚀 テストスイート開始", LogCategory.TEST_EXECUTION, {
      testInfo: {
        title: testInfo.title,
        file: testInfo.file,
        sessionId: logManager.getSessionId(),
      },
      customData: {
        projectName: testInfo.project.name,
        timeout: testInfo.timeout,
      },
    });

    await use(logManager);

    // テストスイート終了ログ
    logManager.info("🏁 テストスイート終了", LogCategory.TEST_EXECUTION, {
      testInfo: {
        title: testInfo.title,
        sessionId: logManager.getSessionId(),
      },
    });

    await logManager.flush();
  },

  // 設定インスタンス
  config: async ({}, use) => {
    await use(config);
  },

  // ベースページインスタンス
  basePage: async ({ pageWithLogging, logManager }, use) => {
    const basePage = new (class extends BasePage {
      constructor(page: Page, logManager: LogManager) {
        super(page, logManager);
      }
    })(pageWithLogging, logManager);

    await use(basePage);
  },
});

export { expect } from "@playwright/test";
