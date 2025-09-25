<!--
PRレビュー支援コマンド (Cursor Commands)

前提:
- GitHub CLI (gh) がインストール・認証済み: `gh auth status`
- jq がインストール済み

使い方(例):
- 現在のブランチに紐づくPRを要約: [Run]
- 特定のPR番号を指定: `PR_NUMBER=123` を環境変数で与えて [Run]
- リポジトリを明示: `REPO=owner/name` を環境変数で与えて [Run]
- 差分本文も含めたい場合(注意: 出力が大きくなる): `INCLUDE_DIFF=1`
-->

```bash
set -euo pipefail

# 引数/環境変数
PR_NUMBER="${PR_NUMBER:-${1:-}}"
REPO="${REPO:-}"
INCLUDE_DIFF="${INCLUDE_DIFF:-0}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[ERROR] '$1' コマンドが見つかりません。インストールしてください。" >&2
    exit 1
  fi
}

require_cmd gh
require_cmd jq

# PR番号の自動解決
if [ -z "${PR_NUMBER}" ]; then
  set +e
  PR_NUMBER=$(gh pr view ${REPO:+--repo "$REPO"} --json number --jq .number 2>/dev/null)
  rc=$?
  set -e
  if [ $rc -ne 0 ] || [ -z "${PR_NUMBER}" ] || [ "${PR_NUMBER}" = "null" ]; then
    PR_NUMBER=$(gh pr list ${REPO:+--repo "$REPO"} --state open --limit 1 --json number --jq '.[0].number' 2>/dev/null || true)
  fi
fi

if [ -z "${PR_NUMBER}" ] || [ "${PR_NUMBER}" = "null" ]; then
  echo "[ERROR] PRが特定できませんでした。現在のブランチにPRが無いか、オープンPRが存在しません。PR_NUMBER または REPO/ブランチを確認してください。" >&2
  exit 1
fi

# PRメタ情報の取得
PR_JSON=$(gh pr view ${REPO:+--repo "$REPO"} "${PR_NUMBER}" \
  --json number,title,body,author,baseRefName,headRefName,labels,mergeStateStatus,updatedAt,createdAt,url,assignees,changedFiles,additions,deletions,files,commits)

# サマリMarkdown生成
SUMMARY_MD=$(echo "${PR_JSON}" | jq -r '
  def labelnames: ( .labels // [] ) | map(.name) | join(", ");
  def assignees: ( .assignees // [] ) | map(.login) | join(", ");
  def short(s): (s // "") | .[0:7];
  def commits: ( .commits // [] )
    | map("* " + short(.oid // .id) + " " + (.messageHeadline // .title // .message // ""))
    | join("\n");
  def files_tsv:
    ( .files // [] )
    | map([.path, (.additions|tostring), (.deletions|tostring)] | @tsv)
    | join("\n");
  "### PR概要\n"
  + "- タイトル: \(.title) (#\(.number))\n"
  + "- URL: \(.url)\n"
  + "- 作成者: \(.author.login)\n"
  + "- ブランチ: \(.headRefName) -> \(.baseRefName)\n"
  + "- ラベル: \(labelnames)\n"
  + "- アサイン: \(assignees)\n"
  + "- 変更: \(.changedFiles) files, +\(.additions) -\(.deletions)\n"
  + "\n### コミット\n"
  + commits + "\n"
  + "\n### 変更ファイル一覧 (TSV)\npath\tadd\tdel\n"
  + files_tsv + "\n"
  + "\n---\n"
  + "以下の変更点をレビューしてください。設計・境界条件・パフォーマンス・セキュリティ・可読性・テスト観点での指摘を短く具体的に。重大度(High/Med/Low)と提案修正例も併記してください。\n"
')

echo "${SUMMARY_MD}"

# 差分本文の追加 (オプション)
if [ "${INCLUDE_DIFF}" = "1" ]; then
  echo "\n### Diff (truncated to 2000 lines)" 
  gh pr diff ${REPO:+--repo "$REPO"} "${PR_NUMBER}" --color=never | head -n 2000
fi

exit 0
```
