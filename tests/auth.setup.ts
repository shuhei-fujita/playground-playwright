import { test as setup, expect } from "@playwright/test";
import path from "path";
import { config } from "./utils/TestConfig";
import { logger } from "./utils/TestLogger";

const authFile = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
  logger.info("=== GitHub認証セットアップ開始 ===");

  // common-rules.mdcに準拠: 環境変数から認証情報を取得
  const username = config.githubUsername;
  const password = config.githubPassword;

  // 認証情報が設定されていない場合はスキップ
  if (!config.hasGitHubCredentials()) {
    setup.skip(
      true,
      "環境変数 GITHUB_USERNAME と GITHUB_PASSWORD が設定されていません。\n" +
        ".envファイルを作成し、GitHub認証情報を設定してください。\n" +
        "セキュリティ上の理由により、ハードコーディングされた認証情報は削除されました。"
    );
  }

  try {
    logger.startStep("GitHubログインページへ移動");
    await page.goto("https://github.com/login");

    logger.startStep(
      "認証情報入力",
      `ユーザー名: ${username?.replace(/(?<=.{2}).(?=.{2})/g, "*")}`
    );
    await page.getByLabel("Username or email address").fill(username!);
    await page.getByLabel("Password").fill(password!);

    logger.startStep("ログインボタンクリック");
    await page.getByRole("button", { name: "Sign in" }).nth(0).click();

    // Wait until the page receives the cookies.
    // Sometimes login flow sets cookies in the process of several redirects.
    // Wait for the final URL to ensure that the cookies are actually set.
    logger.startStep("リダイレクト完了待機");
    await page.waitForURL("https://github.com/");

    logger.startStep("認証状態保存", `保存先: ${authFile}`);
    await page.context().storageState({ path: authFile });

    logger.info("✅ GitHub認証セットアップが正常に完了しました");
  } catch (error) {
    logger.error("GitHub認証セットアップに失敗しました", error);

    // スクリーンショット撮影（デバッグ用）
    await page.screenshot({
      path: path.join(
        __dirname,
        "../test-results/screenshots/auth-setup-failure.png"
      ),
      fullPage: true,
    });

    throw error;
  }

  logger.info("=== GitHub認証セットアップ完了 ===");
});
