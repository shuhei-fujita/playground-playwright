# プロジェクト固有Q&A / Project-Specific FAQ

## 設計・アーキテクチャ / Design & Architecture

### Q1: expect/assertはPage Object内とテストファイル内のどちらに書くべき？
**A:** Playwright公式準拠のハイブリッドアプローチを採用しています：

```typescript
// ✅ Page Object内: アクション実行時の基本成功確認
async navigate(): Promise<void> {
  await this.page.goto(this.url);
  await expect(this.heroSection).toBeVisible({ timeout: 15000 }); // 基本確認
}

// ✅ テストファイル内: テスト固有の詳細検証
test("ページタイトル検証", async ({ page }) => {
  await playwrightPage.navigate(); // 基本確認済み
  await expect(page).toHaveTitle(/Fast and reliable end-to-end testing/); // 詳細検証
});
```

**詳細**: [expect-strategy.mdc](expect-strategy.mdc)

---

### Q2: Page Object内で`page.locator()`を直接使っても良い？
**A:** 基本的に**避けるべき**です。アーキテクチャルールに従って設計してください：

```typescript
// ❌ 避けるべきパターン
test("テスト", async ({ page }) => {
  const element = page.locator("main"); // 直接使用
  await expect(element).toBeVisible();
});

// ✅ 推奨パターン
test("テスト", async ({ page }) => {
  const playwrightPage = new PlaywrightDevPage(page);
  await playwrightPage.navigate(); // Page Objectメソッド使用
  await playwrightPage.verifyMainElements(); // Page Objectで検証
});
```

**理由**: Page Object Modelによる責任分離・保守性・再利用性の向上

---

### Q3: CSS セレクター (`.class`, `#id`) を使っても良い？
**A:** **基本的に避ける**べきです。セレクター戦略の優先順位に従ってください：

```typescript
// ❌ 避けるべき（CSS依存）
page.locator('.btn-primary')
page.locator('#submit-button')

// ✅ 推奨（セマンティック・安定）
page.getByRole('button', { name: 'Submit' })
page.getByLabel('Password')
page.getByText('Save')
```

**優先順位**: Role-based → Text-based → Label-based → 属性セレクター → CSS（最終手段）

**詳細**: [selectors.mdc](selectors.mdc)

---

## テスト実行・環境 / Test Execution & Environment

### Q4: VRTテストで初回実行時に「snapshot doesn't exist」エラーが出る
**A:** **正常な動作**です。初回実行時はベースライン画像が存在しないため：

```bash
# ベースライン画像を承認
npx playwright test --update-snapshots

# または特定のテストのみ
npx playwright test VRT.spec.ts --update-snapshots
```

**手順**:
1. テスト実行してベースライン画像を生成
2. `--update-snapshots`で承認
3. gitにコミット
4. 次回からは比較テストが実行される

**詳細**: [test-outputs.mdc](test-outputs.mdc)

---

### Q5: テストが並列実行で失敗する場合がある
**A:** `playwright.config.ts`の設定を確認してください：

```typescript
export default defineConfig({
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined, // CI環境では1つに制限
  retries: process.env.CI ? 2 : 0,        // CI環境でのみリトライ
});
```

**対策**:
- 共有状態の排除
- テスト間の依存関係をなくす
- 適切な待機戦略の実装

---

### Q6: `process.env.TEST_PASSWORD` が undefined になる
**A:** 環境変数の設定を確認してください：

```bash
# .env ファイルの作成
echo "TEST_PASSWORD=your-test-password" > .env

# .env.example の確認
TEST_PASSWORD=dummy-password-for-demo
```

**セキュリティルール**:
- ハードコーディング禁止
- `.env`をgit管理から除外
- `.env.example`でテンプレート提供

**詳細**: [security.mdc](security.mdc)

---

## 実装・開発 / Implementation & Development

### Q7: 新しいPage Objectを作成する際の手順は？
**A:** 以下の手順に従ってください：

```typescript
// 1. BasePage を継承
export class NewPage extends BasePage {
  readonly url = "https://example.com";
  
  // 2. セレクター戦略に従った要素定義
  readonly submitButton: Locator;
  
  constructor(page: Page) {
    super(page);
    // 3. Role-based セレクターを優先
    this.submitButton = this.page.getByRole('button', { name: 'Submit' });
  }
  
  // 4. アクションメソッドに基本成功確認を含む
  async submit(): Promise<void> {
    try {
      await this.submitButton.click();
      await expect(this.page).toHaveURL(/success/); // 基本確認
    } catch (error) {
      await this.handleError(`送信に失敗: ${error}`);
      throw error;
    }
  }
}
```

**チェックリスト**:
- [ ] BasePage継承
- [ ] セレクター戦略遵守
- [ ] アクションメソッドに基本確認
- [ ] エラーハンドリング実装

---

### Q8: archiveフォルダのファイルは品質チェック対象外？
**A:** **はい**。`tests/archive/`は品質チェック対象外です：

```javascript
// scripts/quality-check.js
const shouldSkipArchive = filePath.includes('tests/archive/');
if (shouldSkipArchive) {
  console.log('🗂️ アーカイブフォルダは品質チェック対象外です');
  return;
}
```

**目的**:
- 段階的改善の対象ファイル
- 参考実装・学習用コード
- 実験的実装

**運用**:
- 新規実装は`tests/`直下に配置
- archive内は参考のみ、本番使用禁止

---

### Q9: Given-When-Then構造は必須？
**A:** **推奨**です。テスト構造ルールに従ってください：

```typescript
test("テスト名", async ({ page }) => {
  const somePage = new SomePage(page);
  
  try {
    // === GIVEN: テスト前提条件の設定 ===
    await somePage.navigate();
    
    // === WHEN: テスト対象の操作実行 ===
    await somePage.performAction();
    
    // === THEN: 期待結果の検証 ===
    await expect(page).toHaveTitle(/期待タイトル/);
  } catch (error) {
    await somePage.handleError(`テストでエラー: ${error}`);
    throw error;
  }
});
```

**理由**:
- テスト意図の明確化
- 可読性・保守性の向上
- 統一されたテスト構造

**詳細**: [test-structure.mdc](test-structure.mdc)

---

## トラブルシューティング / Troubleshooting

### Q10: 「要素が見つからない」エラーが発生する
**A:** 以下の順序で確認してください：

1. **適切な待機戦略**:
```typescript
// ❌ 不適切
await page.locator('.dynamic-content').click();

// ✅ 適切
await expect(page.locator('.dynamic-content')).toBeVisible();
await page.locator('.dynamic-content').click();
```

2. **セレクター戦略の見直し**:
```typescript
// ❌ 不安定
page.locator('.btn-123')

// ✅ 安定
page.getByRole('button', { name: 'Submit' })
```

3. **iframeの確認**:
```typescript
// iframe内要素の場合
const frame = page.frameLocator('iframe[name="content"]');
await frame.getByRole('button').click();
```

---

### Q11: テスト実行が遅い場合の対策は？
**A:** 以下の最適化を確認してください：

1. **並列実行の活用**:
```typescript
// playwright.config.ts
export default defineConfig({
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,
});
```

2. **不要な待機の削除**:
```typescript
// ❌ 固定待機
await page.waitForTimeout(5000);

// ✅ 条件待機
await expect(element).toBeVisible();
```

3. **効率的なセレクター使用**:
```typescript
// ❌ 複雑なCSS
page.locator('div.container > ul.list > li:nth-child(3)')

// ✅ シンプルなRole
page.getByRole('listitem').nth(2)
```

---

### Q12: CI/CDでテストが失敗するが、ローカルでは成功する
**A:** 以下を確認してください：

1. **環境変数の設定**:
```yaml
# GitHub Actions例
env:
  TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
```

2. **タイムアウト設定**:
```typescript
// CI環境では長めに設定
expect.configure({ timeout: process.env.CI ? 30000 : 10000 });
```

3. **ブラウザの違い**:
```typescript
// CI用の設定
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'on-first-retry',
}
```

---

## ベストプラクティス / Best Practices

### Q13: テストデータの管理方法は？
**A:** 以下の階層で管理してください：

```typescript
// tests/data/TestData.ts
export const TestData = {
  users: {
    validUser: { username: 'testuser', password: process.env.TEST_PASSWORD },
    invalidUser: { username: 'invalid', password: 'wrong' }
  },
  urls: {
    staging: 'https://staging.example.com',
    production: 'https://example.com'
  }
};

// CSVデータ駆動テスト
// tests/test.csv
id,runTest,url,expectedTitle
001,true,https://playwright.dev,Playwright
```

**原則**:
- 機密情報は環境変数
- 静的データはTypeScriptファイル
- 大量データはCSVファイル

---

### Q14: エラー時のデバッグ方法は？
**A:** 以下のツールを活用してください：

1. **HTMLレポート**:
```bash
npx playwright show-report
```

2. **UIモード**:
```bash
npx playwright test --ui
```

3. **デバッグモード**:
```bash
npx playwright test --debug
```

4. **トレース確認**:
```bash
npx playwright show-trace test-results/trace.zip
```

**BasePage.handleError()の活用**:
```typescript
// 自動的にスクリーンショット・ログ出力
await this.handleError(`操作に失敗: ${error}`);
```

---

### Q15: 品質チェックで問題が検出された場合の対処法は？
**A:** 以下の手順で修正してください：

```bash
# 品質チェック実行
./scripts/quality-check.js

# 問題の確認
📊 === MECE品質チェック結果 ===
🏗️ 構造的品質: 80% (8/10) - 問題数: 2
🔒 セキュリティ品質: 100% (10/10) - 問題数: 0
```

**修正優先度**:
1. **🔒 セキュリティ** (最優先)
2. **🏗️ 構造的品質** (高)
3. **⚙️ 機能的品質** (中)
4. **📝 保守性品質** (低)

**具体的な修正例**:
```typescript
// セキュリティ問題修正
- const password = "hardcoded123";
+ const password = process.env.TEST_PASSWORD;

// 構造的問題修正  
- await page.locator('.btn').click();
+ await this.submitButton.click();
```

---

## 参考リンク / References

### 📚 **プロジェクト内ドキュメント**
- [アーキテクチャルール](architecture.mdc)
- [expect配置戦略](expect-strategy.mdc)
- [セレクター戦略](selectors.mdc)
- [テスト構造ルール](test-structure.mdc)
- [セキュリティルール](security.mdc)
- [品質基準](quality.mdc)

### 🌐 **外部リソース**
- [Playwright公式ドキュメント](https://playwright.dev/)
- [Page Object Model](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [セレクター戦略](https://playwright.dev/docs/locators)

---

## 更新履歴 / Update History

| 日付       | 更新内容                     | 担当者       |
| ---------- | ---------------------------- | ------------ |
| 2025-09-23 | 初版作成・expect配置戦略追加 | AI Assistant |
| -          | -                            | -            |

---

*このFAQは実際のプロジェクト課題に基づいて作成されています。新しい質問や課題が発見された場合は、このドキュメントを随時更新してください。*