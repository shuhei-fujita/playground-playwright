# 📚 ログシステム ベストプラクティス集

> **実装例とノウハウ** - 効果的なログシステム活用のための実践的ガイド

## 🎯 基本方針

### 🏛️ ログ設計の5原則

1. **📝 構造化**: 一貫した形式での情報記録
2. **🎯 目的明確**: ログの目的（デバッグ・監視・分析）を明確化
3. **⚖️ 適切なレベル**: ログレベルの適切な使い分け
4. **🔒 セキュリティ**: 機密情報の適切な保護
5. **⚡ パフォーマンス**: 本体処理への影響最小化

---

## 🚀 クイックスタート ベストプラクティス

### ✅ 推奨: 環境別初期化

```typescript
// tests/setup/logging-setup.ts
import { initializeLoggingSystem, LogLevel } from '../utils/logging';

export async function setupLogging() {
  const environment = process.env.NODE_ENV || 'development';
  
  return await initializeLoggingSystem({
    level: environment === 'production' ? LogLevel.WARN : LogLevel.INFO,
    enableConsole: environment === 'development',
    enableFile: true,
    enableStructured: environment !== 'development',
    enableMetrics: environment === 'production'
  });
}

// 使用例
const logger = await setupLogging();
```

### ❌ 避けるべき: 直接初期化

```typescript
// BAD: 環境考慮なしの固定設定
const logger = createQuickLogger(LogLevel.DEBUG);
```

---

## 🧪 Playwrightテスト統合

### ✅ 推奨: Test Fixturesでの統合

```typescript
// tests/fixtures/enhanced-fixtures.ts
import { test as base } from '@playwright/test';
import { initializeLoggingSystem, LogManager } from '../utils/logging';

type TestFixtures = {
  logger: LogManager;
};

export const test = base.extend<TestFixtures>({
  logger: async ({}, use) => {
    const logger = await initializeLoggingSystem();
    await use(logger);
    await logger.flush();
    await logger.close();
  }
});

export { expect } from '@playwright/test';
```

### 🎯 テストでの活用例

```typescript
// tests/login.spec.ts
import { test, expect } from '../fixtures/enhanced-fixtures';

test('ユーザーログインテスト', async ({ page, logger }) => {
  // === GIVEN: テスト前提条件の設定 ===
  logger.info('=== GIVEN: テスト前提条件の設定 ===');
  await page.goto('/login');
  logger.pageAction('navigate', '/login');

  // === WHEN: ログイン操作実行 ===
  logger.info('=== WHEN: ログイン操作実行 ===');
  const startTime = Date.now();
  
  await page.fill('[data-testid="email"]', 'user@example.com');
  await page.fill('[data-testid="password"]', process.env.TEST_PASSWORD!);
  await page.click('[data-testid="login-button"]');
  
  const duration = Date.now() - startTime;
  logger.performance('ログイン操作', { duration });

  // === THEN: 結果検証 ===
  logger.info('=== THEN: 結果検証 ===');
  await expect(page).toHaveURL('/dashboard');
  logger.info('✅ ログイン成功を確認');
});
```

---

## 🏗️ Page Object Pattern統合

### ✅ 推奨: BasePage with Logging

```typescript
// tests/pages/BasePage.ts
import { Page } from '@playwright/test';
import { LogManager, LogCategory } from '../utils/logging';

export class BasePage {
  protected page: Page;
  protected logger: LogManager;

  constructor(page: Page, logger: LogManager) {
    this.page = page;
    this.logger = logger;
  }

  async navigate(url: string): Promise<void> {
    this.logger.info(`🌐 ページ移動開始: ${url}`, LogCategory.PAGE_INTERACTION);
    
    const startTime = Date.now();
    await this.page.goto(url);
    const duration = Date.now() - startTime;
    
    this.logger.performance('ページナビゲーション', { 
      duration, 
      url 
    });
  }

  async waitForElement(selector: string, timeout = 5000): Promise<void> {
    this.logger.debug(`⏱️ 要素待機開始: ${selector}`);
    
    const startTime = Date.now();
    try {
      await this.page.waitForSelector(selector, { timeout });
      const duration = Date.now() - startTime;
      this.logger.performance('要素待機', { duration, selector });
    } catch (error) {
      this.logger.error(`❌ 要素待機失敗: ${selector}`, 
        LogCategory.ERROR_HANDLING, 
        { selector, timeout }, 
        error as Error
      );
      throw error;
    }
  }

  async handleError(message: string, error?: Error): Promise<void> {
    // スクリーンショット撮影
    const screenshot = await this.page.screenshot({ 
      path: `test-results/error-${Date.now()}.png` 
    });
    
    this.logger.error(message, LogCategory.ERROR_HANDLING, {
      screenshot: screenshot.toString('base64'),
      url: this.page.url(),
      userAgent: await this.page.evaluate(() => navigator.userAgent)
    }, error);
  }
}
```

### 🎯 具体的Page Object例

```typescript
// tests/pages/LoginPage.ts
import { expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { LogCategory } from '../utils/logging';

export class LoginPage extends BasePage {
  private readonly emailSelector = '[data-testid="email"]';
  private readonly passwordSelector = '[data-testid="password"]';
  private readonly submitSelector = '[data-testid="login-button"]';

  async login(email: string, password: string): Promise<void> {
    try {
      this.logger.startStep('ログイン処理');

      // メール入力
      await this.page.fill(this.emailSelector, email);
      this.logger.security('メールアドレス入力', { 
        email: email.replace(/@.+/, '@***') // マスキング
      });

      // パスワード入力
      await this.page.fill(this.passwordSelector, password);
      this.logger.security('パスワード入力', { 
        hasPassword: !!password,
        length: password.length 
      });

      // ログインボタンクリック
      const startTime = Date.now();
      await this.page.click(this.submitSelector);
      
      // 成功確認
      await this.page.waitForURL('/dashboard');
      const duration = Date.now() - startTime;
      
      this.logger.performance('ログイン完了', { duration });
      this.logger.endStep('ログイン処理', duration);
      
    } catch (error) {
      await this.handleError('ログイン処理でエラーが発生', error as Error);
      this.logger.failStep('ログイン処理', error);
      throw error;
    }
  }

  async validateLoginForm(): Promise<void> {
    this.logger.info('📋 ログインフォーム検証開始');
    
    // 必要な要素の存在確認
    await expect(this.page.locator(this.emailSelector)).toBeVisible();
    await expect(this.page.locator(this.passwordSelector)).toBeVisible();
    await expect(this.page.locator(this.submitSelector)).toBeVisible();
    
    this.logger.info('✅ ログインフォーム検証完了');
  }
}
```

---

## 📊 ログレベル使い分けガイド

### 🎯 レベル別使用方針

| レベル    | 用途         | 例                             | 本番出力 |
| --------- | ------------ | ------------------------------ | -------- |
| **TRACE** | 詳細デバッグ | 変数値・内部状態               | ❌        |
| **DEBUG** | 開発デバッグ | 処理フロー・条件分岐           | ❌        |
| **INFO**  | 一般情報     | テスト開始・完了・重要イベント | ✅        |
| **WARN**  | 警告         | 非推奨機能・回復可能エラー     | ✅        |
| **ERROR** | エラー       | テスト失敗・例外発生           | ✅        |
| **FATAL** | 致命的エラー | システム停止レベル             | ✅        |

### 📝 実装例

```typescript
// ✅ 適切なレベル使用
logger.trace('変数値', { variable: value });              // 詳細デバッグ
logger.debug('条件分岐', { condition: true });             // 処理フロー
logger.info('テスト開始: ログインテスト');                  // 重要イベント
logger.warn('古いAPIを使用しています', { api: 'v1.0' });   // 非推奨警告
logger.error('ログイン失敗', category, context, error);    // エラー
logger.fatal('データベース接続不可', category, context);   // 致命的

// ❌ 不適切なレベル使用
logger.error('テスト開始');                               // ERROR過剰
logger.info('変数値: ' + variable);                       // INFO詳細すぎ
```

---

## 🔒 セキュリティ ベストプラクティス

### 🛡️ 機密データ保護

#### ✅ 推奨: 自動マスキング

```typescript
// システムが自動でマスキング
logger.info('ユーザー情報', {
  email: 'user@example.com',        // → user@***
  password: 'secret123',            // → ***
  apiKey: 'sk-1234567890'          // → ***
});
```

#### ✅ 推奨: 手動マスキング

```typescript
// 特別な機密データは手動でマスキング
logger.info('処理完了', {
  userId: user.id,
  email: maskEmail(user.email),
  creditCard: '****-****-****-1234'
});

function maskEmail(email: string): string {
  return email.replace(/@.+/, '@***');
}
```

#### ❌ 避けるべき: 生データ出力

```typescript
// BAD: 機密情報が平文で出力される
logger.info('ユーザー情報', { 
  password: actualPassword,     // 危険
  ssn: actualSSN               // 危険
});
```

### 🔐 認証関連ログ

```typescript
// ✅ セキュリティログの適切な記録
export class SecurityLogger {
  static logAuthAttempt(success: boolean, user: string): void {
    logger.security('認証試行', {
      authAttempt: true,
      success,
      user: maskEmail(user),
      timestamp: new Date().toISOString(),
      ip: getClientIP() // 実装に応じて
    });
  }

  static logSensitiveDataAccess(dataType: string): void {
    logger.security('機密データアクセス', {
      sensitiveDataAccess: true,
      dataType,
      timestamp: new Date().toISOString()
    });
  }
}

// 使用例
await loginPage.login(email, password);
SecurityLogger.logAuthAttempt(true, email);
```

---

## ⚡ パフォーマンス最適化

### 🚀 効率的なログ記録

#### ✅ 推奨: バッチ処理の活用

```typescript
// StructuredEmitter設定
const structuredEmitter = new StructuredEmitter({
  directory: 'logs/structured',
  enableIndexing: true,
  enableAggregation: true,
  batchSize: 50,           // 大きなバッチで効率化
  flushInterval: 30        // 適切な間隔
});
```

#### ✅ 推奨: 条件付きログ

```typescript
// 重い処理は条件付きで実行
if (logger.isDebugEnabled()) {
  const complexData = performExpensiveCalculation();
  logger.debug('複雑なデータ', { complexData });
}

// または
logger.debug(() => `重い処理結果: ${performExpensiveCalculation()}`);
```

#### ❌ 避けるべき: 同期処理

```typescript
// BAD: 同期的なファイル書き込み
fs.writeFileSync('log.txt', data);

// GOOD: 非同期処理
await fs.writeFile('log.txt', data);
```

### 📊 メモリ効率化

```typescript
// ✅ バッファ管理
export class EfficientLogger {
  private buffer: LogEntry[] = [];
  private readonly maxBufferSize = 100;

  async log(entry: LogEntry): Promise<void> {
    this.buffer.push(entry);
    
    if (this.buffer.length >= this.maxBufferSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const entries = this.buffer.splice(0);
    await this.processEntries(entries);
  }
}
```

---

## 🔍 効果的な監視・分析

### 📈 メトリクス活用

#### ✅ 推奨: ビジネスメトリクス

```typescript
// テスト品質メトリクス
logger.performance('テスト実行完了', {
  testName: 'E2Eテストスイート',
  duration: totalDuration,
  passRate: passedTests / totalTests * 100,
  coverage: testCoverage,
  browserCompatibility: {
    chromium: chromiumTests,
    firefox: firefoxTests,
    webkit: webkitTests
  }
});

// ユーザージャーニーメトリクス
logger.performance('ユーザージャーニー', {
  journey: 'purchase_flow',
  steps: ['login', 'browse', 'cart', 'checkout', 'payment'],
  totalDuration: journeyDuration,
  conversionRate: successful / attempted * 100
});
```

#### 📊 アラート設定

```typescript
// カスタムアラート閾値
const metricsEmitter = new MetricsEmitter({
  directory: 'metrics',
  alertThresholds: {
    errorRate: 2,           // 本番: 2%
    avgResponseTime: 2000,  // 本番: 2秒
    failureRate: 5          // 本番: 5%
  }
});
```

### 🔍 ログ分析クエリ

#### jq を使用した高度な分析

```bash
# エラー傾向分析
cat structured.jsonl | jq -r '
  select(.level >= 4) | 
  {hour: .timestamp[0:13], message: .message}
' | jq -s 'group_by(.hour) | map({hour: .[0].hour, count: length})'

# パフォーマンス分析
cat structured.jsonl | jq -r '
  select(.context.performance.duration) |
  {test: .context.testInfo.title, duration: .context.performance.duration}
' | jq -s 'group_by(.test) | map({
  test: .[0].test,
  avg: (map(.duration) | add / length),
  max: (map(.duration) | max),
  min: (map(.duration) | min)
})'

# ブラウザ別成功率
cat structured.jsonl | jq -r '
  select(.context.testInfo and .context.browser) |
  {browser: .context.browser.name, status: .message}
' | jq -s 'group_by(.browser) | map({
  browser: .[0].browser,
  total: length,
  success: (map(select(.status | contains("成功"))) | length)
}) | map(.successRate = (.success / .total * 100))'
```

---

## 🛠️ CI/CD統合

### 🔄 GitHub Actions設定

```yaml
# .github/workflows/test.yml
name: E2E Tests with Logging

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Install Playwright
      run: npx playwright install
      
    - name: Run tests with logging
      env:
        LOG_LEVEL: "INFO"
        LOG_CONSOLE: "false"
        LOG_FILE: "true"
        LOG_STRUCTURED: "true"
        LOG_METRICS: "true"
      run: npx playwright test
      
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results
        path: |
          test-results/
          playwright-report/
        retention-days: 30
        
    - name: Generate test report
      if: always()
      run: |
        # ログ分析レポート生成
        cat test-results/logs/structured/*.jsonl | \
        jq -s 'map(select(.level >= 4)) | length' > error-count.txt
        
        # メトリクスサマリー
        cat test-results/metrics/snapshots.jsonl | \
        tail -1 | jq '.testMetrics' > metrics-summary.json
```

### 📊 レポート自動生成

```typescript
// scripts/generate-report.ts
import { promises as fs } from 'fs';
import * as path from 'path';

interface TestReport {
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    duration: number;
  };
  errors: Array<{
    message: string;
    count: number;
    tests: string[];
  }>;
  performance: {
    avgResponseTime: number;
    slowestTests: Array<{
      test: string;
      duration: number;
    }>;
  };
}

async function generateTestReport(): Promise<TestReport> {
  const structuredLogs = await readStructuredLogs();
  const metricsData = await readMetricsData();
  
  return {
    summary: extractSummary(metricsData),
    errors: analyzeErrors(structuredLogs),
    performance: analyzePerformance(structuredLogs)
  };
}

async function readStructuredLogs(): Promise<any[]> {
  const logFiles = await fs.readdir('test-results/logs/structured');
  const logs: any[] = [];
  
  for (const file of logFiles.filter(f => f.endsWith('.jsonl'))) {
    const content = await fs.readFile(
      path.join('test-results/logs/structured', file), 
      'utf-8'
    );
    const entries = content.split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    logs.push(...entries);
  }
  
  return logs;
}
```

---

## 🧪 テスト環境別設定

### 🏠 ローカル開発環境

```typescript
// playwright.config.local.ts
export default defineConfig({
  use: {
    // ローカル開発設定
    headless: false,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  
  projects: [
    {
      name: 'chromium-dev',
      use: { 
        ...devices['Desktop Chrome'],
        // ローカル専用ログ設定
        contextOptions: {
          extraHTTPHeaders: {
            'X-Log-Level': 'DEBUG'
          }
        }
      }
    }
  ]
});

// tests/setup/local-logging.ts
export async function setupLocalLogging() {
  return await initializeLoggingSystem({
    level: LogLevel.DEBUG,
    enableConsole: true,     // 即座確認
    enableFile: true,        // 詳細保存
    enableStructured: false, // オーバーヘッド削減
    enableMetrics: false,    // 簡素化
    fileConfig: {
      directory: 'dev-logs',
      maxFileSize: 10,       // 小さなファイル
      maxFiles: 7,           // 1週間分
      compress: false        // 即座確認用
    }
  });
}
```

### 🌐 CI/CD環境

```typescript
// tests/setup/ci-logging.ts
export async function setupCILogging() {
  return await initializeLoggingSystem({
    level: LogLevel.INFO,
    enableConsole: false,    // 静穏化
    enableFile: true,
    enableStructured: true,  // 分析用
    enableMetrics: true,     // レポート用
    fileConfig: {
      directory: process.env.CI_LOGS_DIR || 'ci-logs',
      maxFileSize: 50,
      maxFiles: 30,
      compress: true
    },
    metricsConfig: {
      directory: process.env.CI_METRICS_DIR || 'ci-metrics',
      flushInterval: 10      // 短間隔でCI結果反映
    }
  });
}
```

### 🏭 本番環境

```typescript
// tests/setup/production-logging.ts
export async function setupProductionLogging() {
  return await initializeLoggingSystem({
    level: LogLevel.WARN,    // 重要情報のみ
    enableConsole: false,
    enableFile: true,
    enableStructured: true,
    enableMetrics: true,
    sensitiveDataMasking: true, // 必須
    fileConfig: {
      directory: '/var/log/playwright',
      maxFileSize: 100,      // 大容量
      maxFiles: 90,          // 3ヶ月保持
      compress: true
    },
    metricsConfig: {
      directory: '/var/metrics/playwright',
      flushInterval: 60,     // 効率重視
      alertThresholds: {
        errorRate: 2,        // 厳格
        avgResponseTime: 2000,
        failureRate: 5
      }
    }
  });
}
```

---

## 🎯 まとめ

### ✅ チェックリスト: 導入前確認

#### 📋 基本設定
- [ ] 環境別ログ設定の定義
- [ ] 機密データマスキングの有効化
- [ ] 適切なログレベルの設定
- [ ] ディスク容量の確認

#### 🔧 統合設定  
- [ ] Test Fixturesでのログ統合
- [ ] Page ObjectでのBase継承
- [ ] エラーハンドリングの強化
- [ ] パフォーマンス測定の追加

#### 🔍 監視設定
- [ ] メトリクス閾値の設定
- [ ] アラート通知の設定
- [ ] ログローテーションの設定
- [ ] バックアップ戦略の策定

#### 📊 分析設定
- [ ] 構造化ログの有効化
- [ ] インデックス生成の設定
- [ ] レポート生成の自動化
- [ ] ダッシュボード連携

### 🎉 期待効果

| 項目             | 改善効果 | 測定方法     |
| ---------------- | -------- | ------------ |
| **デバッグ効率** | 50%向上  | 問題解決時間 |
| **障害調査**     | 70%短縮  | 原因特定時間 |
| **品質向上**     | 30%向上  | バグ検出率   |
| **運用効率**     | 40%向上  | 監視工数削減 |

このベストプラクティス集に従うことで、効率的で安全、かつ実用的なログシステムを構築できます。
