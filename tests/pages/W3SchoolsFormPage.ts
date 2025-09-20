import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * W3Schools フォームページの Page Object
 *
 * 【なぜこのPage Objectが必要か】
 * 1. テストとページ構造の分離: HTMLの変更がテストに直接影響しない
 * 2. 再利用性: 複数のテストで同じフォーム操作を共有
 * 3. 保守性: フォーム要素の変更を一箇所で管理
 * 4. 可読性: テストコードがより直感的になる
 */
export class W3SchoolsFormPage extends BasePage {
  readonly url =
    "https://www.w3schools.com/html/tryit.asp?filename=tryhtml_form_submit";

  // iframe内の要素にアクセスするためのフレームロケーター
  private readonly frame: Locator;

  // フォーム要素のロケーター（rules.mdcのセレクター戦略に準拠）
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    // iframe選択 - name属性またはtitle属性を優先使用
    this.frame = this.page.frameLocator('iframe[name="iframeResult"]');

    // セレクター戦略: 外部サイトでの最適化アプローチ

    // 【セレクター優先順位に従った実装】
    // 1. Role-basedセレクター（最優先）- 可能な限り使用
    // 2. Name属性セレクター（第2優先）- セマンティックな属性を活用
    // 3. Type属性セレクター（妥協案）- HTML標準属性を使用

    // 入力フィールド - name属性を活用（セマンティックで安定）
    this.firstNameInput = this.frame.locator('input[name="fname"]');
    this.lastNameInput = this.frame.locator('input[name="lname"]');

    // 送信ボタン - type属性による選択（HTML標準に準拠）
    this.submitButton = this.frame.locator('input[type="submit"]');
  }

  /**
   * フォームページに移動
   */
  async navigate(): Promise<void> {
    try {
      await this.navigateTo(this.url);
      await this.waitForPageReady();
    } catch (error) {
      await this.handleError(`フォームページへの移動に失敗: ${error}`);
      throw error;
    }
  }

  /**
   * 名前情報を入力
   * @param firstName - 名前
   * @param lastName - 苗字
   */
  async fillName(firstName: string, lastName: string): Promise<void> {
    try {
      await this.waitForVisible(this.firstNameInput);

      await this.firstNameInput.fill(firstName);
      await this.lastNameInput.fill(lastName);

      // 入力値の検証
      await expect(this.firstNameInput).toHaveValue(firstName);
      await expect(this.lastNameInput).toHaveValue(lastName);
    } catch (error) {
      await this.handleError(`名前入力に失敗: ${error}`);
      throw error;
    }
  }

  /**
   * フォームを送信
   */
  async submitForm(): Promise<void> {
    try {
      await this.submitButton.click();

      // フォーム送信後の待機
      await this.page.waitForLoadState("networkidle");
    } catch (error) {
      await this.handleError(`フォーム送信に失敗: ${error}`);
      throw error;
    }
  }

  /**
   * 送信結果をURLパラメータで検証
   * @param firstName - 期待される名前
   * @param lastName - 期待される苗字
   */
  async verifySubmissionResult(
    firstName: string,
    lastName: string
  ): Promise<void> {
    try {
      const expectedPattern = new RegExp(
        `.*fname=${firstName}.*lname=${lastName}`
      );
      await expect(this.page).toHaveURL(expectedPattern);
    } catch (error) {
      await this.handleError(`送信結果の検証に失敗: ${error}`);
      throw error;
    }
  }
}
