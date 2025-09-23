/**
 * Playwright E2Eテスト 統一型定義 / Unified Type Definitions for Playwright E2E Tests
 *
 * プロジェクト全体で使用される型定義を一箇所に集約
 * All type definitions used across the project are consolidated here
 *
 * セクション構成 / Section Structure:
 * - ログシステム関連型 / Logging System Types
 * - 品質チェック関連型 / Quality Check Types
 * - テストフィクスチャ関連型 / Test Fixture Types
 * - テストデータ関連型 / Test Data Types
 * - テスト設定関連型 / Test Configuration Types
 */

import type { BrowserContext, Page } from "@playwright/test";
import type { TestLogger } from "./utils/TestLogger";
import type { LogManager } from "./utils/logging/LogManager";
import type { BasePage } from "./pages/BasePage";

// ===================================
// ログシステム関連型 / Logging System Types
// ===================================

// ログレベル定義
export enum LogLevel {
  TRACE = 0, // 詳細なトレース情報（開発時のみ）
  DEBUG = 1, // デバッグ情報（開発・テスト環境）
  INFO = 2, // 一般的な情報（全環境）
  WARN = 3, // 警告（全環境）
  ERROR = 4, // エラー（全環境）
  FATAL = 5, // 致命的エラー（全環境）
}

// ログカテゴリ定義
export enum LogCategory {
  TEST_EXECUTION = "test_execution", // テスト実行関連
  PAGE_INTERACTION = "page_interaction", // ページ操作関連
  PERFORMANCE = "performance", // パフォーマンス関連
  SECURITY = "security", // セキュリティ関連
  SYSTEM = "system", // システム関連
  USER_ACTION = "user_action", // ユーザーアクション
  NETWORK = "network", // ネットワーク関連
  ERROR_HANDLING = "error_handling", // エラーハンドリング
}

// テスト情報
export interface TestInfo {
  title: string;
  file?: string;
  line?: number;
  testId?: string;
  sessionId?: string;
  retryCount?: number;
}

// ブラウザ情報
export interface BrowserInfo {
  name: string;
  version?: string;
  platform?: string;
  viewport?: {
    width: number;
    height: number;
  };
}

// ページ情報
export interface PageInfo {
  url: string;
  title?: string;
  loadState?: string;
  responseTime?: number;
}

// パフォーマンス情報
export interface PerformanceInfo {
  duration: number;
  memory?: number;
  networkRequests?: number;
  domContentLoaded?: number;
  firstContentfulPaint?: number;
}

// セキュリティ情報
export interface SecurityInfo {
  authAttempt?: boolean;
  sensitiveDataAccess?: boolean;
  permissionRequest?: string;
  securityWarning?: string;
}

// ログコンテキスト
export interface LogContext {
  testInfo?: TestInfo;
  browser?: BrowserInfo;
  page?: PageInfo;
  performance?: PerformanceInfo;
  security?: SecurityInfo;
  customData?: Record<string, any>;
}

// ログメタデータ
export interface LogMetadata {
  correlationId: string;
  environment: string;
  version?: string;
  hostname?: string;
  processId?: number;
  threadId?: string;
}

// メインのログエントリ
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  context?: LogContext;
  metadata: LogMetadata;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

// ログ設定
export interface LogConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableStructured: boolean;
  enableMetrics: boolean;
  fileConfig?: {
    directory: string;
    maxFileSize: number; // MB
    maxFiles: number;
    compress: boolean;
  };
  metricsConfig?: {
    directory: string;
    flushInterval: number; // seconds
  };
  sensitiveDataMasking: boolean;
  environment: "development" | "staging" | "production" | "test";
}

// ログEmitterインターフェース
export interface LogEmitter {
  emit(entry: LogEntry): Promise<void>;
  flush?(): Promise<void>;
  close?(): Promise<void>;
}

// メトリクス定義
export interface TestMetrics {
  testName: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: "running" | "passed" | "failed" | "skipped";
  browser: string;
  errorCount: number;
  warningCount: number;
  performanceMetrics?: PerformanceInfo;
  screenshots?: string[];
  videos?: string[];
}

// アラート設定
export interface AlertConfig {
  enabled: boolean;
  errorThreshold: number;
  failureRateThreshold: number; // percentage
  responseTimeThreshold: number; // milliseconds
  webhookUrl?: string;
  emailRecipients?: string[];
}

// ===================================
// 品質チェック関連型 / Quality Check Types
// ===================================

/**
 * 品質チェック結果の型定義
 */
export interface QualityCheckResult {
  filePath: string;
  passed: boolean;
  issues: QualityIssue[];
  score: number; // 0-100のスコア
  recommendations: QualityRecommendation[];
}

export interface QualityIssue {
  type: "VIOLATION" | "WARNING";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  message: string;
  why: string;
  recommendation: string;
}

export interface QualityRecommendation {
  type: "IMPROVEMENT" | "SUGGESTION";
  message: string;
  why: string;
}

export interface ProjectQualityReport {
  overallScore: number;
  fileResults: QualityCheckResult[];
  summary: {
    totalFiles: number;
    passedFiles: number;
    criticalIssues: number;
    recommendations: number;
  };
  improvements: string[];
}

// ===================================
// テストフィクスチャ関連型 / Test Fixture Types
// ===================================

/**
 * 拡張テストフィクスチャ
 * 共通機能を全てのテストで利用可能にする
 */
export interface TestFixtures {
  // 基本のPlaywrightオブジェクト（拡張）
  contextWithAuth: BrowserContext;
  pageWithLogging: Page;

  // カスタムユーティリティ
  logger: TestLogger;
  config: TestConfig;
  logManager: LogManager; // 新ログシステム

  // ページオブジェクト用のベースページ
  basePage: BasePage;
}

// ===================================
// テストデータ関連型 / Test Data Types
// ===================================

// CSV テストデータのスキーマ定義
export interface CsvTestDataRow {
  id: string;
  testName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  runTest: "true" | "false";
}

// ===================================
// テスト設定関連型 / Test Configuration Types
// ===================================

// テスト設定型（TestConfig.tsのconfigオブジェクトの型）
// 実際のconfigオブジェクトから型推論される
export type TestConfig = {
  readonly baseUrl: string;
  readonly ticketPiaUrl: string;
  readonly playwrightUrl: string;
  readonly todoAppUrl: string;
  readonly w3schoolsFormUrl: string;
  readonly libecityUrl: string;
  readonly defaultTimeout: number;
  readonly navigationTimeout: number;
  readonly elementTimeout: number;
  readonly ticketPiaEmail: string;
  readonly ticketPiaPassword: string;
  readonly githubUsername: string;
  readonly githubPassword: string;
  readonly libecityEmail: string;
  readonly libecityPassword: string;
  readonly isHeadless: boolean;
  readonly slowMo: number;
  readonly screenshot: "only-on-failure";
  readonly video: "off" | "on" | "retain-on-failure";
  readonly retries: number;
  readonly debugMode: boolean;
  readonly verboseLogging: boolean;
  readonly authFilePath: string;
  readonly screenshotDir: string;
  readonly reportsDir: string;
  readonly hasTicketPiaCredentials: () => boolean;
  readonly hasGitHubCredentials: () => boolean;
  readonly hasLibecityCredentials: () => boolean;
  readonly displayConfig: () => void;
};

// ===================================
// 型エクスポートのまとめ / Type Export Summary
// ===================================

// 主要な型のre-export（利便性向上のため）
export type {
  // Playwright基本型
  BrowserContext,
  Page,
} from "@playwright/test";

// プロジェクト固有クラス型
export type { TestLogger } from "./utils/TestLogger";
export type { LogManager } from "./utils/logging/LogManager";
export type { BasePage } from "./pages/BasePage";
