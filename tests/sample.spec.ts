import { test, expect } from "@playwright/test";
const fs = require("fs");

// 認証済み状態をロードするために
test.describe("PlaywrightのAuthenticationのサンプルテスト", async () => {
  test("test 1", async () => {
    // 認証済み状態をlogで確認したい
    const authState = JSON.parse(
      fs.readFileSync("playwright/.auth/user.json", "utf8")
    );
    console.log("認証済み状態:", authState);

    await expect(true).toBeTruthy();
  });
});
