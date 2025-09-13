import dotenv from "dotenv";
import path from "path";

// 環境変数をロード（common-rules.mdcに準拠）
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * テスト設定管理クラス
 * 環境変数と設定値の一元管理
 * common-rules.mdcに準拠: パスワードなどは.envで管理
 */
export class TestConfig {
  private static instance: TestConfig;

  private constructor() {}

  static getInstance(): TestConfig {
    if (!TestConfig.instance) {
      TestConfig.instance = new TestConfig();
    }
    return TestConfig.instance;
  }

  /**
   * 環境変数の取得（必須）
   * 値が存在しない場合はエラーを投げる
   */
  private getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(
        `環境変数 ${key} が設定されていません。.envファイルを確認してください。`
      );
    }
    return value;
  }

  /**
   * 環境変数の取得（オプション）
   * 値が存在しない場合はデフォルト値を返す
   */
  private getOptionalEnv(key: string, defaultValue: string = ""): string {
    return process.env[key] || defaultValue;
  }

  // === 認証情報 ===
  get ticketPiaEmail(): string {
    return this.getOptionalEnv("ID_TICKET");
  }

  get ticketPiaPassword(): string {
    return this.getOptionalEnv("PASSWORD_TICKET");
  }

  get githubUsername(): string {
    return this.getOptionalEnv("GITHUB_USERNAME");
  }

  get githubPassword(): string {
    return this.getOptionalEnv("GITHUB_PASSWORD");
  }

  get libecityEmail(): string {
    return this.getOptionalEnv("LIBECITY_EMAIL");
  }

  get libecityPassword(): string {
    return this.getOptionalEnv("LIBECITY_PASSWORD");
  }

  // === URL設定 ===
  get baseUrl(): string {
    return this.getOptionalEnv("BASE_URL", "http://localhost:3000");
  }

  get ticketPiaUrl(): string {
    return "https://t.pia.jp/";
  }

  get playwrightUrl(): string {
    return "https://playwright.dev/";
  }

  get todoAppUrl(): string {
    return "https://demo.playwright.dev/todomvc";
  }

  get w3schoolsFormUrl(): string {
    return "https://www.w3schools.com/html/tryit.asp?filename=tryhtml_form_submit";
  }

  get libecityUrl(): string {
    return "https://libecity.com";
  }

  // === タイムアウト設定 ===
  get defaultTimeout(): number {
    return parseInt(this.getOptionalEnv("TEST_TIMEOUT", "30000"));
  }

  get navigationTimeout(): number {
    return parseInt(this.getOptionalEnv("NAVIGATION_TIMEOUT", "10000"));
  }

  get elementTimeout(): number {
    return parseInt(this.getOptionalEnv("ELEMENT_TIMEOUT", "5000"));
  }

  // === テスト実行設定 ===
  get isHeadless(): boolean {
    return this.getOptionalEnv("HEADLESS", "true") === "true";
  }

  get slowMo(): number {
    return parseInt(this.getOptionalEnv("SLOW_MO", "0"));
  }

  get screenshot(): "off" | "only-on-failure" | "on" {
    const value = this.getOptionalEnv("SCREENSHOT", "only-on-failure");
    return value as "off" | "only-on-failure" | "on";
  }

  get video(): "off" | "on" | "retain-on-failure" {
    const value = this.getOptionalEnv("VIDEO", "retain-on-failure");
    return value as "off" | "on" | "retain-on-failure";
  }

  // === デバッグ設定 ===
  get debugMode(): boolean {
    return this.getOptionalEnv("DEBUG", "false") === "true";
  }

  get verboseLogging(): boolean {
    return this.getOptionalEnv("VERBOSE", "false") === "true";
  }

  // === ファイルパス設定 ===
  get authFilePath(): string {
    return path.join(__dirname, "../../playwright/.auth/user.json");
  }

  get screenshotDir(): string {
    return path.join(__dirname, "../../test-results/screenshots");
  }

  get reportsDir(): string {
    return path.join(__dirname, "../../playwright-report");
  }

  // === 認証情報の検証 ===
  /**
   * チケットぴあの認証情報が設定されているかチェック
   */
  hasTicketPiaCredentials(): boolean {
    return !!(this.ticketPiaEmail && this.ticketPiaPassword);
  }

  /**
   * GitHubの認証情報が設定されているかチェック
   */
  hasGitHubCredentials(): boolean {
    return !!(this.githubUsername && this.githubPassword);
  }

  /**
   * リベシティの認証情報が設定されているかチェック
   */
  hasLibecityCredentials(): boolean {
    return !!(this.libecityEmail && this.libecityPassword);
  }

  /**
   * 必要な環境変数がすべて設定されているかチェック
   * @param requiredVars - 必須の環境変数名の配列
   */
  validateRequiredEnvVars(requiredVars: string[]): void {
    const missing = requiredVars.filter((varName) => !process.env[varName]);

    if (missing.length > 0) {
      throw new Error(
        `以下の環境変数が設定されていません: ${missing.join(", ")}\n` +
          ".envファイルを作成し、必要な値を設定してください。"
      );
    }
  }

  /**
   * 設定値の表示（機密情報はマスク）
   */
  displayConfig(): void {
    console.log("=== テスト設定情報 ===");
    console.log(`Base URL: ${this.baseUrl}`);
    console.log(`Default Timeout: ${this.defaultTimeout}ms`);
    console.log(`Headless: ${this.isHeadless}`);
    console.log(`Debug Mode: ${this.debugMode}`);
    console.log(`Screenshot: ${this.screenshot}`);
    console.log(`Video: ${this.video}`);

    // 認証情報は設定有無のみ表示
    console.log(
      `チケットぴあ認証: ${
        this.hasTicketPiaCredentials() ? "設定済み" : "未設定"
      }`
    );
    console.log(
      `GitHub認証: ${this.hasGitHubCredentials() ? "設定済み" : "未設定"}`
    );
    console.log(
      `リベシティ認証: ${this.hasLibecityCredentials() ? "設定済み" : "未設定"}`
    );
    console.log("==================");
  }
}

// シングルトンインスタンスをエクスポート
export const config = TestConfig.getInstance();
