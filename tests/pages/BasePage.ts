import { expect, type Page } from "@playwright/test";
import { LogManager, LogCategory } from "../utils/logging";

/**
 * 全てのPage Objectクラスの基底クラス
 *
 * 【設計思想】
 * 1. 最小限の共通機能のみ提供
 * 2. Playwright標準APIを直接使用
 * 3. 各ページ固有の機能は継承クラスで実装
 * 4. 過度な抽象化を避ける
 *
 * 【提供する機能】
 * - エラーハンドリング
 * - デバッグ用スクリーンショット
 * - 共通ログ機能（オプション）
 * - パフォーマンス測定基盤
 */
export abstract class BasePage {
  protected readonly page: Page;
  protected readonly logManager?: LogManager;
  private operationStartTime: number = 0;

  constructor(page: Page, logManager?: LogManager) {
    this.page = page;
    this.logManager = logManager;
  }

  /**
   * エラー状態の確認とスクリーンショット撮影
   * @param errorMessage - エラーメッセージ
   */
  async handleError(errorMessage: string): Promise<void> {
    // 新LogManagerがある場合は使用、ない場合は従来通り
    if (this.logManager) {
      const currentUrl = this.page.url();
      const title = await this.page.title().catch(() => "タイトル取得失敗");

      this.logManager.error(errorMessage, LogCategory.ERROR_HANDLING, {
        page: {
          url: currentUrl,
          title: title,
        },
      });
    } else {
      console.error(`エラーが発生しました: ${errorMessage}`);
    }

    await this.takeScreenshot(`error-${errorMessage.replace(/\s+/g, "_")}`);

    // エラーの詳細をコンソールに出力（従来通り）
    const currentUrl = this.page.url();
    const title = await this.page.title();
    console.error(`現在のURL: ${currentUrl}`);
    console.error(`ページタイトル: ${title}`);
  }

  /**
   * スクリーンショット撮影（デバッグ・証跡用）
   * @param name - ファイル名
   */
  async takeScreenshot(name: string): Promise<void> {
    const path = `test-results/screenshots/${name}-${Date.now()}.png`;

    await this.page.screenshot({
      path: path,
      fullPage: true,
    });

    // LogManagerがある場合はスクリーンショット撮影をログに記録
    if (this.logManager) {
      this.logManager.info(
        `スクリーンショット撮影: ${name}`,
        LogCategory.SYSTEM,
        {
          page: {
            url: this.page.url(),
          },
          customData: {
            screenshotPath: path,
            screenshotName: name,
          },
        }
      );
    }
  }

  /**
   * 共通ログメソッド - 情報レベル
   */
  protected logInfo(message: string, customData?: any): void {
    if (this.logManager) {
      this.logManager.info(message, LogCategory.PAGE_INTERACTION, {
        page: {
          url: this.page.url(),
        },
        customData,
      });
    }
  }

  /**
   * 共通ログメソッド - 警告レベル
   */
  protected logWarn(message: string, customData?: any): void {
    if (this.logManager) {
      this.logManager.warn(message, LogCategory.PAGE_INTERACTION, {
        page: {
          url: this.page.url(),
        },
        customData,
      });
    }
  }

  /**
   * 共通ログメソッド - エラーレベル
   */
  protected logError(message: string, error?: Error, customData?: any): void {
    if (this.logManager) {
      this.logManager.error(
        message,
        LogCategory.ERROR_HANDLING,
        {
          page: {
            url: this.page.url(),
          },
          customData,
        },
        error
      );
    }
  }

  /**
   * パフォーマンス測定開始
   */
  protected startPerformanceMeasurement(): void {
    this.operationStartTime = Date.now();
  }

  /**
   * パフォーマンス測定終了とログ記録
   */
  protected logPerformance(operationName: string, customData?: any): void {
    if (this.logManager && this.operationStartTime > 0) {
      const duration = Date.now() - this.operationStartTime;
      this.logManager.performance(
        operationName,
        {
          duration,
          ...customData,
        },
        {
          page: {
            url: this.page.url(),
          },
        }
      );
      this.operationStartTime = 0;
    }
  }
}
