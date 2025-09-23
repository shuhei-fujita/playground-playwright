/**
 * 環境変数管理の統一クラス / Unified Environment Variable Manager
 *
 * 型安全な環境変数アクセスとデフォルト値管理
 * Type-safe environment variable access with default value management
 */

// ===================================
// 環境変数型定義 / Environment Variable Types
// ===================================

export interface EnvConfig {
  // システム関連 / System
  NODE_ENV: "development" | "test" | "staging" | "production";
  HOSTNAME: string;

  // ログ関連 / Logging
  LOG_LEVEL: "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
  LOG_CONSOLE: boolean;
  LOG_FILE: boolean;
  LOG_STRUCTURED: boolean;
  LOG_METRICS: boolean;
  LOG_FILE_DIR: string;

  // 認証関連 / Authentication
  TEST_PASSWORD: string;
  TEST_USER_PASSWORD: string;
  TEST_VALID_PASSWORD: string;

  // アラート関連 / Alerts
  ALERT_EMAIL_RECIPIENTS: string[];
  ALERT_WEBHOOK_URL: string;

  // メトリクス関連 / Metrics
  ENABLE_METRICS: boolean;
}

// ===================================
// デフォルト値設定 / Default Values
// ===================================

const DEFAULT_VALUES: Partial<EnvConfig> = {
  NODE_ENV: "development",
  HOSTNAME: "localhost",

  LOG_LEVEL: "INFO",
  LOG_CONSOLE: true,
  LOG_FILE: false,
  LOG_STRUCTURED: false,
  LOG_METRICS: false,
  LOG_FILE_DIR: "./logs",

  TEST_PASSWORD: "TEST_DUMMY_PASSWORD",
  TEST_USER_PASSWORD: "TEST_DUMMY_USER_PASS",
  TEST_VALID_PASSWORD: "TEST_DUMMY_VALID_PASS",

  ALERT_EMAIL_RECIPIENTS: [],
  ALERT_WEBHOOK_URL: "",

  ENABLE_METRICS: false,
};

// ===================================
// 環境変数管理クラス / Environment Manager Class
// ===================================

export class EnvManager {
  /**
   * 型安全な環境変数取得
   * Type-safe environment variable retrieval
   */
  static get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    const rawValue = process.env[key];
    const defaultValue = DEFAULT_VALUES[key];

    // 型に応じた変換処理
    switch (key) {
      // Boolean型
      case "LOG_CONSOLE":
      case "LOG_FILE":
      case "LOG_STRUCTURED":
      case "LOG_METRICS":
      case "ENABLE_METRICS":
        return (rawValue === "true") as EnvConfig[K];

      // Array型
      case "ALERT_EMAIL_RECIPIENTS":
        return (
          rawValue ? rawValue.split(",") : defaultValue || []
        ) as EnvConfig[K];

      // String型（デフォルト値適用）
      default:
        return (rawValue || defaultValue || "") as EnvConfig[K];
    }
  }

  /**
   * 環境変数の存在チェック
   * Check if environment variable exists
   */
  static has(key: keyof EnvConfig): boolean {
    return process.env[key] !== undefined;
  }

  /**
   * 必須環境変数のチェック
   * Check required environment variables
   */
  static validateRequired(keys: (keyof EnvConfig)[]): void {
    const missing = keys.filter((key) => !this.has(key));
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }
  }

  /**
   * 環境変数設定の表示（デバッグ用）
   * Display environment configuration (for debugging)
   */
  static displayConfig(): void {
    console.log("=== Environment Configuration ===");
    console.log(`NODE_ENV: ${this.get("NODE_ENV")}`);
    console.log(`LOG_LEVEL: ${this.get("LOG_LEVEL")}`);
    console.log(`LOG_CONSOLE: ${this.get("LOG_CONSOLE")}`);
    console.log(`ENABLE_METRICS: ${this.get("ENABLE_METRICS")}`);
    console.log("================================");
  }
}

// ===================================
// 利便性のためのエクスポート / Convenience Exports
// ===================================

/**
 * 従来のgetEnvVar互換関数
 * Legacy getEnvVar compatible function
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  return process.env[key] || defaultValue || "";
}

/**
 * よく使う環境変数のショートカット
 * Shortcuts for commonly used environment variables
 */
export const ENV = {
  isDevelopment: () => EnvManager.get("NODE_ENV") === "development",
  isProduction: () => EnvManager.get("NODE_ENV") === "production",
  isTest: () => EnvManager.get("NODE_ENV") === "test",

  getLogLevel: () => EnvManager.get("LOG_LEVEL"),
  isLogConsoleEnabled: () => EnvManager.get("LOG_CONSOLE"),
  isMetricsEnabled: () => EnvManager.get("ENABLE_METRICS"),
} as const;
