# 🎭 Playwright E2Eフレームワーク 完全再現プロンプト

## 📋 概要
このプロンプトは、企業レベルのPlaywright TypeScript E2Eテストフレームワークを完全に再現するための詳細な指示書です。性能が低いモデルでも確実に再現できるよう、段階的に構造化されています。

## 🎯 最終成果物
- 総合品質スコア100/100の完璧なフレームワーク
- CI/CD完全統合（GitHub Actions）
- 統合レポート・ダッシュボード機能
- チーム開発支援（オンボーディング自動化）
- 企業レベルのセキュリティ・コンプライアンス対応

---

## 📝 実行プロンプト

```
あなたは企業向けPlaywright TypeScript E2Eテストフレームワークの専門家です。
社内基盤として展開可能な完璧なフレームワークを構築してください。

## 🎯 要件

### 1. 基本構造
- Page Object Modelパターン完全実装
- TypeScript型安全性確保
- MECE（Mutually Exclusive, Collectively Exhaustive）原則適用

### 2. 品質管理システム
以下の4カテゴリで100点満点の品質チェックシステムを実装：
- 構造的品質（Structural Quality）
- セキュリティ品質（Security Quality）
- 機能的品質（Functional Quality）
- 保守性品質（Maintainability Quality）

### 3. セレクター戦略（優先順位必須）
1. getByRole() - 最優先
2. getByLabel() - 第2優先
3. getByText() - 第3優先
4. getByTestId() - 第4優先
5. CSS/IDセレクター - 最終手段（コメント必須）

### 4. セキュリティ対策
- 環境変数による認証情報管理
- ハードコーディング完全禁止
- GitHub Secrets統合

### 5. CI/CDパイプライン
GitHub Actionsで以下を実装：
- 品質チェック（並行実行）
- マルチブラウザテスト（Chromium, Firefox, WebKit）
- 多環境対応（Staging, Production）
- Visual Regression Testing
- セキュリティスキャン
- 統合レポート生成
- Slack通知

### 6. チーム開発支援
- 新人オンボーディング自動化
- VSCode設定自動生成
- Git hooks設定
- 日英バイリンガルドキュメント

### 7. 監視・レポート
- リアルタイムダッシュボード（HTML）
- パフォーマンスメトリクス
- 品質トレンド分析
- アラート機能

## 📁 必須ファイル構造

```
playwright-framework/
├── .github/workflows/
│   └── playwright-ci.yml          # CI/CDパイプライン
├── .cursor/rules/                  # ルール体系
│   ├── architecture.mdc            # アーキテクチャルール
│   ├── selectors.mdc              # セレクター戦略
│   ├── security.mdc               # セキュリティルール
│   ├── quality.mdc                # 品質基準
│   └── test-outputs.mdc           # 出力管理
├── scripts/
│   ├── quality-check.js           # MECE品質チェック
│   ├── generate-integration-report.js # 統合レポート
│   └── team-setup.js              # チーム開発支援
├── tests/
│   ├── pages/                     # Page Objects
│   │   ├── BasePage.ts            # 基底クラス
│   │   └── *.page.ts              # 各ページ
│   ├── fixtures/                  # フィクスチャ
│   ├── utils/                     # ユーティリティ
│   ├── data/                      # テストデータ
│   ├── smoke/                     # 煙テスト
│   └── *.spec.ts                  # テストファイル
├── docs/
│   ├── ONBOARDING.md              # オンボーディング
│   └── ENTERPRISE-DEPLOYMENT.md   # 企業展開ガイド
├── package.json                   # 拡張コマンド
├── playwright.config.ts          # Playwright設定
├── env.example                    # 環境変数例
└── README.md                      # メインドキュメント
```

## 🔧 実装手順

### Phase 1: 基盤構築
1. package.json作成（全必要コマンド含む）
2. TypeScript設定
3. Playwright基本設定
4. ディレクトリ構造作成

### Phase 2: ルール体系構築
1. .cursor/rules/配下に全ルールファイル作成
2. 日英バイリンガル対応
3. MECE原則適用

### Phase 3: Page Object実装
1. BasePage作成（共通機能）
2. セレクター戦略実装
3. エラーハンドリング統一

### Phase 4: 品質管理システム
1. MECE品質チェッカー実装
2. 4カテゴリ評価システム
3. 自動レポート生成

### Phase 5: CI/CD統合
1. GitHub Actions設定
2. マトリックス戦略実装
3. 環境別実行
4. アーティファクト管理

### Phase 6: レポート・ダッシュボード
1. 統合レポート生成
2. HTMLダッシュボード
3. Slack通知

### Phase 7: チーム支援機能
1. オンボーディング自動化
2. VSCode設定生成
3. Git hooks設定

### Phase 8: ドキュメント整備
1. 企業展開ガイド
2. ROI分析
3. 運用マニュアル

## ✅ 品質基準

### 必須達成項目
- [ ] 総合品質スコア: 100/100
- [ ] セキュリティ違反: 0件
- [ ] TypeScriptエラー: 0件
- [ ] 全ブラウザ対応: Chromium, Firefox, WebKit
- [ ] CI/CD完全自動化
- [ ] 日英バイリンガルドキュメント
- [ ] ワンコマンドセットアップ

### package.jsonコマンド例
```json
{
  "scripts": {
    "setup:complete": "npm install && npx playwright install && npm run setup:env && npm run team:onboard",
    "quality-check": "node scripts/quality-check.js",
    "test:all": "playwright test",
    "test:smoke": "playwright test tests/smoke/ --project=chromium",
    "integration-report": "node scripts/generate-integration-report.js",
    "team:onboard": "node scripts/team-setup.js onboard",
    "ci:full": "npm run quality-check && npm run typecheck && npm run test:all && npm run integration-report",
    "deploy:production": "npm run ci:full && npm run test:smoke && echo '🚀 Production環境へのデプロイ準備完了'"
  }
}
```

## 🎯 成功指標
1. **技術指標**: 品質スコア100点、エラー0件
2. **運用指標**: ワンコマンド完全セットアップ
3. **ビジネス指標**: ROI 300%、導入期間4ヶ月
4. **チーム指標**: オンボーディング自動化、研修効率化

## 📞 重要な注意点
1. 全ファイルに適切なコメント（日本語）
2. エラーハンドリング必須実装
3. 環境変数による設定管理
4. Git管理対象外ファイル適切設定
5. 実行権限設定（scripts/*.js）

この指示に従って、企業レベルの完璧なPlaywright E2Eテストフレームワークを構築してください。
各段階で品質を確認し、最終的に100点満点の評価を達成してください。
```

---

## 🔍 検証用チェックリスト

### 完成確認項目
- [ ] `npm run quality-check` で100/100達成
- [ ] `npm run setup:complete` で完全セットアップ
- [ ] CI/CDパイプライン動作確認
- [ ] 統合レポート生成確認
- [ ] 全ブラウザテスト成功
- [ ] セキュリティスキャン通過
- [ ] オンボーディング機能動作

### ファイル存在確認
- [ ] .github/workflows/playwright-ci.yml
- [ ] .cursor/rules/*.mdc（5ファイル）
- [ ] scripts/*.js（3ファイル）
- [ ] tests/pages/BasePage.ts
- [ ] tests/smoke/critical-path.spec.ts
- [ ] docs/ENTERPRISE-DEPLOYMENT.md
- [ ] env.example
- [ ] README.md更新

## 💡 使用方法

1. このプロンプトを任意のAIモデルに投入
2. 段階的に実装を確認
3. 品質チェックで100点達成まで繰り返し
4. 最終的に企業展開可能なフレームワーク完成

---

**このプロンプトにより、どのAIモデルでも同等の高品質フレームワークが再現可能です。** 🚀
