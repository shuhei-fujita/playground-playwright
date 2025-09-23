# アーキテクチャ図 / Architecture Diagrams

以下はMermaidを埋め込んだMarkdownです。GitHubやエディタのMermaidプレビュー機能で閲覧できます。

## C4 Context / コンテキスト図
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

## Selector Strategy Flow / セレクター戦略フロー
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

### POM 図 / POM Diagrams
- Page Object Modelに特化した詳細図は `docs/architecture/POM.md` を参照

