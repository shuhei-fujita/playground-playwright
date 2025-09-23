/**
 * MetricsEmitter - メトリクス収集・分析用Emitter
 * テスト実行メトリクス、パフォーマンス指標、傾向分析
 */

import { promises as fs } from "fs";
import * as path from "path";
import {
  LogEmitter,
  LogEntry,
  LogLevel,
  LogCategory,
  TestMetrics,
} from "../types";

interface MetricsEmitterConfig {
  directory: string;
  enableRealTimeMetrics: boolean;
  enableTrendAnalysis: boolean;
  flushInterval: number; // seconds
  retentionDays: number; // days
  alertThresholds: {
    errorRate: number; // percentage
    avgResponseTime: number; // milliseconds
    failureRate: number; // percentage
  };
}

interface MetricsSnapshot {
  timestamp: string;
  period: string;
  testMetrics: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
  };
  performanceMetrics: {
    avgResponseTime: number;
    maxResponseTime: number;
    avgMemoryUsage: number;
    networkRequests: number;
  };
  errorMetrics: {
    totalErrors: number;
    errorRate: number;
    criticalErrors: number;
    warningCount: number;
    topErrors: Array<{ message: string; count: number }>;
  };
  browserMetrics: {
    chromium: number;
    firefox: number;
    webkit: number;
  };
  trends: {
    errorRateTrend: "increasing" | "decreasing" | "stable";
    performanceTrend: "improving" | "degrading" | "stable";
    testCountTrend: "increasing" | "decreasing" | "stable";
  };
}

interface AlertData {
  timestamp: string;
  type: "error_rate" | "performance" | "failure_rate";
  severity: "warning" | "critical";
  message: string;
  value: number;
  threshold: number;
  context?: any;
}

export class MetricsEmitter implements LogEmitter {
  private config: MetricsEmitterConfig;
  private metricsBuffer: LogEntry[] = [];
  private testMetrics: Map<string, TestMetrics> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private performanceData: number[] = [];
  private browserCounts: Map<string, number> = new Map();
  private historicalData: MetricsSnapshot[] = [];
  private flushTimer?: NodeJS.Timeout;

  constructor(config: MetricsEmitterConfig) {
    this.config = config;
    this.ensureDirectory();
    this.loadHistoricalData();
    this.setupFlushTimer();
  }

  /**
   * ログエントリからメトリクス情報を抽出
   */
  async emit(entry: LogEntry): Promise<void> {
    this.metricsBuffer.push(entry);

    // リアルタイム処理
    if (this.config.enableRealTimeMetrics) {
      this.processRealTimeMetrics(entry);
    }

    // しきい値チェック
    this.checkAlertThresholds(entry);
  }

  /**
   * リアルタイムメトリクス処理
   */
  private processRealTimeMetrics(entry: LogEntry): void {
    // テストメトリクスの更新
    if (
      entry.category === LogCategory.TEST_EXECUTION &&
      entry.context?.testInfo
    ) {
      this.updateTestMetrics(entry);
    }

    // パフォーマンスメトリクスの収集
    if (entry.context?.performance) {
      this.performanceData.push(entry.context.performance.duration);

      // 最新1000件に制限
      if (this.performanceData.length > 1000) {
        this.performanceData = this.performanceData.slice(-1000);
      }
    }

    // エラーカウントの更新
    if (entry.level >= LogLevel.ERROR) {
      const errorKey = entry.error?.name || entry.message;
      this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);
    }

    // ブラウザメトリクスの更新
    if (entry.context?.browser?.name) {
      const browser = entry.context.browser.name;
      this.browserCounts.set(
        browser,
        (this.browserCounts.get(browser) || 0) + 1
      );
    }
  }

  /**
   * テストメトリクスの更新
   */
  private updateTestMetrics(entry: LogEntry): void {
    const testInfo = entry.context?.testInfo;
    if (!testInfo) return;

    const testId = `${testInfo.file}::${testInfo.title}`;
    let metrics = this.testMetrics.get(testId);

    if (!metrics) {
      metrics = {
        testName: testInfo.title,
        startTime: new Date(entry.timestamp),
        status: "running",
        browser: entry.context?.browser?.name || "unknown",
        errorCount: 0,
        warningCount: 0,
      };
      this.testMetrics.set(testId, metrics);
    }

    // ステータス更新の判定
    if (entry.message.includes("テスト開始")) {
      metrics.startTime = new Date(entry.timestamp);
      metrics.status = "running";
    } else if (
      entry.message.includes("テスト成功") ||
      entry.message.includes("✅")
    ) {
      metrics.endTime = new Date(entry.timestamp);
      metrics.duration =
        metrics.endTime.getTime() - metrics.startTime.getTime();
      metrics.status = "passed";
    } else if (
      entry.message.includes("テスト失敗") ||
      entry.message.includes("❌")
    ) {
      metrics.endTime = new Date(entry.timestamp);
      metrics.duration =
        metrics.endTime.getTime() - metrics.startTime.getTime();
      metrics.status = "failed";
    } else if (
      entry.message.includes("スキップ") ||
      entry.message.includes("⏭️")
    ) {
      metrics.status = "skipped";
    }

    // エラー・警告カウント
    if (entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL) {
      metrics.errorCount++;
    } else if (entry.level === LogLevel.WARN) {
      metrics.warningCount++;
    }

    // パフォーマンスメトリクス
    if (entry.context?.performance) {
      metrics.performanceMetrics = entry.context.performance;
    }
  }

  /**
   * アラートしきい値のチェック
   */
  private checkAlertThresholds(entry: LogEntry): void {
    // エラー率チェック
    const errorRate = this.calculateCurrentErrorRate();
    if (errorRate > this.config.alertThresholds.errorRate) {
      this.generateAlert({
        timestamp: entry.timestamp,
        type: "error_rate",
        severity:
          errorRate > this.config.alertThresholds.errorRate * 2
            ? "critical"
            : "warning",
        message: `エラー率が閾値を超過: ${errorRate.toFixed(2)}%`,
        value: errorRate,
        threshold: this.config.alertThresholds.errorRate,
        context: { entry: entry.message },
      });
    }

    // パフォーマンスチェック
    if (entry.context?.performance?.duration) {
      const responseTime = entry.context.performance.duration;
      if (responseTime > this.config.alertThresholds.avgResponseTime) {
        this.generateAlert({
          timestamp: entry.timestamp,
          type: "performance",
          severity:
            responseTime > this.config.alertThresholds.avgResponseTime * 2
              ? "critical"
              : "warning",
          message: `レスポンス時間が閾値を超過: ${responseTime}ms`,
          value: responseTime,
          threshold: this.config.alertThresholds.avgResponseTime,
          context: {
            testTitle: entry.context?.testInfo?.title,
            url: entry.context?.page?.url,
          },
        });
      }
    }
  }

  /**
   * 現在のエラー率を計算
   */
  private calculateCurrentErrorRate(): number {
    const recentEntries = this.metricsBuffer.slice(-100); // 最新100件
    if (recentEntries.length === 0) return 0;

    const errorCount = recentEntries.filter(
      (entry) => entry.level >= LogLevel.ERROR
    ).length;
    return (errorCount / recentEntries.length) * 100;
  }

  /**
   * アラートの生成
   */
  private async generateAlert(alert: AlertData): Promise<void> {
    const alertsFile = path.join(this.config.directory, "alerts.jsonl");
    const alertLine = JSON.stringify(alert) + "\n";

    try {
      await fs.appendFile(alertsFile, alertLine, "utf8");

      // コンソールにも出力（即座な通知）
      const emoji = alert.severity === "critical" ? "🚨" : "⚠️";
      console.warn(`${emoji} ALERT [${alert.type}]: ${alert.message}`);
    } catch (error) {
      console.error("アラート書き込みエラー:", error);
    }
  }

  /**
   * メトリクススナップショットの生成
   */
  private generateSnapshot(): MetricsSnapshot {
    const now = new Date().toISOString();
    const tests = Array.from(this.testMetrics.values());

    // テストメトリクス
    const passedTests = tests.filter((t) => t.status === "passed").length;
    const failedTests = tests.filter((t) => t.status === "failed").length;
    const skippedTests = tests.filter((t) => t.status === "skipped").length;
    const completedTests = tests.filter((t) => t.duration !== undefined);
    const durations = completedTests
      .map((t) => t.duration!)
      .filter((d) => d > 0);

    // パフォーマンスメトリクス
    const avgResponseTime =
      this.performanceData.length > 0
        ? this.performanceData.reduce((a, b) => a + b) /
          this.performanceData.length
        : 0;

    // エラーメトリクス
    const totalErrors = Array.from(this.errorCounts.values()).reduce(
      (a, b) => a + b,
      0
    );
    const errorRate = tests.length > 0 ? (failedTests / tests.length) * 100 : 0;

    const topErrors = Array.from(this.errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));

    // トレンド分析
    const trends = this.config.enableTrendAnalysis
      ? this.analyzeTrends()
      : {
          errorRateTrend: "stable" as const,
          performanceTrend: "stable" as const,
          testCountTrend: "stable" as const,
        };

    return {
      timestamp: now,
      period: "1h",
      testMetrics: {
        totalTests: tests.length,
        passedTests,
        failedTests,
        skippedTests,
        avgDuration:
          durations.length > 0
            ? durations.reduce((a, b) => a + b) / durations.length
            : 0,
        maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
        minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      },
      performanceMetrics: {
        avgResponseTime,
        maxResponseTime:
          this.performanceData.length > 0
            ? Math.max(...this.performanceData)
            : 0,
        avgMemoryUsage: 0, // TODO: メモリ使用量の計算
        networkRequests: 0, // TODO: ネットワークリクエスト数の計算
      },
      errorMetrics: {
        totalErrors,
        errorRate,
        criticalErrors: Array.from(this.errorCounts.entries()).filter(
          ([msg]) =>
            msg.toLowerCase().includes("fatal") ||
            msg.toLowerCase().includes("critical")
        ).length,
        warningCount: this.metricsBuffer.filter(
          (e) => e.level === LogLevel.WARN
        ).length,
        topErrors,
      },
      browserMetrics: {
        chromium: this.browserCounts.get("chromium") || 0,
        firefox: this.browserCounts.get("firefox") || 0,
        webkit: this.browserCounts.get("webkit") || 0,
      },
      trends,
    };
  }

  /**
   * トレンド分析
   */
  private analyzeTrends(): MetricsSnapshot["trends"] {
    if (this.historicalData.length < 2) {
      return {
        errorRateTrend: "stable",
        performanceTrend: "stable",
        testCountTrend: "stable",
      };
    }

    const current = this.historicalData[this.historicalData.length - 1];
    const previous = this.historicalData[this.historicalData.length - 2];

    // エラー率トレンド
    const errorRateDiff =
      current.errorMetrics.errorRate - previous.errorMetrics.errorRate;
    const errorRateTrend =
      errorRateDiff > 2
        ? "increasing"
        : errorRateDiff < -2
        ? "decreasing"
        : "stable";

    // パフォーマンストレンド
    const perfDiff =
      current.performanceMetrics.avgResponseTime -
      previous.performanceMetrics.avgResponseTime;
    const performanceTrend =
      perfDiff > 100 ? "degrading" : perfDiff < -100 ? "improving" : "stable";

    // テスト数トレンド
    const testDiff =
      current.testMetrics.totalTests - previous.testMetrics.totalTests;
    const testCountTrend =
      testDiff > 5 ? "increasing" : testDiff < -5 ? "decreasing" : "stable";

    return { errorRateTrend, performanceTrend, testCountTrend };
  }

  /**
   * 履歴データの読み込み
   */
  private async loadHistoricalData(): Promise<void> {
    const snapshotsFile = path.join(this.config.directory, "snapshots.jsonl");

    try {
      const content = await fs.readFile(snapshotsFile, "utf8");
      const lines = content
        .trim()
        .split("\n")
        .filter((line) => line);

      this.historicalData = lines
        .map((line) => JSON.parse(line))
        .sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
    } catch (error) {
      // ファイルが存在しない場合は問題なし
      if ((error as any).code !== "ENOENT") {
        console.error("履歴データ読み込みエラー:", error);
      }
    }
  }

  /**
   * バッファのフラッシュとスナップショット生成
   */
  async flush(): Promise<void> {
    if (this.metricsBuffer.length === 0) {
      return;
    }

    try {
      // スナップショットの生成と保存
      const snapshot = this.generateSnapshot();
      await this.saveSnapshot(snapshot);

      // 履歴データの更新
      this.historicalData.push(snapshot);

      // 古いデータの削除
      await this.cleanupOldData();

      // バッファのクリア
      this.metricsBuffer = [];
    } catch (error) {
      console.error("メトリクスフラッシュエラー:", error);
    }
  }

  /**
   * スナップショットの保存
   */
  private async saveSnapshot(snapshot: MetricsSnapshot): Promise<void> {
    const snapshotsFile = path.join(this.config.directory, "snapshots.jsonl");
    const snapshotLine = JSON.stringify(snapshot) + "\n";

    await fs.appendFile(snapshotsFile, snapshotLine, "utf8");
  }

  /**
   * 古いデータのクリーンアップ
   */
  private async cleanupOldData(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    // メモリ内データのクリーンアップ
    this.historicalData = this.historicalData.filter(
      (snapshot) => new Date(snapshot.timestamp) > cutoffDate
    );

    // ファイルからも古いデータを削除（実装を簡略化）
    // 実本格運用では、より効率的な方法を検討
  }

  /**
   * ディレクトリの確保
   */
  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.directory, { recursive: true });
    } catch (error) {
      console.error("メトリクスディレクトリ作成エラー:", error);
      throw error;
    }
  }

  /**
   * 定期フラッシュタイマーの設定
   */
  private setupFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch((error) => {
        console.error("メトリクス定期フラッシュエラー:", error);
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
  }
}
