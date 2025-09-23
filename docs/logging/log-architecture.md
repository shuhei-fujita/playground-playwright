# 🏗️ ログシステム アーキテクチャ設計 / Logging System Architecture Design

## 🎯 設計哲学 / Design Philosophy

### 核心原則 / Core Principles

**🔌 プラガブル設計 / Pluggable Design**
- Emitterパターンによる出力先の動的制御 / Dynamic output control via Emitter pattern
- 実行時設定変更への対応 / Runtime configuration changes support
- 新しい出力先の簡単追加 / Easy addition of new output destinations

**🔒 型安全性 / Type Safety**
- TypeScriptによる完全な型定義 / Complete type definitions with TypeScript
- コンパイル時エラー検出 / Compile-time error detection
- IntelliSenseによる開発支援 / Development support via IntelliSense

**⚡ パフォーマンス重視 / Performance First**
- 非同期処理によるノンブロッキング / Non-blocking via asynchronous processing
- バッチ処理による効率化 / Efficiency through batch processing
- 環境別最適化 / Environment-specific optimization

## 🏗️ アーキテクチャ詳細 / Detailed Architecture

### システム全体図 / System Overview

```mermaid
graph TB
    subgraph "Test Layer / テストレイヤー"
        TestFiles[Test Files<br/>VRT.spec.ts, etc.]
        PageObjects[Page Objects<br/>BasePage, PlaywrightDevPage]
        Fixtures[Test Fixtures<br/>TestFixtures.ts]
    end
    
    subgraph "Logging Core / ログコア"
        LogManager[LogManager<br/>中心管理クラス / Central Manager]
        ConfigFactory[LogConfigFactory<br/>設定ファクトリ / Config Factory]
        Types[Types<br/>型定義 / Type Definitions]
    end
    
    subgraph "Emitters / 出力層"
        ConsoleEmitter[ConsoleEmitter<br/>🖥️ 開発時用 / For Development]
        FileEmitter[FileEmitter<br/>📁 ファイル出力 / File Output]
        StructuredEmitter[StructuredEmitter<br/>📊 JSON Lines]
        MetricsEmitter[MetricsEmitter<br/>📈 分析・監視 / Analytics & Monitoring]
    end
    
    subgraph "Outputs / 出力先"
        Console[Console<br/>即座確認 / Immediate Feedback]
        LogFiles[Log Files<br/>test-results/logs/]
        JSONLogs[Structured Logs<br/>JSON Lines Format]
        Metrics[Metrics & Alerts<br/>メトリクス・アラート]
    end
    
    TestFiles --> LogManager
    PageObjects --> LogManager
    Fixtures --> LogManager
    
    LogManager --> ConfigFactory
    LogManager --> Types
    
    LogManager --> ConsoleEmitter
    LogManager --> FileEmitter
    LogManager --> StructuredEmitter
    LogManager --> MetricsEmitter
    
    ConsoleEmitter --> Console
    FileEmitter --> LogFiles
    StructuredEmitter --> JSONLogs
    MetricsEmitter --> Metrics
    
    style LogManager fill:#e1f5fe
    style ConfigFactory fill:#f3e5f5
    style ConsoleEmitter fill:#e8f5e8
    style FileEmitter fill:#fff3e0
    style StructuredEmitter fill:#fce4ec
    style MetricsEmitter fill:#f1f8e9
```

## 🔌 Emitterパターン設計 / Emitter Pattern Design

### 設計思想 / Design Concept

**🎯 単一責任原則 / Single Responsibility Principle**
- 各Emitterは1つの出力形式に特化 / Each emitter specializes in one output format
- LogManagerは制御のみ、実際の出力はEmitterに委譲 / LogManager controls only, delegates actual output to emitters
- 新しい出力形式の追加が容易 / Easy to add new output formats

### Emitter詳細設計 / Detailed Emitter Design

#### 1. **ConsoleEmitter** - 開発時即座確認 / Immediate Development Feedback

```mermaid
graph LR
    LogEntry[LogEntry] --> Format[メッセージフォーマット<br/>Message Formatting]
    Format --> Color[色付け処理<br/>Color Processing]
    Color --> Console[コンソール出力<br/>Console Output]
    
    Format --> Context[コンテキスト表示<br/>Context Display]
    Context --> Verbose[詳細モード<br/>Verbose Mode]
    
    style Format fill:#e8f5e8
    style Color fill:#fff3e0
    style Context fill:#f3e5f5
```

**特徴 / Features:**
- 環境別色付け制御 / Environment-specific color control
- 詳細モードでのコンテキスト展開 / Context expansion in verbose mode
- レベル別出力先分離 / Level-based output destination separation

#### 2. **FileEmitter** - 永続化・ローテーション / Persistence & Rotation

```mermaid
graph LR
    LogEntry[LogEntry] --> Buffer[バッファリング<br/>Buffering]
    Buffer --> Check[サイズチェック<br/>Size Check]
    
    Check -->|サイズ超過<br/>Size Exceeded| Rotate[ローテーション<br/>Rotation]
    Check -->|正常<br/>Normal| Write[ファイル書き込み<br/>File Write]
    
    Rotate --> Compress[圧縮処理<br/>Compression]
    Compress --> Write
    
    Write --> Flush[フラッシュ<br/>Flush]
    
    style Buffer fill:#e8f5e8
    style Rotate fill:#fff3e0
    style Compress fill:#f3e5f5
```

**特徴 / Features:**
- 自動ローテーション（サイズ・日付ベース） / Automatic rotation (size & date-based)
- 古いファイルの自動圧縮 / Automatic compression of old files
- 非同期書き込みによる高性能 / High performance via asynchronous writes

#### 3. **StructuredEmitter** - 分析・検索最適化 / Analytics & Search Optimization

```mermaid
graph LR
    LogEntry[LogEntry] --> Structure[構造化変換<br/>Structure Conversion]
    Structure --> Batch[バッチ処理<br/>Batch Processing]
    
    Batch --> JSONL[JSON Lines出力<br/>JSON Lines Output]
    Batch --> Index[インデックス生成<br/>Index Generation]
    
    Index --> Search[高速検索<br/>Fast Search]
    JSONL --> Analysis[分析処理<br/>Analysis Processing]
    
    style Structure fill:#e8f5e8
    style Batch fill:#fff3e0
    style Index fill:#f3e5f5
```

**特徴 / Features:**
- JSON Lines形式での構造化出力 / Structured output in JSON Lines format
- 自動インデックス生成による高速検索 / Fast search via automatic index generation
- バッチ処理による高効率 / High efficiency through batch processing

#### 4. **MetricsEmitter** - 監視・分析 / Monitoring & Analytics

```mermaid
graph LR
    LogEntry[LogEntry] --> Extract[メトリクス抽出<br/>Metrics Extraction]
    Extract --> Aggregate[集計処理<br/>Aggregation]
    
    Aggregate --> Realtime[リアルタイム<br/>Real-time]
    Aggregate --> Trend[トレンド分析<br/>Trend Analysis]
    
    Realtime --> Alert[アラート判定<br/>Alert Decision]
    Trend --> Report[レポート生成<br/>Report Generation]
    
    Alert --> Notification[通知送信<br/>Notification]
    
    style Extract fill:#e8f5e8
    style Aggregate fill:#fff3e0
    style Alert fill:#f3e5f5
    style Trend fill:#fce4ec
```

**特徴 / Features:**
- リアルタイムメトリクス収集 / Real-time metrics collection
- 閾値ベースの自動アラート / Automatic threshold-based alerts
- トレンド分析によるパフォーマンス監視 / Performance monitoring via trend analysis

## 🔧 環境別設定戦略 / Environment-Specific Configuration Strategy

### 設計原則 / Design Principles

**📋 環境別設定ルール参照 / Environment Configuration Rules Reference**

環境別の詳細設定は **[📊 logging.mdc](../../.cursor/rules/logging.mdc#環境別設定ルール--environment-configuration-rules)** を参照してください。

For detailed environment-specific configuration, refer to **[📊 logging.mdc](../../.cursor/rules/logging.mdc#環境別設定ルール--environment-configuration-rules)**.

### 設定適用フロー / Configuration Application Flow

```mermaid
graph LR
    Start[アプリケーション開始<br/>Application Start] --> EnvDetect[環境検出<br/>Environment Detection]
    
    EnvDetect --> DefaultConfig[デフォルト設定読み込み<br/>Load Default Config]
    DefaultConfig --> EnvOverride[環境変数オーバーライド<br/>Environment Variable Override]
    EnvOverride --> CustomMerge[カスタム設定マージ<br/>Custom Config Merge]
    
    CustomMerge --> Validate[設定検証<br/>Configuration Validation]
    Validate --> EmitterSetup[Emitterセットアップ<br/>Emitter Setup]
    
    EmitterSetup --> Ready[ログシステム準備完了<br/>Logging System Ready]
    
    style DefaultConfig fill:#e8f5e8
    style EnvOverride fill:#fff3e0
    style CustomMerge fill:#f3e5f5
    style Validate fill:#fce4ec
```

## 🚀 パフォーマンス設計 / Performance Design

### 非同期処理戦略 / Asynchronous Processing Strategy

**🔄 ノンブロッキング設計 / Non-blocking Design**
- ログ出力はメインスレッドをブロックしない / Log output doesn't block main thread
- バッファリングによる書き込み最適化 / Write optimization via buffering
- Promise.allSettledによる並列処理 / Parallel processing via Promise.allSettled

### バッファリング戦略 / Buffering Strategy

```mermaid
graph LR
    LogCall[ログ呼び出し<br/>Log Call] --> Buffer[メモリバッファ<br/>Memory Buffer]
    
    Buffer --> BatchCheck{バッチサイズ<br/>チェック<br/>Batch Size Check}
    
    BatchCheck -->|満杯<br/>Full| Flush[フラッシュ実行<br/>Execute Flush]
    BatchCheck -->|継続<br/>Continue| Wait[次の呼び出し待ち<br/>Wait for Next Call]
    
    Timer[タイマー<br/>Timer] --> ForceFlush[強制フラッシュ<br/>Force Flush]
    
    Flush --> Output[実際の出力<br/>Actual Output]
    ForceFlush --> Output
    
    style Buffer fill:#e8f5e8
    style Flush fill:#fff3e0
    style ForceFlush fill:#f3e5f5
```

### メモリ使用量最適化 / Memory Usage Optimization

**📊 メモリ効率化戦略 / Memory Efficiency Strategy**
- ログエントリの即座解放 / Immediate release of log entries
- 循環参照の防止 / Prevention of circular references
- WeakMap/WeakSetの活用 / Utilization of WeakMap/WeakSet

## 🔒 セキュリティ設計 / Security Design

### 機密データ保護 / Sensitive Data Protection

```mermaid
graph LR
    LogEntry[ログエントリ<br/>Log Entry] --> Detection[機密データ検出<br/>Sensitive Data Detection]
    
    Detection --> Masking[マスキング処理<br/>Masking Process]
    Masking --> Validation[検証<br/>Validation]
    
    Validation --> SafeOutput[安全な出力<br/>Safe Output]
    
    subgraph "検出対象 / Detection Targets"
        Password[パスワード<br/>Passwords]
        Token[APIトークン<br/>API Tokens]
        Email[メールアドレス<br/>Email Addresses]
        PersonalInfo[個人情報<br/>Personal Information]
    end
    
    Detection --> Password
    Detection --> Token
    Detection --> Email
    Detection --> PersonalInfo
    
    style Detection fill:#f3e5f5
    style Masking fill:#fff3e0
    style SafeOutput fill:#e8f5e8
```

### マスキング戦略 / Masking Strategy

**📋 セキュリティルール参照 / Security Rules Reference**

詳細なマスキング戦略とセキュリティルールは **[📊 logging.mdc](../../.cursor/rules/logging.mdc#禁止事項--prohibited-practices)** を参照してください。

For detailed masking strategy and security rules, refer to **[📊 logging.mdc](../../.cursor/rules/logging.mdc#禁止事項--prohibited-practices)**.

## 🔍 監視・アラート設計 / Monitoring & Alert Design

### アラート設計原則 / Alert Design Principles

**📊 段階的アラート / Graduated Alerts**
- 情報レベル：ログのみ / Info level: Log only
- 警告レベル：社内通知 / Warning level: Internal notification
- エラーレベル：即座対応 / Error level: Immediate response
- 致命的レベル：緊急対応 / Fatal level: Emergency response

### メトリクス収集戦略 / Metrics Collection Strategy

```mermaid
graph TB
    subgraph "収集メトリクス / Collected Metrics"
        TestMetrics[テスト実行メトリクス<br/>Test Execution Metrics]
        PerformanceMetrics[パフォーマンスメトリクス<br/>Performance Metrics]
        ErrorMetrics[エラーメトリクス<br/>Error Metrics]
        SystemMetrics[システムメトリクス<br/>System Metrics]
    end
    
    subgraph "分析・アラート / Analysis & Alerts"
        RealTime[リアルタイム分析<br/>Real-time Analysis]
        Trend[トレンド分析<br/>Trend Analysis]
        Threshold[閾値監視<br/>Threshold Monitoring]
        Prediction[予測分析<br/>Predictive Analysis]
    end
    
    TestMetrics --> RealTime
    PerformanceMetrics --> Trend
    ErrorMetrics --> Threshold
    SystemMetrics --> Prediction
    
    RealTime --> Alert[即座アラート<br/>Immediate Alert]
    Trend --> Report[レポート生成<br/>Report Generation]
    Threshold --> Warning[警告通知<br/>Warning Notification]
    Prediction --> Recommendation[改善提案<br/>Improvement Recommendation]
    
    style TestMetrics fill:#e8f5e8
    style PerformanceMetrics fill:#fff3e0
    style ErrorMetrics fill:#f3e5f5
    style SystemMetrics fill:#fce4ec
```

## 🔄 拡張性設計 / Extensibility Design

### 新Emitter追加パターン / New Emitter Addition Pattern

**🔌 プラグイン機構 / Plugin Mechanism**
- LogEmitterインターフェースの実装 / Implement LogEmitter interface
- LogManagerへの動的追加 / Dynamic addition to LogManager
- 設定ファクトリでの自動認識 / Automatic recognition in config factory

### カスタムEmitterの実装例 / Custom Emitter Implementation Example

```typescript
// カスタムEmitterの実装 / Custom Emitter Implementation
class SlackEmitter implements LogEmitter {
  async emit(entry: LogEntry): Promise<void> {
    if (entry.level >= LogLevel.ERROR) {
      await this.sendToSlack(entry);
    }
  }
  
  private async sendToSlack(entry: LogEntry): Promise<void> {
    // Slack通知の実装 / Slack notification implementation
  }
}

// 使用方法 / Usage
const logger = LogManager.getInstance(config);
logger.addEmitter(new SlackEmitter());
```

## 🎯 今後の拡張計画 / Future Extension Plans

### 予定機能 / Planned Features

**📈 高度な分析機能 / Advanced Analytics**
- 機械学習による異常検知 / Anomaly detection via machine learning
- 自動パフォーマンス最適化提案 / Automatic performance optimization suggestions
- テスト品質メトリクスの自動算出 / Automatic test quality metrics calculation

**🔌 外部連携機能 / External Integration**
- ELK Stack連携 / ELK Stack integration
- Grafana ダッシュボード / Grafana dashboard
- APM ツール連携 / APM tool integration

**🚀 スケーラビリティ / Scalability**
- 分散ログ収集対応 / Distributed log collection support
- クラウドストレージ連携 / Cloud storage integration
- マイクロサービス対応 / Microservices support

---

**📝 アーキテクチャ更新履歴 / Architecture Update History**
- v1.0.0: 初期アーキテクチャ設計 (2025-01-23) / Initial architecture design
- 最終更新 / Last updated: 2025-01-23
