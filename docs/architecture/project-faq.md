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

### Q4: Locatorの定義はコンストラクタで行うべき？メソッド内で都度定義すべき？
**A:** **コンストラクタでの定義を推奨**します：

```typescript
// ✅ 推奨: コンストラクタで定義
export class LoginPage extends BasePage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = this.page.getByLabel('Username');
    this.passwordInput = this.page.getByLabel('Password');
    this.submitButton = this.page.getByRole('button', { name: 'Login' });
  }
}

// ❌ 非推奨: メソッド内で都度定義
async login(username: string, password: string): Promise<void> {
  const usernameInput = this.page.getByLabel('Username'); // 毎回定義
  const passwordInput = this.page.getByLabel('Password'); // 毎回定義
}
```

**理由**: 再利用性・保守性・型安全性の向上

---

### Q5: 複数のPage Objectを組み合わせる場合の設計は？
**A:** **コンポジションパターン**を使用してください：

```typescript
// ✅ 複数Page Objectの組み合わせ
test("ログインからダッシュボードまでの流れ", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const headerComponent = new HeaderComponent(page);

  // GIVEN
  await loginPage.navigate();
  
  // WHEN
  await loginPage.login('testuser', process.env.TEST_PASSWORD);
  
  // THEN
  await dashboardPage.verifyPageLoad();
  await headerComponent.verifyUserName('testuser');
});

// Page Object間での依存関係
export class DashboardPage extends BasePage {
  private header: HeaderComponent;
  
  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
  }
}
```

---

### Q6: iframe や Shadow DOM の扱い方は？
**A:** Playwrightの専用APIを使用してください：

```typescript
// iframe の扱い
export class IFramePage extends BasePage {
  private readonly frame: FrameLocator;
  
  constructor(page: Page) {
    super(page);
    this.frame = this.page.frameLocator('iframe[name="content"]');
  }
  
  async clickButtonInFrame(): Promise<void> {
    await this.frame.getByRole('button', { name: 'Submit' }).click();
  }
}

// Shadow DOM の扱い
async clickShadowDOMElement(): Promise<void> {
  const shadowHost = this.page.locator('#shadow-host');
  const shadowContent = shadowHost.locator(':scope >>> button');
  await shadowContent.click();
}
```

---

### Q7: APIテストとE2Eテストの使い分けは？
**A:** 以下の基準で使い分けてください：

```typescript
// ✅ E2Eテスト: ユーザー操作の検証
test("ユーザーがログインできること", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login('user', 'password');
  await expect(page).toHaveURL(/dashboard/);
});

// ✅ APIテスト: データ処理・ビジネスロジックの検証
test("APIでユーザー情報を取得できること", async ({ request }) => {
  const response = await request.get('/api/users/123');
  expect(response.status()).toBe(200);
  const userData = await response.json();
  expect(userData.name).toBe('Test User');
});

// ✅ 組み合わせ: API準備 + E2E検証
test("作成したユーザーでログインできること", async ({ page, request }) => {
  // API でテストユーザー作成
  await request.post('/api/users', { data: testUserData });
  
  // E2E でログイン検証
  const loginPage = new LoginPage(page);
  await loginPage.login(testUserData.username, testUserData.password);
});
```

---

### Q8: データ属性（data-testid）の使用基準は？
**A:** **最終手段として使用**してください：

```typescript
// 優先順位に従った選択
// 1. Role-based (最優先)
this.submitButton = this.page.getByRole('button', { name: 'Submit' });

// 2. Text-based
this.saveLink = this.page.getByText('Save');

// 3. Label-based
this.emailInput = this.page.getByLabel('Email');

// 4. data-testid (最終手段)
this.complexWidget = this.page.locator('[data-testid="user-widget"]');

// ✅ data-testid を使う適切なケース
// - 複雑なカスタムコンポーネント
// - 一意に特定できない要素
// - 外部ライブラリのコンポーネント
```

---

## テスト実行・環境 / Test Execution & Environment

### Q9: ブラウザ別のテスト実行方法は？
**A:** `playwright.config.ts` のプロジェクト設定を活用してください：

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  ],
});

// 実行コマンド
// 特定ブラウザのみ
npx playwright test --project=chromium
npx playwright test --project=firefox

// 複数ブラウザ
npx playwright test --project=chromium --project=firefox

// モバイル
npx playwright test --project=mobile-chrome
```

---

### Q10: ヘッドレス vs ヘッドありモードの使い分けは？
**A:** 用途に応じて使い分けてください：

```bash
# ✅ ヘッドレス（デフォルト）: CI/CD・高速実行
npx playwright test

# ✅ ヘッドあり: デバッグ・開発時
npx playwright test --headed

# ✅ UIモード: インタラクティブなデバッグ
npx playwright test --ui

# ✅ デバッグモード: ステップ実行
npx playwright test --debug
```

```typescript
// 設定での制御
export default defineConfig({
  use: {
    headless: process.env.CI ? true : false, // CI環境でのみヘッドレス
  },
});
```

---

### Q11: CI/CDでの成果物保存設定は？
**A:** 以下の成果物を保存してください：

```yaml
# GitHub Actions例
- name: Run Playwright tests
  run: npx playwright test

- name: Upload HTML report
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 30

- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: test-results
    path: test-results/
    retention-days: 7

# 重要な成果物
# - playwright-report/index.html (HTMLレポート)
# - test-results/ (スクリーンショット・動画・トレース)
# - tests/*-snapshots/ (VRTベースライン画像)
```

---

### Q12: Docker環境でのPlaywright実行方法は？
**A:** 公式Dockerイメージを使用してください：

```dockerfile
# Dockerfile
FROM mcr.microsoft.com/playwright:v1.46.0-focal

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

CMD ["npm", "test"]
```

```bash
# Docker実行
docker build -t playwright-tests .
docker run --rm playwright-tests

# docker-compose.yml
version: '3.8'
services:
  playwright:
    build: .
    volumes:
      - ./test-results:/app/test-results
      - ./playwright-report:/app/playwright-report
```

---

### Q13: 環境別設定の管理方法は？
**A:** 環境変数と設定ファイルを組み合わせてください：

```typescript
// tests/utils/TestConfig.ts
export class TestConfig {
  static getBaseURL(): string {
    switch (process.env.TEST_ENV) {
      case 'production': return 'https://app.example.com';
      case 'staging': return 'https://staging.example.com';
      case 'development': return 'http://localhost:3000';
      default: return 'http://localhost:3000';
    }
  }
  
  static getTimeout(): number {
    return process.env.CI ? 30000 : 10000;
  }
}

// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: TestConfig.getBaseURL(),
  },
  timeout: TestConfig.getTimeout(),
});
```

---

### Q14: 大量のテストファイルの実行管理は？
**A:** タグ付けとフィルタリングを活用してください：

```typescript
// テストのタグ付け
test.describe('ログイン機能', () => {
  test('正常ケース @smoke', async ({ page }) => {
    // 重要なスモークテスト
  });
  
  test('エラーケース @regression', async ({ page }) => {
    // 詳細な回帰テスト
  });
});

// 実行コマンド
npx playwright test --grep "@smoke"      // スモークテストのみ
npx playwright test --grep "@regression" // 回帰テストのみ
npx playwright test tests/login/        // 特定ディレクトリ
npx playwright test --grep "ログイン"     // 名前フィルタ
```

---

## 実装・開発 / Implementation & Development

### Q15: 待機戦略の選択基準は？
**A:** 以下の優先順位で選択してください：

```typescript
// 1. ✅ 最優先: Auto-waiting（Playwrightの自動待機）
await page.click('button'); // 自動的に要素が表示されるまで待機

// 2. ✅ 推奨: expect を使った条件待機
await expect(page.locator('.loading')).toBeHidden();
await expect(page.locator('.content')).toBeVisible();

// 3. ✅ 必要時: 特定の状態待機
await page.waitForLoadState('networkidle');
await page.waitForFunction(() => window.myApp.isReady);

// 4. ❌ 最終手段: 固定時間待機（避けるべき）
await page.waitForTimeout(5000); // 不安定・遅い
```

---

### Q16: カスタムマッチャーの作成方法は？
**A:** Playwrightのカスタムマッチャーを拡張してください：

```typescript
// tests/utils/CustomMatchers.ts
import { expect } from '@playwright/test';

expect.extend({
  async toHaveLoadingState(locator: Locator, expected: boolean) {
    const actual = await locator.getAttribute('aria-busy') === 'true';
    
    return {
      message: () => `Expected loading state to be ${expected}, but was ${actual}`,
      pass: actual === expected,
    };
  },
});

// 使用例
await expect(page.locator('.spinner')).toHaveLoadingState(true);
await expect(page.locator('.content')).toHaveLoadingState(false);
```

---

### Q17: 認証が必要なテストの処理方法は？
**A:** グローバルセットアップを使用してください：

```typescript
// tests/auth.setup.ts
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('testuser');
  await page.getByLabel('Password').fill(process.env.TEST_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  
  // 認証状態を保存
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});

// playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },
  ],
});
```

---

### Q18: ファイルダウンロード/アップロードのテスト方法は？
**A:** Playwrightの専用APIを使用してください：

```typescript
// ダウンロードテスト
test('ファイルダウンロード', async ({ page }) => {
  const downloadPromise = page.waitForDownload();
  await page.getByText('Download').click();
  const download = await downloadPromise;
  
  // ダウンロードファイルの検証
  expect(download.suggestedFilename()).toBe('report.pdf');
  await download.saveAs('./downloads/report.pdf');
});

// アップロードテスト
test('ファイルアップロード', async ({ page }) => {
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('./test-files/sample.jpg');
  
  await page.getByRole('button', { name: 'Upload' }).click();
  await expect(page.getByText('File uploaded successfully')).toBeVisible();
});
```

---

### Q19: APIモックの実装方法は？
**A:** `page.route()` を使用してください：

```typescript
// APIレスポンスのモック
test('APIエラー時の表示確認', async ({ page }) => {
  // APIレスポンスをモック
  await page.route('/api/users', route => {
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  });
  
  await page.goto('/users');
  await expect(page.getByText('サーバーエラーが発生しました')).toBeVisible();
});

// より詳細なAPIモック
class APIFixtures {
  static async mockUserAPI(page: Page, users: User[]) {
    await page.route('/api/users', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ users }),
      });
    });
  }
}
```

---

### Q20: モバイルブラウザテストの実装は？
**A:** デバイスエミュレーションを使用してください：

```typescript
// playwright.config.ts でモバイル設定
export default defineConfig({
  projects: [
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});

// モバイル固有のテスト
test.describe('モバイル表示', () => {
  test('ハンバーガーメニューが表示される', async ({ page }) => {
    await page.goto('/');
    
    // モバイルでのみ表示される要素
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
    
    // タッチ操作
    await page.tap('[data-testid="menu-button"]');
    await expect(page.locator('.mobile-menu')).toBeVisible();
  });
});
```

---

### Q21: 多言語対応テストの実装は？
**A:** ロケール設定とデータ駆動テストを組み合わせてください：

```typescript
// 多言語テストデータ
const languages = [
  { locale: 'ja-JP', welcomeText: 'ようこそ' },
  { locale: 'en-US', welcomeText: 'Welcome' },
  { locale: 'ko-KR', welcomeText: '환영합니다' },
];

for (const lang of languages) {
  test(`言語切り替え: ${lang.locale}`, async ({ page }) => {
    await page.goto(`/?lang=${lang.locale}`);
    await expect(page.getByText(lang.welcomeText)).toBeVisible();
  });
}

// ロケール固有の設定
export default defineConfig({
  projects: [
    {
      name: 'Japanese',
      use: { locale: 'ja-JP', timezoneId: 'Asia/Tokyo' },
    },
    {
      name: 'English',
      use: { locale: 'en-US', timezoneId: 'America/New_York' },
    },
  ],
});
```

---

### Q22: 大量データのテスト効率化は？
**A:** データ生成とクリーンアップ戦略を実装してください：

```typescript
// テストデータ生成
class TestDataGenerator {
  static generateUsers(count: number): User[] {
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
    }));
  }
}

// 効率的な大量データテスト
test('1000件のユーザー表示テスト', async ({ page }) => {
  const users = TestDataGenerator.generateUsers(1000);
  
  // APIモックで大量データを準備
  await page.route('/api/users', route => {
    route.fulfill({ body: JSON.stringify({ users }) });
  });
  
  await page.goto('/users');
  
  // 仮想スクロールの確認
  await expect(page.locator('[data-testid="user-row"]')).toHaveCount(50); // 表示分のみ
  
  // スクロールして追加読み込み
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator('[data-testid="user-row"]')).toHaveCount(100);
});
```

---

### Q23: リアルタイム機能（WebSocket）のテスト方法は？
**A:** WebSocketのモックとイベント待機を組み合わせてください：

```typescript
// WebSocketのテスト
test('リアルタイム通知機能', async ({ page }) => {
  await page.goto('/dashboard');
  
  // WebSocketメッセージのモック
  await page.addInitScript(() => {
    const originalWebSocket = window.WebSocket;
    window.WebSocket = class extends originalWebSocket {
      constructor(url) {
        super(url);
        
        // モックメッセージを送信
        setTimeout(() => {
          this.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({ type: 'notification', message: '新しいメッセージ' })
          }));
        }, 1000);
      }
    };
  });
  
  // 通知の表示確認
  await expect(page.getByText('新しいメッセージ')).toBeVisible();
});
```

---

### Q24: プログレスバーやローディング状態のテスト方法は？
**A:** 状態変化を段階的に検証してください：

```typescript
test('ファイルアップロードのプログレス表示', async ({ page }) => {
  await page.goto('/upload');
  
  const fileInput = page.locator('input[type="file"]');
  const progressBar = page.locator('[data-testid="progress-bar"]');
  const uploadButton = page.getByRole('button', { name: 'Upload' });
  
  // ファイル選択
  await fileInput.setInputFiles('./large-file.zip');
  
  // アップロード開始
  await uploadButton.click();
  
  // プログレスバーの表示確認
  await expect(progressBar).toBeVisible();
  await expect(progressBar).toHaveAttribute('value', '0');
  
  // プログレスの進行確認
  await expect(progressBar).toHaveAttribute('value', /[1-9]/, { timeout: 5000 });
  
  // 完了確認
  await expect(progressBar).toHaveAttribute('value', '100', { timeout: 30000 });
  await expect(page.getByText('アップロード完了')).toBeVisible();
});
```

---

### Q25: CSS アニメーションのテスト方法は？
**A:** アニメーション無効化とタイミング制御を使用してください：

```typescript
// アニメーション無効化（安定性向上）
export default defineConfig({
  use: {
    reducedMotion: 'reduce', // CSSアニメーション無効化
  },
});

// アニメーション付きテスト
test('モーダル表示アニメーション', async ({ page }) => {
  await page.goto('/');
  
  const modal = page.locator('[data-testid="modal"]');
  const openButton = page.getByRole('button', { name: 'Open Modal' });
  
  // 初期状態（非表示）
  await expect(modal).toBeHidden();
  
  // モーダル表示
  await openButton.click();
  
  // アニメーション完了後の状態確認
  await expect(modal).toBeVisible();
  await expect(modal).toHaveCSS('opacity', '1');
});
```

---

## トラブルシューティング / Troubleshooting

### Q26: メモリリークの検出と対策は？
**A:** リソース監視とクリーンアップを実装してください：

```typescript
// メモリ使用量の監視
test('メモリリークのチェック', async ({ page }) => {
  const initialMemory = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  });
  
  // 大量データの処理
  for (let i = 0; i < 100; i++) {
    await page.goto('/heavy-page');
    await page.goBack();
  }
  
  // ガベージコレクション実行
  await page.evaluate(() => {
    if (window.gc) window.gc();
  });
  
  const finalMemory = await page.evaluate(() => {
    return (performance as any).memory?.usedJSHeapSize || 0;
  });
  
  // メモリ増加の確認
  const memoryIncrease = finalMemory - initialMemory;
  expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB以下
});
```

---

### Q27: ネットワークエラーのシミュレーション方法は？
**A:** ネットワーク条件のエミュレーションを使用してください：

```typescript
// ネットワークエラーのシミュレーション
test('ネットワークエラー時の表示', async ({ page, context }) => {
  // オフライン状態のシミュレーション
  await context.setOffline(true);
  
  await page.goto('/');
  await expect(page.getByText('オフラインです')).toBeVisible();
  
  // オンライン復帰
  await context.setOffline(false);
  await page.reload();
  await expect(page.getByText('オンラインです')).toBeVisible();
});

// 低速ネットワークのシミュレーション
test('低速ネットワーク時の動作', async ({ page }) => {
  // ネットワーク速度制限
  await page.route('**/*', route => {
    // 2秒の遅延を追加
    setTimeout(() => route.continue(), 2000);
  });
  
  await page.goto('/');
  await expect(page.getByText('Loading...')).toBeVisible();
  await expect(page.getByText('Content loaded')).toBeVisible({ timeout: 10000 });
});
```

---

### Q28: 権限・認証エラーのテスト方法は？
**A:** 認証状態とAPIレスポンスをモックしてください：

```typescript
// 未認証状態のテスト
test('未認証ユーザーのリダイレクト', async ({ page }) => {
  // 認証情報を削除
  await page.context().clearCookies();
  
  await page.goto('/dashboard');
  
  // ログインページにリダイレクトされることを確認
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText('ログインが必要です')).toBeVisible();
});

// 権限不足のテスト
test('管理者権限なしでの管理画面アクセス', async ({ page }) => {
  // 一般ユーザーとしてログイン
  await page.goto('/login');
  await page.getByLabel('Username').fill('user');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Login' }).click();
  
  // 管理画面にアクセス
  await page.goto('/admin');
  
  // 権限エラーの確認
  await expect(page.getByText('権限がありません')).toBeVisible();
  expect(page.url()).toContain('/unauthorized');
});
```

---

### Q29: パフォーマンス問題の診断方法は？
**A:** Performance APIとメトリクス収集を活用してください：

```typescript
// パフォーマンス測定
test('ページ読み込み性能の測定', async ({ page }) => {
  await page.goto('/');
  
  // Core Web Vitals の測定
  const metrics = await page.evaluate(() => {
    return new Promise(resolve => {
      new PerformanceObserver(list => {
        const entries = list.getEntries();
        const metrics = {};
        
        entries.forEach(entry => {
          if (entry.name === 'FCP') metrics.fcp = entry.value;
          if (entry.name === 'LCP') metrics.lcp = entry.value;
          if (entry.name === 'CLS') metrics.cls = entry.value;
        });
        
        resolve(metrics);
      }).observe({ entryTypes: ['measure', 'paint', 'layout-shift'] });
    });
  });
  
  // パフォーマンス基準の確認
  expect(metrics.fcp).toBeLessThan(2000); // FCP < 2秒
  expect(metrics.lcp).toBeLessThan(4000); // LCP < 4秒
  expect(metrics.cls).toBeLessThan(0.1);  // CLS < 0.1
});
```

---

### Q30: デバッグ情報の効率的な収集方法は？
**A:** コンテキスト情報とスクリーンショットを組み合わせてください：

```typescript
// 詳細なデバッグ情報収集
test('詳細デバッグ情報付きテスト', async ({ page }) => {
  // コンソールログの収集
  const logs = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  // ネットワークリクエストの監視
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
    });
  });
  
  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByText('Success')).toBeVisible();
  } catch (error) {
    // エラー時の詳細情報
    console.log('Console logs:', logs);
    console.log('Network requests:', requests);
    console.log('Current URL:', page.url());
    console.log('Page title:', await page.title());
    
    // デバッグ用スクリーンショット
    await page.screenshot({ path: 'debug-failure.png', fullPage: true });
    
    throw error;
  }
});
```

---

### Q31: CI/CD環境固有の問題対策は？
**A:** 環境差異を考慮した設定を行ってください：

```typescript
// CI環境固有の設定
export default defineConfig({
  use: {
    // CI環境での視認性向上
    video: process.env.CI ? 'retain-on-failure' : 'off',
    screenshot: process.env.CI ? 'only-on-failure' : 'off',
    
    // CI環境での安定性向上
    launchOptions: {
      args: process.env.CI ? [
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ] : [],
    },
  },
  
  // CI環境でのタイムアウト調整
  timeout: process.env.CI ? 60000 : 30000,
  expect: {
    timeout: process.env.CI ? 30000 : 10000,
  },
  
  // CI環境での並列実行制御
  workers: process.env.CI ? 2 : undefined,
});
```

---

## ベストプラクティス / Best Practices

### Q32: コードレビューで確認すべき観点は？
**A:** 以下のチェックリストを使用してください：

```markdown
## Playwright コードレビューチェックリスト

### アーキテクチャ
- [ ] Page Object Modelパターンの使用
- [ ] BasePage の適切な継承
- [ ] セレクター戦略の遵守（Role-based優先）
- [ ] expect配置戦略の準拠

### コード品質
- [ ] Given-When-Then構造の実装
- [ ] 適切なエラーハンドリング
- [ ] 日本語でのテスト名記述
- [ ] ハードコーディングの回避

### パフォーマンス
- [ ] 不要な固定待機の削除
- [ ] 効率的なセレクターの使用
- [ ] 適切な並列実行設定

### セキュリティ
- [ ] 認証情報の環境変数使用
- [ ] 機密情報のマスキング
- [ ] .gitignore の適切な設定
```

---

### Q33: テストケース設計のベストプラクティスは？
**A:** 以下の原則に従ってください：

```typescript
// ✅ 良いテストケース設計
test.describe('ユーザー登録機能', () => {
  test('有効な情報で新規ユーザーを登録できること', async ({ page }) => {
    // 1つの機能に集中
    // 明確な期待結果
    // 独立性の確保
  });
  
  test('必須フィールド未入力時にエラーメッセージが表示されること', async ({ page }) => {
    // エラーケースの網羅
    // 具体的なエラー内容の確認
  });
});

// ❌ 避けるべき設計
test('ユーザー関連の全機能テスト', async ({ page }) => {
  // 複数機能の混在
  // 失敗時の原因特定困難
  // 保守性の低下
});

// テストデータ設計
const TestScenarios = {
  validUser: {
    name: 'Test User',
    email: 'test@example.com',
    password: 'SecurePass123',
  },
  invalidEmail: {
    name: 'Test User',
    email: 'invalid-email',
    password: 'SecurePass123',
  },
};
```

---

### Q34: CI/CD統合のベストプラクティスは？
**A:** 段階的実行と適切な報告を実装してください：

```yaml
# GitHub Actions ベストプラクティス
name: Playwright Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}
      
      # スモークテスト（高速）
      - name: Run smoke tests
        run: npx playwright test --grep "@smoke" --project=${{ matrix.browser }}
      
      # 全テスト（PRのみ）
      - name: Run all tests
        if: github.event_name == 'pull_request'
        run: npx playwright test --project=${{ matrix.browser }}
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-results-${{ matrix.browser }}
          path: |
            playwright-report/
            test-results/
```

---

### Q35: チーム開発での運用ルールは？
**A:** 以下のガイドラインを設定してください：

```markdown
## チーム開発ガイドライン

### 開発フロー
1. 機能開発前に関連テストケースを確認
2. 実装と同時にテストコードを作成
3. プルリクエスト前にローカルでテスト実行
4. コードレビューでテスト観点も確認

### ブランチ戦略
- feature/test-login-functionality
- fix/vrt-baseline-update
- refactor/page-object-improvement

### テストデータ管理
- 共有テストデータは tests/data/ で管理
- 個人用テストデータは .env.local で管理
- 本番データは絶対に使用禁止

### 障害対応
1. テスト失敗時は即座にチーム共有
2. VRTエラーは差分画像を確認してから更新
3. 環境起因の失敗は再実行前に原因調査
```

---

### Q36: 監視・アラートの設定方法は？
**A:** テスト結果の継続監視を実装してください：

```typescript
// テスト結果の監視
class TestMonitoring {
  static async sendSlackAlert(testResults: TestResult[]): Promise<void> {
    const failedTests = testResults.filter(test => test.status === 'failed');
    
    if (failedTests.length > 0) {
      const message = {
        text: `🚨 Playwright Tests Failed`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Failed tests: ${failedTests.length}\nBranch: ${process.env.GITHUB_REF}\nCommit: ${process.env.GITHUB_SHA}`,
            },
          },
        ],
      };
      
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });
    }
  }
}

// 品質メトリクスの追跡
class QualityMetrics {
  static calculateTestCoverage(allTests: Test[], passedTests: Test[]): number {
    return (passedTests.length / allTests.length) * 100;
  }
  
  static trackPerformanceMetrics(testDuration: number): void {
    // メトリクス収集システムに送信
    console.log(`Test execution time: ${testDuration}ms`);
  }
}
```

---

### Q37: 新メンバーのオンボーディング計画は？
**A:** 段階的学習計画を提供してください：

```markdown
## Playwright 学習ロードマップ（新メンバー向け）

### Week 1: 基礎理解
- [ ] Playwright公式ドキュメント読了
- [ ] プロジェクトルール（.cursor/rules/*.mdc）確認
- [ ] 既存テストコードの理解
- [ ] 簡単なテストケース作成（指導付き）

### Week 2: 実践
- [ ] Page Object作成
- [ ] VRTテスト実装
- [ ] エラーハンドリング実装
- [ ] コードレビュー参加

### Week 3: 応用
- [ ] 複雑なテストシナリオ作成
- [ ] CI/CD設定理解
- [ ] 品質チェック実行
- [ ] トラブルシューティング経験

### チェックポイント
- [ ] セレクター戦略の理解度テスト
- [ ] Page Objectパターンの実装確認
- [ ] エラー対応の適切性確認
```

---

### Q38: レガシーコードのテスト追加戦略は？
**A:** 段階的なテスト導入を実行してください：

```typescript
// Phase 1: クリティカルパスの基本テスト
test.describe('レガシー機能 - クリティカルパス', () => {
  test('基本的なログイン機能が動作すること @critical', async ({ page }) => {
    // 最低限の動作確認
  });
  
  test('主要な業務フローが完了すること @critical', async ({ page }) => {
    // エンドツーエンドの確認
  });
});

// Phase 2: 詳細テストの追加
test.describe('レガシー機能 - 詳細テスト', () => {
  test('エラーハンドリングが適切に動作すること @regression', async ({ page }) => {
    // エラーケースの確認
  });
});

// 段階的リファクタリング
class LegacyPageWrapper extends BasePage {
  // 既存のセレクターをラップ
  readonly legacyButton: Locator;
  
  constructor(page: Page) {
    super(page);
    // 暫定的にCSS依存のセレクターを使用
    this.legacyButton = this.page.locator('#legacy-submit-btn');
    // TODO: 将来的にRole-basedに変更
  }
}
```

---

### Q39: パフォーマンステストの戦略は？
**A:** 継続的パフォーマンス監視を実装してください：

```typescript
// パフォーマンスベースライン測定
test.describe('パフォーマンステスト', () => {
  test('ページ読み込み性能のベースライン', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await expect(page.locator('main')).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    
    // ベースライン: 3秒以内
    expect(loadTime).toBeLessThan(3000);
    
    // メトリクス記録
    console.log(`Page load time: ${loadTime}ms`);
  });
  
  test('大量データ表示のパフォーマンス', async ({ page }) => {
    // 1000件のデータ表示テスト
    await page.route('/api/data', route => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({ id: i, name: `Item ${i}` }));
      route.fulfill({ body: JSON.stringify(largeData) });
    });
    
    const startTime = Date.now();
    await page.goto('/data-list');
    await expect(page.locator('[data-testid="data-item"]').first()).toBeVisible();
    const renderTime = Date.now() - startTime;
    
    // 大量データでも5秒以内で表示
    expect(renderTime).toBeLessThan(5000);
  });
});
```

---

### Q40: セキュリティテストの実装方法は？
**A:** セキュリティ観点のテストケースを追加してください：

```typescript
// セキュリティテスト
test.describe('セキュリティテスト', () => {
  test('XSS攻撃の対策確認', async ({ page }) => {
    const maliciousScript = '<script>alert("XSS")</script>';
    
    await page.goto('/form');
    await page.getByLabel('Comment').fill(maliciousScript);
    await page.getByRole('button', { name: 'Submit' }).click();
    
    // スクリプトが実行されずにエスケープされることを確認
    await expect(page.locator('body')).toContainText('<script>alert("XSS")</script>');
    
    // アラートが表示されないことを確認
    page.on('dialog', dialog => {
      expect(dialog.message()).not.toBe('XSS');
      dialog.dismiss();
    });
  });
  
  test('SQL Injection対策の確認', async ({ page }) => {
    const sqlInjection = "'; DROP TABLE users; --";
    
    await page.goto('/search');
    await page.getByLabel('Search').fill(sqlInjection);
    await page.getByRole('button', { name: 'Search' }).click();
    
    // エラーメッセージやSQL文が表示されないことを確認
    await expect(page.locator('body')).not.toContainText('DROP TABLE');
    await expect(page.locator('body')).not.toContainText('SQL syntax error');
  });
});
```

---

### Q41: アクセシビリティテストの実装は？
**A:** 自動アクセシビリティチェックを統合してください：

```typescript
// アクセシビリティテスト
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('アクセシビリティテスト', () => {
  test('ページ全体のアクセシビリティ確認', async ({ page }) => {
    await page.goto('/');
    
    // axe-core を注入
    await injectAxe(page);
    
    // アクセシビリティチェック実行
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });
  
  test('キーボードナビゲーションの確認', async ({ page }) => {
    await page.goto('/form');
    
    // Tabキーでのフォーカス移動確認
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Name')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Email')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Submit' })).toBeFocused();
  });
});
```

---

### Q42: 国際化（i18n）テストの戦略は？
**A:** 多言語・多地域対応のテストを実装してください：

```typescript
// 国際化テスト
const locales = [
  { code: 'ja-JP', currency: 'JPY', dateFormat: 'YYYY/MM/DD' },
  { code: 'en-US', currency: 'USD', dateFormat: 'MM/DD/YYYY' },
  { code: 'de-DE', currency: 'EUR', dateFormat: 'DD.MM.YYYY' },
];

for (const locale of locales) {
  test.describe(`国際化テスト - ${locale.code}`, () => {
    test.use({ locale: locale.code });
    
    test('通貨表示の確認', async ({ page }) => {
      await page.goto('/pricing');
      
      const priceElement = page.getByTestId('price');
      const priceText = await priceElement.textContent();
      
      // 通貨記号の確認
      if (locale.currency === 'JPY') {
        expect(priceText).toContain('¥');
      } else if (locale.currency === 'USD') {
        expect(priceText).toContain('$');
      } else if (locale.currency === 'EUR') {
        expect(priceText).toContain('€');
      }
    });
    
    test('日付形式の確認', async ({ page }) => {
      await page.goto('/calendar');
      
      const dateElement = page.getByTestId('current-date');
      const dateText = await dateElement.textContent();
      
      // 日付形式の確認
      if (locale.code === 'ja-JP') {
        expect(dateText).toMatch(/\d{4}\/\d{2}\/\d{2}/);
      } else if (locale.code === 'en-US') {
        expect(dateText).toMatch(/\d{2}\/\d{2}\/\d{4}/);
      }
    });
  });
}
```

---

### Q43: マイクロフロントエンド環境でのテスト戦略は？
**A:** 個別・統合テストを組み合わせてください：

```typescript
// マイクロフロントエンドテスト
test.describe('マイクロフロントエンド統合テスト', () => {
  test('Shell + Header MFEの統合', async ({ page }) => {
    await page.goto('/');
    
    // Shell アプリケーションの確認
    await expect(page.locator('[data-mfe="shell"]')).toBeVisible();
    
    // Header マイクロフロントエンドの確認
    await expect(page.locator('[data-mfe="header"]')).toBeVisible();
    await expect(page.getByRole('navigation')).toBeVisible();
  });
  
  test('MFE間の通信確認', async ({ page }) => {
    // イベント通信のテスト
    await page.goto('/');
    
    // Header MFEでユーザー情報更新
    await page.getByRole('button', { name: 'Profile' }).click();
    await page.getByLabel('Display Name').fill('New Name');
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Content MFEで更新された情報が表示されることを確認
    await expect(page.locator('[data-mfe="content"] .user-name')).toContainText('New Name');
  });
});
```

---

### Q44: APIファーストな開発でのテスト戦略は？
**A:** API・UI連携テストを実装してください：

```typescript
// API・UI連携テスト
test.describe('API・UI連携テスト', () => {
  test('APIレスポンスとUI表示の整合性', async ({ page, request }) => {
    // 1. APIから直接データを取得
    const apiResponse = await request.get('/api/users/123');
    const userData = await apiResponse.json();
    
    // 2. UIでのデータ表示確認
    await page.goto('/users/123');
    await expect(page.getByText(userData.name)).toBeVisible();
    await expect(page.getByText(userData.email)).toBeVisible();
    
    // 3. データの同期確認
    const displayedName = await page.locator('[data-testid="user-name"]').textContent();
    expect(displayedName).toBe(userData.name);
  });
  
  test('API変更がUIに正しく反映されること', async ({ page, request }) => {
    // APIでデータ更新
    await request.patch('/api/users/123', {
      data: { name: 'Updated Name' }
    });
    
    // UIでの更新確認
    await page.goto('/users/123');
    await page.reload(); // 最新データの取得
    await expect(page.getByText('Updated Name')).toBeVisible();
  });
});
```

---

### Q45: レスポンシブデザインのテスト戦略は？
**A:** ビューポート別テストを体系化してください：

```typescript
// レスポンシブテスト
const viewports = [
  { name: 'Mobile', width: 375, height: 667 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Desktop', width: 1200, height: 800 },
  { name: 'Large Desktop', width: 1920, height: 1080 },
];

for (const viewport of viewports) {
  test.describe(`レスポンシブテスト - ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });
    
    test('ナビゲーションの表示確認', async ({ page }) => {
      await page.goto('/');
      
      if (viewport.width < 768) {
        // モバイル: ハンバーガーメニュー
        await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
        await expect(page.locator('.desktop-nav')).toBeHidden();
      } else {
        // デスクトップ: フルナビゲーション
        await expect(page.locator('.desktop-nav')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden();
      }
    });
    
    test('グリッドレイアウトの確認', async ({ page }) => {
      await page.goto('/products');
      
      const gridItems = page.locator('.product-grid .product-item');
      const itemCount = await gridItems.count();
      
      // ビューポートに応じた列数の確認
      if (viewport.width < 768) {
        // モバイル: 1列
        const firstItem = gridItems.first();
        const secondItem = gridItems.nth(1);
        const firstRect = await firstItem.boundingBox();
        const secondRect = await secondItem.boundingBox();
        
        expect(Math.abs(firstRect.x - secondRect.x)).toBeLessThan(10); // 同じ列
      } else if (viewport.width < 1200) {
        // タブレット: 2列
        // テスト実装
      } else {
        // デスクトップ: 3列以上
        // テスト実装
      }
    });
  });
}
```

---

### Q46: A/Bテスト環境でのテスト戦略は？
**A:** バリアント別テストを実装してください：

```typescript
// A/Bテスト対応
test.describe('A/Bテスト', () => {
  const variants = ['control', 'variant-a', 'variant-b'];
  
  for (const variant of variants) {
    test.describe(`バリアント: ${variant}`, () => {
      test.beforeEach(async ({ page }) => {
        // A/Bテストバリアントの設定
        await page.addInitScript((variant) => {
          localStorage.setItem('ab-test-variant', variant);
        }, variant);
      });
      
      test('CTAボタンのデザイン確認', async ({ page }) => {
        await page.goto('/landing');
        
        const ctaButton = page.getByRole('button', { name: /sign up|get started|join now/i });
        await expect(ctaButton).toBeVisible();
        
        // バリアント別の確認
        if (variant === 'control') {
          await expect(ctaButton).toHaveCSS('background-color', 'rgb(0, 123, 255)'); // 青
        } else if (variant === 'variant-a') {
          await expect(ctaButton).toHaveCSS('background-color', 'rgb(220, 53, 69)'); // 赤
        } else if (variant === 'variant-b') {
          await expect(ctaButton).toHaveCSS('background-color', 'rgb(40, 167, 69)'); // 緑
        }
      });
      
      test('コンバージョン率測定の準備', async ({ page }) => {
        await page.goto('/landing');
        
        // イベント追跡の確認
        const trackingCalls = [];
        page.on('request', request => {
          if (request.url().includes('/analytics/track')) {
            trackingCalls.push(request.postData());
          }
        });
        
        await page.getByRole('button', { name: /sign up/i }).click();
        
        // 適切なイベント送信の確認
        expect(trackingCalls.length).toBeGreaterThan(0);
        expect(trackingCalls[0]).toContain(`variant:${variant}`);
      });
    });
  }
});
```

---

### Q47: データベース状態に依存するテストの管理は？
**A:** テストデータのライフサイクル管理を実装してください：

```typescript
// データベース依存テスト
test.describe('データベース連携テスト', () => {
  let testUserId: string;
  
  test.beforeEach(async ({ request }) => {
    // テスト用ユーザーの作成
    const response = await request.post('/api/test/users', {
      data: {
        name: 'Test User',
        email: `test-${Date.now()}@example.com`,
        role: 'user',
      },
    });
    
    const userData = await response.json();
    testUserId = userData.id;
  });
  
  test.afterEach(async ({ request }) => {
    // テストデータのクリーンアップ
    if (testUserId) {
      await request.delete(`/api/test/users/${testUserId}`);
    }
  });
  
  test('ユーザー詳細ページの表示', async ({ page }) => {
    await page.goto(`/users/${testUserId}`);
    await expect(page.getByText('Test User')).toBeVisible();
  });
  
  test('ユーザー情報の更新', async ({ page, request }) => {
    await page.goto(`/users/${testUserId}/edit`);
    await page.getByLabel('Name').fill('Updated Name');
    await page.getByRole('button', { name: 'Save' }).click();
    
    // データベース状態の確認
    const response = await request.get(`/api/users/${testUserId}`);
    const userData = await response.json();
    expect(userData.name).toBe('Updated Name');
  });
});
```

---

### Q48: 本番環境でのスモークテスト戦略は？
**A:** 本番環境用の限定テストを実装してください：

```typescript
// 本番スモークテスト
test.describe('本番スモークテスト @production', () => {
  test.beforeEach(async ({ page }) => {
    // 本番環境の確認
    expect(process.env.TEST_ENV).toBe('production');
    
    // 読み取り専用操作のみ許可
    test.skip(process.env.READONLY_MODE !== 'true', '本番環境では読み取り専用モードが必要');
  });
  
  test('ホームページの基本表示', async ({ page }) => {
    await page.goto('/');
    
    // 基本要素の確認
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    
    // パフォーマンス確認
    const loadTime = await page.evaluate(() => {
      return performance.timing.loadEventEnd - performance.timing.navigationStart;
    });
    expect(loadTime).toBeLessThan(5000); // 5秒以内
  });
  
  test('重要なAPIエンドポイントの応答確認', async ({ request }) => {
    const endpoints = [
      '/api/health',
      '/api/status',
      '/api/version',
    ];
    
    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      expect(response.status()).toBe(200);
      
      const responseTime = response.headers()['x-response-time'];
      if (responseTime) {
        expect(parseInt(responseTime)).toBeLessThan(1000); // 1秒以内
      }
    }
  });
});
```

---

### Q49: 技術負債の測定と改善戦略は？
**A:** 継続的な品質測定を実装してください：

```typescript
// 技術負債測定
class TechnicalDebtAnalyzer {
  static async analyzeCSSSelectors(testFiles: string[]): Promise<DebtMetrics> {
    const cssUsage = { count: 0, files: [] };
    
    for (const file of testFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const cssMatches = content.match(/\.locator\(['"]\.|#\w+/g);
      
      if (cssMatches) {
        cssUsage.count += cssMatches.length;
        cssUsage.files.push(file);
      }
    }
    
    return {
      cssSelectors: cssUsage,
      debtScore: cssUsage.count * 0.8, // CSS依存度による負債スコア
    };
  }
  
  static async analyzeTestCoverage(): Promise<CoverageMetrics> {
    // Page Object使用率
    // セレクター戦略準拠率
    // エラーハンドリング実装率
    return {
      pageObjectUsage: 85,
      selectorCompliance: 92,
      errorHandling: 78,
    };
  }
}

// 改善計画の自動提案
test('技術負債レポート生成', async () => {
  const testFiles = await glob('./tests/**/*.spec.ts');
  const debtMetrics = await TechnicalDebtAnalyzer.analyzeCSSSelectors(testFiles);
  const coverage = await TechnicalDebtAnalyzer.analyzeTestCoverage();
  
  console.log('=== 技術負債レポート ===');
  console.log(`CSS依存セレクター数: ${debtMetrics.cssSelectors.count}`);
  console.log(`Page Object使用率: ${coverage.pageObjectUsage}%`);
  console.log(`セレクター戦略準拠率: ${coverage.selectorCompliance}%`);
  
  // 改善優先度の提案
  if (coverage.pageObjectUsage < 80) {
    console.log('🔴 高優先度: Page Object Modelの導入を推進');
  }
  if (debtMetrics.cssSelectors.count > 50) {
    console.log('🟡 中優先度: CSSセレクターをRole-basedに変更');
  }
});
```

---

### Q50: 将来のPlaywrightアップデートへの対応戦略は？
**A:** 前方互換性を考慮した実装を行ってください：

```typescript
// 前方互換性対応
class PlaywrightVersionManager {
  static getVersion(): string {
    return require('@playwright/test/package.json').version;
  }
  
  static isVersionAtLeast(targetVersion: string): boolean {
    const current = this.getVersion();
    return this.compareVersions(current, targetVersion) >= 0;
  }
  
  // 新機能の段階的導入
  static getLocatorWithFallback(page: Page, selector: string) {
    if (this.isVersionAtLeast('1.40.0')) {
      // 新しいAPI使用
      return page.getByRole('button', { name: selector });
    } else {
      // 従来のAPI使用
      return page.locator(`button:has-text("${selector}")`);
    }
  }
}

// アップグレード計画
test.describe('バージョンアップ準備', () => {
  test('非推奨APIの使用状況確認', async ({ page }) => {
    // 非推奨警告の監視
    const warnings = [];
    page.on('console', msg => {
      if (msg.type() === 'warning' && msg.text().includes('deprecated')) {
        warnings.push(msg.text());
      }
    });
    
    await page.goto('/');
    
    // 非推奨API使用の報告
    if (warnings.length > 0) {
      console.log('⚠️ 非推奨API使用検出:');
      warnings.forEach(warning => console.log(`  - ${warning}`));
    }
  });
  
  test('新機能の互換性確認', async ({ page }) => {
    // 新しいPlaywright機能のテスト
    try {
      // 例: 新しいセレクター機能
      await page.getByRole('button', { name: 'Test' });
      console.log('✅ 新機能は利用可能');
    } catch (error) {
      console.log('⚠️ 新機能は未対応、フォールバック使用');
    }
  });
});

// マイグレーション支援
class MigrationHelper {
  static async updateSelectors(filePath: string): Promise<void> {
    let content = await fs.readFile(filePath, 'utf-8');
    
    // 古いセレクターパターンを新しいものに置換
    const replacements = [
      { old: /page\.locator\('button'\)\.click\(\)/, new: "page.getByRole('button').click()" },
      { old: /page\.locator\('\[data-testid="([^"]+)"\]'\)/, new: "page.getByTestId('$1')" },
    ];
    
    replacements.forEach(({ old, new: newPattern }) => {
      content = content.replace(old, newPattern);
    });
    
    await fs.writeFile(filePath, content);
  }
}
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