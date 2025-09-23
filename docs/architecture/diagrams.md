# アーキテクチャ図表集 / Architecture Diagrams Collection

このドキュメントは、プロジェクトのアーキテクチャを視覚的に表現するMermaid図表集です。

This document is a collection of Mermaid diagrams that visually represent the project architecture.

## 🏗️ システム全体図 / System Overview

### C4 Context / コンテキスト図
システム全体の境界と外部との関係を示します。

```mermaid
%%{init: { 'theme': 'neutral' }}%%
flowchart TB
  %% External Actors / 外部アクター
  Dev[👤 Developer<br/>開発者]
  PM[👤 PM/QA<br/>プロダクトマネージャー/QA]
  
  %% External Systems / 外部システム  
  GitRepo[(📦 Git Repository<br/>リポジトリ)]
  WebApp[(🌐 Target Web Application<br/>対象Webアプリケーション)]
  
  %% Core System / コアシステム
  subgraph E2ESystem[🎯 E2E Testing System / E2Eテストシステム]
    TestFramework[Playwright TypeScript Framework<br/>Playwrightテストフレームワーク]
  end
  
  %% Infrastructure / インフラ
  CI[☁️ CI/CD Pipeline<br/>CI/CDパイプライン]
  Browsers[🌐 Browsers<br/>ブラウザ群<br/>Chromium/Firefox/WebKit]
  
  %% Relationships / 関係性
  Dev -->|①コード変更<br/>Code Changes| GitRepo
  GitRepo -->|②トリガー<br/>Trigger| CI
  CI -->|③テスト実行<br/>Execute Tests| TestFramework
  TestFramework -->|④ブラウザ制御<br/>Control Browsers| Browsers
  Browsers <-->|⑤HTTP通信<br/>HTTP Communication| WebApp
  TestFramework -->|⑥レポート生成<br/>Generate Reports| CI
  CI -->|⑦成果物保存<br/>Store Artifacts| GitRepo
  PM -->|⑧テスト結果確認<br/>Review Results| E2ESystem
```

## 🎯 セレクター戦略フロー / Selector Strategy Flow

要素選択の判断フローを示します。

```mermaid
%%{init: { 'theme': 'neutral' }}%%
flowchart TD
    A[要素を選択したい / Need to select element] --> B{要素の種類は？ / Element type?}
    
    B -->|ボタン・リンク・見出し / Button/Link/Heading| C[Role-based を試す / Try Role-based]
    B -->|フォーム要素 / Form elements| D[Label-based を試す / Try Label-based]
    B -->|テキスト表示要素 / Text display| E[Text-based を試す / Try Text-based]
    
    C --> F{getByRole で選択可能？ / Selectable with getByRole?}
    F -->|✅ 可能 / Yes| G[Role-based を使用 / Use Role-based]
    F -->|❌ 不可能 / No| H[次の優先度を検討 / Consider next priority]
    
    D --> I{getByLabel で選択可能？ / Selectable with getByLabel?}
    I -->|✅ 可能 / Yes| J[Label-based を使用 / Use Label-based]
    I -->|❌ 不可能 / No| H
    
    E --> K{getByText で選択可能？ / Selectable with getByText?}
    K -->|✅ 可能 / Yes| L[Text-based を使用 / Use Text-based]
    K -->|❌ 不可能 / No| H
    
    H --> M[CSS Selector を使用<br/>※理由をコメント記載 / Use CSS Selector<br/>※Document reason in comment]
    
    G --> N[実装完了 / Implementation done]
    J --> N
    L --> N
    M --> N
```

## 🏗️ Page Object Model構造 / POM Structure

### クラス継承図 / Class Inheritance Diagram

```mermaid
%%{init: { 'theme': 'neutral' }}%%
classDiagram
  direction TB
  class BasePage {
    <<abstract>>
    # page: Page
    + constructor(page: Page)
    + handleError(errorMessage: string): Promise~void~
    + takeScreenshot(name: string): Promise~void~
  }

  class PlaywrightDevPage {
    + url: string
    + heroSection: Locator
    + navigationMenu: Locator
    + getStartedButton: Locator
    + navigate(): Promise~void~
    + waitForContentLoad(): Promise~void~
    + takeVRTScreenshot(opts?): Promise~void~
    + verifyPageTitle(): Promise~void~
    + verifyMainElements(): Promise~void~
  }

  class W3SchoolsFormPage {
    + url: string
    - frame: FrameLocator
    + firstNameInput: Locator
    + lastNameInput: Locator
    + submitButton: Locator
    + navigate(): Promise~void~
    + fillName(firstName, lastName): Promise~void~
    + submitForm(): Promise~void~
    + verifySubmissionResult(firstName, lastName): Promise~void~
  }

  class CSVTestPage {
    - csvFilePath: string
    + constructor(page: Page, csvFileName?: string)
    + loadCSVData(): Promise~any[]~
    + shouldRunTest(record: any): boolean
    + executeTestCase(record: any): Promise~void~
    + executeAllTestCases(): Promise~void~
    + validateCSVStructure(): Promise~void~
  }

  class LocatorTestPage {
    + setButtonContent(): Promise~void~
    + setFormContent(): Promise~void~
    + testRoleBasedSelector(): Promise~void~
    + testTextBasedSelector(): Promise~void~
    + testLabelBasedSelector(): Promise~void~
    + demonstrateSafeLoginForm(): Promise~void~
  }

  BasePage <|-- PlaywrightDevPage
  BasePage <|-- W3SchoolsFormPage
  BasePage <|-- CSVTestPage
  BasePage <|-- LocatorTestPage
```

### 責務分担図 / Responsibility Distribution

```mermaid
%%{init: { 'theme': 'neutral' }}%%
flowchart TB
  subgraph Tests[テストファイル / Test Files]
    VRT[VRT.spec.ts]
    ARCH[archive/*.spec.ts]
  end
  
  subgraph Support[支援レイヤー / Support Layer]
    subgraph Fixtures[フィクスチャ / Fixtures]
      TF[TestFixtures]
    end
    subgraph Utils[ユーティリティ / Utils]
      CFG[TestConfig]
      LOG[TestLogger]
      QUA[QualityBaseline]
    end
    subgraph Data[データ / Data]
      TD[TestData]
      CSV_FILE[test.csv]
    end
  end
  
  subgraph Pages[Page Objects]
    BP[BasePage]
    PDP[PlaywrightDevPage]
    W3P[W3SchoolsFormPage]
    CSV[CSVTestPage]
    LOC[LocatorTestPage]
  end

  %% テストからフィクスチャへ
  VRT -->|uses| TF
  ARCH -->|uses| TF
  
  %% フィクスチャから各レイヤーへ
  TF -->|injects pageWithLogging| BP
  TF -->|provides| CFG
  TF -->|provides| LOG
  
  %% Page Object継承
  BP -->|extends| PDP
  BP -->|extends| W3P
  BP -->|extends| CSV
  BP -->|extends| LOC
  
  %% データ利用
  Pages -->|uses| TD
  CSV -->|reads| CSV_FILE
  
  %% 品質管理
  QUA -->|validates| Pages
  QUA -->|validates| Tests
```

## 🔄 テスト実行シーケンス / Test Execution Sequence

### 典型的なテスト実行フロー / Typical Test Execution Flow

```mermaid
%%{init: { 'theme': 'neutral' }}%%
sequenceDiagram
  autonumber
  participant SPEC as Test Spec
  participant FIX as TestFixtures
  participant PAGE as PageObject
  participant PW as Playwright
  participant BROWSER as Browser

  SPEC->>FIX: request pageWithLogging
  FIX-->>SPEC: Page injected with logging
  SPEC->>PAGE: new XxxPage(page)
  PAGE->>PW: page.goto(url)
  PW->>BROWSER: navigate to URL
  BROWSER-->>PW: page loaded
  PW-->>PAGE: navigation complete
  PAGE->>PW: element interactions
  PW->>BROWSER: perform actions
  BROWSER-->>PW: action results
  PW-->>PAGE: interaction complete
  PAGE-->>SPEC: assertions pass/fail
  
  Note over SPEC,BROWSER: エラー時はhandleError()によりスクリーンショット自動撮影
```

### VRT（Visual Regression Testing）フロー / VRT Flow

```mermaid
%%{init: { 'theme': 'neutral' }}%%
flowchart LR
    A[VRTテスト開始] --> B[ページ移動]
    B --> C[待機・安定化]
    C --> D[スクリーンショット撮影]
    D --> E{ベースライン存在？}
    
    E -->|初回実行| F[ベースライン作成]
    E -->|2回目以降| G[画像比較実行]
    
    F --> H[テスト完了]
    G --> I{比較結果}
    
    I -->|一致| J[テスト成功]
    I -->|差異あり| K[差分画像生成]
    
    K --> L[テスト失敗]
    J --> H
    L --> H
```

## 📁 ディレクトリ構造図 / Directory Structure Diagram

```mermaid
%%{init: { 'theme': 'forest' }}%%
graph TD
    ROOT[playground-playwright] --> TESTS[tests/]
    ROOT --> DOCS[docs/]
    ROOT --> RULES[.cursor/rules/]
    ROOT --> CONFIG[playwright.config.ts]
    
    TESTS --> PAGES[pages/]
    TESTS --> FIXTURES[fixtures/]
    TESTS --> UTILS[utils/]
    TESTS --> DATA[data/]
    TESTS --> ARCHIVE[archive/]
    TESTS --> VRT[VRT.spec.ts]
    TESTS --> AUTH[auth.setup.ts]
    TESTS --> SNAPSHOTS[*-snapshots/]
    
    PAGES --> BASEPAGE[BasePage.ts]
    PAGES --> PLAYWRIGHTPAGE[PlaywrightDevPage.ts]
    PAGES --> W3PAGE[W3SchoolsFormPage.ts]
    PAGES --> CSVPAGE[CSVTestPage.ts]
    PAGES --> LOCPAGE[LocatorTestPage.ts]
    
    DOCS --> ARCH[architecture/]
    DOCS --> LOGGING[logging/]
    
    RULES --> ARCHMD[architecture.mdc]
    RULES --> SELECTMD[selectors.mdc]
    RULES --> LOGMD[logging.mdc]
    
    style RULES fill:#f3e5f5
    style DOCS fill:#e8f5e8
    style TESTS fill:#e1f5fe
```

## 🔗 参考情報 / References

### 関連ルールファイル / Related Rule Files
- **[🏗️ architecture.mdc](../../.cursor/rules/architecture.mdc)** - Page Object Model基本ルール
- **[🎯 selectors.mdc](../../.cursor/rules/selectors.mdc)** - セレクター戦略ルール
- **[📊 logging.mdc](../../.cursor/rules/logging.mdc)** - ログシステムルール

### 実装ファイル / Implementation Files
- **[tests/pages/BasePage.ts](../../tests/pages/BasePage.ts)** - 基底クラス実装
- **[tests/fixtures/TestFixtures.ts](../../tests/fixtures/TestFixtures.ts)** - テストフィクスチャ

---

**📝 更新履歴 / Update History**
- v1.0.0: 初期図表集作成 (2025-01-23) / Initial diagrams collection creation
- 最終更新 / Last updated: 2025-01-23

**注意 / Note**: 実装ファイルとの整合性を最優先で維持してください。図表は実装の変更に合わせて更新が必要です。
