/**
 * テストデータ管理クラス
 * rules.mdcに準拠: テストデータの分離と型安全性の確保
 */

import type { CsvTestDataRow } from "../types";
import { URLS } from "../constants";

// ユーザー関連のテストデータ
// 【セキュリティ重要】パスワードは環境変数から取得するか、テスト用ダミー値として明示
export const UserTestData = {
  validUser: {
    email: "valid.user@example.com",
    password: process.env.TEST_VALID_PASSWORD || "TEST_DUMMY_VALID_PASS", // テスト用ダミー値
    firstName: "田中",
    lastName: "太郎",
  },
  invalidUser: {
    email: "invalid.email",
    password: "TEST_DUMMY_WEAK_PASS", // テスト用ダミー値（意図的に弱いパスワード）
    firstName: "",
    lastName: "",
  },
  testUser: {
    email: "test.user@example.com",
    password: process.env.TEST_USER_PASSWORD || "TEST_DUMMY_USER_PASS", // テスト用ダミー値
    firstName: "テスト",
    lastName: "ユーザー",
  },
} as const;

// フォーム入力用のテストデータ
export const FormTestData = {
  personalInfo: {
    firstName: "山田",
    lastName: "花子",
    email: "yamada.hanako@example.com",
    phone: "090-1234-5678",
    address: "東京都渋谷区1-2-3",
    zipCode: "150-0001",
  },
  businessInfo: {
    companyName: "株式会社テスト",
    department: "開発部",
    position: "エンジニア",
    businessEmail: "info@testcompany.co.jp",
    businessPhone: "03-1234-5678",
  },
  invalidData: {
    email: "invalid-email-format",
    phone: "abc-defg-hijk",
    zipCode: "invalid-zip",
  },
} as const;

// Todo アプリケーション用のテストデータ
export const TodoTestData = {
  sampleTasks: [
    "チーズを買う",
    "猫にエサをあげる",
    "医者の予約を取る",
    "レポートを書く",
    "会議の準備をする",
    "メールを返信する",
  ],
  priorityTasks: [
    "緊急: 明日の発表準備",
    "重要: 年次レビューの準備",
    "通常: 読書時間の確保",
  ],
  longTasks: [
    "とても長いタスク名を持つアイテム".repeat(10),
    "特殊文字を含むタスク: !@#$%^&*()",
    "絵文字を含むタスク 🎯📝✅",
  ],
  emptyTask: "",
  maxLengthTask: "x".repeat(500),
} as const;

// URL関連のテストデータ（統一定数から取得）
export const UrlTestData = {
  external: {
    playwright: URLS.PLAYWRIGHT_DOCS,
    github: URLS.GITHUB,
    google: URLS.GOOGLE,
    w3schools: URLS.W3SCHOOLS_FORM,
  },
  demo: {
    todoApp: URLS.TODO_DEMO,
    ticketPia: URLS.TICKET_PIA,
  },
  local: {
    development: URLS.LOCAL_DEV,
    testing: URLS.LOCAL_TEST,
    staging: URLS.STAGING,
  },
} as const;

// エラーメッセージのテストデータ
export const ErrorMessages = {
  validation: {
    required: "この項目は必須です",
    invalidEmail: "正しいメールアドレスを入力してください",
    passwordTooShort: "パスワードは8文字以上である必要があります",
    passwordMismatch: "パスワードが一致しません",
  },
  authentication: {
    invalidCredentials: "メールアドレスまたはパスワードが正しくありません",
    accountLocked: "アカウントがロックされています",
    sessionExpired: "セッションが期限切れです",
  },
  network: {
    connectionError: "接続エラーが発生しました",
    timeout: "リクエストがタイムアウトしました",
    serverError: "サーバーエラーが発生しました",
  },
} as const;

// 画面表示用のテキストデータ
export const DisplayTexts = {
  navigation: {
    home: "ホーム",
    login: "ログイン",
    logout: "ログアウト",
    myPage: "マイページ",
    settings: "設定",
    help: "ヘルプ",
  },
  buttons: {
    save: "保存",
    cancel: "キャンセル",
    submit: "送信",
    delete: "削除",
    edit: "編集",
    confirm: "確認",
    back: "戻る",
    next: "次へ",
  },
  messages: {
    success: "正常に処理されました",
    processing: "処理中です...",
    loading: "読み込み中...",
    noData: "データがありません",
    confirmDelete: "削除してもよろしいですか？",
  },
} as const;

// CSV テストデータのスキーマ定義は tests/types.ts で定義済み

// 動的テストデータ生成用のヘルパー関数
export class TestDataGenerator {
  /**
   * ランダムな文字列を生成
   * @param length - 文字列の長さ
   * @param includeSpecialChars - 特殊文字を含むかどうか
   */
  static generateRandomString(
    length: number = 10,
    includeSpecialChars: boolean = false
  ): string {
    const baseChars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    const chars = includeSpecialChars ? baseChars + specialChars : baseChars;

    return Array.from({ length }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join("");
  }

  /**
   * ランダムなメールアドレスを生成
   * @param domain - ドメイン名（省略時はランダム）
   */
  static generateRandomEmail(domain: string = "example.com"): string {
    const username = this.generateRandomString(8).toLowerCase();
    return `${username}@${domain}`;
  }

  /**
   * 現在の日時に基づくユニークな文字列を生成
   */
  static generateUniqueString(prefix: string = "test"): string {
    const timestamp = Date.now();
    const random = this.generateRandomString(4);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * テスト用の日本語名を生成
   */
  static generateRandomJapaneseName(): { firstName: string; lastName: string } {
    const lastNames = [
      "田中",
      "佐藤",
      "鈴木",
      "高橋",
      "山田",
      "渡辺",
      "伊藤",
      "中村",
    ];
    const firstNames = [
      "太郎",
      "花子",
      "次郎",
      "美咲",
      "健太",
      "恵子",
      "隆司",
      "由美",
    ];

    return {
      lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
      firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
    };
  }
}

// すべてのテストデータをまとめたオブジェクト
export const TestData = {
  users: UserTestData,
  forms: FormTestData,
  todos: TodoTestData,
  urls: UrlTestData,
  errors: ErrorMessages,
  texts: DisplayTexts,
  generator: TestDataGenerator,
} as const;

export default TestData;
