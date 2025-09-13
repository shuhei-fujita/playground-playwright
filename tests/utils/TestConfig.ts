import dotenv from "dotenv";
import path from "path";

// 環境変数をロード（機密情報のみ）
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * テスト設定の一元管理
 * 機密情報は環境変数、定数は内部で管理
 * security.mdcに準拠: パスワードなどは.envで管理
 */

// ===================================
// 環境変数管理
// ===================================
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    console.warn(`環境変数 ${key} が設定されていません`);
    return "";
  }
  return value || defaultValue || "";
};

// ===================================
// メイン設定オブジェクト
// ===================================
export const config = {
  // URL設定
  baseUrl: "http://localhost:3000",
  ticketPiaUrl: "https://t.pia.jp/",
  playwrightUrl: "https://playwright.dev/",
  todoAppUrl: "https://demo.playwright.dev/todomvc",
  w3schoolsFormUrl:
    "https://www.w3schools.com/html/tryit.asp?filename=tryhtml_form_submit",
  libecityUrl: "https://libecity.com",

  // タイムアウト設定
  defaultTimeout: 30000, // 30秒
  navigationTimeout: 10000, // 10秒
  elementTimeout: 5000, // 5秒

  // 認証情報
  ticketPiaEmail: getEnvVar("ID_TICKET"),
  ticketPiaPassword: getEnvVar("PASSWORD_TICKET"),
  githubUsername: getEnvVar("GITHUB_USERNAME"),
  githubPassword: getEnvVar("GITHUB_PASSWORD"),
  libecityEmail: getEnvVar("LIBECITY_EMAIL"),
  libecityPassword: getEnvVar("LIBECITY_PASSWORD"),

  // テスト実行設定
  isHeadless: true,
  slowMo: 0,
  screenshot: "only-on-failure" as const,
  video: "retain-on-failure" as "off" | "on" | "retain-on-failure", // 型を明示的に指定
  retries: 2,

  // デバッグ設定
  debugMode: getEnvVar("DEBUG", "false") === "true",
  verboseLogging: getEnvVar("VERBOSE", "false") === "true",

  // ファイルパス設定
  authFilePath: path.join(__dirname, "../../playwright/.auth/user.json"),
  screenshotDir: path.join(__dirname, "../../test-results/screenshots"),
  reportsDir: path.join(__dirname, "../../playwright-report"),

  // 認証情報の検証
  hasTicketPiaCredentials: () =>
    !!(config.ticketPiaEmail && config.ticketPiaPassword),
  hasGitHubCredentials: () =>
    !!(config.githubUsername && config.githubPassword),
  hasLibecityCredentials: () =>
    !!(config.libecityEmail && config.libecityPassword),

  // 設定表示
  displayConfig: () => {
    console.log("=== テスト設定情報 ===");
    console.log(`Base URL: ${config.baseUrl}`);
    console.log(`Default Timeout: ${config.defaultTimeout}ms`);
    console.log(`Headless: ${config.isHeadless}`);
    console.log(`Debug: ${config.debugMode}`);

    console.log(
      `チケットぴあ認証: ${
        config.hasTicketPiaCredentials() ? "設定済み" : "未設定"
      }`
    );
    console.log(
      `GitHub認証: ${config.hasGitHubCredentials() ? "設定済み" : "未設定"}`
    );
    console.log(
      `リベシティ認証: ${
        config.hasLibecityCredentials() ? "設定済み" : "未設定"
      }`
    );
    console.log("==================");
  },
} as const;

// ===================================
// 型定義
// ===================================
export type TestConfig = typeof config;
