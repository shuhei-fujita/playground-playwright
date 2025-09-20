import { expect, type Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

/**
 * CSV データ駆動テスト用の Page Object
 * CSVファイルからテストデータを読み込み、データ駆動テストを実行
 *
 * 【なぜこのPage Objectが必要か】
 * 1. データ管理の分離: テストロジックとテストデータの分離
 * 2. 再利用性: 複数のテストで同じCSV読み込みロジックを共有
 * 3. エラーハンドリング: ファイル読み込み失敗の統一処理
 * 4. 型安全性: TypeScriptでのCSVデータの型管理
 */
export class CSVTestPage extends BasePage {
  private readonly csvFilePath: string;

  constructor(page: Page, csvFileName: string = "test.csv") {
    super(page);
    this.csvFilePath = path.join(__dirname, "..", csvFileName);
  }

  /**
   * CSVファイルからテストデータを読み込み
   * @returns テストデータの配列
   */
  async loadCSVData(): Promise<any[]> {
    try {
      // CSVファイルの存在確認
      if (!fs.existsSync(this.csvFilePath)) {
        throw new Error(`CSVファイルが見つかりません: ${this.csvFilePath}`);
      }

      // CSV ファイルの内容を同期的に読み込む
      const records = parse(fs.readFileSync(this.csvFilePath), {
        columns: true,
        skip_empty_lines: true,
      });

      console.log(`CSVデータを読み込みました: ${records.length}件`);
      return records;
    } catch (error) {
      await this.handleError(`CSVデータの読み込みに失敗: ${error}`);
      throw error;
    }
  }

  /**
   * 特定のテストケースが実行対象かどうかを判定
   * @param record - CSVレコード
   * @returns 実行対象の場合true
   */
  shouldRunTest(record: any): boolean {
    return record.runTest === "true";
  }

  /**
   * テストケースIDに基づいたテスト実行
   * @param record - CSVレコード
   */
  async executeTestCase(record: any): Promise<void> {
    try {
      if (!this.shouldRunTest(record)) {
        console.log(`テストケース ${record.id} はスキップされました`);
        return;
      }

      console.log(`テストケース ${record.id} を実行中...`);

      // 実際のテストロジックをここに実装
      // 例: record.url があればそのページに移動
      if (record.url) {
        await this.navigateTo(record.url);
        await this.waitForPageReady();
      }

      // 例: record.expectedTitle があればタイトルを検証
      if (record.expectedTitle) {
        await this.verifyTitle(record.expectedTitle);
      }

      console.log(`テストケース ${record.id} が正常に完了しました`);
    } catch (error) {
      await this.handleError(
        `テストケース ${record.id} の実行に失敗: ${error}`
      );
      throw error;
    }
  }

  /**
   * 全てのCSVテストケースを実行
   */
  async executeAllTestCases(): Promise<void> {
    try {
      const records = await this.loadCSVData();

      for (const record of records) {
        await this.executeTestCase(record);
      }

      console.log("全てのCSVテストケースが完了しました");
    } catch (error) {
      await this.handleError(`CSVテストケースの実行に失敗: ${error}`);
      throw error;
    }
  }

  /**
   * CSVデータの検証
   * 必要なカラムが存在するかチェック
   */
  async validateCSVStructure(): Promise<void> {
    try {
      const records = await this.loadCSVData();

      if (records.length === 0) {
        throw new Error("CSVファイルにデータが含まれていません");
      }

      // 必要なカラムの存在確認
      const requiredColumns = ["id", "runTest"];
      const firstRecord = records[0];

      for (const column of requiredColumns) {
        if (!(column in firstRecord)) {
          throw new Error(
            `必要なカラム '${column}' がCSVファイルに存在しません`
          );
        }
      }

      console.log("CSVファイルの構造検証が完了しました");
    } catch (error) {
      await this.handleError(`CSVファイルの構造検証に失敗: ${error}`);
      throw error;
    }
  }
}
