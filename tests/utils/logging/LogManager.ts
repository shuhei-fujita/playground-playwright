/**
 * LogManager - 日運用対応ログシステムの中心クラス
 * プラガブル設計によりEmitterを動的に制御
 */

import { randomUUID } from "crypto";
import {
  LogLevel,
  LogCategory,
  LogEntry,
  LogEmitter,
  LogConfig,
  LogContext,
  LogMetadata,
} from "./types";

export class LogManager {
  private static instance: LogManager;
  private emitters: LogEmitter[] = [];
  private config: LogConfig;
  private correlationId: string;
  private sessionId: string;

  private constructor(config: LogConfig) {
    this.config = config;
    this.correlationId = randomUUID();
    this.sessionId = randomUUID();
  }

  /**
   * シングルトンインスタンスの取得
   */
  static getInstance(config?: LogConfig): LogManager {
    if (!LogManager.instance) {
      if (!config) {
        throw new Error("LogManager初期化時には設定が必要です");
      }
      LogManager.instance = new LogManager(config);
    }
    return LogManager.instance;
  }

  /**
   * Emitterの追加
   */
  addEmitter(emitter: LogEmitter): void {
    this.emitters.push(emitter);
  }

  /**
   * Emitterの削除
   */
  removeEmitter(emitter: LogEmitter): void {
    const index = this.emitters.indexOf(emitter);
    if (index > -1) {
      this.emitters.splice(index, 1);
    }
  }

  /**
   * 設定の更新
   */
  updateConfig(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * TRACEレベルログ
   */
  trace(
    message: string,
    category: LogCategory = LogCategory.SYSTEM,
    context?: LogContext
  ): void {
    this.log(LogLevel.TRACE, message, category, context);
  }

  /**
   * DEBUGレベルログ
   */
  debug(
    message: string,
    category: LogCategory = LogCategory.SYSTEM,
    context?: LogContext
  ): void {
    this.log(LogLevel.DEBUG, message, category, context);
  }

  /**
   * INFOレベルログ
   */
  info(
    message: string,
    category: LogCategory = LogCategory.SYSTEM,
    context?: LogContext
  ): void {
    this.log(LogLevel.INFO, message, category, context);
  }

  /**
   * WARNレベルログ
   */
  warn(
    message: string,
    category: LogCategory = LogCategory.SYSTEM,
    context?: LogContext
  ): void {
    this.log(LogLevel.WARN, message, category, context);
  }

  /**
   * ERRORレベルログ
   */
  error(
    message: string,
    category: LogCategory = LogCategory.ERROR_HANDLING,
    context?: LogContext,
    error?: Error
  ): void {
    const enhancedContext = error
      ? {
          ...context,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: (error as any).code,
          },
        }
      : context;

    this.log(LogLevel.ERROR, message, category, enhancedContext);
  }

  /**
   * FATALレベルログ
   */
  fatal(
    message: string,
    category: LogCategory = LogCategory.ERROR_HANDLING,
    context?: LogContext,
    error?: Error
  ): void {
    const enhancedContext = error
      ? {
          ...context,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
            code: (error as any).code,
          },
        }
      : context;

    this.log(LogLevel.FATAL, message, category, enhancedContext);
  }

  /**
   * テスト開始ログ
   */
  startTest(testTitle: string, context?: LogContext): void {
    this.info(`🚀 テスト開始: ${testTitle}`, LogCategory.TEST_EXECUTION, {
      ...context,
      testInfo: {
        ...context?.testInfo,
        title: testTitle,
        sessionId: this.sessionId,
      },
    });
  }

  /**
   * テスト完了ログ
   */
  endTest(
    testTitle: string,
    status: "passed" | "failed" | "skipped",
    duration?: number,
    context?: LogContext
  ): void {
    const statusEmoji =
      status === "passed" ? "✅" : status === "failed" ? "❌" : "⏭️";
    const durationText = duration ? ` (${duration}ms)` : "";

    this.info(
      `${statusEmoji} テスト${
        status === "passed" ? "成功" : status === "failed" ? "失敗" : "スキップ"
      }: ${testTitle}${durationText}`,
      LogCategory.TEST_EXECUTION,
      {
        ...context,
        testInfo: {
          ...context?.testInfo,
          title: testTitle,
          sessionId: this.sessionId,
        },
        performance: duration ? { duration } : undefined,
      }
    );
  }

  /**
   * ページ操作ログ
   */
  pageAction(action: string, url: string, context?: LogContext): void {
    this.info(`🌐 ページ操作: ${action}`, LogCategory.PAGE_INTERACTION, {
      ...context,
      page: {
        url,
        ...context?.page,
      },
    });
  }

  /**
   * パフォーマンスログ
   */
  performance(message: string, metrics: any, context?: LogContext): void {
    this.info(`⚡ パフォーマンス: ${message}`, LogCategory.PERFORMANCE, {
      ...context,
      performance: metrics,
    });
  }

  /**
   * セキュリティログ
   */
  security(message: string, securityContext: any, context?: LogContext): void {
    this.warn(`🔒 セキュリティ: ${message}`, LogCategory.SECURITY, {
      ...context,
      security: securityContext,
    });
  }

  /**
   * メインのログ出力メソッド
   */
  private async log(
    level: LogLevel,
    message: string,
    category: LogCategory,
    context?: LogContext
  ): Promise<void> {
    // レベルフィルタリング
    if (level < this.config.level) {
      return;
    }

    // 機密データのマスキング
    const maskedMessage = this.config.sensitiveDataMasking
      ? this.maskSensitiveData(message)
      : message;
    const maskedContext =
      this.config.sensitiveDataMasking && context
        ? this.maskSensitiveContext(context)
        : context;

    // メタデータの生成
    const metadata: LogMetadata = {
      correlationId: this.correlationId,
      environment: this.config.environment,
      hostname: process.env.HOSTNAME || "localhost",
      processId: process.pid,
      version: process.env.npm_package_version || "1.0.0",
    };

    // ログエントリの作成
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message: maskedMessage,
      context: maskedContext,
      metadata,
    };

    // 全Emitterに送信
    await Promise.allSettled(
      this.emitters.map((emitter) => emitter.emit(logEntry))
    );
  }

  /**
   * 機密データのマスキング
   */
  private maskSensitiveData(message: string): string {
    return message
      .replace(/password["\s]*[:=]["\s]*[^"\s,}]+/gi, 'password: "***"')
      .replace(/token["\s]*[:=]["\s]*[^"\s,}]+/gi, 'token: "***"')
      .replace(/key["\s]*[:=]["\s]*[^"\s,}]+/gi, 'key: "***"')
      .replace(/(\w+@\w+\.\w+)/g, (email) => email.replace(/@.+/, "@***"));
  }

  /**
   * コンテキスト内の機密データマスキング
   */
  private maskSensitiveContext(context: LogContext): LogContext {
    const masked = { ...context };

    if (masked.security) {
      masked.security = { ...masked.security };
      // セキュリティ関連の機密情報をマスク
    }

    if (masked.customData) {
      masked.customData = { ...masked.customData };
      Object.keys(masked.customData).forEach((key) => {
        if (
          key.toLowerCase().includes("password") ||
          key.toLowerCase().includes("token") ||
          key.toLowerCase().includes("secret")
        ) {
          masked.customData![key] = "***";
        }
      });
    }

    return masked;
  }

  /**
   * 全Emitterのフラッシュ
   */
  async flush(): Promise<void> {
    await Promise.allSettled(
      this.emitters
        .filter((emitter) => emitter.flush)
        .map((emitter) => emitter.flush!())
    );
  }

  /**
   * ログシステムのクローズ
   */
  async close(): Promise<void> {
    await Promise.allSettled(
      this.emitters
        .filter((emitter) => emitter.close)
        .map((emitter) => emitter.close!())
    );
  }

  /**
   * 現在の設定を取得
   */
  getConfig(): LogConfig {
    return { ...this.config };
  }

  /**
   * セッションIDを取得
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * 相関IDを取得
   */
  getCorrelationId(): string {
    return this.correlationId;
  }
}
