import { expect, type Locator, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { logger } from "../utils/TestLogger";
import { config } from "../utils/TestConfig";

/**
 * Todo MVC デモアプリのPage Object
 * BasePage を継承し、Todo操作の全機能を実装
 * rules.mdcに準拠: data-testid、placeholder-based、role-basedセレクターを使用
 */
export class TodoPage extends BasePage {
  // セレクターの定義（rules.mdcセレクター優先度に完全準拠）
  readonly newTodoInput: Locator;
  readonly todoTitle: Locator;
  readonly todoCount: Locator;
  readonly clearCompletedButton: Locator;
  readonly toggleAllButton: Locator;
  readonly todoItems: Locator;
  readonly activeFilter: Locator;
  readonly completedFilter: Locator;
  readonly allFilter: Locator;

  constructor(page: Page) {
    super(page);

    /*
     * セレクター戦略（rules.mdcに完全準拠）:
     * 1. Role-based Selectors（最優先）
     * 2. Label-based Selectors
     * 3. Placeholder-based Selectors
     * 4. Test ID Selectors（data-testid）
     * 5. Text-based Selectors
     */

    // 3. Placeholder-based Selectors（新規入力フィールド）
    this.newTodoInput = page.getByPlaceholder("What needs to be done?");

    // 4. Test ID Selectors（data-testid - 推奨）
    this.todoTitle = this.getByTestIdSafe("todo-title");
    this.todoCount = this.getByTestIdSafe("todo-count");
    this.todoItems = this.getByTestIdSafe("todo-item");

    // 1. Role-based Selectors（最優先）
    this.clearCompletedButton = this.getByRoleSafe("button", {
      name: "Clear completed",
    });

    // 2. Label-based Selectors
    this.toggleAllButton = page.getByLabel("Mark all as complete");

    // 5. Text-based Selectors（フィルター）
    this.allFilter = this.getByTextSafe("All");
    this.activeFilter = this.getByTextSafe("Active");
    this.completedFilter = this.getByTextSafe("Completed");

    logger.info("TodoPageを初期化しました（セレクター戦略完全準拠）");
  }

  /**
   * Todo MVC アプリへ移動
   */
  async navigateToTodoApp(): Promise<void> {
    logger.startStep("Todo MVCアプリへ移動");

    try {
      await this.navigateTo(config.todoAppUrl);
      await this.waitForPageReady();

      // 新規Todo入力フィールドが表示されるまで待機
      await this.waitForVisible(this.newTodoInput);
      await this.verifyTitle("Todo MVC");

      logger.endStep("Todo MVCアプリへ移動");
    } catch (error) {
      await this.handleError("Todo MVCアプリへの移動に失敗");
      throw error;
    }
  }

  /**
   * 新しいTodoを追加
   * @param todoText - 追加するTodoのテキスト
   */
  async addTodo(todoText: string): Promise<void> {
    logger.startStep("Todo追加", `内容: ${todoText}`);

    try {
      if (!todoText.trim()) {
        throw new Error("Todoのテキストが空です");
      }

      await this.waitForVisible(this.newTodoInput);
      await this.fillSafe(this.newTodoInput, todoText, { clear: true });
      await this.newTodoInput.press("Enter");

      // 入力フィールドがクリアされることを確認
      await expect(this.newTodoInput).toBeEmpty();

      // 新しいTodoが追加されたことを確認
      await this.verifyTodoExists(todoText);

      logger.info(`Todoを追加しました: ${todoText}`);
      logger.endStep("Todo追加");
    } catch (error) {
      await this.handleError("Todo追加に失敗");
      throw error;
    }
  }

  /**
   * 複数のTodoを順次追加
   * @param todos - 追加するTodoのリスト
   */
  async addMultipleTodos(todos: string[]): Promise<void> {
    logger.startStep("複数Todo追加", `件数: ${todos.length}`);

    try {
      for (let i = 0; i < todos.length; i++) {
        const todo = todos[i];
        logger.info(`${i + 1}/${todos.length}: ${todo}`);
        await this.addTodo(todo);
      }

      // 全て追加されたことを確認
      await this.verifyTodoCount(todos);

      logger.endStep("複数Todo追加");
      logger.info(`${todos.length}件のTodoを追加しました`);
    } catch (error) {
      logger.failStep("複数Todo追加", error);
      throw error;
    }
  }

  /**
   * 指定されたTodoが存在することを確認
   * @param todoText - 確認するTodoのテキスト
   */
  async verifyTodoExists(todoText: string): Promise<void> {
    logger.startStep("Todo存在確認", `確認対象: ${todoText}`);

    try {
      const todoItem = this.todoItems.filter({ hasText: todoText });
      await this.waitForVisible(todoItem, 5000);
      logger.info(`✅ Todoが存在します: ${todoText}`);
      logger.endStep("Todo存在確認");
    } catch (error) {
      await this.handleError("Todo存在確認に失敗");
      throw error;
    }
  }

  /**
   * Todoの数と内容を確認
   * @param expectedTodos - 期待されるTodoのリスト
   */
  async verifyTodoCount(expectedTodos: string[]): Promise<void> {
    logger.startStep("Todo数・内容確認", `期待数: ${expectedTodos.length}`);

    try {
      await expect(this.todoTitle).toHaveText(expectedTodos, {
        timeout: 10000,
      });
      logger.info(`✅ Todoの数と内容が正しいです: ${expectedTodos.length}件`);
      logger.endStep("Todo数・内容確認");
    } catch (error) {
      await this.handleError("Todo数・内容確認に失敗");
      throw error;
    }
  }

  /**
   * 指定インデックスのTodoアイテムを取得
   * @param index - Todoのインデックス（0始まり）
   */
  async getTodoItem(index: number): Promise<Locator> {
    if (index < 0) {
      throw new Error(`不正なインデックスです: ${index}`);
    }
    return this.todoItems.nth(index);
  }

  /**
   * Todoの完了状態を切り替え
   * @param index - 切り替えるTodoのインデックス
   */
  async toggleTodo(index: number): Promise<void> {
    logger.startStep("Todo完了状態切り替え", `インデックス: ${index}`);

    try {
      const todoItem = await this.getTodoItem(index);
      const checkbox = todoItem.getByRole("checkbox");

      await this.waitForVisible(todoItem);
      await checkbox.click();

      logger.info(`Todo完了状態を切り替えました: インデックス ${index}`);
      logger.endStep("Todo完了状態切り替え");
    } catch (error) {
      await this.handleError("Todo完了状態切り替えに失敗");
      throw error;
    }
  }

  /**
   * Todoを削除
   * @param index - 削除するTodoのインデックス
   */
  async deleteTodo(index: number): Promise<void> {
    logger.startStep("Todo削除", `インデックス: ${index}`);

    try {
      const todoItem = await this.getTodoItem(index);

      // ホバーして削除ボタンを表示
      await todoItem.hover();

      // 削除ボタンをクリック
      const deleteButton = todoItem.getByRole("button", { name: "Delete" });
      await this.waitForVisible(deleteButton);
      await deleteButton.click();

      // Todoが削除されたことを確認（DOM から消える）
      await expect(todoItem).not.toBeVisible({ timeout: 5000 });

      logger.info(`Todoを削除しました: インデックス ${index}`);
      logger.endStep("Todo削除");
    } catch (error) {
      await this.handleError("Todo削除に失敗");
      throw error;
    }
  }

  /**
   * Todoを編集
   * @param index - 編集するTodoのインデックス
   * @param newText - 新しいテキスト
   */
  async editTodo(index: number, newText: string): Promise<void> {
    logger.startStep(
      "Todo編集",
      `インデックス: ${index}, 新しいテキスト: ${newText}`
    );

    try {
      if (!newText.trim()) {
        throw new Error("編集後のテキストが空です");
      }

      const todoItem = await this.getTodoItem(index);

      // ダブルクリックで編集モードに入る
      await todoItem.dblclick();

      // 編集テキストボックスを取得
      const editTextbox = todoItem.getByRole("textbox", { name: "Edit" });
      await this.waitForVisible(editTextbox);

      // テキストを入力
      await editTextbox.fill(newText);
      await editTextbox.press("Enter");

      // 編集が完了したことを確認
      await expect(todoItem.getByText(newText)).toBeVisible({ timeout: 5000 });

      logger.info(`Todoを編集しました: ${newText}`);
      logger.endStep("Todo編集");
    } catch (error) {
      await this.handleError("Todo編集に失敗");
      throw error;
    }
  }

  /**
   * 完了済みTodoをクリア
   */
  async clearCompletedTodos(): Promise<void> {
    logger.startStep("完了済みTodoクリア");

    try {
      await this.waitForVisible(this.clearCompletedButton);
      await this.clickSafe(this.clearCompletedButton);

      logger.info("完了済みTodoをクリアしました");
      logger.endStep("完了済みTodoクリア");
    } catch (error) {
      await this.handleError("完了済みTodoクリアに失敗");
      throw error;
    }
  }

  /**
   * 全てのTodoの完了状態を切り替え
   */
  async toggleAllTodos(): Promise<void> {
    logger.startStep("全Todo完了状態切り替え");

    try {
      await this.waitForVisible(this.toggleAllButton);
      await this.clickSafe(this.toggleAllButton);

      logger.info("全Todoの完了状態を切り替えました");
      logger.endStep("全Todo完了状態切り替え");
    } catch (error) {
      await this.handleError("全Todo完了状態切り替えに失敗");
      throw error;
    }
  }

  /**
   * 指定されたTodoが完了状態であることを確認
   * @param index - 確認するTodoのインデックス
   */
  async verifyTodoCompleted(index: number): Promise<void> {
    logger.startStep("Todo完了状態確認", `インデックス: ${index}`);

    try {
      const todoItem = await this.getTodoItem(index);
      await expect(todoItem).toHaveClass(/completed/, { timeout: 5000 });

      logger.info(`✅ Todoが完了状態です: インデックス ${index}`);
      logger.endStep("Todo完了状態確認");
    } catch (error) {
      await this.handleError("Todo完了状態確認に失敗");
      throw error;
    }
  }

  /**
   * 指定されたTodoが未完了状態であることを確認
   * @param index - 確認するTodoのインデックス
   */
  async verifyTodoNotCompleted(index: number): Promise<void> {
    logger.startStep("Todo未完了状態確認", `インデックス: ${index}`);

    try {
      const todoItem = await this.getTodoItem(index);
      await expect(todoItem).not.toHaveClass(/completed/, { timeout: 5000 });

      logger.info(`✅ Todoが未完了状態です: インデックス ${index}`);
      logger.endStep("Todo未完了状態確認");
    } catch (error) {
      await this.handleError("Todo未完了状態確認に失敗");
      throw error;
    }
  }

  /**
   * 残りのTodo数を取得
   */
  async getRemainingTodoCount(): Promise<string> {
    try {
      const countText = await this.todoCount.textContent();
      return countText || "0";
    } catch (error) {
      logger.warn("Todo数取得でエラーが発生しました", error);
      return "0";
    }
  }

  /**
   * フィルター機能のテスト
   * @param filter - 適用するフィルター（All, Active, Completed）
   */
  async applyFilter(filter: "All" | "Active" | "Completed"): Promise<void> {
    logger.startStep("フィルター適用", `フィルター: ${filter}`);

    try {
      let filterButton: Locator;
      switch (filter) {
        case "All":
          filterButton = this.allFilter;
          break;
        case "Active":
          filterButton = this.activeFilter;
          break;
        case "Completed":
          filterButton = this.completedFilter;
          break;
        default:
          throw new Error(`不正なフィルター: ${filter}`);
      }

      await this.clickSafe(filterButton);
      logger.info(`フィルターを適用しました: ${filter}`);
      logger.endStep("フィルター適用");
    } catch (error) {
      await this.handleError("フィルター適用に失敗");
      throw error;
    }
  }

  /**
   * Todo一覧をクリア（全削除）
   */
  async clearAllTodos(): Promise<void> {
    logger.startStep("全Todo削除");

    try {
      // 全てのTodoを完了状態にしてからクリア
      await this.toggleAllTodos();
      await this.clearCompletedTodos();

      // Todo一覧が空になったことを確認
      await expect(this.todoItems).toHaveCount(0, { timeout: 5000 });

      logger.info("全てのTodoを削除しました");
      logger.endStep("全Todo削除");
    } catch (error) {
      await this.handleError("全Todo削除に失敗");
      throw error;
    }
  }
}
