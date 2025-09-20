import fs from "fs";
import path from "path";
import { test } from "@playwright/test";
import { parse } from "csv-parse/sync";

// CSV ファイルのパスを取得
const csvFilePath = path.join(__dirname, "test.csv");

// CSV ファイルの内容を同期的に読み込む
const records = parse(fs.readFileSync(csvFilePath), {
  columns: true,
  skip_empty_lines: true,
});

// CSV から読み込んだ各行に対してテストを作成
for (const record of records) {
  test(`Test for: ${record.id}`, async () => {
    // テストデータに基づいて条件分岐
    if (record.runTest === "true") {
      console.log(`Running test for case ID: ${record.id}`);
    }
  });
}
