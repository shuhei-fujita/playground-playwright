/**
 * ログシステムの型定義
 * 日運用に対応した構造化ログのインターフェース
 */

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
  environment: "development" | "staging" | "production";
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
