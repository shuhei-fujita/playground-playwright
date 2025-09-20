import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { logger } from "../utils/TestLogger";
import { config } from "../utils/TestConfig";

/**
 * リベシティページのPage Object
 * BasePage を継承して共通機能を利用
 *
 * 【なぜこのクラスが必要か】
 * 1. セキュリティ: ハードコーディングされた認証情報を環境変数管理に移行
 * 2. 保守性: リベシティ特有の操作を一箇所に集約
 * 3. 再利用性: 複数のテストで同じログイン・操作フローを使用
 * 4. テスタビリティ: 操作の成功・失敗を適切に検証
 */
export class LibecityPage extends BasePage {
  // セレクターの定義（rules.mdcセレクター優先度に準拠）
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly reactionButtons: Locator;
  readonly sameReactionButtons: Locator;

  constructor(page: Page) {
    super(page);

    // 【なぜPlaceholder-basedセレクターを使用するか】
    // リベシティサイトではlabelが提供されていないため、
    // placeholder属性を使用（セレクター戦略の第3優先度）
    this.emailInput = page.getByPlaceholder("メールアドレス");
    this.passwordInput = page.getByPlaceholder("パスワード");

    // 【なぜRole-basedセレクターを使用するか】
    // ボタンはARIAロールが明確なので最優先のセレクター戦略を適用
    this.loginButton = this.getByRoleSafe("button", { name: "ログイン" });

    // 【なぜCSSセレクターを使用するか】
    // リアクション機能は独自UIのため、他のセレクター戦略では
    // 選択できず、やむを得ずCSSセレクターを使用（最終手段）
    this.reactionButtons = page.locator(".reaction_data .btn");
    this.sameReactionButtons = page.getByRole("button", {
      name: "同じリアクションをする",
    });

    logger.info("LibecityPageを初期化しました（環境変数準拠）");
  }

  /**
   * リベシティのトップページに移動
   *
   * 【なぜこのメソッドが必要か】
   * 1. URLの一元管理: 設定ファイルでURL管理
   * 2. エラーハンドリング: ページ読み込み失敗の適切な処理
   * 3. ログ記録: デバッグ時の追跡可能性確保
   */
  async navigateToAllTweets(): Promise<void> {
    logger.startStep("リベシティ全投稿ページへ移動");

    try {
      await this.navigateTo(`${config.libecityUrl}/tweet/all`);
      await this.waitForPageReady();

      logger.endStep("リベシティ全投稿ページへ移動");
    } catch (error) {
      await this.handleError("リベシティページへの移動に失敗");
      throw error;
    }
  }

  /**
   * ログインページへリダイレクト
   *
   * 【なぜ別メソッドとして分離するか】
   * 1. 単一責任: 各メソッドは1つの責任のみを持つ
   * 2. テスタビリティ: 各ステップを個別にテスト可能
   * 3. デバッグ: どの段階で失敗したかを特定しやすい
   */
  async navigateToLogin(): Promise<void> {
    logger.startStep("ログインページへ移動");

    try {
      await this.navigateTo(`${config.libecityUrl}/signin?redirect=/tweet/all`);
      await this.waitForPageReady();

      // フォーム要素が表示されるまで待機
      await this.waitForVisible(this.emailInput);
      await this.waitForVisible(this.passwordInput);

      logger.endStep("ログインページへ移動");
    } catch (error) {
      await this.handleError("ログインページへの移動に失敗");
      throw error;
    }
  }

  /**
   * ログイン処理の実行
   *
   * @param email - メールアドレス（環境変数から取得）
   * @param password - パスワード（環境変数から取得）
   *
   * 【なぜパラメータで受け取るか】
   * 1. テスタビリティ: 異なる認証情報でのテストが可能
   * 2. セキュリティ: 認証情報を直接参照せず、呼び出し側で管理
   * 3. 柔軟性: 将来的に複数ユーザー対応が容易
   */
  async login(email: string, password: string): Promise<void> {
    logger.startStep(
      "リベシティログイン実行",
      `Email: ${email.replace(/@.+/, "@***")}`
    );

    try {
      // メールアドレス入力
      await this.fillSafe(this.emailInput, email, { clear: true });
      logger.info("メールアドレスを入力しました");

      // 【なぜパスワード入力時にログを残すか】
      // デバッグ時にどの段階まで進んだかを追跡するため
      // ただし、パスワードの値は絶対にログに残さない
      await this.fillSafe(this.passwordInput, password, { clear: true });
      logger.info("パスワードを入力しました（値は非表示）");

      // ログインボタンクリック
      await this.clickSafe(this.loginButton);
      logger.info("ログインボタンをクリックしました");

      logger.endStep("リベシティログイン実行");
    } catch (error) {
      await this.handleError("ログイン処理に失敗");
      throw error;
    }
  }

  /**
   * ログイン成功の検証
   *
   * 【なぜURL検証を行うか】
   * 1. 確実性: 見た目だけでなく、実際にページ遷移を確認
   * 2. 信頼性: リダイレクトが正常に完了したことを保証
   * 3. デバッグ: 失敗時にどこまで進んだかを明確にする
   */
  async verifyLoginSuccess(): Promise<void> {
    logger.startStep("ログイン成功検証");

    try {
      // ページ読み込み完了を待機
      // 【なぜ3秒待機するか】
      // リベシティはSPAのため、JSによる画面更新に時間が必要
      await this.page.waitForTimeout(3000);

      // URLの確認
      const currentUrl = this.getCurrentUrl();
      logger.info(`現在のURL: ${currentUrl}`);

      // 期待されるURLと一致するかチェック
      expect(currentUrl).toBe(`${config.libecityUrl}/tweet/all`);

      logger.endStep("ログイン成功検証");
      logger.info("✅ リベシティログインに成功しました");
    } catch (error) {
      await this.handleError("ログイン成功検証に失敗");
      throw error;
    }
  }

  /**
   * リアクション操作の実行（複数投稿に対して）
   *
   * @param startIndex - 開始インデックス（デフォルト5）
   * @param count - 実行回数（デフォルト10）
   *
   * 【なぜパラメータ化するか】
   * 1. 柔軟性: テストケースに応じて回数を調整可能
   * 2. 保守性: ハードコーディングを避けて設定可能に
   * 3. テスタビリティ: 異なるパターンでのテストが容易
   */
  async performReactions(
    startIndex: number = 5,
    count: number = 10
  ): Promise<void> {
    logger.startStep(
      "リアクション操作実行",
      `${startIndex}番目から${count}回実行`
    );

    try {
      // Version 1: CSSセレクター使用パターン（sample-リベ.spec.ts由来）
      if (
        await this.reactionButtons
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        await this.performReactionsWithCSSSelector(startIndex, count);
      }
      // Version 2: Role-basedセレクター使用パターン（sample-リベ2.spec.ts由来）
      else {
        await this.performReactionsWithRoleSelector(startIndex, count);
      }

      logger.endStep("リアクション操作実行");
      logger.info(`🎉 ${count}回のリアクション操作が完了しました`);
    } catch (error) {
      logger.failStep("リアクション操作実行", error);
      throw error;
    }
  }

  /**
   * CSSセレクターを使用したリアクション操作
   *
   * 【なぜprivateメソッドとして分離するか】
   * 1. カプセル化: 内部実装の詳細を隠蔽
   * 2. 保守性: 実装方式の変更が外部に影響しない
   * 3. 可読性: 複雑な処理を意味のある名前で抽象化
   */
  private async performReactionsWithCSSSelector(
    startIndex: number,
    count: number
  ): Promise<void> {
    logger.info("CSSセレクター方式でリアクションを実行します");

    const buttonCount = await this.reactionButtons.count();
    logger.info(`見つかったボタンの数: ${buttonCount}`);

    for (let i = startIndex; i < count; i++) {
      const button = this.reactionButtons.nth(i);

      try {
        // 【なぜscrollIntoViewIfNeededを使用するか】
        // 動的コンテンツで画面外の要素をクリックするため
        await button.scrollIntoViewIfNeeded();

        const isVisible = await button.isVisible();
        const isEnabled = await button.isEnabled();

        // 【なぜDOM操作を使用するか】
        // 一部のボタンが隠れている場合の対策として強制表示
        // ただし、これは最終手段であり、通常は推奨されない
        if (!isVisible) {
          const elementHandle = await button.elementHandle();
          if (elementHandle) {
            await this.page.evaluate((element) => {
              (element as HTMLElement).style.display = "block";
              (element as HTMLElement).style.visibility = "visible";
            }, elementHandle);
          }
        }

        if (isVisible && isEnabled) {
          await button.click({ force: true });
          logger.info(`✅ ${i + 1}回目のリアクションを実行しました`);
        } else {
          logger.warn(`⚠️ ${i + 1}回目のリアクションは実行できませんでした`);
          logger.warn(`可視性: ${isVisible}, 有効性: ${isEnabled}`);
        }
      } catch (error) {
        logger.warn(`${i + 1}回目のリアクションでエラー:`, error);
        // エラーが発生しても処理を継続（他のリアクションは実行）
        continue;
      }
    }
  }

  /**
   * Role-basedセレクターを使用したリアクション操作
   *
   * 【なぜRole-basedセレクターを優先するか】
   * 1. アクセシビリティ: 支援技術との互換性が高い
   * 2. 保守性: UI変更に対して耐性がある
   * 3. 意味性: ボタンの役割が明確
   */
  private async performReactionsWithRoleSelector(
    startIndex: number,
    count: number
  ): Promise<void> {
    logger.info("Role-basedセレクター方式でリアクションを実行します");

    for (let i = startIndex; i < count; i++) {
      try {
        const reactionButton = this.sameReactionButtons.nth(i);

        // 【なぜwaitFor状態確認を行うか】
        // 動的コンテンツの読み込み完了を確実に待機するため
        await reactionButton.waitFor({ state: "visible", timeout: 5000 });
        await reactionButton.click();

        logger.info(`✅ ${i + 1}回目のリアクションを実行しました`);
      } catch (error) {
        logger.warn(`${i + 1}回目のリアクションでエラー:`, error);
        // 個々の失敗は全体の処理を止めない
        continue;
      }
    }
  }

  /**
   * 統合ログインフロー（完全自動化）
   *
   * @param email - メールアドレス
   * @param password - パスワード
   *
   * 【なぜ統合フローメソッドが重要か】
   * 1. 簡潔性: テストコードから詳細実装を隠蔽
   * 2. 原子性: ログイン処理全体を1つの操作として扱う
   * 3. エラーハンドリング: 全ステップを通した例外処理
   */
  async loginFlow(email: string, password: string): Promise<void> {
    logger.startStep(
      "リベシティログインフロー全体",
      `User: ${email.replace(/@.+/, "@***")}`
    );

    try {
      await this.navigateToAllTweets();
      await this.navigateToLogin();
      await this.login(email, password);
      await this.verifyLoginSuccess();

      logger.endStep("リベシティログインフロー全体");
      logger.info("🎉 リベシティログインフローが正常に完了しました");
    } catch (error) {
      logger.failStep("リベシティログインフロー全体", error);
      throw error;
    }
  }

  /**
   * ログイン＋リアクション の完全自動フロー
   *
   * @param email - メールアドレス
   * @param password - パスワード
   * @param startIndex - リアクション開始インデックス
   * @param count - リアクション実行回数
   *
   * 【なぜこの統合フローが必要か】
   * 1. 一連の作業: ログイン後すぐにリアクション実行は一般的なユースケース
   * 2. エラー回復: ログイン失敗時にリアクションを実行しない
   * 3. 効率性: テストコードが簡潔になる
   */
  async loginAndReact(
    email: string,
    password: string,
    startIndex: number = 5,
    count: number = 10
  ): Promise<void> {
    logger.startStep("リベシティログイン＋リアクション完全フロー");

    try {
      // ステップ1: ログイン処理
      await this.loginFlow(email, password);

      // ステップ2: リアクション処理
      await this.performReactions(startIndex, count);

      logger.endStep("リベシティログイン＋リアクション完全フロー");
      logger.info("🚀 リベシティの全操作が正常に完了しました");
    } catch (error) {
      logger.failStep("リベシティログイン＋リアクション完全フロー", error);
      throw error;
    }
  }
}
