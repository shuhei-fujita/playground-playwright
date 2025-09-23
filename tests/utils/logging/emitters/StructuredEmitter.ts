/**
 * StructuredEmitter - 構造化ログ出力用Emitter
 * JSON Lines形式での高効率ログ出力とクエリ最適化
 */

import { promises as fs } from "fs";
import { createWriteStream, WriteStream } from "fs";
import * as path from "path";
import { LogEmitter, LogEntry, LogLevel, LogCategory } from "../types";

interface StructuredEmitterConfig {
  directory: string;
  enableIndexing: boolean; // インデックスファイルの生成
  enableAggregation: boolean; // 集計データの生成
  batchSize: number; // バッチサイズ
  flushInterval: number; // フラッシュ間隔（秒）
}

interface LogIndex {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  testTitle?: string;
  offset: number;
  length: number;
}

interface LogAggregation {
  timestamp: string;
  period: string; // '1h', '1d' etc.
  stats: {
    total: number;
    byLevel: Record<LogLevel, number>;
    byCategory: Record<LogCategory, number>;
    errorRate: number;
    averageTestDuration?: number;
    failedTests: string[];
  };
}

export class StructuredEmitter implements LogEmitter {
  private config: StructuredEmitterConfig;
  private logStream?: WriteStream;
  private indexStream?: WriteStream;
  private currentLogFile?: string;
  private currentIndexFile?: string;
  private writeBuffer: LogEntry[] = [];
  private indexBuffer: LogIndex[] = [];
  private aggregationData: Map<string, LogAggregation> = new Map();
  private flushTimer?: NodeJS.Timeout;
  private currentOffset: number = 0;

  constructor(config: StructuredEmitterConfig) {
    this.config = config;
    this.ensureDirectory();
    this.initializeStreams();
    this.setupFlushTimer();
  }

  /**
   * ログエントリを構造化形式で出力
   */
  async emit(entry: LogEntry): Promise<void> {
    this.writeBuffer.push(entry);

    // インデックス情報の準備
    if (this.config.enableIndexing) {
      const indexEntry: LogIndex = {
        timestamp: entry.timestamp,
        level: entry.level,
        category: entry.category,
        testTitle: entry.context?.testInfo?.title,
        offset: this.currentOffset,
        length: 0, // 後で設定
      };
      this.indexBuffer.push(indexEntry);
    }

    // 集計データの更新
    if (this.config.enableAggregation) {
      this.updateAggregation(entry);
    }

    // バッチサイズに達したらフラッシュ
    if (this.writeBuffer.length >= this.config.batchSize) {
      await this.flush();
    }
  }

  /**
   * バッファの内容をファイルに書き込み
   */
  async flush(): Promise<void> {
    if (this.writeBuffer.length === 0) {
      return;
    }

    try {
      await this.ensureStreams();
      await this.writeLogBatch();

      if (this.config.enableIndexing) {
        await this.writeIndexBatch();
      }

      if (this.config.enableAggregation) {
        await this.writeAggregationData();
      }
    } catch (error) {
      console.error("構造化ログ書き込みエラー:", error);
    }
  }

  /**
   * ログバッチの書き込み
   */
  private async writeLogBatch(): Promise<void> {
    if (!this.logStream) {
      throw new Error("ログストリームが初期化されていません");
    }

    const batch = [...this.writeBuffer];
    this.writeBuffer = [];

    for (let i = 0; i < batch.length; i++) {
      const entry = batch[i];
      const logLine = this.formatStructuredLog(entry);
      const byteLength = Buffer.byteLength(logLine, "utf8");

      // インデックス情報の更新
      if (this.config.enableIndexing && this.indexBuffer[i]) {
        this.indexBuffer[i].length = byteLength;
      }

      await this.writeToStream(this.logStream, logLine);
      this.currentOffset += byteLength;
    }
  }

  /**
   * 構造化ログのフォーマット（JSON Lines）
   */
  private formatStructuredLog(entry: LogEntry): string {
    const structuredEntry = {
      "@timestamp": entry.timestamp,
      "@level": LogLevel[entry.level],
      "@category": entry.category,
      "@message": entry.message,
      "@metadata": {
        correlation_id: entry.metadata.correlationId,
        environment: entry.metadata.environment,
        hostname: entry.metadata.hostname,
        process_id: entry.metadata.processId,
        version: entry.metadata.version,
      },
      ...(entry.context?.testInfo && {
        test: {
          title: entry.context.testInfo.title,
          file: entry.context.testInfo.file,
          session_id: entry.context.testInfo.sessionId,
          retry_count: entry.context.testInfo.retryCount,
        },
      }),
      ...(entry.context?.browser && {
        browser: {
          name: entry.context.browser.name,
          version: entry.context.browser.version,
          platform: entry.context.browser.platform,
          viewport: entry.context.browser.viewport,
        },
      }),
      ...(entry.context?.page && {
        page: {
          url: entry.context.page.url,
          title: entry.context.page.title,
          load_state: entry.context.page.loadState,
          response_time: entry.context.page.responseTime,
        },
      }),
      ...(entry.context?.performance && {
        performance: {
          duration: entry.context.performance.duration,
          memory: entry.context.performance.memory,
          network_requests: entry.context.performance.networkRequests,
          dom_content_loaded: entry.context.performance.domContentLoaded,
          first_contentful_paint:
            entry.context.performance.firstContentfulPaint,
        },
      }),
      ...(entry.context?.security && {
        security: entry.context.security,
      }),
      ...(entry.error && {
        error: {
          name: entry.error.name,
          message: entry.error.message,
          stack: entry.error.stack,
          code: entry.error.code,
        },
      }),
      ...(entry.context?.customData && {
        custom: entry.context.customData,
      }),
    };

    return JSON.stringify(structuredEntry) + "\n";
  }

  /**
   * インデックスバッチの書き込み
   */
  private async writeIndexBatch(): Promise<void> {
    if (!this.indexStream || this.indexBuffer.length === 0) {
      return;
    }

    const indexEntries = [...this.indexBuffer];
    this.indexBuffer = [];

    for (const indexEntry of indexEntries) {
      const indexLine = JSON.stringify(indexEntry) + "\n";
      await this.writeToStream(this.indexStream, indexLine);
    }
  }

  /**
   * 集計データの更新
   */
  private updateAggregation(entry: LogEntry): void {
    const hour =
      new Date(entry.timestamp).toISOString().substring(0, 13) + ":00:00.000Z";
    const key = `${hour}_1h`;

    let aggregation = this.aggregationData.get(key);
    if (!aggregation) {
      aggregation = {
        timestamp: hour,
        period: "1h",
        stats: {
          total: 0,
          byLevel: {} as Record<LogLevel, number>,
          byCategory: {} as Record<LogCategory, number>,
          errorRate: 0,
          failedTests: [],
        },
      };
      this.aggregationData.set(key, aggregation);
    }

    // 統計の更新
    aggregation.stats.total++;
    aggregation.stats.byLevel[entry.level] =
      (aggregation.stats.byLevel[entry.level] || 0) + 1;
    aggregation.stats.byCategory[entry.category] =
      (aggregation.stats.byCategory[entry.category] || 0) + 1;

    // エラー率の計算
    const errorCount =
      (aggregation.stats.byLevel[LogLevel.ERROR] || 0) +
      (aggregation.stats.byLevel[LogLevel.FATAL] || 0);
    aggregation.stats.errorRate = (errorCount / aggregation.stats.total) * 100;

    // 失敗テストの記録
    if (entry.level >= LogLevel.ERROR && entry.context?.testInfo?.title) {
      const testTitle = entry.context.testInfo.title;
      if (!aggregation.stats.failedTests.includes(testTitle)) {
        aggregation.stats.failedTests.push(testTitle);
      }
    }

    // テスト実行時間の集計
    if (entry.context?.performance?.duration) {
      const durations = (aggregation as any).durations || [];
      durations.push(entry.context.performance.duration);
      (aggregation as any).durations = durations;
      aggregation.stats.averageTestDuration =
        durations.reduce((a: number, b: number) => a + b) / durations.length;
    }
  }

  /**
   * 集計データの書き込み
   */
  private async writeAggregationData(): Promise<void> {
    if (this.aggregationData.size === 0) {
      return;
    }

    const aggregationFile = path.join(
      this.config.directory,
      "aggregation.jsonl"
    );

    try {
      const aggregationLines = Array.from(this.aggregationData.values())
        .map((agg) => JSON.stringify(agg) + "\n")
        .join("");

      await fs.appendFile(aggregationFile, aggregationLines, "utf8");

      // 書き込み後はクリア（メモリ使用量削減）
      this.aggregationData.clear();
    } catch (error) {
      console.error("集計データ書き込みエラー:", error);
    }
  }

  /**
   * ストリームへの書き込み（Promise版）
   */
  private writeToStream(stream: WriteStream, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
      stream.write(data, "utf8", (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * ストリームの初期化
   */
  private async initializeStreams(): Promise<void> {
    const date = new Date().toISOString().split("T")[0];

    this.currentLogFile = path.join(
      this.config.directory,
      `structured-${date}.jsonl`
    );

    if (this.config.enableIndexing) {
      this.currentIndexFile = path.join(
        this.config.directory,
        `index-${date}.jsonl`
      );
    }

    await this.ensureStreams();
  }

  /**
   * ストリームの確保
   */
  private async ensureStreams(): Promise<void> {
    if (!this.logStream || this.logStream.destroyed) {
      this.logStream = createWriteStream(this.currentLogFile!, { flags: "a" });
      this.currentOffset = await this.getFileSize(this.currentLogFile!);
    }

    if (
      this.config.enableIndexing &&
      (!this.indexStream || this.indexStream.destroyed)
    ) {
      this.indexStream = createWriteStream(this.currentIndexFile!, {
        flags: "a",
      });
    }
  }

  /**
   * ファイルサイズの取得
   */
  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  /**
   * ディレクトリの確保
   */
  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.directory, { recursive: true });
    } catch (error) {
      console.error("構造化ログディレクトリ作成エラー:", error);
      throw error;
    }
  }

  /**
   * 定期フラッシュタイマーの設定
   */
  private setupFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch((error) => {
        console.error("構造化ログ定期フラッシュエラー:", error);
      });
    }, this.config.flushInterval * 1000);
  }

  /**
   * リソースのクリーンアップ
   */
  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    await this.flush();

    if (this.logStream) {
      await new Promise<void>((resolve, reject) => {
        this.logStream!.end((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    if (this.indexStream) {
      await new Promise<void>((resolve, reject) => {
        this.indexStream!.end((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  }
}
