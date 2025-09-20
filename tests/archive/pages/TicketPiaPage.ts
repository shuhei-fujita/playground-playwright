import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { logger } from "../utils/TestLogger";
import { config } from "../utils/TestConfig";

/**
 * チケットぴあログインページのPage Object
 * BasePage を継承して共通機能を利用
 * rules.mdcに準拠: Role-based、Label-basedセレクターを優先使用
 */
export class TicketPiaPage extends BasePage {
  // セレクターの定義（rules.mdcセレクター優先度に準拠）
  readonly loginLink: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly myPageText: Locator;
  readonly errorMessage: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    super(page);

    // 1. Role-based Selectors（最優先）
    this.loginLink = this.getByRoleSafe("link", {
      name: "ログイン",
      exact: true,
    });
    this.loginButton = this.getByRoleSafe("button", {
      name: "ログイン",
      exact: true,
    });

    // 2. Label-based Selectors（第2優先）
    this.emailInput = page.getByLabel("ぴあ会員ID（メールアドレス）");
    this.passwordInput = page.getByLabel("パスワード");

    // 3. Text-based Selectors（第3優先）
    this.myPageText = this.getByTextSafe("マイページ");
    this.errorMessage = this.getByTextSafe("エラーが発生しました", false);

    // 4. CSS Selectors（最終手段 - ローディング表示）
    this.loadingIndicator = page.locator(".loading, .spinner, [data-loading]");
  }

  /**
   * チケットぴあトップページへ移動
   */
  async navigateToTop(): Promise<void> {
    logger.startStep("チケットぴあトップページへ移動");

    try {
      await this.navigateTo(config.ticketPiaUrl);
      await this.waitForPageReady();
      await this.verifyTitle("チケットぴあ");

      logger.endStep("チケットぴあトップページへ移動");
    } catch (error) {
      await this.handleError("トップページへの移動に失敗");
      throw error;
    }
  }

  /**
   * ログインページへ移動
   */
  async goToLoginPage(): Promise<void> {
    logger.startStep("ログインページへ移動");

    try {
      await this.waitForVisible(this.loginLink);
      await this.clickSafe(this.loginLink);
      await this.waitForPageReady();

      // ログインフォームが表示されるまで待機
      await this.waitForVisible(this.emailInput);
      await this.waitForVisible(this.passwordInput);

      logger.endStep("ログインページへ移動");
    } catch (error) {
      await this.handleError("ログインページへの移動に失敗");
      throw error;
    }
  }

  /**
   * ログイン情報を入力してログイン実行
   * @param email - メールアドレス
   * @param password - パスワード
   */
  async login(email: string, password: string): Promise<void> {
    logger.startStep(
      "ログイン情報入力・実行",
      `Email: ${email.replace(/@.+/, "@***")}`
    );

    try {
      // メールアドレス入力
      await this.fillSafe(this.emailInput, email, { clear: true });
      logger.info("メールアドレスを入力しました");

      // パスワード入力
      await this.fillSafe(this.passwordInput, password, { clear: true });
      logger.info("パスワードを入力しました");

      // ローディング開始前にボタンをクリック
      await this.clickSafe(this.loginButton);
      logger.info("ログインボタンをクリックしました");

      // ローディングが完了するまで待機
      await this.waitForLoading();

      logger.endStep("ログイン情報入力・実行");
    } catch (error) {
      await this.handleError("ログイン処理に失敗");
      throw error;
    }
  }

  /**
   * ログイン成功の確認
   */
  async verifyLoginSuccess(): Promise<void> {
    logger.startStep("ログイン成功確認");

    try {
      // マイページへのリダイレクトを待機
      await this.waitForVisible(this.myPageText, 15000);

      // URLの確認（追加の検証）
      const currentUrl = this.getCurrentUrl();
      logger.info(`現在のURL: ${currentUrl}`);

      // ページタイトルの確認
      await this.verifyTitle("マイページ");

      logger.endStep("ログイン成功確認");
      logger.info("✅ ログインに成功しました");
    } catch (error) {
      // エラーメッセージが表示されているかチェック
      const isErrorVisible = await this.errorMessage
        .isVisible()
        .catch(() => false);
      if (isErrorVisible) {
        const errorText = await this.errorMessage.textContent();
        logger.error(`ログインエラー: ${errorText}`);
      }

      await this.handleError("ログイン成功確認に失敗");
      throw error;
    }
  }

  /**
   * ログインフローの統合実行
   * @param email - メールアドレス
   * @param password - パスワード
   */
  async loginFlow(email: string, password: string): Promise<void> {
    logger.startStep(
      "チケットぴあログインフロー全体",
      `User: ${email.replace(/@.+/, "@***")}`
    );

    try {
      await this.navigateToTop();
      await this.goToLoginPage();
      await this.login(email, password);
      await this.verifyLoginSuccess();

      logger.endStep("チケットぴあログインフロー全体");
      logger.info("🎉 チケットぴあログインフローが正常に完了しました");
    } catch (error) {
      logger.failStep("チケットぴあログインフロー全体", error);
      throw error;
    }
  }

  /**
   * ログイン状態の確認
   */
  async isLoggedIn(): Promise<boolean> {
    try {
      return await this.myPageText.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * ログアウト処理（オプション機能）
   */
  async logout(): Promise<void> {
    logger.startStep("ログアウト処理");

    try {
      // ログアウトリンク・ボタンを探してクリック
      const logoutLink = this.getByRoleSafe("link", { name: "ログアウト" });
      await this.waitForVisible(logoutLink);
      await this.clickSafe(logoutLink);

      // ログアウト完了を確認
      await this.waitForVisible(this.loginLink);

      logger.endStep("ログアウト処理");
      logger.info("ログアウトが完了しました");
    } catch (error) {
      logger.warn("ログアウト処理中にエラーが発生しました", error);
      throw error;
    }
  }
}
