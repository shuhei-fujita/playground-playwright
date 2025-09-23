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

  constructor(page: Page, logManager?: any) {
    super(page, logManager);

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
   * 公式パターン準拠: 基本成功確認を含む
   */
  async navigate(): Promise<void> {
    this.startPerformanceMeasurement();
    this.logInfo("Playwright.devページへの移動開始", { url: this.url });

    try {
      await this.page.goto(this.url);
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForLoadState("networkidle");

      // 公式パターン: 基本的な読み込み成功確認
      await expect(this.heroSection).toBeVisible({ timeout: 15000 });

      await this.waitForContentLoad();

      this.logPerformance("Playwright.devページ移動完了", {
        url: this.url,
        heroSectionVisible: true,
      });
    } catch (error) {
      this.logError("Playwright.devページへの移動に失敗", error as Error, {
        url: this.url,
      });
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
    this.startPerformanceMeasurement();
    this.logInfo("VRTスクリーンショット撮影開始", {
      fullPage: options?.fullPage ?? true,
      hasClip: !!options?.clip,
    });

    try {
      await this.waitForContentLoad();

      // 少し待機してアニメーションを完了
      await this.page.waitForTimeout(1000);

      await expect(this.page).toHaveScreenshot({
        fullPage: options?.fullPage ?? true,
        clip: options?.clip,
      });

      this.logPerformance("VRTスクリーンショット撮影完了", {
        fullPage: options?.fullPage ?? true,
        screenshotGenerated: true,
      });
    } catch (error) {
      this.logError("VRTスクリーンショット撮影に失敗", error as Error, options);
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
   * Get Startedボタンをクリック
   * 公式パターン準拠: アクション + 基本成功確認
   */
  async clickGetStarted(): Promise<void> {
    this.startPerformanceMeasurement();
    this.logInfo("Get Startedボタンクリック開始");

    try {
      await this.getStartedButton.click();

      // 公式パターン: アクション成功の基本確認
      await expect(this.page).toHaveURL(/docs/);

      this.logPerformance("Get Startedクリック完了", {
        navigationSuccessful: true,
        newUrl: this.page.url(),
      });
    } catch (error) {
      this.logError("Get Startedクリックに失敗", error as Error);
      await this.handleError(`Get Startedクリックに失敗: ${error}`);
      throw error;
    }
  }

  /**
   * 主要要素の存在確認（詳細検証メソッド）
   * テストファイルから必要に応じて呼び出し
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
