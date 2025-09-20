import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Playwright Locator テスト用の Page Object
 * 様々なセレクター戦略のテストを担当
 *
 * 【なぜこのPage Objectが必要か】
 * 1. セレクター戦略の統一: rules.mdcに準拠した実装例の提供
 * 2. テストの再利用性: 共通のHTML設定と検証ロジックを提供
 * 3. 保守性: セレクター戦略の変更を一箇所で管理
 * 4. 教育目的: 推奨されるセレクター戦略の実装例
 */
export class LocatorTestPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * ボタン要素のHTMLコンテンツを設定
   */
  async setButtonContent(): Promise<void> {
    try {
      await this.page.setContent(`
        <button>Click me</button>
      `);
    } catch (error) {
      await this.handleError(`ボタンコンテンツの設定に失敗: ${error}`);
      throw error;
    }
  }

  /**
   * フォーム要素のHTMLコンテンツを設定
   */
  async setFormContent(): Promise<void> {
    try {
      await this.page.setContent(`
        <label for="username">User Name</label>
        <input id="username" />
      `);
    } catch (error) {
      await this.handleError(`フォームコンテンツの設定に失敗: ${error}`);
      throw error;
    }
  }

  /**
   * Role-basedセレクターでボタンを取得・検証
   */
  async testRoleBasedSelector(): Promise<void> {
    try {
      await this.setButtonContent();

      // rules.mdcの第1優先度: Role-basedセレクター
      const button = this.page.getByRole("button");
      await expect(button).toBeVisible();
    } catch (error) {
      await this.handleError(`Role-basedセレクターテストに失敗: ${error}`);
      throw error;
    }
  }

  /**
   * Text-basedセレクターで要素を取得・検証
   */
  async testTextBasedSelector(): Promise<void> {
    try {
      await this.setButtonContent();

      // rules.mdcの第3優先度: Text-basedセレクター
      const button = this.page.getByText("Click me");
      await expect(button).toBeVisible();
    } catch (error) {
      await this.handleError(`Text-basedセレクターテストに失敗: ${error}`);
      throw error;
    }
  }

  /**
   * Label-basedセレクターで入力フィールドを取得・検証
   */
  async testLabelBasedSelector(): Promise<void> {
    try {
      await this.setFormContent();

      // rules.mdcの第2優先度: Label-basedセレクター
      const input = this.page.getByLabel("User Name");
      await expect(input).toBeVisible();
    } catch (error) {
      await this.handleError(`Label-basedセレクターテストに失敗: ${error}`);
      throw error;
    }
  }

  /**
   * セレクター戦略のデモンストレーション
   * 実際のログインフォームを想定した安全な実装例
   */
  async demonstrateSafeLoginForm(): Promise<void> {
    try {
      await this.page.setContent(`
        <form>
          <label for="username">User Name</label>
          <input id="username" type="text" />
          
          <label for="password">Password</label>
          <input id="password" type="password" />
          
          <button type="submit">Sign in</button>
        </form>
        <div id="welcome" style="display: none;">Welcome, User!</div>
      `);

      // セキュリティを考慮した実装例
      await this.page.getByLabel("User Name").fill("TestUser");

      // 【セキュリティ重要】環境変数を使用（ハードコーディング禁止）
      const password = process.env.TEST_PASSWORD || "test-dummy-password";
      await this.page.getByLabel("Password").fill(password);

      await this.page.getByRole("button", { name: "Sign in" }).click();

      // ログイン成功の確認（実際のアプリケーションでは適切な成功判定を実装）
      console.log("ログインフォームのデモンストレーション完了");
    } catch (error) {
      await this.handleError(`ログインフォームデモに失敗: ${error}`);
      throw error;
    }
  }
}
