import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Playwright.dev サイトの Page Object
 * Visual Regression Testing 用
 *
 * 【なぜこのPage Objectが必要か】
 * 1. VRTの一貫性: スクリーンショット撮影の標準化
 * 2. 待機戦略: ページの完全な読み込み待機
 * 3. エラーハンドリング: VRT失敗時の詳細情報取得
 * 4. 再利用性: 複数のVRTテストでの共通利用
 */
export class PlaywrightDevPage extends BasePage {
  readonly url = "https://playwright.dev";

  // 主要要素のロケーター（rules.mdcのセレクター戦略に準拠）
  readonly heroSection: Locator;
  readonly navigationMenu: Locator;
  readonly getStartedButton: Locator;

  constructor(page: Page) {
    super(page);

    // Role-basedセレクターを優先使用（Playwright標準APIを直接使用）
    this.getStartedButton = this.page.getByRole("link", {
      name: "Get started",
    });
    this.navigationMenu = this.page.getByRole("navigation");

    // セマンティックなタグセレクター使用（CSS クラスより安定）
    this.heroSection = this.page.locator("main").first();
  }

  /**
   * Playwright.devページに移動
   */
  async navigate(): Promise<void> {
    try {
      await this.page.goto(this.url);
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForLoadState("networkidle");
      await this.waitForContentLoad();
    } catch (error) {
      await this.handleError(`Playwright.devページへの移動に失敗: ${error}`);
      throw error;
    }
  }

  /**
   * ページコンテンツの完全な読み込みを待機
   * VRTの安定性向上のため
   */
  async waitForContentLoad(): Promise<void> {
    try {
      // 主要コンテンツの読み込み待機（Playwright標準APIを直接使用）
      await expect(this.heroSection).toBeVisible({ timeout: 15000 });

      // 画像の読み込み完了を待機
      await this.page.waitForFunction(
        () => {
          const images = Array.from(document.querySelectorAll("img"));
          return images.every((img) => img.complete);
        },
        { timeout: 10000 }
      );

      // フォントの読み込み完了を待機
      await this.page.waitForFunction(
        () => {
          return document.fonts.ready;
        },
        { timeout: 5000 }
      );
    } catch (error) {
      // 読み込み待機でエラーが発生しても、テストを継続
      console.warn(`コンテンツ読み込み待機でエラー: ${error}`);
    }
  }

  /**
   * Visual Regression Testing用のスクリーンショット撮影
   * @param options - スクリーンショットオプション
   */
  async takeVRTScreenshot(options?: {
    fullPage?: boolean;
    clip?: { x: number; y: number; width: number; height: number };
  }): Promise<void> {
    try {
      await this.waitForContentLoad();

      // 少し待機してアニメーションを完了
      await this.page.waitForTimeout(1000);

      await expect(this.page).toHaveScreenshot({
        fullPage: options?.fullPage ?? true,
        clip: options?.clip,
      });
    } catch (error) {
      await this.handleError(`VRTスクリーンショット撮影に失敗: ${error}`);
      throw error;
    }
  }

  /**
   * ページタイトルの検証
   */
  async verifyPageTitle(): Promise<void> {
    try {
      const title = await this.page.title();
      expect(title).toContain("Playwright");
    } catch (error) {
      await this.handleError(`ページタイトルの検証に失敗: ${error}`);
      throw error;
    }
  }

  /**
   * 主要要素の存在確認
   */
  async verifyMainElements(): Promise<void> {
    try {
      await expect(this.heroSection).toBeVisible();
      await expect(this.navigationMenu).toBeVisible();

      // Get Startedボタンの存在確認（存在しない場合もあるため、エラーにしない）
      try {
        await expect(this.getStartedButton).toBeVisible({ timeout: 3000 });
      } catch {
        console.log(
          "Get Startedボタンが見つかりませんでした（ページ構成による）"
        );
      }
    } catch (error) {
      await this.handleError(`主要要素の検証に失敗: ${error}`);
      throw error;
    }
  }
}
