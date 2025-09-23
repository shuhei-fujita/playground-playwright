/**
 * ログ監視・アラートシステムのセットアップ
 * 日運用での自動監視と障害検知を実現
 */

import { promises as fs } from "fs";
import * as path from "path";

interface MonitoringConfig {
  logDirectory: string;
  alertWebhookUrl?: string;
  emailRecipients?: string[];
  checkInterval: number; // seconds
  thresholds: {
    errorRate: number; // percentage
    responseTime: number; // milliseconds
    diskUsage: number; // percentage
    memoryUsage: number; // percentage
  };
  enabled: boolean;
}

export class LogMonitor {
  private config: MonitoringConfig;
  private monitoring: boolean = false;
  private checkTimer?: NodeJS.Timeout;

  constructor(config: MonitoringConfig) {
    this.config = config;
  }

  /**
   * 監視開始
   */
  start(): void {
    if (this.monitoring || !this.config.enabled) {
      return;
    }

    this.monitoring = true;
    console.log("🔍 ログ監視を開始しました");

    this.checkTimer = setInterval(() => {
      this.performHealthCheck().catch((error) => {
        console.error("ヘルスチェックエラー:", error);
      });
    }, this.config.checkInterval * 1000);

    // 初回チェック
    this.performHealthCheck().catch(console.error);
  }

  /**
   * 監視停止
   */
  stop(): void {
    if (!this.monitoring) {
      return;
    }

    this.monitoring = false;
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
    }
    console.log("🔍 ログ監視を停止しました");
  }

  /**
   * ヘルスチェック実行
   */
  private async performHealthCheck(): Promise<void> {
    const checks = [
      this.checkErrorRate(),
      this.checkResponseTime(),
      this.checkDiskUsage(),
      this.checkLogRotation(),
    ];

    const results = await Promise.allSettled(checks);

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`ヘルスチェック${index + 1}が失敗:`, result.reason);
      }
    });
  }

  /**
   * エラー率チェック
   */
  private async checkErrorRate(): Promise<void> {
    try {
      const metricsFile = path.join(
        this.config.logDirectory,
        "metrics",
        "snapshots.jsonl"
      );
      const content = await fs.readFile(metricsFile, "utf8");
      const lines = content
        .trim()
        .split("\n")
        .filter((line) => line);

      if (lines.length === 0) return;

      // 最新のメトリクスを取得
      const latestMetrics = JSON.parse(lines[lines.length - 1]);
      const errorRate = latestMetrics.errorMetrics?.errorRate || 0;

      if (errorRate > this.config.thresholds.errorRate) {
        await this.sendAlert({
          type: "error_rate",
          severity:
            errorRate > this.config.thresholds.errorRate * 2
              ? "critical"
              : "warning",
          message: `エラー率が閾値を超過: ${errorRate.toFixed(2)}%`,
          value: errorRate,
          threshold: this.config.thresholds.errorRate,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      // メトリクスファイルが存在しない場合は正常
      if ((error as any).code !== "ENOENT") {
        throw error;
      }
    }
  }

  /**
   * レスポンス時間チェック
   */
  private async checkResponseTime(): Promise<void> {
    try {
      const metricsFile = path.join(
        this.config.logDirectory,
        "metrics",
        "snapshots.jsonl"
      );
      const content = await fs.readFile(metricsFile, "utf8");
      const lines = content
        .trim()
        .split("\n")
        .filter((line) => line);

      if (lines.length === 0) return;

      const latestMetrics = JSON.parse(lines[lines.length - 1]);
      const avgResponseTime =
        latestMetrics.performanceMetrics?.avgResponseTime || 0;

      if (avgResponseTime > this.config.thresholds.responseTime) {
        await this.sendAlert({
          type: "response_time",
          severity:
            avgResponseTime > this.config.thresholds.responseTime * 2
              ? "critical"
              : "warning",
          message: `平均レスポンス時間が閾値を超過: ${avgResponseTime}ms`,
          value: avgResponseTime,
          threshold: this.config.thresholds.responseTime,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      if ((error as any).code !== "ENOENT") {
        throw error;
      }
    }
  }

  /**
   * ディスク使用量チェック
   */
  private async checkDiskUsage(): Promise<void> {
    try {
      const { execSync } = require("child_process");
      const output = execSync(`du -sb ${this.config.logDirectory}`).toString();
      const usedBytes = parseInt(output.split("\t")[0]);
      const usedMB = usedBytes / (1024 * 1024);

      // 簡易的な警告（1GB以上）
      if (usedMB > 1024) {
        await this.sendAlert({
          type: "disk_usage",
          severity: usedMB > 5120 ? "critical" : "warning", // 5GB以上は重大
          message: `ログディスク使用量が多い: ${(usedMB / 1024).toFixed(2)}GB`,
          value: usedMB,
          threshold: 1024,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.warn("ディスク使用量チェックに失敗:", error);
    }
  }

  /**
   * ログローテーションチェック
   */
  private async checkLogRotation(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.logDirectory);
      const logFiles = files.filter((file) => file.endsWith(".log"));

      for (const file of logFiles) {
        const filePath = path.join(this.config.logDirectory, file);
        const stats = await fs.stat(filePath);
        const sizeMB = stats.size / (1024 * 1024);

        // 100MB以上のファイルは警告
        if (sizeMB > 100) {
          await this.sendAlert({
            type: "log_rotation",
            severity: sizeMB > 500 ? "critical" : "warning",
            message: `ログファイルサイズが大きい: ${file} (${sizeMB.toFixed(
              2
            )}MB)`,
            value: sizeMB,
            threshold: 100,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.warn("ログローテーションチェックに失敗:", error);
    }
  }

  /**
   * アラート送信
   */
  private async sendAlert(alert: any): Promise<void> {
    console.warn(`🚨 ALERT [${alert.type}]: ${alert.message}`);

    // アラートファイルに記録
    const alertsFile = path.join(this.config.logDirectory, "alerts.log");
    const alertLine = `${alert.timestamp} [${alert.severity.toUpperCase()}] ${
      alert.message
    }\n`;

    try {
      await fs.appendFile(alertsFile, alertLine);
    } catch (error) {
      console.error("アラートファイル書き込みエラー:", error);
    }

    // Webhook通知（設定されている場合）
    if (this.config.alertWebhookUrl) {
      try {
        // Node.js 18+ の組み込みfetch または node-fetch を使用
        let fetchFunction: any;

        if (typeof globalThis.fetch !== "undefined") {
          fetchFunction = globalThis.fetch;
        } else {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          fetchFunction = require("node-fetch");
        }

        await fetchFunction(this.config.alertWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `🚨 ${alert.message}`,
            severity: alert.severity,
            timestamp: alert.timestamp,
            type: alert.type,
            value: alert.value,
            threshold: alert.threshold,
          }),
        });
      } catch (error) {
        console.error("Webhook通知エラー:", error);
      }
    }
  }
}

/**
 * デフォルト監視設定
 */
export function getDefaultMonitoringConfig(): MonitoringConfig {
  return {
    logDirectory: "test-results",
    checkInterval: 300, // 5分
    thresholds: {
      errorRate: 5, // 5%
      responseTime: 3000, // 3秒
      diskUsage: 80, // 80%
      memoryUsage: 85, // 85%
    },
    enabled: process.env.NODE_ENV === "production",
  };
}

/**
 * 環境別監視設定
 */
export function getMonitoringConfigByEnvironment(
  env: string
): MonitoringConfig {
  const baseConfig = getDefaultMonitoringConfig();

  switch (env) {
    case "development":
      return {
        ...baseConfig,
        enabled: false,
        checkInterval: 60,
      };

    case "staging":
      return {
        ...baseConfig,
        enabled: true,
        checkInterval: 180, // 3分
        thresholds: {
          ...baseConfig.thresholds,
          errorRate: 10,
        },
      };

    case "production":
      return {
        ...baseConfig,
        enabled: true,
        checkInterval: 300, // 5分
        thresholds: {
          errorRate: 3, // より厳格
          responseTime: 2000, // より厳格
          diskUsage: 75,
          memoryUsage: 80,
        },
      };

    default:
      return baseConfig;
  }
}

/**
 * 監視システムの自動セットアップ
 */
export async function setupMonitoring(): Promise<LogMonitor> {
  const env = process.env.NODE_ENV || "development";
  const config = getMonitoringConfigByEnvironment(env);

  // 環境変数による設定オーバーライド
  if (process.env.ALERT_WEBHOOK_URL) {
    config.alertWebhookUrl = process.env.ALERT_WEBHOOK_URL;
  }

  if (process.env.ALERT_EMAIL_RECIPIENTS) {
    config.emailRecipients = process.env.ALERT_EMAIL_RECIPIENTS.split(",");
  }

  const monitor = new LogMonitor(config);

  if (config.enabled) {
    monitor.start();

    // プロセス終了時の自動停止
    process.on("SIGINT", () => {
      console.log("\n監視システムを停止中...");
      monitor.stop();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      monitor.stop();
      process.exit(0);
    });
  }

  return monitor;
}

/**
 * ダッシュボード用メトリクス集計
 */
export async function generateDashboardData(
  logDirectory: string
): Promise<any> {
  const dashboardData = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      avgDuration: 0,
      errorRate: 0,
    },
    trends: {
      last24h: [] as Array<{
        timestamp: string;
        errorRate: number;
        avgDuration: number;
      }>,
      last7d: [],
    },
    topErrors: [],
    performanceMetrics: {
      avgResponseTime: 0,
      maxResponseTime: 0,
      slowestTests: [],
    },
  };

  try {
    const metricsFile = path.join(logDirectory, "metrics", "snapshots.jsonl");
    const content = await fs.readFile(metricsFile, "utf8");
    const lines = content
      .trim()
      .split("\n")
      .filter((line) => line);

    if (lines.length === 0) return dashboardData;

    const metrics = lines.map((line) => JSON.parse(line));
    const latest = metrics[metrics.length - 1];

    // サマリー情報
    if (latest.testMetrics) {
      dashboardData.summary = {
        totalTests: latest.testMetrics.totalTests,
        passedTests: latest.testMetrics.passedTests,
        failedTests: latest.testMetrics.failedTests,
        avgDuration: latest.testMetrics.avgDuration,
        errorRate: latest.errorMetrics?.errorRate || 0,
      };
    }

    // トレンド情報（簡易版）
    const now = new Date();
    const last24h = metrics.filter((m) => {
      const metricTime = new Date(m.timestamp);
      return now.getTime() - metricTime.getTime() <= 24 * 60 * 60 * 1000;
    });

    dashboardData.trends.last24h = last24h.map((m) => ({
      timestamp: m.timestamp,
      errorRate: m.errorMetrics?.errorRate || 0,
      avgDuration: m.testMetrics?.avgDuration || 0,
    }));

    // トップエラー
    if (latest.errorMetrics?.topErrors) {
      dashboardData.topErrors = latest.errorMetrics.topErrors;
    }

    // パフォーマンスメトリクス
    if (latest.performanceMetrics) {
      dashboardData.performanceMetrics = {
        avgResponseTime: latest.performanceMetrics.avgResponseTime,
        maxResponseTime: latest.performanceMetrics.maxResponseTime,
        slowestTests: [], // TODO: 実装
      };
    }
  } catch (error) {
    console.error("ダッシュボードデータ生成エラー:", error);
  }

  return dashboardData;
}

// CLIでの実行サポート
if (require.main === module) {
  console.log("🔍 ログ監視システムを開始します...");
  setupMonitoring()
    .then(() => {
      console.log("✅ 監視システムが稼働中です");
    })
    .catch((error) => {
      console.error("❌ 監視システムの開始に失敗:", error);
      process.exit(1);
    });
}
