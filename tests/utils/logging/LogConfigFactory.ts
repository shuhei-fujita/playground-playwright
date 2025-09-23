/**
 * LogConfigFactory - 環境別ログ設定の生成
 * 開発・ステージング・本番環境に応じた最適なログ設定を提供
 */

import { LogLevel, LogConfig } from "../../types";
import { LogManager } from "./LogManager";
import { ConsoleEmitter } from "./emitters/ConsoleEmitter";
import { FileEmitter } from "./emitters/FileEmitter";
import { StructuredEmitter } from "./emitters/StructuredEmitter";
import { MetricsEmitter } from "./emitters/MetricsEmitter";

type Environment = "development" | "staging" | "production" | "test";

export class LogConfigFactory {
  /**
   * 環境別のデフォルト設定を取得
   */
  static getDefaultConfig(environment: Environment): LogConfig {
    const baseConfig = {
      sensitiveDataMasking: true,
      environment,
      fileConfig: {
        directory: "test-results/logs",
        maxFileSize: 50, // MB
        maxFiles: 30,
        compress: true,
      },
      metricsConfig: {
        directory: "test-results/metrics",
        flushInterval: 30, // seconds
      },
    };

    switch (environment) {
      case "development":
        return {
          ...baseConfig,
          level: LogLevel.DEBUG,
          enableConsole: true,
          enableFile: true,
          enableStructured: false,
          enableMetrics: false,
        };

      case "test":
        return {
          ...baseConfig,
          level: LogLevel.INFO,
          enableConsole: true,
          enableFile: false,
          enableStructured: false,
          enableMetrics: false,
        };

      case "staging":
        return {
          ...baseConfig,
          level: LogLevel.INFO,
          enableConsole: false,
          enableFile: true,
          enableStructured: true,
          enableMetrics: true,
        };

      case "production":
        return {
          ...baseConfig,
          level: LogLevel.WARN,
          enableConsole: false,
          enableFile: true,
          enableStructured: true,
          enableMetrics: true,
          sensitiveDataMasking: true,
        };

      default:
        throw new Error(`未対応の環境: ${environment}`);
    }
  }

  /**
   * 環境変数からの設定オーバーライド
   */
  static applyEnvironmentOverrides(config: LogConfig): LogConfig {
    const overrides: Partial<LogConfig> = {};

    // ログレベルのオーバーライド
    const logLevel = process.env.LOG_LEVEL;
    if (logLevel && logLevel in LogLevel) {
      overrides.level = LogLevel[logLevel as keyof typeof LogLevel];
    }

    // コンソール出力のオーバーライド
    if (process.env.LOG_CONSOLE !== undefined) {
      overrides.enableConsole = process.env.LOG_CONSOLE === "true";
    }

    // ファイル出力のオーバーライド
    if (process.env.LOG_FILE !== undefined) {
      overrides.enableFile = process.env.LOG_FILE === "true";
    }

    // 構造化ログのオーバーライド
    if (process.env.LOG_STRUCTURED !== undefined) {
      overrides.enableStructured = process.env.LOG_STRUCTURED === "true";
    }

    // メトリクスのオーバーライド
    if (process.env.LOG_METRICS !== undefined) {
      overrides.enableMetrics = process.env.LOG_METRICS === "true";
    }

    // ファイル設定のオーバーライド
    if (process.env.LOG_FILE_DIR) {
      overrides.fileConfig = {
        ...config.fileConfig!,
        directory: process.env.LOG_FILE_DIR,
      };
    }

    return { ...config, ...overrides };
  }

  /**
   * カスタム設定とのマージ
   */
  static mergeCustomConfig(
    baseConfig: LogConfig,
    customConfig: Partial<LogConfig>
  ): LogConfig {
    return {
      ...baseConfig,
      ...customConfig,
      fileConfig: {
        ...baseConfig.fileConfig!,
        ...customConfig.fileConfig,
      },
      metricsConfig: {
        ...baseConfig.metricsConfig!,
        ...customConfig.metricsConfig,
      },
    };
  }

  /**
   * 設定の検証
   */
  static validateConfig(config: LogConfig): void {
    // 必須フィールドの検証
    if (!config.environment) {
      throw new Error("environment は必須です");
    }

    if (config.level < LogLevel.TRACE || config.level > LogLevel.FATAL) {
      throw new Error("無効なログレベルです");
    }

    // ファイル出力が有効な場合のディレクトリ検証
    if (config.enableFile && !config.fileConfig?.directory) {
      throw new Error(
        "ファイル出力が有効な場合、fileConfig.directory は必須です"
      );
    }

    // メトリクスが有効な場合のディレクトリ検証
    if (config.enableMetrics && !config.metricsConfig?.directory) {
      throw new Error(
        "メトリクスが有効な場合、metricsConfig.directory は必須です"
      );
    }

    // ファイルサイズの妥当性チェック
    if (config.fileConfig?.maxFileSize && config.fileConfig.maxFileSize <= 0) {
      throw new Error("maxFileSize は正の値である必要があります");
    }

    // ファイル数の妥当性チェック
    if (config.fileConfig?.maxFiles && config.fileConfig.maxFiles <= 0) {
      throw new Error("maxFiles は正の値である必要があります");
    }
  }

  /**
   * 完全な設定の生成（デフォルト + 環境変数 + カスタム）
   */
  static createConfig(
    environment: Environment,
    customConfig: Partial<LogConfig> = {}
  ): LogConfig {
    let config = this.getDefaultConfig(environment);
    config = this.applyEnvironmentOverrides(config);
    config = this.mergeCustomConfig(config, customConfig);

    this.validateConfig(config);

    return config;
  }

  /**
   * LogManagerの初期化（設定とEmitter自動セットアップ）
   */
  static async initializeLogManager(
    environment: Environment,
    customConfig: Partial<LogConfig> = {}
  ): Promise<LogManager> {
    const config = this.createConfig(environment, customConfig);
    const logManager = LogManager.getInstance(config);

    // Emitterの自動追加
    await this.setupEmitters(logManager, config);

    return logManager;
  }

  /**
   * 設定に基づくEmitterの自動セットアップ
   */
  private static async setupEmitters(
    logManager: LogManager,
    config: LogConfig
  ): Promise<void> {
    // Console Emitter
    if (config.enableConsole) {
      const consoleEmitter = new ConsoleEmitter({
        colorEnabled: config.environment === "development",
        verbose: config.level <= LogLevel.DEBUG,
      });
      logManager.addEmitter(consoleEmitter);
    }

    // File Emitter
    if (config.enableFile && config.fileConfig) {
      const fileEmitter = new FileEmitter({
        directory: config.fileConfig.directory,
        maxFileSize: config.fileConfig.maxFileSize,
        maxFiles: config.fileConfig.maxFiles,
        compress: config.fileConfig.compress,
      });
      logManager.addEmitter(fileEmitter);
    }

    // Structured Emitter
    if (config.enableStructured && config.fileConfig) {
      const structuredEmitter = new StructuredEmitter({
        directory: config.fileConfig.directory + "/structured",
        enableIndexing: config.environment !== "development",
        enableAggregation: config.environment === "production",
        batchSize: config.environment === "production" ? 50 : 10,
        flushInterval: config.environment === "production" ? 60 : 30,
      });
      logManager.addEmitter(structuredEmitter);
    }

    // Metrics Emitter
    if (config.enableMetrics && config.metricsConfig) {
      const metricsEmitter = new MetricsEmitter({
        directory: config.metricsConfig.directory,
        enableRealTimeMetrics: true,
        enableTrendAnalysis: config.environment === "production",
        flushInterval: config.metricsConfig.flushInterval,
        retentionDays: config.environment === "production" ? 90 : 30,
        alertThresholds: {
          errorRate: config.environment === "production" ? 5 : 10,
          avgResponseTime: config.environment === "production" ? 3000 : 5000,
          failureRate: config.environment === "production" ? 10 : 20,
        },
      });
      logManager.addEmitter(metricsEmitter);
    }
  }

  /**
   * 設定情報のサマリー表示
   */
  static displayConfigSummary(config: LogConfig): void {
    console.log("\n📊 === ログシステム設定サマリー ===");
    console.log(`🌍 環境: ${config.environment}`);
    console.log(`📈 ログレベル: ${LogLevel[config.level]}`);
    console.log(
      `🖥️  コンソール出力: ${config.enableConsole ? "有効" : "無効"}`
    );
    console.log(`📁 ファイル出力: ${config.enableFile ? "有効" : "無効"}`);
    console.log(`📊 構造化ログ: ${config.enableStructured ? "有効" : "無効"}`);
    console.log(`📈 メトリクス: ${config.enableMetrics ? "有効" : "無効"}`);
    console.log(
      `🔒 機密データマスキング: ${
        config.sensitiveDataMasking ? "有効" : "無効"
      }`
    );

    if (config.fileConfig && config.enableFile) {
      console.log(`📂 ログディレクトリ: ${config.fileConfig.directory}`);
      console.log(`📏 最大ファイルサイズ: ${config.fileConfig.maxFileSize}MB`);
      console.log(`🗂️  最大ファイル数: ${config.fileConfig.maxFiles}`);
    }

    if (config.metricsConfig && config.enableMetrics) {
      console.log(
        `📊 メトリクスディレクトリ: ${config.metricsConfig.directory}`
      );
      console.log(
        `⏱️  フラッシュ間隔: ${config.metricsConfig.flushInterval}秒`
      );
    }

    console.log("=====================================\n");
  }

  /**
   * プリセット設定
   */
  static getPresetConfigs() {
    return {
      // 開発環境：即座のフィードバック重視
      development: {
        description: "開発環境 - 詳細なデバッグ情報とコンソール出力",
        config: this.getDefaultConfig("development"),
      },

      // テスト環境：最小限のオーバーヘッド
      test: {
        description: "テスト環境 - 最小限のログでテスト実行速度を優先",
        config: this.getDefaultConfig("test"),
      },

      // ステージング環境：本番に近い設定
      staging: {
        description: "ステージング環境 - 本番相当の構造化ログとメトリクス",
        config: this.getDefaultConfig("staging"),
      },

      // 本番環境：最高レベルの運用機能
      production: {
        description: "本番環境 - 完全な監視・アラート・分析機能",
        config: this.getDefaultConfig("production"),
      },
    };
  }
}
