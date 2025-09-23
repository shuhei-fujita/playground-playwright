# 🚀 日運用対応ログシステム

Playwright TypeScriptテスト環境向けの本格的なログシステム。開発から本番運用まで、あらゆる環境で高品質なログ管理を実現します。

## 📊 システム概要

### 特徴
- **🔧 プラガブル設計**: Emitterパターンによる出力先の動的制御
- **📈 構造化ログ**: JSON Lines形式での高効率ログ出力
- **⚡ 非同期処理**: バッチ処理による高パフォーマンス
- **🔄 自動ローテーション**: ファイルサイズ・期間ベースの自動管理
- **📊 リアルタイムメトリクス**: テスト実行状況の即座な把握
- **🚨 自動アラート**: 閾値ベースの障害検知
- **🔒 セキュリティ対応**: 機密情報の自動マスキング
- **🌍 環境別設定**: 開発・ステージング・本番環境の最適化

## 🏗️ アーキテクチャ

```
LogManager (中心クラス)
├── ConsoleEmitter    (コンソール出力)
├── FileEmitter       (ファイル出力 + ローテーション)
├── StructuredEmitter (JSON Lines + インデックス)
└── MetricsEmitter    (メトリクス収集 + 分析)
```

## 🚀 クイックスタート

### 1. 基本的な使用方法

```typescript
import { initializeLoggingSystem, LogLevel, LogCategory } from './utils/logging';

// ログシステム初期化
const logger = await initializeLoggingSystem({
  level: LogLevel.INFO,
  enableConsole: true,
  enableFile: true
});

// 基本的なログ出力
logger.info('テスト開始');
logger.error('エラーが発生', LogCategory.ERROR_HANDLING);

// テスト固有のログ
logger.startTest('ログインテスト', {
  testInfo: { title: 'ログインテスト', file: 'login.spec.ts' },
  browser: { name: 'chromium' }
});

logger.endTest('ログインテスト', 'passed', 2400);
```

### 2. 既存コードとの互換性

```typescript
import { logger } from './utils/NewTestLogger';

// 既存のAPIをそのまま使用可能
logger.info('情報ログ');
logger.error('エラーログ');
logger.startStep('ページ移動');
logger.endStep('ページ移動', 1200);
```

## 📋 環境別設定

### 開発環境
```typescript
// 即座のフィードバック重視
{
  level: LogLevel.DEBUG,
  enableConsole: true,
  enableFile: true,
  enableStructured: false,
  enableMetrics: false
}
```

### ステージング環境
```typescript
// 本番相当の機能
{
  level: LogLevel.INFO,
  enableConsole: false,
  enableFile: true,
  enableStructured: true,
  enableMetrics: true
}
```

### 本番環境
```typescript
// 完全な監視・分析機能
{
  level: LogLevel.WARN,
  enableConsole: false,
  enableFile: true,
  enableStructured: true,
  enableMetrics: true,
  sensitiveDataMasking: true
}
```

## 🎯 高度な機能

### 1. 構造化ログ

```typescript
// JSON Lines形式での構造化出力
{
  "@timestamp": "2025-01-23T12:34:56.789Z",
  "@level": "INFO",
  "@category": "test_execution",
  "@message": "テスト完了",
  "test": {
    "title": "ログインテスト",
    "session_id": "session_123",
    "file": "login.spec.ts"
  },
  "performance": {
    "duration": 2400,
    "memory": 45.2
  },
  "@metadata": {
    "correlation_id": "trace_xyz789",
    "environment": "staging"
  }
}
```

### 2. パフォーマンス追跡

```typescript
logger.performance('ページロード', {
  duration: 1800,
  memory: 52.1,
  networkRequests: 8,
  domContentLoaded: 1200,
  firstContentfulPaint: 900
});
```

### 3. セキュリティログ

```typescript
logger.security('認証試行', {
  authAttempt: true,
  sensitiveDataAccess: false,
  permissionRequest: 'user_data'
});
```

### 4. メトリクス収集

自動的に以下のメトリクスを収集：
- テスト実行時間・成功率
- エラー発生頻度・トレンド
- パフォーマンス指標
- ブラウザ別統計

## 📁 ファイル構造

```
test-results/
├── logs/                    # 通常のログファイル
│   ├── test-2025-01-23.log
│   ├── test-2025-01-22.log.gz
│   └── structured/          # 構造化ログ
│       ├── structured-2025-01-23.jsonl
│       └── index-2025-01-23.jsonl
├── metrics/                 # メトリクス
│   ├── snapshots.jsonl      # メトリクススナップショット
│   └── alerts.jsonl         # アラート履歴
└── alerts.log              # アラートログ
```

## 🔍 監視・アラート

### 自動監視項目
- **エラー率**: 5%以上で警告
- **レスポンス時間**: 3秒以上で警告
- **ディスク使用量**: 1GB以上で警告
- **ファイルサイズ**: 100MB以上で警告

### アラート通知
```bash
# Webhook URL設定
export ALERT_WEBHOOK_URL="https://hooks.slack.com/services/xxx"

# メール受信者設定
export ALERT_EMAIL_RECIPIENTS="dev-team@example.com,ops@example.com"
```

## 🛠️ 設定方法

### 環境変数での制御

```bash
# ログレベル
export LOG_LEVEL="INFO"

# 出力制御
export LOG_CONSOLE="true"
export LOG_FILE="true"
export LOG_STRUCTURED="true"
export LOG_METRICS="true"

# ディレクトリ
export LOG_FILE_DIR="custom-logs"
```

### プログラム内設定

```typescript
const logger = await initializeLoggingSystem({
  level: LogLevel.DEBUG,
  enableConsole: true,
  enableFile: true,
  enableStructured: true,
  enableMetrics: true,
  fileConfig: {
    directory: 'custom-logs',
    maxFileSize: 100, // MB
    maxFiles: 50,
    compress: true
  },
  metricsConfig: {
    directory: 'custom-metrics',
    flushInterval: 30 // seconds
  }
});
```

## 📈 使用例

### Playwrightテストとの統合

```typescript
import { test, expect } from '@playwright/test';
import { initializeLoggingSystem, LogLevel } from '../utils/logging';

test.describe('ログシステム統合テスト', () => {
  let logger: LogManager;

  test.beforeAll(async () => {
    logger = await initializeLoggingSystem();
  });

  test('商品検索テスト', async ({ page }, testInfo) => {
    const testContext = {
      testInfo: {
        title: testInfo.title,
        file: testInfo.file,
        sessionId: logger.getSessionId()
      },
      browser: { name: 'chromium' }
    };

    try {
      logger.startTest(testInfo.title, testContext);

      // ページ移動
      await page.goto('https://example.com');
      logger.pageAction('navigate', 'https://example.com', testContext);

      // 検索実行
      const startTime = Date.now();
      await page.fill('[data-testid="search"]', '商品名');
      await page.click('[data-testid="search-btn"]');
      const duration = Date.now() - startTime;

      logger.performance('商品検索', { duration }, testContext);

      // 結果検証
      await expect(page.locator('[data-testid="results"]')).toBeVisible();
      
      logger.endTest(testInfo.title, 'passed', duration);

    } catch (error) {
      logger.error('テスト失敗', LogCategory.ERROR_HANDLING, testContext, error);
      logger.endTest(testInfo.title, 'failed');
      throw error;
    }
  });

  test.afterAll(async () => {
    await logger.flush();
    await logger.close();
  });
});
```

## 🔧 トラブルシューティング

### よくある問題

1. **ログファイルが作成されない**
   ```bash
   # ディレクトリの権限確認
   ls -la test-results/
   
   # 手動でディレクトリ作成
   mkdir -p test-results/logs
   ```

2. **メトリクスが収集されない**
   ```typescript
   // メトリクスEmitterの有効化確認
   const config = logger.getConfig();
   console.log('Metrics enabled:', config.enableMetrics);
   ```

3. **パフォーマンス問題**
   ```typescript
   // バッチサイズの調整
   const logger = await initializeLoggingSystem({
     // ... 他の設定
     metricsConfig: {
       directory: 'metrics',
       flushInterval: 60 // 間隔を長くする
     }
   });
   ```

### デバッグモード

```typescript
// 詳細ログの有効化
const logger = await initializeLoggingSystem({
  level: LogLevel.TRACE,
  enableConsole: true
});

// 設定確認
logger.utils.displayCurrentConfig();
```

## 📚 API リファレンス

### LogManager

| メソッド                                       | 説明           | 例                                                 |
| ---------------------------------------------- | -------------- | -------------------------------------------------- |
| `info(message, category?, context?)`           | 情報ログ       | `logger.info('処理完了')`                          |
| `error(message, category?, context?, error?)`  | エラーログ     | `logger.error('失敗', category, context, err)`     |
| `startTest(title, context?)`                   | テスト開始     | `logger.startTest('ログインテスト')`               |
| `endTest(title, status, duration?)`            | テスト終了     | `logger.endTest('ログインテスト', 'passed', 2400)` |
| `performance(message, metrics, context?)`      | パフォーマンス | `logger.performance('ロード', {duration: 1800})`   |
| `security(message, securityContext, context?)` | セキュリティ   | `logger.security('認証', {authAttempt: true})`     |

### ユーティリティ

| 関数                               | 説明           | 例                                  |
| ---------------------------------- | -------------- | ----------------------------------- |
| `initializeLoggingSystem(config?)` | システム初期化 | `await initializeLoggingSystem()`   |
| `createQuickLogger(level?)`        | 簡単初期化     | `createQuickLogger(LogLevel.DEBUG)` |
| `shutdownLoggingSystem()`          | システム停止   | `await shutdownLoggingSystem()`     |

## 🤝 移行ガイド

### 段階的移行手順

1. **Phase 1**: 互換性レイヤーの導入
   ```typescript
   // 既存コードはそのまま
   import { logger } from './utils/NewTestLogger';
   ```

2. **Phase 2**: 新機能の段階的導入
   ```typescript
   // 新しいテストでは新API使用
   logger.startTest('新しいテスト');
   logger.performance('操作', metrics);
   ```

3. **Phase 3**: 完全移行
   ```typescript
   // 全面的に新システムを使用
   const logger = await initializeLoggingSystem();
   ```

## 🚀 今後の拡張

- **分散ログ収集**: ELK Stack, Fluentd対応
- **機械学習**: 異常検知の自動化
- **ダッシュボード**: リアルタイム可視化
- **API連携**: 外部システムとの統合

## 📞 サポート

- **GitHub Issues**: バグ報告・機能要望
- **Wiki**: 詳細ドキュメント
- **Examples**: サンプルコード集

---

**更新履歴**
- v1.0.0: 初期リリース（2025-01-23）
