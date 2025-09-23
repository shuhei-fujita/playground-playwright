/**
 * ConsoleEmitter - コンソール出力用Emitter
 * 開発時の即座な確認とデバッグに最適化
 */

import { LogEmitter, LogEntry, LogLevel } from "../types";

export class ConsoleEmitter implements LogEmitter {
  private colorEnabled: boolean;
  private verbose: boolean;

  constructor(options: { colorEnabled?: boolean; verbose?: boolean } = {}) {
    this.colorEnabled = options.colorEnabled ?? true;
    this.verbose = options.verbose ?? false;
  }

  /**
   * ログエントリをコンソールに出力
   */
  async emit(entry: LogEntry): Promise<void> {
    const formattedMessage = this.formatMessage(entry);

    switch (entry.level) {
      case LogLevel.TRACE:
        if (this.verbose) {
          console.debug(formattedMessage);
        }
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        if (entry.error && this.verbose) {
          console.error("Stack trace:", entry.error.stack);
        }
        break;
      case LogLevel.FATAL:
        console.error(formattedMessage);
        if (entry.error) {
          console.error("Fatal error details:", entry.error);
        }
        break;
    }

    // 詳細モードでコンテキスト情報も出力
    if (this.verbose && entry.context) {
      console.group("Context:");
      this.logContext(entry);
      console.groupEnd();
    }
  }

  /**
   * メッセージのフォーマット
   */
  private formatMessage(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const level = this.formatLevel(entry.level);
    const category = this.formatCategory(entry.category);

    return `${timestamp} ${level} [${category}] ${entry.message}`;
  }

  /**
   * ログレベルのフォーマット（色付き）
   */
  private formatLevel(level: LogLevel): string {
    const levelName = LogLevel[level];

    if (!this.colorEnabled) {
      return `[${levelName}]`;
    }

    switch (level) {
      case LogLevel.TRACE:
        return `\x1b[37m[${levelName}]\x1b[0m`; // 白
      case LogLevel.DEBUG:
        return `\x1b[36m[${levelName}]\x1b[0m`; // シアン
      case LogLevel.INFO:
        return `\x1b[32m[${levelName}]\x1b[0m`; // 緑
      case LogLevel.WARN:
        return `\x1b[33m[${levelName}]\x1b[0m`; // 黄
      case LogLevel.ERROR:
        return `\x1b[31m[${levelName}]\x1b[0m`; // 赤
      case LogLevel.FATAL:
        return `\x1b[35m[${levelName}]\x1b[0m`; // マゼンタ
      default:
        return `[${levelName}]`;
    }
  }

  /**
   * カテゴリのフォーマット
   */
  private formatCategory(category: string): string {
    if (!this.colorEnabled) {
      return category;
    }
    return `\x1b[34m${category}\x1b[0m`; // 青
  }

  /**
   * コンテキスト情報の詳細出力
   */
  private logContext(entry: LogEntry): void {
    const { context } = entry;
    if (!context) return;

    if (context.testInfo) {
      console.log("📝 Test:", {
        title: context.testInfo.title,
        file: context.testInfo.file,
        sessionId: context.testInfo.sessionId,
      });
    }

    if (context.browser) {
      console.log("🌐 Browser:", {
        name: context.browser.name,
        version: context.browser.version,
        platform: context.browser.platform,
      });
    }

    if (context.page) {
      console.log("📄 Page:", {
        url: context.page.url,
        title: context.page.title,
        loadState: context.page.loadState,
      });
    }

    if (context.performance) {
      console.log("⚡ Performance:", {
        duration: `${context.performance.duration}ms`,
        memory: context.performance.memory
          ? `${Math.round(context.performance.memory / 1024 / 1024)}MB`
          : undefined,
        networkRequests: context.performance.networkRequests,
      });
    }

    if (context.security) {
      console.log("🔒 Security:", context.security);
    }

    if (context.customData) {
      console.log("📊 Custom Data:", context.customData);
    }
  }

  /**
   * バッファなし（即座出力）のためフラッシュ不要
   */
  async flush(): Promise<void> {
    // Console出力はバッファリングされないため何もしない
  }
}
