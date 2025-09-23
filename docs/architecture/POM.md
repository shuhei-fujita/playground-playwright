# Page Object Model アーキテクチャ / POM Architecture

このドキュメントは、当リポジトリのPage Object Model構造に焦点を当てた設計図です。

## 1. クラス構造 / Class Structure (実装ベース)
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

## 2. 責務分担 / Responsibilities
- **BasePage**: 共通基盤（エラーハンドリング、スクショ）
- **各Page**: セレクター戦略遵守、ドメイン操作の集約
- **Fixtures**: 認証済みコンテキスト、ロギング、設定の注入

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

## 3. シーケンス: 典型操作 / Sequence: Typical Operations
```mermaid
%%{init: { 'theme': 'neutral' }}%%
sequenceDiagram
  autonumber
  participant SPEC as Spec
  participant FIX as TestFixtures
  participant PAGE as PageObject(BasePage派生)
  participant PW as Playwright

  SPEC->>FIX: request pageWithLogging
  FIX-->>SPEC: Page injected
  SPEC->>PAGE: new XxxPage(page)
  PAGE->>PW: goto()/actions
  PAGE-->>SPEC: assertions pass/fail
```

**更新時は実装ファイルとの整合性を最優先で維持してください。**
