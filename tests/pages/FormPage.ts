import {
  expect,
  type FrameLocator,
  type Locator,
  type Page,
} from "@playwright/test";
import { BasePage } from "./BasePage";
import { logger } from "../utils/TestLogger";
import { config } from "../utils/TestConfig";

/**
 * W3Schools フォームページのPage Object
 * BasePage を継承し、iframe操作とフォーム処理を実装
 * rules.mdcに準拠: IDセレクターは最終手段として使用（外部サイトのため）
 */
export class FormPage extends BasePage {
  readonly frame: FrameLocator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly submitButton: Locator;
  readonly resultText: Locator;
  readonly serverMessage: Locator;

  constructor(page: Page) {
    super(page);

    // iframe内のフォーム要素にアクセス
    this.frame = page.frameLocator("#iframeResult");

    /*
     * セレクター戦略に関する重要な注意:
     * 外部サイト（W3Schools）では理想的なセレクター属性が提供されていないため、
     * やむを得ずIDセレクターを使用。
     * 本来であれば以下の優先順位で選択すべき:
     * 1. getByLabel() - ラベル要素との関連付け
     * 2. getByRole() - ARIAロールによる識別
     * 3. getByPlaceholder() - プレースホルダーテキスト
     * 4. getByTestId() - data-testid属性
     * 5. CSS ID/Class - 最終手段（現在の実装）
     */

    // IDセレクター使用（外部サイトの制約により不可避）
    this.firstNameInput = this.frame.locator("#fname");
    this.lastNameInput = this.frame.locator("#lname");

    // 属性セレクター（type属性による識別）
    this.submitButton = this.frame.locator('input[type="submit"]');

    // Text-basedセレクター（推奨手法を部分的に適用）
    this.resultText = this.frame.getByText(/fname=.*&lname=.*/);
    this.serverMessage = this.frame.getByText(
      "The server has processed your input"
    );

    logger.info("FormPageを初期化しました（iframe対応）");
  }

  /**
   * フォームページへ移動
   */
  async navigateToForm(): Promise<void> {
    logger.startStep("W3Schoolsフォームページへ移動");

    try {
      await this.navigateTo(config.w3schoolsFormUrl);

      // iframe が読み込まれるまで待機
      await this.page.waitForSelector("#iframeResult");
      logger.info("iframeが読み込まれました");

      // フォーム要素が利用可能になるまで待機
      await this.firstNameInput.waitFor({ state: "visible", timeout: 10000 });
      await this.lastNameInput.waitFor({ state: "visible", timeout: 10000 });

      logger.endStep("W3Schoolsフォームページへ移動");
    } catch (error) {
      await this.handleError("フォームページへの移動に失敗");
      throw error;
    }
  }

  /**
   * 名前（First Name）を入力
   * @param firstName - 入力する名前
   */
  async fillFirstName(firstName: string): Promise<void> {
    logger.startStep("名前（First Name）入力", `値: ${firstName}`);

    try {
      await this.firstNameInput.waitFor({ state: "visible" });
      await this.firstNameInput.clear();
      await this.firstNameInput.fill(firstName);

      // 入力値の確認
      const actualValue = await this.firstNameInput.inputValue();
      if (actualValue !== firstName) {
        throw new Error(
          `入力値が期待値と異なります: 期待値="${firstName}", 実際="${actualValue}"`
        );
      }

      logger.info(`名前を入力しました: ${firstName}`);
      logger.endStep("名前（First Name）入力");
    } catch (error) {
      await this.handleError("名前入力に失敗");
      throw error;
    }
  }

  /**
   * 苗字（Last Name）を入力
   * @param lastName - 入力する苗字
   */
  async fillLastName(lastName: string): Promise<void> {
    logger.startStep("苗字（Last Name）入力", `値: ${lastName}`);

    try {
      await this.lastNameInput.waitFor({ state: "visible" });
      await this.lastNameInput.clear();
      await this.lastNameInput.fill(lastName);

      // 入力値の確認
      const actualValue = await this.lastNameInput.inputValue();
      if (actualValue !== lastName) {
        throw new Error(
          `入力値が期待値と異なります: 期待値="${lastName}", 実際="${actualValue}"`
        );
      }

      logger.info(`苗字を入力しました: ${lastName}`);
      logger.endStep("苗字（Last Name）入力");
    } catch (error) {
      await this.handleError("苗字入力に失敗");
      throw error;
    }
  }

  /**
   * フォームを送信
   */
  async submitForm(): Promise<void> {
    logger.startStep("フォーム送信");

    try {
      await this.submitButton.waitFor({ state: "visible" });
      await this.submitButton.click();

      // 送信結果が表示されるまで待機
      await this.serverMessage.waitFor({ state: "visible", timeout: 10000 });

      logger.endStep("フォーム送信");
      logger.info("フォームが正常に送信されました");
    } catch (error) {
      await this.handleError("フォーム送信に失敗");
      throw error;
    }
  }

  /**
   * 入力値が正しく設定されているかを検証
   * @param firstName - 期待される名前
   * @param lastName - 期待される苗字
   */
  async verifyInputValues(firstName: string, lastName: string): Promise<void> {
    logger.startStep("入力値検証", `期待値: ${firstName} ${lastName}`);

    try {
      await expect(this.firstNameInput).toHaveValue(firstName, {
        timeout: 5000,
      });
      await expect(this.lastNameInput).toHaveValue(lastName, { timeout: 5000 });

      logger.info("✅ 入力値が正しく設定されています");
      logger.endStep("入力値検証");
    } catch (error) {
      await this.handleError("入力値検証に失敗");
      throw error;
    }
  }

  /**
   * フォーム送信結果を検証
   * @param firstName - 期待される名前
   * @param lastName - 期待される苗字
   */
  async verifyFormSubmission(
    firstName: string,
    lastName: string
  ): Promise<void> {
    logger.startStep(
      "フォーム送信結果検証",
      `期待値: ${firstName} ${lastName}`
    );

    try {
      // 送信されたデータの表示を確認
      const expectedResultText = `fname=${firstName}&lname=${lastName}`;
      await expect(this.frame.getByText(expectedResultText)).toBeVisible({
        timeout: 10000,
      });

      // サーバー処理完了メッセージを確認
      await expect(this.serverMessage).toBeVisible({ timeout: 5000 });

      logger.info("✅ フォーム送信結果が正しく表示されています");
      logger.endStep("フォーム送信結果検証");
    } catch (error) {
      await this.handleError("フォーム送信結果検証に失敗");
      throw error;
    }
  }

  /**
   * フォーム操作の統合フロー
   * @param firstName - 入力する名前
   * @param lastName - 入力する苗字
   */
  async fillAndSubmitForm(firstName: string, lastName: string): Promise<void> {
    logger.startStep(
      "フォーム操作統合フロー",
      `名前: ${firstName} ${lastName}`
    );

    try {
      await this.navigateToForm();
      await this.fillFirstName(firstName);
      await this.fillLastName(lastName);
      await this.verifyInputValues(firstName, lastName);
      await this.submitForm();
      await this.verifyFormSubmission(firstName, lastName);

      logger.endStep("フォーム操作統合フロー");
      logger.info("🎉 フォーム操作フローが正常に完了しました");
    } catch (error) {
      logger.failStep("フォーム操作統合フロー", error);
      throw error;
    }
  }

  /**
   * フォームをリセット（ページリロード）
   */
  async resetForm(): Promise<void> {
    logger.startStep("フォームリセット");

    try {
      await this.reload();

      // フォーム要素が再度利用可能になるまで待機
      await this.firstNameInput.waitFor({ state: "visible" });
      await this.lastNameInput.waitFor({ state: "visible" });

      logger.endStep("フォームリセット");
      logger.info("フォームがリセットされました");
    } catch (error) {
      await this.handleError("フォームリセットに失敗");
      throw error;
    }
  }

  /**
   * 入力値をクリア
   */
  async clearAllInputs(): Promise<void> {
    logger.startStep("全入力値クリア");

    try {
      await this.firstNameInput.clear();
      await this.lastNameInput.clear();

      // クリア確認
      await expect(this.firstNameInput).toHaveValue("");
      await expect(this.lastNameInput).toHaveValue("");

      logger.endStep("全入力値クリア");
      logger.info("全ての入力値がクリアされました");
    } catch (error) {
      await this.handleError("入力値クリアに失敗");
      throw error;
    }
  }
}
