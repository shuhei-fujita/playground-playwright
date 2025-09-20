import { expect, type Page } from "@playwright/test";

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
 */
export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * エラー状態の確認とスクリーンショット撮影
   * @param errorMessage - エラーメッセージ
   */
  async handleError(errorMessage: string): Promise<void> {
    console.error(`エラーが発生しました: ${errorMessage}`);
    await this.takeScreenshot(`error-${errorMessage.replace(/\s+/g, "_")}`);

    // エラーの詳細をコンソールに出力
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
    await this.page.screenshot({
      path: `test-results/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }
}
