# 📝 テストファイル責務分離ベストプラクティス

## 🚨 問題：VRT-enhanced.spec.ts (542行) 

### ❌ **何が間違っているか**

```typescript
// ❌ テストファイルが長すぎる
test("テスト名", async ({ page, logManager }, testInfo) => {
  const startTime = Date.now();
  const playwrightPage = new EnhancedPlaywrightDevPage(page, logManager);

  try {
    // テスト開始ログ
    logManager.startTest(testInfo.title, {
      testInfo: {
        title: testInfo.title,
        file: testInfo.file,
        sessionId: logManager.getSessionId(),
      },
      browser: {
        name: "chromium",
        platform: process.platform,
      },
      customData: {
        testType: "VRT_Screenshot",
        targetSite: "playwright.dev",
        expectedArtifacts: ["screenshot", "performance_metrics"],
      },
    });

    // === GIVEN: テスト前提条件の設定 ===
    logManager.info("🏁 === GIVEN: テスト前提条件の設定 ===", LogCategory.TEST_EXECUTION);
    await playwrightPage.navigate();

    // === WHEN: テスト対象の操作実行 ===
    logManager.info("⚡ === WHEN: VRTスクリーンショット撮影実行 ===", LogCategory.TEST_EXECUTION);
    
    // ... さらに30行以上続く
  } catch (error) {
    // ... エラーハンドリングでさらに10行
  }
});
```

**問題点**:
- **1つのテストが50-100行**
- **ログロジックとテストロジックが混在**
- **重複パターンが大量発生**
- **テストの意図が埋もれる**

## ✅ 解決策：責務分離による簡潔化

### 📊 **責務分離の原則**

| 層 | 責務 | ファイル | 行数目安 |
|---|------|---------|----------|
| **テストファイル** | テストケース定義・アサーション | `*.spec.ts` | **5-15行/テスト** |
| **ヘルパークラス** | 共通テストパターン・ログロジック | `helpers/*.ts` | 無制限 |
| **Page Object** | ページ固有操作・要素管理 | `pages/*.ts` | 無制限 |
| **フィクスチャ** | テスト環境・システム初期化 | `fixtures/*.ts` | 無制限 |

### 🎯 **理想的なテストファイル（5-15行）**

```typescript
// ✅ 簡潔で読みやすい
test("Playwright.devページのスクリーンショットが正常に撮影できること", async ({
  pageWithAdvancedLogging,
  logManager,
}, testInfo) => {
  const vrtHelper = new VRTTestHelper(pageWithAdvancedLogging, logManager);
  
  // ヘルパーに詳細処理を委譲
  await vrtHelper.executeVRTScreenshotTest(testInfo);
  
  // テストファイルではアサーションに集中
  console.log("✅ スクリーンショット撮影が正常に完了しました");
});
```

**改善点**:
- **テスト1つが5-10行**
- **意図が明確**
- **詳細ロジックはヘルパーに委譲**
- **アサーションに集中**

## 🏗️ ファイル構成比較

### Before: 混在アーキテクチャ ❌
```
tests/
├── VRT-enhanced.spec.ts     # 542行（問題）
│   ├── テストロジック
│   ├── ログロジック
│   ├── エラーハンドリング
│   ├── パフォーマンス測定
│   └── 重複コード
```

### After: 責務分離アーキテクチャ ✅
```
tests/
├── VRT-clean.spec.ts        # 90行（適切）
│   ├── テストケース定義
│   └── アサーション
├── helpers/
│   └── VRTTestHelper.ts     # 200行
│       ├── 共通テストパターン
│       ├── ログロジック
│       └── エラーハンドリング
├── pages/
│   └── Enhanced*.ts         # 各300行
│       ├── ページ固有操作
│       └── 要素管理
└── fixtures/
    └── Enhanced*.ts         # 200行
        └── システム初期化
```

## 📏 テストファイル行数ガイドライン

### 🎯 **理想的な行数**

| テストファイル全体 | 1テストメソッド | 説明 |
|-------------------|----------------|------|
| **50-150行** | **5-15行** | 理想的 ✅ |
| **150-300行** | **15-30行** | 許容範囲 ⚠️ |
| **300行以上** | **30行以上** | 要改善 ❌ |

### 🚨 **警告サイン**

```typescript
// ❌ 1つのテストが長すぎる警告サイン
test("テスト名", async () => {
  // 30行以上のテストロジック
  // 詳細なログ設定
  // 複雑なエラーハンドリング
  // 重複するパターン
  // ↑ これらは全てヘルパーに移すべき
});
```

## 🔄 移行戦略

### Phase 1: ヘルパークラス作成
```typescript
// tests/helpers/VRTTestHelper.ts
export class VRTTestHelper {
  async executeVRTScreenshotTest(testInfo: any): Promise<void> {
    // 詳細なログロジック
    // エラーハンドリング  
    // パフォーマンス測定
  }
}
```

### Phase 2: テストファイル簡潔化
```typescript
// tests/VRT-clean.spec.ts
test("テスト名", async ({ page, logManager }, testInfo) => {
  const helper = new VRTTestHelper(page, logManager);
  await helper.executeVRTScreenshotTest(testInfo);
  
  // アサーションに集中
  await expect(page).toHaveTitle(/Expected/);
});
```

### Phase 3: 既存ファイル置き換え
```bash
# 新版の動作確認後
mv tests/VRT-clean.spec.ts tests/VRT.spec.ts
rm tests/VRT-enhanced.spec.ts  # 長いファイルを削除
```

## 🎯 ベストプラクティス

### ✅ **テストファイルに書くべきもの**
- テストケース名と説明
- Given-When-Thenの大まかな流れ
- テスト固有のアサーション
- テスト固有の設定値

### ❌ **テストファイルに書かないもの**
- 詳細なログメッセージ
- 複雑なエラーハンドリング
- パフォーマンス測定の実装
- Page Objectの詳細操作
- フィクスチャの初期化ロジック

### 🔧 **具体的な移行例**

#### Before (50行)
```typescript
test("タイトル検証", async ({ page, logManager }, testInfo) => {
  const startTime = Date.now();
  
  logManager.startTest(testInfo.title, {
    testInfo: { ... },
    browser: { ... },
    customData: { ... }
  });
  
  logManager.info("=== GIVEN: ページナビゲーション ===", LogCategory.TEST_EXECUTION);
  
  try {
    await page.goto("https://playwright.dev");
    await page.waitForLoadState("domcontentloaded");
    
    logManager.info("=== WHEN & THEN: タイトル検証実行 ===", LogCategory.TEST_EXECUTION);
    
    const title = await page.title();
    await expect(page).toHaveTitle(/Fast and reliable/);
    
    const duration = Date.now() - startTime;
    logManager.info("✅ タイトル検証成功", LogCategory.TEST_EXECUTION, {
      testInfo: { title: testInfo.title, sessionId: logManager.getSessionId() },
      performance: { duration },
      customData: { actualTitle: title, validationResult: "match_found" }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logManager.error("タイトル検証でエラーが発生", LogCategory.ERROR_HANDLING, {
      testInfo: { title: testInfo.title, sessionId: logManager.getSessionId() },
      performance: { duration },
      customData: { testPhase: "title_validation", errorType: "assertion_failure" }
    }, error);
    throw error;
  }
});
```

#### After (8行)
```typescript
test("タイトル検証", async ({ page, logManager }, testInfo) => {
  const helper = new VRTTestHelper(page, logManager);
  
  const title = await helper.executeTitleVerificationTest(testInfo);
  
  await expect(page).toHaveTitle(/Fast and reliable/);
  console.log(`✅ 期待されるタイトルを確認: ${title}`);
});
```

## 📊 効果測定

### 改善前後の比較

| 指標 | VRT-enhanced.spec.ts | VRT-clean.spec.ts | 改善率 |
|------|---------------------|-------------------|--------|
| 総行数 | 542行 | 90行 | **83%削減** |
| 1テスト平均行数 | 80行 | 12行 | **85%削減** |
| 可読性 | ❌ 低 | ✅ 高 | **大幅改善** |
| 保守性 | ❌ 低 | ✅ 高 | **大幅改善** |

## 🎯 まとめ

### 📝 **テストファイルの責務**
1. **テストケースの定義**
2. **Given-When-Thenの明確化**  
3. **アサーションの実行**
4. **テスト固有設定の記述**

### 🚫 **テストファイルの責務ではないもの**
1. 詳細なログ実装
2. 複雑なエラーハンドリング
3. パフォーマンス測定の詳細
4. システム初期化ロジック

### 🎯 **目指すべき姿**
- **1テスト = 5-15行**
- **意図が一目瞭然**
- **アサーションに集中**
- **詳細ロジックは適切に分離**

**結論**: VRT-enhanced.spec.ts (542行) は明らかに書きすぎ。VRT-clean.spec.ts (90行) が理想的な形です。
