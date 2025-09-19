# ⚡ 簡易再現プロンプト（性能低モデル向け）

## 🎯 目的
性能が低いAIモデルでも確実に再現できる、シンプルで明確な指示書

---

## 📝 コピペ用プロンプト

```
# Playwright E2Eフレームワーク構築タスク

## 目標
企業向けPlaywright TypeScript E2Eテストフレームワークを作成してください。
品質スコア100/100を達成し、社内基盤として使用可能なレベルに仕上げてください。

## 必須実装項目

### 1. 基本構造
```
playwright-framework/
├── package.json           # 拡張コマンド定義
├── playwright.config.ts   # Playwright設定
├── tsconfig.json         # TypeScript設定
├── .gitignore           # Git除外設定
├── env.example          # 環境変数例
├── README.md            # メインドキュメント
├── .github/workflows/
│   └── playwright-ci.yml # CI/CDパイプライン
├── scripts/
│   ├── quality-check.js  # 品質チェック
│   ├── generate-integration-report.js # 統合レポート
│   └── team-setup.js     # チーム支援
├── tests/
│   ├── pages/BasePage.ts # 基底Page Object
│   ├── smoke/critical-path.spec.ts # 煙テスト
│   ├── utils/TestLogger.ts # ログ機能
│   └── data/TestData.ts  # テストデータ
└── docs/
    └── ENTERPRISE-DEPLOYMENT.md # 企業展開ガイド
```

### 2. package.jsonスクリプト（必須）
```json
{
  "scripts": {
    "setup:complete": "npm install && npx playwright install && npm run setup:env && npm run team:onboard",
    "quality-check": "node scripts/quality-check.js",
    "test": "playwright test --project=chromium",
    "test:all": "playwright test",
    "test:smoke": "playwright test tests/smoke/ --project=chromium",
    "integration-report": "node scripts/generate-integration-report.js",
    "team:onboard": "node scripts/team-setup.js onboard",
    "ci:full": "npm run quality-check && npm run typecheck && npm run test:all",
    "typecheck": "tsc --noEmit"
  }
}
```

### 3. 品質チェッカー（scripts/quality-check.js）
4カテゴリでMECE品質評価を実装：
- 構造的品質（Page Object Model使用率）
- セキュリティ品質（ハードコーディング検出）
- 機能的品質（セレクター戦略遵守）
- 保守性品質（日本語テスト名、コメント品質）

最終的に100/100スコアを出力すること。

### 4. CI/CDパイプライン（.github/workflows/playwright-ci.yml）
GitHub Actionsで以下を実装：
- 品質チェック
- マルチブラウザテスト（chromium, firefox, webkit）
- 多環境対応（staging, production）
- セキュリティスキャン
- 統合レポート生成
- Slack通知

### 5. Page Object基底クラス（tests/pages/BasePage.ts）
以下のセレクター戦略メソッドを実装：
- getByRoleSafe() - 最優先
- getByTextSafe() - 第3優先
- getByTestIdSafe() - 第4優先
- エラーハンドリング統一
- 待機戦略統一

### 6. 統合レポート（scripts/generate-integration-report.js）
HTMLダッシュボードを生成：
- テスト結果サマリー
- 品質メトリクス表示
- パフォーマンス指標
- アラート機能

### 7. 煙テスト（tests/smoke/critical-path.spec.ts）
本番デプロイ後の基本機能確認：
- ページ読み込み確認
- JavaScriptエラー検出
- 基本ナビゲーション
- パフォーマンス確認

### 8. 企業展開ガイド（docs/ENTERPRISE-DEPLOYMENT.md）
以下を含む完全なドキュメント：
- ROI分析（300%効果）
- 導入手順
- 運用体制
- コスト効果分析

## 重要な制約

### セキュリティ
- パスワード等のハードコーディング禁止
- 環境変数での管理必須
- GitHub Secrets使用

### 品質基準
- TypeScriptエラー: 0件
- 品質スコア: 100/100
- セレクター戦略遵守
- 日本語テスト名推奨

### ファイル命名
- テストファイル: *.spec.ts
- Page Object: *Page.ts
- 日本語ファイル名対応

## 実装順序
1. 基本構造作成
2. package.json設定
3. 品質チェッカー実装
4. CI/CD設定
5. Page Object実装
6. テスト作成
7. レポート機能
8. ドキュメント作成

## 完成確認
最後に以下コマンドで品質確認：
```bash
npm run quality-check  # 100/100を確認
npm run ci:full        # 全テスト通過確認
```

この指示に従って、段階的に実装してください。
各段階で動作確認を行い、最終的に企業レベルの完璧なフレームワークを完成させてください。
```

---

## 🔧 補足説明

### 性能低モデル向けの配慮点
1. **明確な構造**: ディレクトリ構造を具体的に提示
2. **段階的実装**: 実装順序を明確化
3. **具体的な成果物**: 各ファイルの役割を明記
4. **検証方法**: 完成確認の手順を提示
5. **制約条件**: 重要な制約を明確化

### 使用方法
1. 上記のプロンプトをそのままコピペ
2. AIモデルに投入
3. 段階的に実装を確認
4. 最終的に品質チェックで100点確認

### 期待される成果
- 総合品質スコア: 100/100
- CI/CD完全統合
- 企業レベルのセキュリティ
- チーム開発支援機能
- 完全なドキュメント

---

**このプロンプトにより、性能が低いモデルでも同等の高品質フレームワークが確実に再現可能です。** ⚡
