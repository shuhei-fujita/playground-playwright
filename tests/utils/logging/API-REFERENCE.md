# 📚 ログシステム API リファレンス

> **完全なAPI仕様書** - クラス・メソッド・インターフェースの詳細仕様

## 🎯 API概要

### 📊 主要コンポーネント

| コンポーネント       | 役割                 | エクスポート                                   |
| -------------------- | -------------------- | ---------------------------------------------- |
| **LogManager**       | ログ管理の中心クラス | `LogManager`                                   |
| **LogConfigFactory** | 設定生成・管理       | `LogConfigFactory`                             |
| **Emitters**         | 出力機能             | `ConsoleEmitter`, `FileEmitter`, etc.          |
| **Types**            | 型定義               | `LogLevel`, `LogCategory`, etc.                |
| **Utilities**        | 便利関数             | `initializeLoggingSystem`, `createQuickLogger` |

---

## 🧠 LogManager

### 📝 概要
ログシステムの中心クラス。シングルトンパターンでアプリケーション全体のログを管理。

### 🏗️ コンストラクタ

```typescript
private constructor(config: LogConfig)
```

**パラメータ**:
- `config`: ログ設定オブジェクト

**注意**: privateコンストラクタのため、直接インスタンス化不可。`getInstance()`を使用。

### 🔧 静的メソッド

#### `getInstance(config?: LogConfig): LogManager`

シングルトンインスタンスの取得

**パラメータ**:
- `config` (optional): 初回初期化時の設定

**戻り値**: `LogManager` インスタンス

**例**:
```typescript
// 初回初期化
const logger = LogManager.getInstance(config);

// 既存インスタンス取得
const logger = LogManager.getInstance();
```

**エラー**:
- 初回初期化時に`config`が未指定の場合、`Error`をthrow

### 📤 Emitter管理

#### `addEmitter(emitter: LogEmitter): void`

Emitterを追加

**パラメータ**:
- `emitter`: 追加するEmitterインスタンス

**例**:
```typescript
const consoleEmitter = new ConsoleEmitter();
logger.addEmitter(consoleEmitter);
```

#### `removeEmitter(emitter: LogEmitter): void`

Emitterを削除

**パラメータ**:
- `emitter`: 削除するEmitterインスタンス

**例**:
```typescript
logger.removeEmitter(consoleEmitter);
```

### ⚙️ 設定管理

#### `updateConfig(config: Partial<LogConfig>): void`

実行時設定更新

**パラメータ**:
- `config`: 更新する設定項目（部分的）

**例**:
```typescript
logger.updateConfig({
  level: LogLevel.DEBUG,
  enableConsole: true
});
```

#### `getConfig(): LogConfig`

現在の設定を取得

**戻り値**: 設定オブジェクトのコピー

**例**:
```typescript
const currentConfig = logger.getConfig();
console.log(`現在のレベル: ${LogLevel[currentConfig.level]}`);
```

### 📝 ログ出力メソッド

#### `trace(message: string, category?: LogCategory, context?: LogContext): void`

TRACEレベルログ

**パラメータ**:
- `message`: ログメッセージ
- `category` (optional): ログカテゴリ (default: `LogCategory.SYSTEM`)
- `context` (optional): コンテキスト情報

**例**:
```typescript
logger.trace('詳細デバッグ情報', LogCategory.SYSTEM, {
  customData: { variable: value }
});
```

#### `debug(message: string, category?: LogCategory, context?: LogContext): void`

DEBUGレベルログ

#### `info(message: string, category?: LogCategory, context?: LogContext): void`

INFOレベルログ

#### `warn(message: string, category?: LogCategory, context?: LogContext): void`

WARNレベルログ

#### `error(message: string, category?: LogCategory, context?: LogContext, error?: Error): void`

ERRORレベルログ

**パラメータ**:
- `error` (optional): Errorオブジェクト（スタックトレース付加用）

**例**:
```typescript
try {
  // 何らかの処理
} catch (error) {
  logger.error('処理でエラーが発生', LogCategory.ERROR_HANDLING, {
    operation: 'dataProcessing'
  }, error);
}
```

#### `fatal(message: string, category?: LogCategory, context?: LogContext, error?: Error): void`

FATALレベルログ

### 🎭 テスト専用メソッド

#### `startTest(testTitle: string, context?: LogContext): void`

テスト開始ログ

**パラメータ**:
- `testTitle`: テスト名
- `context` (optional): テストコンテキスト

**例**:
```typescript
logger.startTest('ログインテスト', {
  testInfo: {
    title: 'ログインテスト',
    file: 'login.spec.ts'
  },
  browser: {
    name: 'chromium'
  }
});
```

#### `endTest(testTitle: string, status: 'passed' | 'failed' | 'skipped', duration?: number, context?: LogContext): void`

テスト完了ログ

**パラメータ**:
- `testTitle`: テスト名
- `status`: テスト結果
- `duration` (optional): 実行時間（ミリ秒）
- `context` (optional): コンテキスト情報

**例**:
```typescript
logger.endTest('ログインテスト', 'passed', 2400, {
  performance: { duration: 2400 }
});
```

#### `pageAction(action: string, url: string, context?: LogContext): void`

ページ操作ログ

**パラメータ**:
- `action`: 操作種別
- `url`: 対象URL
- `context` (optional): コンテキスト情報

**例**:
```typescript
logger.pageAction('navigate', 'https://example.com', {
  page: {
    url: 'https://example.com',
    responseTime: 1200
  }
});
```

#### `performance(message: string, metrics: any, context?: LogContext): void`

パフォーマンスログ

**パラメータ**:
- `message`: メッセージ
- `metrics`: パフォーマンス指標
- `context` (optional): コンテキスト情報

**例**:
```typescript
logger.performance('ページロード完了', {
  duration: 1800,
  memory: 52.1,
  networkRequests: 8
});
```

#### `security(message: string, securityContext: any, context?: LogContext): void`

セキュリティログ

**パラメータ**:
- `message`: メッセージ
- `securityContext`: セキュリティ関連情報
- `context` (optional): コンテキスト情報

**例**:
```typescript
logger.security('認証試行', {
  authAttempt: true,
  success: true,
  user: 'user@example.com'
});
```

### 🔄 システム管理

#### `flush(): Promise<void>`

全Emitterのバッファをフラッシュ

**戻り値**: Promise（完了時にresolve）

**例**:
```typescript
await logger.flush();
```

#### `close(): Promise<void>`

ログシステムのクリーンアップ・クローズ

**戻り値**: Promise（完了時にresolve）

**例**:
```typescript
await logger.close();
```

### 🔍 情報取得

#### `getSessionId(): string`

現在のセッションIDを取得

**戻り値**: セッションID（UUID）

#### `getCorrelationId(): string`

相関IDを取得

**戻り値**: 相関ID（UUID）

---

## ⚙️ LogConfigFactory

### 📝 概要
環境別ログ設定の生成・管理クラス。静的メソッドのみ提供。

### 🌍 環境別設定

#### `getDefaultConfig(environment: Environment): LogConfig`

環境別デフォルト設定を取得

**パラメータ**:
- `environment`: `'development' | 'staging' | 'production' | 'test'`

**戻り値**: 環境別設定オブジェクト

**例**:
```typescript
const devConfig = LogConfigFactory.getDefaultConfig('development');
const prodConfig = LogConfigFactory.getDefaultConfig('production');
```

#### `applyEnvironmentOverrides(config: LogConfig): LogConfig`

環境変数による設定オーバーライド

**パラメータ**:
- `config`: ベース設定

**戻り値**: オーバーライド適用後の設定

**対応環境変数**:
- `LOG_LEVEL`: ログレベル
- `LOG_CONSOLE`: コンソール出力有効化
- `LOG_FILE`: ファイル出力有効化
- `LOG_STRUCTURED`: 構造化ログ有効化
- `LOG_METRICS`: メトリクス有効化
- `LOG_FILE_DIR`: ログファイルディレクトリ

**例**:
```typescript
// 環境変数: LOG_LEVEL=DEBUG, LOG_CONSOLE=true
const config = LogConfigFactory.applyEnvironmentOverrides(baseConfig);
// config.level === LogLevel.DEBUG
// config.enableConsole === true
```

### 🔧 設定管理

#### `mergeCustomConfig(baseConfig: LogConfig, customConfig: Partial<LogConfig>): LogConfig`

カスタム設定のマージ

**パラメータ**:
- `baseConfig`: ベース設定
- `customConfig`: カスタム設定（部分的）

**戻り値**: マージ後の設定

**例**:
```typescript
const finalConfig = LogConfigFactory.mergeCustomConfig(baseConfig, {
  level: LogLevel.INFO,
  enableMetrics: true
});
```

#### `validateConfig(config: LogConfig): void`

設定の妥当性検証

**パラメータ**:
- `config`: 検証する設定

**エラー**:
- 必須項目不足時: `Error`をthrow
- 値が不正時: `Error`をthrow

**例**:
```typescript
try {
  LogConfigFactory.validateConfig(config);
  console.log('設定は有効です');
} catch (error) {
  console.error('設定エラー:', error.message);
}
```

#### `createConfig(environment: Environment, customConfig?: Partial<LogConfig>): LogConfig`

完全な設定生成（デフォルト + 環境変数 + カスタム）

**パラメータ**:
- `environment`: 環境種別
- `customConfig` (optional): カスタム設定

**戻り値**: 最終設定

**例**:
```typescript
const config = LogConfigFactory.createConfig('production', {
  enableMetrics: true,
  fileConfig: {
    maxFileSize: 200
  }
});
```

### 🚀 自動初期化

#### `initializeLogManager(environment: Environment, customConfig?: Partial<LogConfig>): Promise<LogManager>`

LogManagerの自動初期化

**パラメータ**:
- `environment`: 環境種別
- `customConfig` (optional): カスタム設定

**戻り値**: Promise<LogManager>（初期化済みインスタンス）

**例**:
```typescript
const logger = await LogConfigFactory.initializeLogManager('production', {
  enableMetrics: true
});
```

### 📊 設定表示

#### `displayConfigSummary(config: LogConfig): void`

設定サマリーの表示

**パラメータ**:
- `config`: 表示する設定

**例**:
```typescript
LogConfigFactory.displayConfigSummary(config);
// 出力:
// 📊 === ログシステム設定サマリー ===
// 🌍 環境: production
// 📈 ログレベル: WARN
// ...
```

#### `getPresetConfigs(): object`

プリセット設定の取得

**戻り値**: 環境別プリセット設定オブジェクト

**例**:
```typescript
const presets = LogConfigFactory.getPresetConfigs();
console.log(presets.development.description);
// "開発環境 - 詳細なデバッグ情報とコンソール出力"
```

---

## 📤 Emitters

### 🖥️ ConsoleEmitter

#### `constructor(options?: { colorEnabled?: boolean; verbose?: boolean })`

**パラメータ**:
- `options.colorEnabled` (default: true): カラー出力有効化
- `options.verbose` (default: false): 詳細モード

#### `emit(entry: LogEntry): Promise<void>`

ログエントリをコンソールに出力

### 📁 FileEmitter

#### `constructor(config: FileEmitterConfig)`

**パラメータ**:
```typescript
interface FileEmitterConfig {
  directory: string;        // 出力ディレクトリ
  maxFileSize: number;      // 最大ファイルサイズ（MB）
  maxFiles: number;         // 保持ファイル数
  compress: boolean;        // 圧縮有効化
  filePattern?: string;     // ファイル名パターン
}
```

#### `emit(entry: LogEntry): Promise<void>`

ログエントリをファイルに出力

#### `flush(): Promise<void>`

バッファ内容をファイルに書き込み

#### `close(): Promise<void>`

ファイルストリームをクローズ

### 📊 StructuredEmitter

#### `constructor(config: StructuredEmitterConfig)`

**パラメータ**:
```typescript
interface StructuredEmitterConfig {
  directory: string;           // 出力ディレクトリ
  enableIndexing: boolean;     // インデックス生成
  enableAggregation: boolean;  // 集計データ生成
  batchSize: number;          // バッチサイズ
  flushInterval: number;      // フラッシュ間隔（秒）
}
```

### 📈 MetricsEmitter

#### `constructor(config: MetricsEmitterConfig)`

**パラメータ**:
```typescript
interface MetricsEmitterConfig {
  directory: string;
  enableRealTimeMetrics: boolean;
  enableTrendAnalysis: boolean;
  flushInterval: number;
  retentionDays: number;
  alertThresholds: {
    errorRate: number;
    avgResponseTime: number;
    failureRate: number;
  };
}
```

---

## 🏷️ 型定義

### 📊 LogLevel

```typescript
enum LogLevel {
  TRACE = 0,  // 詳細トレース
  DEBUG = 1,  // デバッグ情報
  INFO = 2,   // 一般情報
  WARN = 3,   // 警告
  ERROR = 4,  // エラー
  FATAL = 5   // 致命的エラー
}
```

### 🏷️ LogCategory

```typescript
enum LogCategory {
  TEST_EXECUTION = "test_execution",     // テスト実行
  PAGE_INTERACTION = "page_interaction", // ページ操作
  PERFORMANCE = "performance",           // パフォーマンス
  SECURITY = "security",                 // セキュリティ
  SYSTEM = "system",                     // システム
  USER_ACTION = "user_action",          // ユーザーアクション
  NETWORK = "network",                   // ネットワーク
  ERROR_HANDLING = "error_handling"      // エラーハンドリング
}
```

### 📝 LogEntry

```typescript
interface LogEntry {
  timestamp: string;          // ISO 8601形式
  level: LogLevel;           // ログレベル
  category: LogCategory;     // カテゴリ
  message: string;           // メッセージ
  context?: LogContext;      // コンテキスト
  metadata: LogMetadata;     // メタデータ
  error?: {                  // エラー詳細
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}
```

### 🎯 LogContext

```typescript
interface LogContext {
  testInfo?: TestInfo;         // テスト情報
  browser?: BrowserInfo;       // ブラウザ情報
  page?: PageInfo;            // ページ情報
  performance?: PerformanceInfo; // パフォーマンス情報
  security?: SecurityInfo;     // セキュリティ情報
  customData?: Record<string, any>; // カスタムデータ
}
```

### 📋 TestInfo

```typescript
interface TestInfo {
  title: string;         // テスト名
  file?: string;        // ファイル名
  line?: number;        // 行番号
  testId?: string;      // テストID
  sessionId?: string;   // セッションID
  retryCount?: number;  // リトライ回数
}
```

### 🌐 BrowserInfo

```typescript
interface BrowserInfo {
  name: string;          // ブラウザ名
  version?: string;      // バージョン
  platform?: string;    // プラットフォーム
  viewport?: {           // ビューポート
    width: number;
    height: number;
  };
}
```

### 📄 PageInfo

```typescript
interface PageInfo {
  url: string;              // URL
  title?: string;           // ページタイトル
  loadState?: string;       // ロード状態
  responseTime?: number;    // 応答時間
}
```

### ⚡ PerformanceInfo

```typescript
interface PerformanceInfo {
  duration: number;               // 実行時間
  memory?: number;               // メモリ使用量
  networkRequests?: number;      // ネットワークリクエスト数
  domContentLoaded?: number;     // DOMContentLoaded時間
  firstContentfulPaint?: number; // FCP時間
}
```

### 🔒 SecurityInfo

```typescript
interface SecurityInfo {
  authAttempt?: boolean;        // 認証試行
  sensitiveDataAccess?: boolean; // 機密データアクセス
  permissionRequest?: string;   // 権限要求
  securityWarning?: string;     // セキュリティ警告
}
```

### ⚙️ LogConfig

```typescript
interface LogConfig {
  level: LogLevel;                    // ログレベル
  enableConsole: boolean;             // コンソール出力
  enableFile: boolean;                // ファイル出力
  enableStructured: boolean;          // 構造化ログ
  enableMetrics: boolean;             // メトリクス
  fileConfig?: {                      // ファイル設定
    directory: string;
    maxFileSize: number;
    maxFiles: number;
    compress: boolean;
  };
  metricsConfig?: {                   // メトリクス設定
    directory: string;
    flushInterval: number;
  };
  sensitiveDataMasking: boolean;      // 機密データマスキング
  environment: 'development' | 'staging' | 'production'; // 環境
}
```

---

## 🛠️ ユーティリティ関数

### 🚀 initializeLoggingSystem

```typescript
function initializeLoggingSystem(
  customConfig?: Partial<LogConfig>
): Promise<LogManager>
```

環境変数からの自動初期化

**パラメータ**:
- `customConfig` (optional): カスタム設定

**戻り値**: Promise<LogManager>

**例**:
```typescript
const logger = await initializeLoggingSystem({
  level: LogLevel.DEBUG,
  enableConsole: true
});
```

### ⚡ createQuickLogger

```typescript
function createQuickLogger(level?: LogLevel): LogManager
```

開発・テスト用の簡単初期化

**パラメータ**:
- `level` (default: LogLevel.INFO): ログレベル

**戻り値**: LogManager

**例**:
```typescript
const logger = createQuickLogger(LogLevel.DEBUG);
```

### 🏭 initializeProductionLogging

```typescript
function initializeProductionLogging(
  customConfig?: Partial<LogConfig>
): Promise<LogManager>
```

本番環境向け完全初期化

### 🧪 initializeTestLogging

```typescript
function initializeTestLogging(): LogManager
```

テスト環境向け軽量初期化

### 🔄 shutdownLoggingSystem

```typescript
function shutdownLoggingSystem(): Promise<void>
```

ログシステムの完全シャットダウン

**例**:
```typescript
await shutdownLoggingSystem();
```

---

## 🔧 CompatibilityLogger

### 📝 概要
既存システムとの互換性を提供するラッパークラス

### 🏗️ コンストラクタ

```typescript
constructor(logManager?: LogManager)
```

**パラメータ**:
- `logManager` (optional): LogManagerインスタンス

### 📝 互換メソッド

#### `info(message: string, context?: any): void`

INFOレベルログ（互換性）

#### `error(message: string, context?: any): void`

ERRORレベルログ（互換性）

#### `warn(message: string, context?: any): void`

WARNレベルログ（互換性）

#### `debug(message: string, context?: any): void`

DEBUGレベルログ（互換性）

#### `startStep(stepName: string, description?: string): void`

ステップ開始（互換性）

#### `endStep(stepName: string, duration?: number): void`

ステップ完了（互換性）

#### `failStep(stepName: string, error: any): void`

ステップ失敗（互換性）

---

## 🔍 utils オブジェクト

### 📊 parseLogLevel

```typescript
function parseLogLevel(levelString: string): LogLevel
```

文字列からLogLevel列挙型への変換

**パラメータ**:
- `levelString`: ログレベル文字列

**戻り値**: LogLevel

**エラー**: 無効な文字列の場合Error

**例**:
```typescript
const level = utils.parseLogLevel('DEBUG'); // LogLevel.DEBUG
```

### ✅ validateConfig

```typescript
function validateConfig(config: LogConfig): boolean
```

設定の妥当性チェック

**パラメータ**:
- `config`: 検証する設定

**戻り値**: 有効な場合true、無効な場合false

### 📋 displayCurrentConfig

```typescript
function displayCurrentConfig(): void
```

現在のログ設定の表示

**例**:
```typescript
utils.displayCurrentConfig();
// コンソールに設定サマリーを出力
```

---

## 📊 プリセット設定

### presets オブジェクト

```typescript
const presets = {
  development: {
    description: "開発環境 - 詳細なデバッグ情報とコンソール出力",
    config: LogConfig
  },
  test: {
    description: "テスト環境 - 最小限のログでテスト実行速度を優先",
    config: LogConfig
  },
  staging: {
    description: "ステージング環境 - 本番相当の構造化ログとメトリクス",
    config: LogConfig
  },
  production: {
    description: "本番環境 - 完全な監視・アラート・分析機能",
    config: LogConfig
  }
};
```

**使用例**:
```typescript
import { presets } from './utils/logging';

console.log(presets.production.description);
const prodConfig = presets.production.config;
```

---

## 🚨 エラー処理

### 🎯 共通エラーパターン

#### 初期化エラー

```typescript
// LogManager初期化時
const logger = LogManager.getInstance(); // Error: 設定が必要
```

**解決**:
```typescript
const config = LogConfigFactory.createConfig('development');
const logger = LogManager.getInstance(config);
```

#### 設定検証エラー

```typescript
LogConfigFactory.validateConfig(invalidConfig); // Error: 必須項目不足
```

#### Emitter エラー

```typescript
// ファイル書き込み権限不足
fileEmitter.emit(entry); // Promise rejection
```

### 🛡️ エラーハンドリングパターン

```typescript
try {
  await logger.flush();
} catch (error) {
  console.error('ログフラッシュでエラー:', error);
  // フォールバック処理
}
```

---

## 📈 パフォーマンス考慮事項

### ⚡ 最適化のヒント

1. **バッチサイズ調整**: 環境に応じたbatchSize設定
2. **フラッシュ間隔**: flushIntervalの適切な設定
3. **レベルフィルタリング**: 本番環境での適切なレベル設定
4. **Emitter選択**: 用途に応じたEmitterの組み合わせ

### 📊 パフォーマンス指標

| 項目         | 目標値 | 測定方法       |
| ------------ | ------ | -------------- |
| ログ出力遅延 | < 1ms  | 同期処理時間   |
| メモリ使用量 | < 50MB | プロセス監視   |
| CPU使用率    | < 5%   | システム監視   |
| ファイルI/O  | < 10ms | フラッシュ時間 |

---

## 🎯 使用例まとめ

### 🚀 基本使用

```typescript
// 1. 初期化
const logger = await initializeLoggingSystem();

// 2. 基本ログ
logger.info('処理開始');
logger.error('エラー発生', LogCategory.ERROR_HANDLING);

// 3. テスト統合
logger.startTest('テスト名');
logger.endTest('テスト名', 'passed', 2400);

// 4. クリーンアップ
await logger.flush();
await logger.close();
```

### 🏗️ 高度な使用

```typescript
// カスタム設定
const logger = await initializeLoggingSystem({
  level: LogLevel.DEBUG,
  enableMetrics: true,
  fileConfig: {
    directory: 'custom-logs',
    maxFileSize: 100
  }
});

// 構造化ログ
logger.performance('ページロード', {
  duration: 1800,
  memory: 52.1
}, {
  testInfo: { title: 'パフォーマンステスト' },
  page: { url: 'https://example.com' }
});
```

この API リファレンスにより、ログシステムの全機能を正確に理解し、効果的に活用できます。
