/**
 * プロジェクト共通定数 / Project Common Constants
 *
 * URL、タイムアウト値、その他の定数を一元管理
 * Centralized management of URLs, timeout values, and other constants
 */

// ===================================
// URL定数 / URL Constants
// ===================================

export const URLS = {
  // 外部サイト / External Sites
  PLAYWRIGHT: "https://playwright.dev",
  PLAYWRIGHT_DOCS: "https://playwright.dev/",
  TODO_DEMO: "https://demo.playwright.dev/todomvc",
  W3SCHOOLS_FORM:
    "https://www.w3schools.com/html/tryit.asp?filename=tryhtml_form_submit",
  TICKET_PIA: "https://t.pia.jp/",
  GITHUB: "https://github.com/",
  GOOGLE: "https://www.google.com/",
  LIBECITY: "https://libecity.com",

  // ローカル環境 / Local Environment
  LOCAL_DEV: "http://localhost:3000",
  LOCAL_TEST: "http://localhost:3001",
  STAGING: "https://staging.example.com",
} as const;

// ===================================
// タイムアウト定数 / Timeout Constants
// ===================================

export const TIMEOUTS = {
  DEFAULT: 30000, // 30秒
  NAVIGATION: 10000, // 10秒
  ELEMENT: 5000, // 5秒
  QUICK: 2000, // 2秒
} as const;

// ===================================
// テスト設定定数 / Test Configuration Constants
// ===================================

export const TEST_CONFIG = {
  VIEWPORT: {
    WIDTH: 1920,
    HEIGHT: 1080,
  },
  RETRY_COUNT: 2,
  SLOW_MO: 0,
} as const;

// ===================================
// ファイルパス定数 / File Path Constants
// ===================================

export const PATHS = {
  AUTH_FILE: "../../playwright/.auth/user.json",
  SCREENSHOTS_DIR: "../../test-results/screenshots",
  REPORTS_DIR: "../../playwright-report",
  VIDEOS_DIR: "../test-results/videos/",
  HAR_FILE: "../test-results/har/trace.har",
} as const;

// ===================================
// 型安全なURL取得 / Type-safe URL Access
// ===================================

export type UrlKey = keyof typeof URLS;
export type TimeoutKey = keyof typeof TIMEOUTS;

/**
 * URL取得ヘルパー関数
 * Type-safe URL retrieval helper
 */
export function getUrl(key: UrlKey): string {
  return URLS[key];
}

/**
 * タイムアウト値取得ヘルパー関数
 * Type-safe timeout retrieval helper
 */
export function getTimeout(key: TimeoutKey): number {
  return TIMEOUTS[key];
}
