# 💡 ログシステム 実装ガイド / Logging System Implementation Guide

## 🚀 はじめに / Getting Started

### 前提条件 / Prerequisites

**📋 必要な環境 / Required Environment**
- Node.js 16+ / Node.js 16+
- TypeScript 4.5+ / TypeScript 4.5+
- Playwright 1.40+ / Playwright 1.40+

**📁 プロジェクト構成 / Project Structure**
```
tests/
├── utils/
│   └── logging/          # ログシステム実装 / Logging system implementation
└── fixtures/
    └── TestFixtures.ts   # テストフィクスチャ / Test fixtures
```

## 🔧 基本セットアップ / Basic Setup

### 1. ログシステムの初期化 / Initialize Logging System

```typescript
// tests/fixtures/TestFixtures.ts
import { test as base } from '@playwright/test';
import { initializeLoggingSystem, LogManager } from '../utils/logging';

type TestFixtures = {
  logManager: LogManager;
};

export const test = base.extend<TestFixtures>({
  logManager: async ({}, use) => {
    // 環境に応じた自動初期化 / Auto-initialization based on environment
    const logger = await initializeLoggingSystem({
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: true
    });
    
    await use(logger);
    
    // テスト終了時のクリーンアップ / Cleanup after test completion
    await logger.flush();
    await logger.close();
  },
});
```

### 2. Page Objectでの活用 / Utilization in Page Objects

```typescript
// tests/pages/BasePage.ts
import { Page } from '@playwright/test';
import { LogManager, LogCategory } from '../utils/logging';

export abstract class BasePage {
  protected readonly page: Page;
  protected readonly logManager?: LogManager;

  constructor(page: Page, logManager?: LogManager) {
    this.page = page;
    this.logManager = logManager;
  }

  async navigate(url: string): Promise<void> {
    this.logManager?.info(`🌐 ページ移動: ${url}`, LogCategory.PAGE_INTERACTION, {
      page: { url }
    });
    
    const startTime = Date.now();
    await this.page.goto(url);
    const duration = Date.now() - startTime;
    
    this.logManager?.performance('ページロード', { duration }, {
      page: { url, responseTime: duration }
    });
  }

  async handleError(errorMessage: string, error?: Error): Promise<void> {
    // エラーログの出力 / Error log output
    this.logManager?.error(errorMessage, LogCategory.ERROR_HANDLING, {
      page: { url: this.page.url(), title: await this.page.title() }
    }, error);
    
    // スクリーンショット撮影 / Take screenshot
    await this.takeScreenshot(`error-${errorMessage.replace(/\s+/g, "_")}`);
  }

  async takeScreenshot(name: string): Promise<void> {
    const filename = `test-results/screenshots/${name}-${Date.now()}.png`;
    await this.page.screenshot({ path: filename, fullPage: true });
    
    this.logManager?.info(`📸 スクリーンショット撮影: ${name}`, LogCategory.PAGE_INTERACTION, {
      customData: { screenshotPath: filename }
    });
  }
}
```

## 📝 テストファイルでの使用パターン / Usage Patterns in Test Files

### Given-When-Then パターン / Given-When-Then Pattern

```typescript
// tests/example.spec.ts
import { test, expect } from './fixtures/TestFixtures';
import { LogCategory } from './utils/logging';

test.describe('ログ統合テストサンプル', () => {
  test('ユーザーログイン機能テスト', async ({ page, logManager }, testInfo) => {
    try {
      // テスト開始ログ / Test start log
      logManager.startTest(testInfo.title, {
        testInfo: {
          title: testInfo.title,
          file: testInfo.file,
          sessionId: logManager.getSessionId()
        },
        browser: { name: 'chromium' }
      });

      // === GIVEN: 前提条件の設定 ===
      logManager.info('=== GIVEN: ログインページへ移動 ===', LogCategory.TEST_EXECUTION);
      await page.goto('/login');
      await expect(page).toHaveURL(/login/);

      // === WHEN: 操作の実行 ===
      logManager.info('=== WHEN: ログイン情報入力・送信 ===', LogCategory.TEST_EXECUTION);
      await page.fill('[data-testid="email"]', 'user@example.com');
      await page.fill('[data-testid="password"]', 'password123');
      await page.click('[data-testid="login-button"]');

      // === THEN: 結果の検証 ===
      logManager.info('=== THEN: ログイン成功確認 ===', LogCategory.TEST_EXECUTION);
      await expect(page).toHaveURL(/dashboard/);
      await expect(page.getByText('ようこそ')).toBeVisible();

      // テスト成功ログ / Test success log
      logManager.endTest(testInfo.title, 'passed', Date.now() - startTime);

    } catch (error) {
      // エラーハンドリング / Error handling
      logManager.error('テスト実行でエラーが発生', LogCategory.ERROR_HANDLING, {
        testInfo: { title: testInfo.title },
        page: { url: page.url() }
      }, error);
      
      logManager.endTest(testInfo.title, 'failed');
      throw error;
    }
  });
});
```

### VRTテストでの活用 / VRT Test Utilization

```typescript
// tests/VRT.spec.ts
test('スクリーンショット比較テスト', async ({ page, logManager }, testInfo) => {
  const startTime = Date.now();
  
  try {
    logManager.startTest(testInfo.title, {
      testInfo: { title: testInfo.title, sessionId: logManager.getSessionId() },
      customData: { testType: 'VRT' }
    });

    // === GIVEN ===
    logManager.info('=== GIVEN: テスト対象ページの準備 ===', LogCategory.TEST_EXECUTION);
    await page.goto('https://playwright.dev');
    await page.waitForLoadState('networkidle');

    // === WHEN ===
    logManager.info('=== WHEN: スクリーンショット撮影 ===', LogCategory.TEST_EXECUTION);
    const screenshotStart = Date.now();
    
    // === THEN ===
    logManager.info('=== THEN: 画像比較実行 ===', LogCategory.TEST_EXECUTION);
    await expect(page).toHaveScreenshot('playwright-homepage.png');
    
    const screenshotDuration = Date.now() - screenshotStart;
    logManager.performance('VRTスクリーンショット撮影', { 
      duration: screenshotDuration 
    }, {
      testInfo: { title: testInfo.title },
      customData: { screenshotType: 'fullpage' }
    });

    logManager.endTest(testInfo.title, 'passed', Date.now() - startTime);

  } catch (error) {
    logManager.error('VRTテスト失敗', LogCategory.ERROR_HANDLING, {
      testInfo: { title: testInfo.title },
      customData: { testType: 'VRT', failureReason: 'screenshot_mismatch' }
    }, error);
    
    logManager.endTest(testInfo.title, 'failed');
    throw error;
  }
});
```

## 🔧 高度な設定 / Advanced Configuration

### 環境変数による設定制御 / Configuration Control via Environment Variables

**📋 環境変数制御ルール参照 / Environment Variable Control Rules Reference**

必須の環境変数設定は **[📊 logging.mdc](../../.cursor/rules/logging.mdc#環境変数制御ルール--environment-variable-control-rules)** を参照してください。

For required environment variable configuration, refer to **[📊 logging.mdc](../../.cursor/rules/logging.mdc#環境変数制御ルール--environment-variable-control-rules)**.

### カスタム設定での初期化 / Initialization with Custom Configuration

```typescript
// 本番環境向けカスタム設定 / Custom configuration for production
const logger = await initializeLoggingSystem({
  level: LogLevel.WARN,
  enableConsole: false,
  enableFile: true,
  enableStructured: true,
  enableMetrics: true,
  sensitiveDataMasking: true,
  fileConfig: {
    directory: 'production-logs',
    maxFileSize: 100, // MB
    maxFiles: 100,
    compress: true
  },
  metricsConfig: {
    directory: 'production-metrics',
    flushInterval: 60 // seconds
  }
});
```

## 📊 パフォーマンス監視 / Performance Monitoring

### 自動パフォーマンス測定 / Automatic Performance Measurement

```typescript
// Page Objectでの自動測定 / Automatic measurement in Page Object
export class PlaywrightDevPage extends BasePage {
  async navigateToGetStarted(): Promise<void> {
    const startTime = Date.now();
    
    this.logManager?.info('Get Startedボタンをクリック', LogCategory.PAGE_INTERACTION);
    
    // 操作実行 / Execute operation
    await this.page.getByRole('link', { name: 'Get started' }).click();
    
    // パフォーマンス測定 / Performance measurement
    const duration = Date.now() - startTime;
    this.logManager?.performance('Get Startedナビゲーション', { duration }, {
      page: { url: this.page.url() },
      customData: { operation: 'navigation', target: 'get-started' }
    });
    
    // 閾値チェック / Threshold check
    if (duration > 3000) {
      this.logManager?.warn('ナビゲーションが遅い', LogCategory.PERFORMANCE, {
        performance: { duration, threshold: 3000 }
      });
    }
  }
}
```

### カスタムメトリクス収集 / Custom Metrics Collection

```typescript
// カスタムメトリクスの収集例 / Custom metrics collection example
class CustomMetricsCollector {
  private logManager: LogManager;

  constructor(logManager: LogManager) {
    this.logManager = logManager;
  }

  async measureTestSuite(suiteName: string, testCount: number): Promise<void> {
    this.logManager.info(`テストスイート開始: ${suiteName}`, LogCategory.SYSTEM, {
      customData: {
        suiteMetrics: {
          name: suiteName,
          testCount,
          startTime: new Date().toISOString()
        }
      }
    });
  }

  async recordBrowserMetrics(browserName: string): Promise<void> {
    // ブラウザ固有のメトリクス収集 / Browser-specific metrics collection
    this.logManager.performance('ブラウザメトリクス', {
      duration: 0,
      memory: process.memoryUsage().heapUsed
    }, {
      browser: { name: browserName },
      customData: {
        browserMetrics: {
          userAgent: 'Chrome/120.0.0.0',
          viewport: { width: 1280, height: 720 }
        }
      }
    });
  }
}
```

## 🔍 デバッグ・トラブルシューティング / Debugging & Troubleshooting

### よくある問題と解決方法 / Common Issues and Solutions

#### 1. **ログファイルが作成されない / Log files not created**

```typescript
// 問題診断 / Problem diagnosis
const logger = await initializeLoggingSystem();
const config = logger.getConfig();

console.log('現在の設定:', config);
console.log('ファイル出力有効:', config.enableFile);
console.log('ログディレクトリ:', config.fileConfig?.directory);

// 解決方法 / Solution
// 1. ディレクトリの手動作成 / Manual directory creation
await fs.mkdir('test-results/logs', { recursive: true });

// 2. 権限確認 / Permission check
const stats = await fs.stat('test-results');
console.log('ディレクトリ権限:', stats.mode);
```

#### 2. **メトリクスが収集されない / Metrics not collected**

```typescript
// デバッグモードでの確認 / Debug mode verification
const logger = await initializeLoggingSystem({
  level: LogLevel.DEBUG,
  enableConsole: true,
  enableMetrics: true
});

// メトリクス設定の確認 / Metrics configuration check
logger.utils.displayCurrentConfig();

// 手動フラッシュでの確認 / Manual flush verification
await logger.flush();
```

#### 3. **パフォーマンス問題 / Performance issues**

```typescript
// バッチサイズの調整 / Batch size adjustment
const logger = await initializeLoggingSystem({
  // ... 他の設定
  metricsConfig: {
    directory: 'metrics',
    flushInterval: 60, // 間隔を長くする / Extend interval
    batchSize: 100     // バッチサイズを大きくする / Increase batch size
  }
});

// 非同期処理の最適化 / Asynchronous processing optimization
logger.info('test message'); // await不要 / No await needed
await logger.flush(); // 明示的なフラッシュ / Explicit flush
```

### デバッグヘルパー関数 / Debug Helper Functions

```typescript
// デバッグ用ユーティリティ / Debug utilities
export class LoggingDebugger {
  static async diagnoseSystem(): Promise<void> {
    try {
      const logger = LogManager.getInstance();
      const config = logger.getConfig();
      
      console.log('🔍 ログシステム診断結果:');
      console.log('- 環境:', config.environment);
      console.log('- ログレベル:', LogLevel[config.level]);
      console.log('- 有効なEmitter数:', logger.getEmitterCount());
      console.log('- セッションID:', logger.getSessionId());
      
      // ディレクトリ存在確認 / Directory existence check
      if (config.enableFile) {
        const exists = await fs.access(config.fileConfig!.directory).then(() => true).catch(() => false);
        console.log('- ログディレクトリ存在:', exists);
      }
      
    } catch (error) {
      console.error('診断エラー:', error);
    }
  }

  static async testEmitters(): Promise<void> {
    const logger = LogManager.getInstance();
    
    console.log('🧪 Emitterテスト開始');
    
    logger.trace('TRACE レベルテスト');
    logger.debug('DEBUG レベルテスト');
    logger.info('INFO レベルテスト');
    logger.warn('WARN レベルテスト');
    logger.error('ERROR レベルテスト');
    
    await logger.flush();
    console.log('✅ Emitterテスト完了');
  }
}

// 使用方法 / Usage
// await LoggingDebugger.diagnoseSystem();
// await LoggingDebugger.testEmitters();
```

## 🎯 ベストプラクティス / Best Practices

### 1. **適切なログレベルの使用 / Proper Log Level Usage**

**📋 ログレベル使用ルール参照 / Log Level Usage Rules Reference**

適切なログレベルの使用方法は **[📊 logging.mdc](../../.cursor/rules/logging.mdc#基本原則--basic-principles)** を参照してください。

For proper log level usage guidelines, refer to **[📊 logging.mdc](../../.cursor/rules/logging.mdc#基本原則--basic-principles)**.

### 2. **適切なカテゴリ分類 / Proper Category Classification**

```typescript
// ✅ 目的別カテゴリの使用 / Purpose-based category usage
logger.info('テスト開始', LogCategory.TEST_EXECUTION);
logger.info('ボタンクリック', LogCategory.PAGE_INTERACTION);  
logger.performance('API応答', metrics, LogCategory.PERFORMANCE);
logger.security('認証試行', authData, LogCategory.SECURITY);
logger.error('例外発生', LogCategory.ERROR_HANDLING, context, error);
```

### 3. **コンテキスト情報の充実 / Rich Context Information**

```typescript
// ✅ 詳細なコンテキスト / Detailed context
logger.info('商品検索実行', LogCategory.USER_ACTION, {
  testInfo: { title: testInfo.title, sessionId: logger.getSessionId() },
  page: { url: page.url(), title: await page.title() },
  customData: { 
    searchQuery: 'laptop',
    resultCount: 25,
    filterOptions: ['price', 'brand']
  }
});

// ❌ コンテキスト不足 / Insufficient context
logger.info('検索実行');
```

### 4. **パフォーマンス考慮 / Performance Considerations**

```typescript
// ✅ 効率的な使用 / Efficient usage
const startTime = Date.now();
// ... 処理実行 ...
const duration = Date.now() - startTime;

logger.performance('重要な処理', { duration }, {
  customData: { operation: 'data-processing', recordCount: 1000 }
});

// ❌ 非効率な使用 / Inefficient usage
logger.debug(`処理中... ${Math.random()}`); // 無駄な文字列生成 / Unnecessary string generation
await logger.info('軽微な操作');            // 不要なawait / Unnecessary await
```

### 5. **エラーハンドリングのパターン / Error Handling Patterns**

```typescript
// ✅ 包括的なエラーハンドリング / Comprehensive error handling
async function executeTestStep(stepName: string): Promise<void> {
  try {
    logger.info(`▶️ ステップ開始: ${stepName}`, LogCategory.TEST_EXECUTION);
    
    // ... テストロジック ...
    
    logger.info(`✅ ステップ完了: ${stepName}`, LogCategory.TEST_EXECUTION);
    
  } catch (error) {
    logger.error(`❌ ステップ失敗: ${stepName}`, LogCategory.ERROR_HANDLING, {
      testInfo: { step: stepName },
      page: { url: page.url() }
    }, error);
    
    // スクリーンショット撮影 / Take screenshot
    await takeScreenshot(`error-${stepName}`);
    
    throw error; // 再スロー / Re-throw
  }
}
```

## 📚 実用的なコードテンプレート / Practical Code Templates

### テストクラステンプレート / Test Class Template

```typescript
// テスト基底クラステンプレート / Test base class template
export abstract class LoggedTestBase {
  protected page: Page;
  protected logManager: LogManager;
  protected testInfo: TestInfo;

  constructor(page: Page, logManager: LogManager, testInfo: TestInfo) {
    this.page = page;
    this.logManager = logManager;
    this.testInfo = testInfo;
  }

  protected async startTest(): Promise<void> {
    this.logManager.startTest(this.testInfo.title, {
      testInfo: {
        title: this.testInfo.title,
        file: this.testInfo.file,
        sessionId: this.logManager.getSessionId()
      }
    });
  }

  protected async logGiven(step: string): Promise<void> {
    this.logManager.info(`🏁 === GIVEN: ${step} ===`, LogCategory.TEST_EXECUTION);
  }

  protected async logWhen(step: string): Promise<void> {
    this.logManager.info(`⚡ === WHEN: ${step} ===`, LogCategory.TEST_EXECUTION);
  }

  protected async logThen(step: string): Promise<void> {
    this.logManager.info(`✅ === THEN: ${step} ===`, LogCategory.TEST_EXECUTION);
  }

  protected async endTest(status: 'passed' | 'failed' | 'skipped', duration?: number): Promise<void> {
    this.logManager.endTest(this.testInfo.title, status, duration);
  }

  protected async handleError(error: Error, context?: string): Promise<void> {
    this.logManager.error(`テストエラー${context ? `: ${context}` : ''}`, LogCategory.ERROR_HANDLING, {
      testInfo: { title: this.testInfo.title },
      page: { url: this.page.url() }
    }, error);
  }
}

// 使用例 / Usage example
class LoginTest extends LoggedTestBase {
  async executeLoginTest(): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.startTest();
      
      await this.logGiven('ログインページに移動');
      await this.page.goto('/login');
      
      await this.logWhen('認証情報を入力してログイン');
      await this.page.fill('#email', 'user@example.com');
      await this.page.fill('#password', 'password');
      await this.page.click('#login-button');
      
      await this.logThen('ダッシュボードページに遷移');
      await expect(this.page).toHaveURL(/dashboard/);
      
      await this.endTest('passed', Date.now() - startTime);
      
    } catch (error) {
      await this.handleError(error, 'ログイン処理');
      await this.endTest('failed');
      throw error;
    }
  }
}
```

---

**📝 実装ガイド更新履歴 / Implementation Guide Update History**
- v1.0.0: 初期実装ガイド作成 (2025-01-23) / Initial implementation guide creation
- 最終更新 / Last updated: 2025-01-23
