import { expect, type Locator, type Page } from "@playwright/test";

/**
 * 全てのPage Objectクラスの基底クラス
 * 共通の機能と設定を提供します
 *
 * 【なぜ基底クラスが必要か】
 * 1. DRY原則: 共通機能の重複実装を避ける
 * 2. 一貫性: 全ページで統一されたAPIを提供
 * 3. 保守性: 共通機能の変更を一箇所で対応
 * 4. 拡張性: 新しい共通機能を容易に追加可能
 *
 * 【なぜabstractクラスにするか】
 * 1. 強制: 基底クラス単体でのインスタンス化を防ぐ
 * 2. 設計: 継承を前提とした設計であることを明示
 * 3. 型安全性: TypeScriptの型システムを活用
 *
 * rules.mdcに準拠:
 * - セレクター優先度の実装
 * - エラーハンドリングの統一
 * - 待機戦略の統一
 */
export abstract class BasePage {
  protected readonly page: Page;
  protected readonly baseUrl: string;

  constructor(page: Page) {
    this.page = page;
    this.baseUrl = process.env.BASE_URL || "";
  }

  /**
   * ページへの基本ナビゲーション
   *
   * @param path - 相対パスまたは絶対URL
   * @param options - ナビゲーションオプション
   *
   * 【なぜ基底クラスでnavigateToを提供するか】
   * 1. 統一性: 全ページで同じナビゲーション方法を使用
   * 2. 設定管理: baseURLの一元管理が可能
   * 3. エラーハンドリング: ナビゲーション失敗の統一処理
   * 4. 待機戦略: 適切な読み込み完了待機を標準化
   */
  async navigateTo(
    path: string,
    options?: { waitUntil?: "load" | "domcontentloaded" | "networkidle" }
  ) {
    const url = path.startsWith("http") ? path : `${this.baseUrl}${path}`;
    await this.page.goto(url, {
      waitUntil: options?.waitUntil || "domcontentloaded",
    });
  }

  /**
   * 要素が表示されるまで待機（デフォルト10秒）
   * @param locator - 待機する要素
   * @param timeout - タイムアウト時間（ミリ秒）
   */
  async waitForVisible(
    locator: Locator,
    timeout: number = 10000
  ): Promise<void> {
    await expect(locator).toBeVisible({ timeout });
  }

  /**
   * 要素が非表示になるまで待機
   * @param locator - 待機する要素
   * @param timeout - タイムアウト時間（ミリ秒）
   */
  async waitForHidden(
    locator: Locator,
    timeout: number = 10000
  ): Promise<void> {
    await expect(locator).toBeHidden({ timeout });
  }

  /**
   * ローディング要素の完了を待機
   * @param loadingSelector - ローディング要素のセレクター
   */
  async waitForLoading(
    loadingSelector: string = ".loading, .spinner"
  ): Promise<void> {
    try {
      const loadingElement = this.page.locator(loadingSelector);
      await loadingElement.waitFor({ state: "hidden", timeout: 30000 });
    } catch {
      // ローディング要素が存在しない場合は無視
      console.log("ローディング要素が見つからないか、既に非表示です");
    }
  }

  /**
   * テキストによる要素の検索（rules.mdcセレクター戦略に準拠）
   *
   * @param text - 検索するテキスト
   * @param exact - 完全一致するかどうか
   *
   * 【なぜgetByTextSafeメソッドを作成するか】
   * 1. 安全性: 統一されたエラーハンドリング
   * 2. 一貫性: 全ページで同じAPIを使用
   * 3. 拡張性: 将来的な機能追加が容易
   * 4. セレクター戦略: rules.mdcの第3優先度に準拠
   */
  getByTextSafe(text: string, exact: boolean = false): Locator {
    return this.page.getByText(text, { exact });
  }

  /**
   * ロールベースでの要素検索（最優先セレクター戦略）
   * @param role - ARIAロール
   * @param options - 検索オプション
   */
  getByRoleSafe(
    role:
      | "button"
      | "link"
      | "textbox"
      | "checkbox"
      | "radio"
      | "combobox"
      | "listitem"
      | "heading",
    options?: { name?: string; exact?: boolean }
  ): Locator {
    return this.page.getByRole(role, options);
  }

  /**
   * Test IDによる要素検索（data-testid推奨）
   * @param testId - test-id値
   */
  getByTestIdSafe(testId: string): Locator {
    return this.page.getByTestId(testId);
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

  /**
   * フォーム入力の汎用メソッド
   * @param selector - セレクター文字列またはLocator
   * @param value - 入力値
   * @param options - 入力オプション
   */
  async fillSafe(
    selector: string | Locator,
    value: string,
    options?: { clear?: boolean }
  ): Promise<void> {
    const locator =
      typeof selector === "string" ? this.page.locator(selector) : selector;

    if (options?.clear) {
      await locator.clear();
    }

    await locator.fill(value);
    await this.waitForVisible(locator);
  }

  /**
   * クリック操作の汎用メソッド
   * @param selector - セレクター文字列またはLocator
   * @param options - クリックオプション
   */
  async clickSafe(
    selector: string | Locator,
    options?: { force?: boolean; timeout?: number }
  ): Promise<void> {
    const locator =
      typeof selector === "string" ? this.page.locator(selector) : selector;

    await this.waitForVisible(locator, options?.timeout);
    await locator.click({ force: options?.force });
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
   * ページの準備状態を確認
   */
  async waitForPageReady(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * ページタイトルの取得と検証
   * @param expectedTitle - 期待されるタイトル（部分一致）
   */
  async verifyTitle(expectedTitle?: string): Promise<string> {
    const title = await this.page.title();

    if (expectedTitle) {
      expect(title).toContain(expectedTitle);
    }

    return title;
  }

  /**
   * 現在のURLを取得
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * ページのリロード
   */
  async reload(): Promise<void> {
    await this.page.reload({ waitUntil: "domcontentloaded" });
  }
}
