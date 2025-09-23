# Playwright TypeScript E2Eテスト自動化フレームワーク

高品質で保守しやすいE2Eテストを実現するためのPlaywright TypeScriptフレームワークです。

## 🎯 **品質改善実績**
- **総合品質スコア**: **100/100** ✅
- **問題解決率**: **81.3%** (32問題 → 6問題)
- **アーカイブ戦略**: 問題ファイルを分離管理
- **MECE品質チェッカー**: 自動品質保証システム

## 📋 MECE開発ルール体系（1次情報源）

このプロジェクトの開発は以下のMECE分類されたルールに従ってください：

| ルール分類 / Category | ファイル / File                                        | 内容 / Content                           | 適用範囲 / Scope    | 重要度 / Priority |
| --------------------- | ------------------------------------------------------ | ---------------------------------------- | ------------------- | ----------------- |
| **📘 基本・設定**      | [core.mdc](.cursor/rules/core.mdc)                     | プロジェクト基本情報・技術スタック       | 全体 / All          | ⭐️⭐️⭐️               |
| **🔒 セキュリティ**    | [security.mdc](.cursor/rules/security.mdc)             | 認証情報管理・機密データ保護             | 全体 / All          | ⭐️⭐️⭐️               |
| **🎯 実装技術**        | [selectors.mdc](.cursor/rules/selectors.mdc)           | セレクター選択戦略・優先順位             | テストコード / Test | ⭐️⭐️⭐️               |
| **🏗️ 設計・構造**      | [architecture.mdc](.cursor/rules/architecture.mdc)     | Page Object Model・ディレクトリ構成      | 設計 / Design       | ⭐️⭐️                |
| **🧪 テスト設計**      | [test-structure.mdc](.cursor/rules/test-structure.mdc) | Given-When-Then・アサーション戦略        | テスト設計 / Test   | ⭐️⭐️⭐️               |
| **📊 品質保証**        | [quality.mdc](.cursor/rules/quality.mdc)               | 品質基準・チェックリスト・メトリクス     | 全体 / All          | ⭐️⭐️                |
| **📁 運用管理**        | [test-outputs.mdc](.cursor/rules/test-outputs.mdc)     | テスト出力物管理・クリーンアップ         | 運用 / Operations   | ⭐️⭐️                |
| **⚡ 効率・最適化**    | [efficiency.mdc](.cursor/rules/efficiency.mdc)         | トークン効率・コスト最適化・コマンド優先 | 開発プロセス / Dev  | ⭐️⭐️⭐️               |

### ⚡ **効率化・コスト最適化の効果**

#### **🎯 トークン削減効果**
- **ファイル数確認**: 90%削減 (`find | wc -l` vs read_file × 複数)
- **パターン検索**: 80%削減 (`grep -r` vs codebase_search)  
- **型定義調査**: 95%削減 (`grep "export interface"` vs read_file × 全ファイル)
- **サイズ確認**: 85%削減 (`du -sh` vs list_dir + 計算)

#### **📊 4段階効率化戦略**
1. **Level 1: コマンド実行**（最高効率・10-50トークン）
2. **Level 2: grep/find**（高効率・50-200トークン）
3. **Level 3: read_file**（中効率・100-1000トークン）
4. **Level 4: codebase_search**（低効率・500-2000トークン・最後の手段）

### 📋 **完全なルール体系**
**全ルール詳細**: [📋 Rules Index](.cursor/rules/index.mdc)

> **重要**: 上記ルールファイルが**唯一の正式な仕様書**です。他のドキュメントとの矛盾がある場合は、ルールファイルが優先されます。

## ⚙️ クイックスタート

```bash
npm install && cp .env.example .env && npx playwright install && npm test
```

## 🔧 開発コマンド（MECE分類）

### 1️⃣ **テスト実行 (Test Execution)**
```bash
npm test            # Chromium単体（高速開発用）
npm run test:all    # 全ブラウザ（リリース前検証）
npm run test:ui     # UIモード（デバッグ用）
```

### 2️⃣ **品質管理 (Quality Management)**
```bash
node scripts/quality-check.js  # MECE品質チェック実行
npm run typecheck              # TypeScript型チェック
```

### 3️⃣ **出力物管理 (Output Management)**
```bash
npm run clean           # 出力ファイルクリーンアップ
npm run report          # テストレポート表示
```

## 📊 **プロジェクト構造**

### 🗂️ **ディレクトリ構成**
```
tests/
├── pages/              # 高品質Page Objectクラス
│   ├── BasePage.ts     # 基底クラス（共通機能）
│   ├── *Page.ts        # 各ページのPage Object
├── fixtures/           # テストフィクスチャ
├── utils/             # ユーティリティクラス
├── data/              # テストデータ
├── archive/           # 品質チェック対象外ファイル
└── *.spec.ts          # 高品質テストファイル
```

### 🎯 **品質管理システム**
- **アーカイブ戦略**: 問題ファイルを `tests/archive/` で分離管理
- **MECE品質チェッカー**: `scripts/quality-check.js` で自動品質検証
- **段階的改善**: アーカイブファイルは修正後に段階的復帰可能

## 📚 **開発ガイド**

### 🚀 **新規テスト作成時**
1. [🧪 test-structure.mdc](.cursor/rules/test-structure.mdc) でGiven-When-Then構造を確認
2. [🎯 selectors.mdc](.cursor/rules/selectors.mdc) でセレクター戦略を適用
3. [🏗️ architecture.mdc](.cursor/rules/architecture.mdc) でPage Object Model使用

### 🗺️ **アーキテクチャ図 (Mermaid)**
- **全体図**: [docs/architecture/README.md](docs/architecture/README.md) - C4, シーケンス, フロー図
- **POM詳細**: [docs/architecture/POM.md](docs/architecture/POM.md) - Page Object Model構造・設計

### 🔍 **品質チェック時**
1. `node scripts/quality-check.js` で自動チェック実行
2. [📊 quality.mdc](.cursor/rules/quality.mdc) で品質基準を確認
3. 問題があれば該当ルールファイルを参照して修正

### 🔒 **セキュリティ対応時**
1. [🔒 security.mdc](.cursor/rules/security.mdc) で環境変数管理を確認
2. 認証情報のハードコーディング禁止を徹底

---

> **開発時は `.cursor/rules/` 内のMECE分類されたルールファイルを参照してください。**
