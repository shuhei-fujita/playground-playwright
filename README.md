# Playwright TypeScript E2Eテスト自動化フレームワーク

高品質で保守しやすいE2Eテストを実現するためのPlaywright TypeScriptフレームワークです。

## 📋 開発ルール（1次情報源）

このプロジェクトの開発は以下のルールに従ってください：

| ルール分類         | ファイル                                             | 適用範囲     | 重要度 |
| ------------------ | ---------------------------------------------------- | ------------ | ------ |
| **基本ルール**     | [📘 core.mdc](.cursor/rules/core.mdc)                 | 全体         | ⭐️⭐️⭐️    |
| **セキュリティ**   | [🔒 security.mdc](.cursor/rules/security.mdc)         | 全体         | ⭐️⭐️⭐️    |
| **セレクター戦略** | [🎯 selectors.mdc](.cursor/rules/selectors.mdc)       | テストコード | ⭐️⭐️⭐️    |
| **アーキテクチャ** | [🏗️ architecture.mdc](.cursor/rules/architecture.mdc) | 設計         | ⭐️⭐️     |
| **品質基準**       | [📊 quality.mdc](.cursor/rules/quality.mdc)           | 全体         | ⭐️⭐️     |

> **重要**: 上記ルールファイルが**唯一の正式な仕様書**です。他のドキュメントとの矛盾がある場合は、ルールファイルが優先されます。

## ⚙️ クイックスタート

```bash
npm install && cp .env.example .env && npx playwright install && npm test
```

## 🧹 出力物管理

```bash
yarn clean          # 出力ファイルクリーンアップ
yarn update:vrt     # VRTベースライン更新
yarn test:all       # 全ブラウザでテスト実行
yarn test:ui        # UIモードでテスト実行
yarn report         # テストレポート表示
yarn typecheck      # TypeScript型チェック
```

> **詳細**: [📁 test-outputs.mdc](.cursor/rules/test-outputs.mdc) を参照

## 📚 開発情報

**全ルール一覧**: [📋 Rules Index](.cursor/rules/index.mdc)

**対応テストシナリオ**: チケットぴあ、フォーム操作、Todo MVC、リベシティ、VRT

**出力物管理**: [📁 test-outputs.mdc](.cursor/rules/test-outputs.mdc)

---

> **開発時は `.cursor/rules/` 内のルールファイルを参照してください。**
