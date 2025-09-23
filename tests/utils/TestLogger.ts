/**
 * テストログ出力のユーティリティクラス
 * 統一されたログフォーマットでテスト実行状況を記録
 */

import { ENV } from "./EnvManager";
export class TestLogger {
  private static instance: TestLogger;
  private logs: {
    timestamp: string;
    level: string;
    message: string;
    context?: any;
  }[] = [];

  private constructor() {}

  static getInstance(): TestLogger {
    if (!TestLogger.instance) {
      TestLogger.instance = new TestLogger();
    }
    return TestLogger.instance;
  }

  /**
   * 情報ログの出力
   * @param message - ログメッセージ
   * @param context - 追加のコンテキスト情報
   */
  info(message: string, context?: any): void {
    this.log("INFO", message, context);
  }

  /**
   * エラーログの出力
   * @param message - エラーメッセージ
   * @param context - エラーの詳細情報
   */
  error(message: string, context?: any): void {
    this.log("ERROR", message, context);
  }

  /**
   * 警告ログの出力
   * @param message - 警告メッセージ
   * @param context - 追加の詳細情報
   */
  warn(message: string, context?: any): void {
    this.log("WARN", message, context);
  }

  /**
   * デバッグログの出力（開発時のみ）
   * @param message - デバッグメッセージ
   * @param context - デバッグ情報
   */
  debug(message: string, context?: any): void {
    if (ENV.isDevelopment()) {
      this.log("DEBUG", message, context);
    }
  }

  /**
   * テストステップの開始ログ
   * @param stepName - ステップ名
   * @param description - ステップの説明
   */
  startStep(stepName: string, description?: string): void {
    const message = description ? `${stepName}: ${description}` : stepName;
    this.info(`▶️ ステップ開始: ${message}`);
  }

  /**
   * テストステップの完了ログ
   * @param stepName - ステップ名
   * @param duration - 実行時間（ミリ秒）
   */
  endStep(stepName: string, duration?: number): void {
    const durationMsg = duration ? ` (${duration}ms)` : "";
    this.info(`✅ ステップ完了: ${stepName}${durationMsg}`);
  }

  /**
   * テストステップの失敗ログ
   * @param stepName - ステップ名
   * @param error - エラー情報
   */
  failStep(stepName: string, error: any): void {
    this.error(`❌ ステップ失敗: ${stepName}`, error);
  }

  /**
   * 基本のログ出力メソッド
   */
  private log(level: string, message: string, context?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, context };

    this.logs.push(logEntry);

    // コンソールにも出力
    const formattedMessage = `[${timestamp}] ${level}: ${message}`;

    switch (level) {
      case "ERROR":
        console.error(formattedMessage, context || "");
        break;
      case "WARN":
        console.warn(formattedMessage, context || "");
        break;
      case "DEBUG":
        console.debug(formattedMessage, context || "");
        break;
      default:
        console.log(formattedMessage, context || "");
    }
  }

  /**
   * すべてのログを取得
   */
  getAllLogs(): typeof this.logs {
    return [...this.logs];
  }

  /**
   * ログをクリア
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * ログをファイルに保存（オプション）
   */
  async saveLogsToFile(filePath: string): Promise<void> {
    try {
      const fs = require("fs");
      const logContent = this.logs
        .map(
          (log) =>
            `[${log.timestamp}] ${log.level}: ${log.message} ${
              log.context ? JSON.stringify(log.context) : ""
            }`
        )
        .join("\n");

      fs.writeFileSync(filePath, logContent, "utf8");
      console.log(`ログを保存しました: ${filePath}`);
    } catch (error) {
      console.error("ログの保存に失敗しました:", error);
    }
  }
}

// シングルトンインスタンスをエクスポート
export const logger = TestLogger.getInstance();
