import { test, expect } from "./fixtures/TestFixtures";
import { TodoPage } from "./pages/TodoPage";
import { TestData } from "./data/TestData";

// ローカルストレージの確認用ヘルパー関数
async function checkNumberOfTodosInLocalStorage(page: any, expected: number) {
  return await page.waitForFunction((expectedNumber: number) => {
    return (
      JSON.parse(localStorage["react-todos"] || "[]").length === expectedNumber
    );
  }, expected);
}

// テストデータの使用
const TODO_ITEMS = TestData.todos.sampleTasks.slice(0, 3);

test.beforeEach(async ({ pageWithLogging, logger }) => {
  logger.info("Todo MVCアプリの初期化を開始");
  const todoPage = new TodoPage(pageWithLogging);
  await todoPage.navigateToTodoApp();
  logger.info("Todo MVCアプリの初期化完了");
});

test.describe("新しいTodo", () => {
  test("Todoアイテムを追加できること", async ({ pageWithLogging, logger }) => {
    logger.info("=== Todo追加テスト開始 ===");

    const todoPage = new TodoPage(pageWithLogging);

    // 1つ目のTodoを作成
    await todoPage.addTodo(TODO_ITEMS[0]);
    await todoPage.verifyTodoCount([TODO_ITEMS[0]]);

    // 2つ目のTodoを作成
    await todoPage.addTodo(TODO_ITEMS[1]);
    await todoPage.verifyTodoCount([TODO_ITEMS[0], TODO_ITEMS[1]]);

    await checkNumberOfTodosInLocalStorage(pageWithLogging, 2);

    logger.info("=== Todo追加テスト完了 ===");
  });

  test("アイテム追加後に入力フィールドがクリアされること", async ({
    pageWithLogging,
    logger,
  }) => {
    logger.info("=== 入力フィールドクリアテスト開始 ===");

    const todoPage = new TodoPage(pageWithLogging);

    await todoPage.addTodo(TODO_ITEMS[0]);
    await expect(todoPage.newTodoInput).toBeEmpty();
    await checkNumberOfTodosInLocalStorage(pageWithLogging, 1);

    logger.info("=== 入力フィールドクリアテスト完了 ===");
  });
});

test.describe("Todoの編集", () => {
  test("Todoアイテムを編集できること", async ({ pageWithLogging, logger }) => {
    logger.info("=== Todo編集テスト開始 ===");

    const todoPage = new TodoPage(pageWithLogging);
    const editedText = "編集後のタスク名";

    // Todoを作成
    await todoPage.addTodo(TODO_ITEMS[0]);

    // Todoを編集
    await todoPage.editTodo(0, editedText);

    // 編集結果を確認
    await expect(todoPage.todoTitle).toHaveText([editedText]);
    await checkNumberOfTodosInLocalStorage(pageWithLogging, 1);

    logger.info("=== Todo編集テスト完了 ===");
  });

  test("複数アイテムの編集テスト", async ({ pageWithLogging, logger }) => {
    logger.info("=== 複数Todo編集テスト開始 ===");

    const todoPage = new TodoPage(pageWithLogging);

    // 複数のTodoを追加
    await todoPage.addMultipleTodos([TODO_ITEMS[0], TODO_ITEMS[1]]);

    // それぞれを編集
    const editedItems = ["編集済み1", "編集済み2"];
    await todoPage.editTodo(0, editedItems[0]);
    await todoPage.editTodo(1, editedItems[1]);

    // 編集結果を確認
    await todoPage.verifyTodoCount(editedItems);

    logger.info("=== 複数Todo編集テスト完了 ===");
  });
});

test.describe("Todoの削除", () => {
  test("Todoアイテムを削除できること", async ({ pageWithLogging, logger }) => {
    logger.info("=== Todo削除テスト開始 ===");

    const todoPage = new TodoPage(pageWithLogging);

    // 複数のTodoを作成
    await todoPage.addMultipleTodos([
      TODO_ITEMS[0],
      TODO_ITEMS[1],
      TODO_ITEMS[2],
    ]);

    // 2番目のTodoを削除
    await todoPage.deleteTodo(1);

    // 削除後のTodo一覧を確認
    await todoPage.verifyTodoCount([TODO_ITEMS[0], TODO_ITEMS[2]]);
    await checkNumberOfTodosInLocalStorage(pageWithLogging, 2);

    logger.info("=== Todo削除テスト完了 ===");
  });

  test("すべてのTodoを削除できること", async ({ pageWithLogging, logger }) => {
    logger.info("=== 全Todo削除テスト開始 ===");

    const todoPage = new TodoPage(pageWithLogging);

    // 複数のTodoを作成
    await todoPage.addMultipleTodos(TODO_ITEMS);

    // 全Todoをクリア
    await todoPage.clearAllTodos();

    // 全て削除されたことを確認
    await expect(todoPage.todoItems).toHaveCount(0);
    await checkNumberOfTodosInLocalStorage(pageWithLogging, 0);

    logger.info("=== 全Todo削除テスト完了 ===");
  });
});

test.describe("Todoの完了・未完了", () => {
  test("Todoアイテムを完了状態にできること", async ({
    pageWithLogging,
    logger,
  }) => {
    logger.info("=== Todo完了状態テスト開始 ===");

    const todoPage = new TodoPage(pageWithLogging);

    await todoPage.addTodo(TODO_ITEMS[0]);

    // Todoを完了状態にする
    await todoPage.toggleTodo(0);

    // 完了状態を確認
    await todoPage.verifyTodoCompleted(0);

    logger.info("=== Todo完了状態テスト完了 ===");
  });

  test("全てのTodoを一括で完了状態にできること", async ({
    pageWithLogging,
    logger,
  }) => {
    logger.info("=== 全Todo一括完了テスト開始 ===");

    const todoPage = new TodoPage(pageWithLogging);

    // 複数のTodoを作成
    await todoPage.addMultipleTodos([TODO_ITEMS[0], TODO_ITEMS[1]]);

    // 全て完了状態にする
    await todoPage.toggleAllTodos();

    // 全てが完了状態になっていることを確認
    await todoPage.verifyTodoCompleted(0);
    await todoPage.verifyTodoCompleted(1);

    logger.info("=== 全Todo一括完了テスト完了 ===");
  });

  test("完了したTodoをクリアできること", async ({
    pageWithLogging,
    logger,
  }) => {
    logger.info("=== 完了Todoクリアテスト開始 ===");

    const todoPage = new TodoPage(pageWithLogging);

    // Todoを作成して完了状態にする
    await todoPage.addMultipleTodos([TODO_ITEMS[0], TODO_ITEMS[1]]);
    await todoPage.toggleTodo(0); // 1つ目だけ完了

    // 完了したTodoをクリア
    await todoPage.clearCompletedTodos();

    // 未完了のTodoのみが残っていることを確認
    await todoPage.verifyTodoCount([TODO_ITEMS[1]]);
    await checkNumberOfTodosInLocalStorage(pageWithLogging, 1);

    logger.info("=== 完了Todoクリアテスト完了 ===");
  });

  test("フィルター機能のテスト", async ({ pageWithLogging, logger }) => {
    logger.info("=== フィルター機能テスト開始 ===");

    const todoPage = new TodoPage(pageWithLogging);

    // 複数のTodoを作成（一部完了状態）
    await todoPage.addMultipleTodos([
      TODO_ITEMS[0],
      TODO_ITEMS[1],
      TODO_ITEMS[2],
    ]);
    await todoPage.toggleTodo(0); // 1つ目を完了状態に

    // 各フィルターを試す
    await todoPage.applyFilter("All");
    await todoPage.applyFilter("Active");
    await todoPage.applyFilter("Completed");
    await todoPage.applyFilter("All"); // 元に戻す

    logger.info("=== フィルター機能テスト完了 ===");
  });
});

test.describe("Todoカウンター", () => {
  test("残りのTodo数が正しく表示されること", async ({
    pageWithLogging,
    logger,
  }) => {
    logger.info("=== Todoカウンターテスト開始 ===");

    const todoPage = new TodoPage(pageWithLogging);

    // Todoを作成
    await todoPage.addMultipleTodos([
      TODO_ITEMS[0],
      TODO_ITEMS[1],
      TODO_ITEMS[2],
    ]);

    // 1つ完了状態にする
    await todoPage.toggleTodo(0);

    // 残りのカウントを確認（完了していない2つ）
    const remainingCount = await todoPage.getRemainingTodoCount();
    expect(remainingCount).toContain("2");

    logger.info(`残りTodo数: ${remainingCount}`);
    logger.info("=== Todoカウンターテスト完了 ===");
  });

  test("長いテキストやエラーケースのテスト", async ({
    pageWithLogging,
    logger,
  }) => {
    logger.info("=== エラーケーステスト開始 ===");

    const todoPage = new TodoPage(pageWithLogging);

    // 長いテキストのテスト
    const longTask = TestData.todos.longTasks[0];
    await todoPage.addTodo(longTask);
    await todoPage.verifyTodoExists(longTask);

    // 特殊文字のテスト
    const specialTask = TestData.todos.longTasks[1];
    await todoPage.addTodo(specialTask);
    await todoPage.verifyTodoExists(specialTask);

    // 絵文字のテスト
    const emojiTask = TestData.todos.longTasks[2];
    await todoPage.addTodo(emojiTask);
    await todoPage.verifyTodoExists(emojiTask);

    logger.info("=== エラーケーステスト完了 ===");
  });
});
