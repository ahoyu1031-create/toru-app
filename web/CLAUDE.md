@AGENTS.md

# TORU プロジェクト — Claude Code ルール

## Project: TORU
- This is a quote/estimation app for construction trades, built on Next.js 16 + Supabase, deployed to Vercel.
- Mobile UI is a priority. When editing pages, always verify mobile layout (cards, not tables on small screens).
- **作業ログ**: 各セッションでやったことは `TORU/LOG.md` に追記（最新が一番上）。Git管理。メモリにworklog_xxxを作らない。
- **動作確認方針**: 既に Vercel 本番デプロイ済み（https://toru-app.vercel.app）。新機能テストは**本番URL前提**。ローカル `npm run dev` は素早くコード書く時の補助で、`stripe listen` のようなローカル専用フローは避ける。Vercel に環境変数を入れ、Stripe Dashboard で本番URLの Webhook を登録するのが正規ルート。

## Environment
- OS: Windows (PowerShell). Use `cd /d` for cross-drive navigation. Avoid `!` prefix syntax (causes parse errors). Quote keys containing Japanese middle-dot or special characters.
- Never use `--omit=optional` with npm install (breaks lightningcss Windows binary).
- In ESM `next.config.ts`, do not use `__dirname` (causes Turbopack panic); use `import.meta.url` instead.

## スキルの自動活用（必須）

以下の作業を始める前に、対応するスキルを**必ず呼び出してから**実装に入ること。呼び出しを忘れた場合でも、ユーザーに確認せず自分で判断して使うこと。

| 作業内容 | 使うスキル |
|---------|-----------|
| UI/UX・画面デザイン・コンポーネント（計画・カラー/フォント選定）| `ui-ux-pro-max` |
| UI/UX・実装（ジェネリックAI感を回避、独自性のあるプロダクション級UI）| `frontend-design`（プラグイン提供）|
| Supabase DB・RLS・マイグレーション | `supabase` または `supabase-development` |
| Claude API・プロンプト・モデル設定 | `claude-api`（ビルトイン。モデルID・料金・パラメータは記憶で答えず必ずこれを読む）|
| パフォーマンス改善・Core Web Vitals | `performance-optimization` |
| SEO対策・検索流入改善 | `seo-monitoring` |
| GA4・計測・イベントトラッキング | `analytics` |
| セキュリティ監査・脆弱性チェック | `security-review`（ビルトイン・現ブランチの変更対象）|
| GitHub Actions のセキュリティ | `gha-security-review` |
| E2Eテスト・自動テスト作成 | `e2e-testing-automation` または `playwright-e2e-testing` |
| API仕様書・ドキュメント生成 | `api-reference-documentation` |
| コード品質・リファクタリング後 | `simplify`（ビルトイン）または `pr-review-toolkit:code-simplifier` エージェント |
| PRレビュー | `review`（GitHub PR・ビルトイン）／作業中diffは `code-review`。多角レビューは `/review-pr` |

スキルの実在はセッション冒頭のスキル一覧（system-reminder）が正。ディスク上は `~/.claude/skills`＋有効プラグイン、さらに**ビルトイン**（claude-api / simplify / review / code-review / security-review / verify / run 等）がある（2026-07-02 棚卸し・同日ビルトイン分を訂正）。

## プロジェクト基本情報

- **本番URL**: https://toru-app.vercel.app
- **スタック**: Next.js 16 / React 19 / Supabase / Tailwind v4 / Claude API
- **DB**: Supabase PostgreSQL（RLS有効）
- **認証**: Supabase Auth（メール＋パスワード）

## 料金プラン（2026-05-17 確定）

| プラン | 月額 | 解析回数 | グループ | 単価マスタ |
|--------|------|---------|---------|-----------|
| free | 無料 | 15回/月 | 参加のみ可 | 不可 |
| individual | ¥1,480 | 30回/月 | 参加のみ可 | 可 |
| team_5 | ¥9,800 | 100回/月 | 作成・参加可 | 可 |
| team_10 | ¥16,800 | 300回/月 | 作成・参加可 | 可 |
| team_unlimited | ¥29,800 | 無制限 | 作成・参加可 | 可 |

- betaプランは廃止
- 15回到達で料金ページ（/settings/plan）へ誘導
- グループ作成はteam系プランのみ

## コーディング規約

- `getCurrentUser()` を使う（`supabase.auth.getUser()` 直呼び禁止）
- 主要ページには `loading.tsx` を必ず作る（`components/skeleton.tsx` を活用）
- `ensureCompany` は React cache 済みなので何度呼んでも安全
- コメントは「なぜ」だけ書く。「何をしているか」は書かない

## Database (Supabase)
- Before suggesting SQL policy/migration fixes, first check if the policy/table already exists (`select * from pg_policies where ...`) to avoid 'already exists' loops.
- For DELETE statements, always check foreign key constraints and order deletions from child to parent tables.

## Autonomy
- When the user says 'proceed', 'go ahead', or 'work autonomously', do NOT ask clarifying questions or request permission for each step. Make reasonable decisions, log them in the worklog, and continue.
- After multi-file edits, always verify changes actually deployed (git status, check correct subfolder for `git -C web` commits) before declaring done.
