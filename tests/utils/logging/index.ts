/**
 * ログシステム メインエクスポート
 * 日運用対応ログシステムの統一エントリーポイント
 */

// 型定義
export * from "./types";

// コアクラス
export { LogManager } from "./LogManager";
export { LogConfigFactory } from "./LogConfigFactory";

// Emitters
export { ConsoleEmitter } from "./emitters/ConsoleEmitter";
export { FileEmitter } from "./emitters/FileEmitter";
export { StructuredEmitter } from "./emitters/StructuredEmitter";
export { MetricsEmitter } from "./emitters/MetricsEmitter";

// 便利関数とユーティリティ
import { LogManager } from "./LogManager";
import { LogConfigFactory } from "./LogConfigFactory";
import { LogLevel, LogCategory, LogConfig } from "./types";

/**
 * 環境変数からの自動初期化
 */
export async function initializeLoggingSystem(
  customConfig?: Partial<LogConfig>
): Promise<LogManager> {
  const environment = (process.env.NODE_ENV || "development") as
    | "development"
    | "staging"
    | "production"
    | "test";

  const logManager = await LogConfigFactory.initializeLogManager(
    environment,
    customConfig
  );

  // 設定サマリーの表示（開発環境のみ）
  if (environment === "development") {
    LogConfigFactory.displayConfigSummary(logManager.getConfig());
  }

  return logManager;
}

/**
 * クイック初期化（開発・テスト用）
 */
export function createQuickLogger(level: LogLevel = LogLevel.INFO): LogManager {
  const config = LogConfigFactory.createConfig("development", {
    level,
    enableConsole: true,
    enableFile: false,
    enableStructured: false,
    enableMetrics: false,
  });

  return LogManager.getInstance(config);
}

/**
 * 本番環境向け完全ログシステム初期化
 */
export async function initializeProductionLogging(
  customConfig?: Partial<LogConfig>
): Promise<LogManager> {
  return await LogConfigFactory.initializeLogManager(
    "production",
    customConfig
  );
}

/**
 * テスト環境向け軽量ログシステム初期化
 */
export function initializeTestLogging(): LogManager {
  const config = LogConfigFactory.createConfig("test");
  return LogManager.getInstance(config);
}

/**
 * 既存システムとの互換性レイヤー
 * 既存のTestLoggerインターフェースを新システムで実装
 */
export class CompatibilityLogger {
  private logManager: LogManager;

  constructor(logManager?: LogManager) {
    this.logManager = logManager || createQuickLogger();
  }

  // 既存のTestLoggerメソッドとの互換性
  info(message: string, context?: any): void {
    this.logManager.info(message, LogCategory.SYSTEM, { customData: context });
  }

  error(message: string, context?: any): void {
    this.logManager.error(message, LogCategory.ERROR_HANDLING, {
      customData: context,
    });
  }

  warn(message: string, context?: any): void {
    this.logManager.warn(message, LogCategory.SYSTEM, { customData: context });
  }

  debug(message: string, context?: any): void {
    this.logManager.debug(message, LogCategory.SYSTEM, { customData: context });
  }

  startStep(stepName: string, description?: string): void {
    this.logManager.info(
      `▶️ ステップ開始: ${stepName}${description ? `: ${description}` : ""}`,
      LogCategory.TEST_EXECUTION
    );
  }

  endStep(stepName: string, duration?: number): void {
    const durationText = duration ? ` (${duration}ms)` : "";
    this.logManager.info(
      `✅ ステップ完了: ${stepName}${durationText}`,
      LogCategory.TEST_EXECUTION,
      duration ? { performance: { duration } } : undefined
    );
  }

  failStep(stepName: string, error: any): void {
    this.logManager.error(
      `❌ ステップ失敗: ${stepName}`,
      LogCategory.TEST_EXECUTION,
      { customData: error },
      error instanceof Error ? error : undefined
    );
  }

  // 新しいメソッド（既存コードで利用可能）
  getAllLogs(): any[] {
    // 新システムではログはEmitterで直接処理されるため、
    // 必要に応じて実装するか、非推奨として扱う
    console.warn(
      "getAllLogs() は新しいログシステムでは非推奨です。構造化ログファイルを直接参照してください。"
    );
    return [];
  }

  clearLogs(): void {
    console.warn("clearLogs() は新しいログシステムでは非推奨です。");
  }

  async saveLogsToFile(filePath: string): Promise<void> {
    console.warn(
      "saveLogsToFile() は新しいログシステムでは自動的に行われます。"
    );
  }
}

/**
 * 既存プロジェクトでの簡単移行用
 * 既存のloggerインスタンスを置き換え可能
 */
export const logger = new CompatibilityLogger();

/**
 * 設定プリセットの取得
 */
export const presets = LogConfigFactory.getPresetConfigs();

/**
 * ログシステムの完全シャットダウン
 */
export async function shutdownLoggingSystem(): Promise<void> {
  try {
    const instance = LogManager.getInstance();
    await instance.flush();
    await instance.close();
  } catch (error) {
    console.error("ログシステムのシャットダウンでエラーが発生:", error);
  }
}

/**
 * 開発支援ユーティリティ
 */
export const utils = {
  /**
   * ログレベルの文字列から列挙型への変換
   */
  parseLogLevel(levelString: string): LogLevel {
    const upperLevel = levelString.toUpperCase();
    if (upperLevel in LogLevel) {
      return LogLevel[upperLevel as keyof typeof LogLevel];
    }
    throw new Error(`無効なログレベル: ${levelString}`);
  },

  /**
   * 設定の妥当性チェック
   */
  validateConfig(config: LogConfig): boolean {
    try {
      LogConfigFactory.validateConfig(config);
      return true;
    } catch (error) {
      console.error("設定検証エラー:", error);
      return false;
    }
  },

  /**
   * 現在のログ設定の表示
   */
  displayCurrentConfig(): void {
    try {
      const instance = LogManager.getInstance();
      LogConfigFactory.displayConfigSummary(instance.getConfig());
    } catch (error) {
      console.error("LogManagerが初期化されていません");
    }
  },
};

// デフォルトエクスポート（ES Module互換）
export default {
  LogManager,
  LogConfigFactory,
  initializeLoggingSystem,
  createQuickLogger,
  logger,
  utils,
  presets,
};
