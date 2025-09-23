# 実装ガイド / Implementation Guide

このドキュメントは、プロジェクトのアーキテクチャルールに従った具体的な実装方法を示すガイドです。

This document provides a practical implementation guide following the project's architecture rules.

## 🏗️ 新規Page Object作成手順 / New Page Object Creation Steps

### 基本手順 / Basic Steps

**📋 必須チェックリスト / Required Checklist**
- [ ] BasePage継承
- [ ] セレクター戦略遵守  
- [ ] アクションメソッドに基本確認
- [ ] エラーハンドリング実装

### 手順1: BasePage継承 / Step 1: Inherit from BasePage

```typescript
// tests/pages/NewPage.ts
import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class NewPage extends BasePage {
  readonly url = "https://example.com/new-page";
  
  // セレクター戦略に従った要素定義
  readonly submitButton: Locator;
  readonly emailInput: Locator;
  readonly statusMessage: Locator;
  
  constructor(page: Page) {
    super(page);
    
    // Role-based セレクターを優先
    this.submitButton = this.page.getByRole('button', { name: 'Submit' });
    this.emailInput = this.page.getByLabel('Email Address');
    this.statusMessage = this.page.getByTestId('status-message');
  }
}
```

### 手順2: アクションメソッド実装 / Step 2: Implement Action Methods

```typescript
export class NewPage extends BasePage {
  // ... constructor ...
  
  /**
   * ページナビゲーション
   * 基本成功確認を含む
   */
  async navigate(): Promise<void> {
    try {
      await this.page.goto(this.url);
      await this.page.waitForLoadState('domcontentloaded');
      
      // 基本的な読み込み成功確認
      await expect(this.submitButton).toBeVisible({ timeout: 10000 });
      
    } catch (error) {
      await this.handleError(`ページ移動失敗: ${this.url}`);
      throw error;
    }
  }
  
  /**
   * フォーム送信
   * アクション成功の基本確認を含む
   */
  async submitForm(email: string): Promise<void> {
    try {
      // 入力
      await this.emailInput.fill(email);
      
      // 入力値の基本確認
      await expect(this.emailInput).toHaveValue(email);
      
      // 送信
      await this.submitButton.click();
      
      // アクション成功の基本確認
      await expect(this.statusMessage).toBeVisible({ timeout: 5000 });
      
    } catch (error) {
      await this.handleError(`フォーム送信失敗: ${error}`);
      throw error;
    }
  }
}
```

### 手順3: テストファイルでの使用 / Step 3: Usage in Test Files

```typescript
// tests/new-page.spec.ts
import { test, expect } from '@playwright/test';
import { NewPage } from './pages/NewPage';

test.describe('新機能テスト', () => {
  test('フォーム送信が成功すること', async ({ page }) => {
    const newPage = new NewPage(page);
    
    // === GIVEN ===
    await newPage.navigate();
    
    // === WHEN ===
    await newPage.submitForm('test@example.com');
    
    // === THEN ===
    // テスト固有の詳細検証
    await expect(page.getByText('送信完了')).toBeVisible();
    await expect(page).toHaveURL(/success/);
  });
});
```

## 🎯 セレクター実装パターン / Selector Implementation Patterns

### 優先順位別実装例 / Implementation Examples by Priority

**📋 セレクター戦略ルール参照 / Selector Strategy Rules Reference**

詳細なセレクター戦略は **[🎯 selectors.mdc](../../.cursor/rules/selectors.mdc)** を参照してください。

For detailed selector strategy, refer to **[🎯 selectors.mdc](../../.cursor/rules/selectors.mdc)**.

#### 1位: Role-based セレクター / Role-based Selectors

```typescript
export class ExamplePage extends BasePage {
  constructor(page: Page) {
    super(page);
    
    // ボタン要素
    this.submitButton = this.page.getByRole('button', { name: 'Submit' });
    this.cancelButton = this.page.getByRole('button', { name: 'Cancel' });
    
    // リンク要素
    this.homeLink = this.page.getByRole('link', { name: 'Home' });
    this.aboutLink = this.page.getByRole('link', { name: 'About Us' });
    
    // 見出し要素
    this.mainHeading = this.page.getByRole('heading', { name: 'Welcome' });
    this.subHeading = this.page.getByRole('heading', { level: 2 });
  }
}
```

#### 2位: Text-based セレクター / Text-based Selectors

```typescript
export class ExamplePage extends BasePage {
  constructor(page: Page) {
    super(page);
    
    // 表示テキストベース
    this.successMessage = this.page.getByText('Operation completed successfully');
    this.errorMessage = this.page.getByText(/Error: .+/);
    this.partialText = this.page.getByText('Save', { exact: false });
  }
}
```

#### 3位: Label-based セレクター / Label-based Selectors

```typescript
export class ExamplePage extends BasePage {
  constructor(page: Page) {
    super(page);
    
    // フォーム要素
    this.emailInput = this.page.getByLabel('Email Address');
    this.passwordInput = this.page.getByLabel('Password');
    this.confirmCheckbox = this.page.getByLabel('I agree to the terms');
  }
}
```

#### 最終手段: CSS セレクター / CSS Selectors (Last Resort)

```typescript
export class ExamplePage extends BasePage {
  constructor(page: Page) {
    super(page);
    
    // 【外部サイト制約により最終手段として使用】
    // External site constraints require last resort usage
    this.externalElement = this.page.locator('.external-specific-class');
    this.legacyElement = this.page.locator('#legacy-id-element');
  }
}
```

## 🔄 expect配置実装パターン / Expect Placement Implementation Patterns

**📋 expect配置戦略ルール参照 / Expect Placement Strategy Rules Reference**

詳細なルールは **[🎯 expect-strategy.mdc](../../.cursor/rules/expect-strategy.mdc)** を参照してください。

For detailed rules, refer to **[🎯 expect-strategy.mdc](../../.cursor/rules/expect-strategy.mdc)**.

### Page Object内の基本確認 / Basic Verification in Page Objects

```typescript
export class LoginPage extends BasePage {
  async performLogin(username: string, password: string): Promise<void> {
    // 入力アクション
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    
    // 入力値の基本確認（Page Object内）
    await expect(this.usernameInput).toHaveValue(username);
    await expect(this.passwordInput).toHaveValue(password);
    
    // ログインボタンクリック
    await this.loginButton.click();
    
    // アクション成功の基本確認（Page Object内）
    await expect(this.page).toHaveURL(/dashboard/);
  }
}
```

### テストファイル内の詳細検証 / Detailed Verification in Test Files

```typescript
test('ログイン機能テスト', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  // === GIVEN ===
  await loginPage.navigate();
  
  // === WHEN ===
  await loginPage.performLogin('user@example.com', 'password123');
  
  // === THEN ===
  // テスト固有の詳細検証（テストファイル内）
  await expect(page.getByText('Welcome back, User!')).toBeVisible();
  await expect(page.getByRole('navigation')).toContainText('Logout');
  await expect(page).toHaveTitle(/Dashboard - MyApp/);
});
```

## 🔧 エラーハンドリング実装パターン / Error Handling Implementation Patterns

### BasePage活用パターン / BasePage Utilization Pattern

```typescript
export class ExamplePage extends BasePage {
  async complexOperation(): Promise<void> {
    try {
      // 複雑な操作の実行
      await this.performMultiStepAction();
      
      // 成功確認
      await expect(this.successIndicator).toBeVisible();
      
    } catch (error) {
      // BasePage.handleError()を活用
      await this.handleError(`複雑な操作でエラー: ${error}`);
      throw error;  // 再スロー重要
    }
  }
  
  private async performMultiStepAction(): Promise<void> {
    await this.step1();
    await this.step2();
    await this.step3();
  }
}
```

### テストファイルでのエラーハンドリング / Error Handling in Test Files

```typescript
test('複雑な操作テスト', async ({ page }) => {
  const examplePage = new ExamplePage(page);
  
  try {
    // === GIVEN ===
    await examplePage.navigate();
    
    // === WHEN ===
    await examplePage.complexOperation();
    
    // === THEN ===
    await expect(page.getByText('Operation completed')).toBeVisible();
    
  } catch (error) {
    // テストレベルでの追加エラー情報
    console.error(`テスト失敗: ${error}`);
    
    // 必要に応じて追加のデバッグ情報収集
    const currentUrl = page.url();
    console.error(`失敗時URL: ${currentUrl}`);
    
    // エラーを再スロー
    throw error;
  }
});
```

## 🗂️ ファイル構成・命名規則 / File Structure & Naming Conventions

**📋 アーキテクチャルール参照 / Architecture Rules Reference**

詳細なルールは **[🏗️ architecture.mdc](../../.cursor/rules/architecture.mdc)** を参照してください。

For detailed rules, refer to **[🏗️ architecture.mdc](../../.cursor/rules/architecture.mdc)**.

### 推奨ファイル構成 / Recommended File Structure

```
tests/
├── pages/                    # Page Objectクラス
│   ├── BasePage.ts          # 基底クラス
│   ├── LoginPage.ts         # ログイン機能
│   ├── DashboardPage.ts     # ダッシュボード機能
│   └── ProfilePage.ts       # プロフィール機能
├── fixtures/                # テストフィクスチャ
│   └── TestFixtures.ts      # 共通フィクスチャ
├── utils/                   # ユーティリティ
│   ├── TestConfig.ts        # 設定管理
│   └── TestLogger.ts        # ログ管理
├── data/                    # テストデータ
│   ├── TestData.ts          # 静的データ
│   └── users.json           # ユーザーデータ
├── login.spec.ts            # ログインテスト
├── dashboard.spec.ts        # ダッシュボードテスト
└── profile.spec.ts          # プロフィールテスト
```

### 命名規則実装例 / Naming Convention Implementation Examples

```typescript
// ✅ 推奨命名
export class LoginPage extends BasePage {}        // Page Object
export class UserTestData {}                      // テストデータ
export class DatabaseUtil {}                      // ユーティリティ

// ファイル名
login.spec.ts                                     // テストファイル
LoginPage.ts                                      // Page Object
database.util.ts                                  // ユーティリティ
```

## 💡 ベストプラクティス集 / Best Practices Collection

### Page Object設計のベストプラクティス / Page Object Design Best Practices

**✅ 推奨パターン / Recommended Patterns**

```typescript
export class GoodExamplePage extends BasePage {
  // 1. readonly修飾子でLocatorを保護
  readonly submitButton: Locator;
  readonly statusMessage: Locator;
  
  constructor(page: Page) {
    super(page);
    
    // 2. コンストラクタでLocatorを初期化
    this.submitButton = this.page.getByRole('button', { name: 'Submit' });
    this.statusMessage = this.page.getByTestId('status');
  }
  
  // 3. アクションメソッドは具体的な名前
  async submitFormWithValidation(data: FormData): Promise<void> {
    // 4. 型安全なパラメータ
    await this.fillForm(data);
    await this.submitButton.click();
    
    // 5. 基本成功確認を含む
    await expect(this.statusMessage).toBeVisible();
  }
  
  // 6. プライベートメソッドで詳細実装を隠蔽
  private async fillForm(data: FormData): Promise<void> {
    // 詳細な入力処理
  }
}
```

**❌ 避けるべきパターン / Patterns to Avoid**

```typescript
export class BadExamplePage extends BasePage {
  constructor(page: Page) {
    super(page);
    // ❌ Locatorを都度定義
  }
  
  // ❌ 曖昧なメソッド名
  async doSomething(): Promise<void> {
    // ❌ メソッド内でLocator定義
    const button = this.page.locator('.btn');
    
    // ❌ 基本確認なし
    await button.click();
  }
}
```

### テスト設計のベストプラクティス / Test Design Best Practices

**✅ 推奨構造 / Recommended Structure**

```typescript
test.describe('機能テストグループ', () => {
  test('具体的なテストケース名', async ({ page }) => {
    const examplePage = new ExamplePage(page);
    
    // === GIVEN: 前提条件 ===
    await examplePage.navigate();
    await examplePage.setupInitialState();
    
    // === WHEN: 操作実行 ===
    await examplePage.performTargetAction();
    
    // === THEN: 結果検証 ===
    await expect(page.getByText('Expected Result')).toBeVisible();
  });
});
```

## 🔧 トラブルシューティング / Troubleshooting

### よくある問題と解決方法 / Common Issues and Solutions

#### 1. 要素が見つからないエラー / Element Not Found Errors

```typescript
// ❌ 問題のあるコード
await page.locator('.dynamic-element').click();

// ✅ 解決方法
await page.waitForSelector('.dynamic-element', { state: 'visible' });
await page.locator('.dynamic-element').click();

// ✅ より良い解決方法（セレクター戦略改善）
await page.getByRole('button', { name: 'Dynamic Action' }).click();
```

#### 2. タイミング問題 / Timing Issues

```typescript
// ❌ 問題のあるコード
await page.click('#submit');
await expect(page.locator('#result')).toBeVisible();

// ✅ 解決方法
await page.click('#submit');
await page.waitForLoadState('networkidle');
await expect(page.locator('#result')).toBeVisible({ timeout: 10000 });
```

#### 3. iframe操作 / iframe Operations

```typescript
export class IframePage extends BasePage {
  private frame: FrameLocator;
  
  constructor(page: Page) {
    super(page);
    this.frame = this.page.frameLocator('#target-iframe');
  }
  
  async interactWithIframeElement(): Promise<void> {
    // iframe内要素の操作
    await this.frame.getByRole('button', { name: 'Submit' }).click();
    
    // iframe内要素の確認
    await expect(this.frame.getByText('Success')).toBeVisible();
  }
}
```

## 🔗 関連リンク / Related Links

### プロジェクトルール / Project Rules
- **[🏗️ architecture.mdc](../../.cursor/rules/architecture.mdc)** - Page Object Model基本ルール
- **[🎯 selectors.mdc](../../.cursor/rules/selectors.mdc)** - セレクター戦略ルール
- **[🎯 expect-strategy.mdc](../../.cursor/rules/expect-strategy.mdc)** - expect配置戦略ルール

### 関連ドキュメント / Related Documents
- **[diagrams.md](diagrams.md)** - アーキテクチャ図表集
- **[faq.md](faq.md)** - よくある質問

### 外部リソース / External Resources
- [Playwright公式ドキュメント](https://playwright.dev/docs/pom)
- [TypeScript公式ドキュメント](https://www.typescriptlang.org/docs/)

---

**📝 更新履歴 / Update History**
- v1.0.0: 初期実装ガイド作成 (2025-01-23) / Initial implementation guide creation
- 最終更新 / Last updated: 2025-01-23

**注意 / Note**: 実装例は実際のプロジェクトファイルとの整合性を最優先で維持してください。
