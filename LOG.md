# TORU 作業ログ

セッション毎の実行記録。新しい作業は **上に追記**（最新が一番上）。

---

## 2026-06-10

### フロー一貫性監査 + /alpha 行き止まりリンク全廃 + 解析バックエンド健全性確認

**背景**: ユーザー依頼「今やるべきこと・直すべきところ・一貫したフローができているか確認。昨日エラーが出たのが気になる」。

**昨日(6/9)のセッション再構成**（未コミットで残っていた作業）:
- 20:56 `analyze-client.tsx` のトライアル切れCTA `/alpha`→`ALPHA_FORM_URL` 修正（未コミット）
- 21:04 `scripts/db/recent-signups.mjs` 新規（登録者一覧スクリプト）
- 22:09 `scratch/sample-drawing.html` から自作サンプル図面 `web/public/samples/sample.pdf` を生成（**「サンプル図面で試す」ボタンは未接続**。コード上どこからも参照なし）
- `.gitignore` に `scratch/` 追加

**エラー原因調査**:
- DB直接確認: `drawing_analyses` の最新レコードは **5/16**（6月の解析レコード0件。失敗時は行が作られない仕様）
- **本番同条件で sample.pdf を解析APIに直接投げて検証 → ✅成功**（Opus 4.7・13品目抽出・APIキー/クレジット/モデルID/PDF全て正常）
- モデルID `claude-opus-4-7` / `claude-sonnet-4-6` は有効と確認（claude-apiスキルで照合）
- → **バックエンドは健全**。昨日のエラーの実体はUI側の何か（要ユーザー確認）の可能性大

**フロー監査の発見と修正**（5/29の `/alpha`廃止→`/`リダイレクト化 の残骸が3箇所残っていた）:
1. `settings/plan/page.tsx:146` トライアル切れ文言内「アルファテスター枠に申込」が `/alpha`（→LPに飛ばされ迷子）→ `ALPHA_FORM_URL` 外部リンク化 ✅
2. `settings/plan/page.tsx:195` アンバーカード「もう一つの選択肢」も同様 → 外部リンク化 ✅
3. `app/page.tsx:437` LPフッターの ALPHA リンク（`/`への自己ループ）→ 削除（5/29方針「アルファ入口はアプリ内に集約」に整合）✅
- 検証: `tsc --noEmit` ✅ / `npm run build` ✅ exit 0
- 本番LP稼働確認 ✅（Playwright）

**残課題（このセッションで未対応）**:
- 「サンプル図面で試す」ボタンの実装（sample.pdf は配信されるだけ。analyze画面への接続が次タスク）
- `recent-signups.mjs` の不具合: users テーブルのフラグ取得が失敗しても無言で全員「一般」表示になる（error握りつぶし）。aoki.ai が team_unlimited なのに「一般」と出たのはこれ
- 認証画面バッジの出し分け（既知・本番前チェックリスト記載済み）

---

## 2026-06-03

### X コールドDM 開始 + 「DM君」テンプレ集を新規作成

**背景**: 固定ツイ公開（紹介動画は120fps→Xに弾かれ→ffmpegで60fps化、168MB→30MBに変換して解決）。今日から X で社長・経営者クラスに DM を開始する方針。

**作成**: `docs/dm-templates.md`（DM君）— コピペ用コールドDMテンプレ集
- A. 社長・経営者向け（今日のメイン。ROI/人件費/受注スピードで語る。2ステップ＋簡潔ワンショット）
- B. 実務者向け（積算/一人親方・2ステップ）/ C. AI×建設発信者向け / D. ワンショット（痛み投稿者向け）
- 鉄則: 事前にいいね/リプで認知→冒頭1行を個別化→URLは2通目→1日2〜3通→「教えてください」トーン→記録つける
- トラッキング表・禁止事項つき

**メッセージ統一**: 価値訴求は「**半日〜1日 → 10分**」で固定ツイ/LP/DM 全部揃えた（旧docsの「1日→30秒」は抽出単体の話）。

**関連既存docs**: bio/固ツイ案=`x-strategy-drafts.md`、アルファ承認=`alpha-tester-runbook.md`。

### プラン画面: ベータ中は決済UIを無効化 + developer の team_unlimited 表示を解消

**背景**: 個人営業を本格化するにあたり、(1) ベータ期間中はユーザーが実際にプラン変更（課金）できないようにしたい。ただし裏のStripeシステムは丸ごと維持し、正式公開時に即解放できる状態に。(2) developer アカウント（is_unlimited）が比較表で「team_unlimited が現在のプラン」と表示されるのが実態と違うので、プランなし扱いに。

**実施**（`web/app/(app)/settings/plan/page.tsx` の表示ロジックのみ。Stripeバックエンドは不触）:
- ① 比較表の `isCurrent` を `!hasUnlimitedAccess && planType === plan` に変更 → developer/alpha はどのカードも「現在のプラン」にしない（team_unlimited ピン留め＆developerバッジ廃止）。上部「現在のプラン: developer（無制限）」はそのまま（正確なので維持）。
- ② プラン変更ボタンを `IS_LIVE_BILLING` でゲート。ベータ（test）中は無効化した「ベータ期間中」ボタンを表示、`UpgradeButton`（→PlanChangeModal→Stripe Checkout）は live 時のみ描画。**`NEXT_PUBLIC_BILLING_MODE=live` を立てれば即解放**。
- ③ フッター文言もベータ中は「プラン変更は停止しています（正式公開時に解放）」に。
- 検証: tsc/build エラー0。
- 補足: developer の DB プラン（北陸電工=team_unlimited）は未変更。is_unlimited=true が無制限アクセスを付与しており plan 値は表示・機能に影響しないため。必要なら別途 null 化可能。

### 確認事項メモ + 本番前チェックリスト作成

- **β参加者の「現在のプラン」表示**: "β" にはならない。普通のサインアップ=「無料体験中」（10回/7日トライアル, 緑）、アルファ承認=「アルファテスター」（無制限, オレンジ）。betaはプランでなく期間。DM経由の人を無制限にしたいなら alpha 承認運用。
- **カリさん(aoki1031movie)** が team_unlimited 表示なのは、過去のStripeテスト購入の課金データが残っているため（正しい挙動）。青木優(dev)は今回の修正でプランなし表示に。
- **認証画面の信頼バッジ問題（既知バグ・本番前対応）**: `auth-shell.tsx` の3バッジ（クレカ不要/登録1分/ベータ無料）が signup/login 共通パネルに出ており、**login画面でも「登録は約1分で完了」が出てちぐはぐ**。本番前に出し分け or login非表示。
- **`docs/pre-launch-checklist.md` 新規作成**: 本番(Live)切替前にまとめてやる項目を集約（BILLING_MODE切替/Stripe Live化/コピー見直し/テストアカウント整理/動画・固ツイ正式版 等）。気づいたら随時追記する運用。

### パフォーマンス改良 #1: ナビのクリック即フィードバック

**背景**: ユーザー指摘「TORUがもっさり＝ページ遷移＋操作の反応」（AI処理は後回し）。調査の結果、`loading.tsx` は18ファイルで全ルートほぼ網羅済み（スケルトンは充足）。真因は**クリック直後のフィードバックが無い**こと（サイドバー押下→遷移完了までアクティブ表示も動かず無反応に見える）。

**実施**: `web/components/app-sidebar.tsx` に Next 16 の `useLinkStatus` を使った `NavSpinner` を追加。親ナビ項目をクリックすると、その項目に**即スピナー**が出る（遷移中だけ）。サイドバー内のみの追加で低リスク。tsc/build エラー0。

**次の候補（順次）**: サブ項目にも同様、重いページ（dashboard等）のクエリ最適化、AI処理（図面解析）の体感改善は最後。`(app)/layout.tsx` は共有レイアウトで遷移ごとに再実行されない（既にOK）。

---

## 2026-05-29

### LP一本化 + auth画面（signup/login/onboarding）を Blueprint デザインに刷新

**背景**: LPはBlueprint化済みだが、`/signup` 以降のアカウント登録〜アプリ内が旧"Dark Pro"デザイン（青#2563EB/オレンジ/ダーク紺）のままで、LP→登録で世界観が分断していた。ユーザー指摘「サインアップもサービスもLPとモードが違う、LPに合わせていく」。

**方針合意**:
- LPは `/` 一本化（`/alpha` は廃止）。アルファ応募の入口は公開LPではなく**アプリ内のトライアル壁**に集約。承認は owner の DB操作（変更なし）。
- デザイン統一は ①auth フルBlueprint → ②globals.css の色トークン差し替えでアプリ内全体を寄せる、の2段階。作業画面に方眼等の重い装飾は入れず可読性優先。

**このセッションの実施（①auth まで）**:
1. **LP一本化**: `app/alpha/page.tsx` を `redirect("/")` に置換（600行→7行）。既存 `/alpha` リンクは `/` に転送。
2. **トライアル壁バナー直リンク化**: `components/trial-banner.tsx` の test mode ended CTA を `/alpha` → `ALPHA_FORM_URL`（新タブ・`<a target=_blank>`）。`/alpha`消去で行き止まりになる動線を修正（=一本化と1セットの必須変更）。
3. **Blueprint フォーム部品**: `globals.css` に `.bp-label .bp-input .bp-alert(.bp-alert-ok) .bp-code` 追加（紺枠・focusでオレンジシャドウ）。
4. **共通シェル**: `components/auth-shell.tsx` 新規。左=製図モチーフのブランドパネル（TORUロゴ・「図面を投げたら見積書が出てくる」・安心材料3点）＋右=フォーム枠。signup/login で共有。
5. **3画面刷新**: `signup/page.tsx` `login/page.tsx`（AuthShell使用）、`onboarding/page.tsx` + `onboarding-form.tsx`（bp-grid + bp-input/label/cta）。

**検証**:
- `npx tsc --noEmit` ✅ エラー0
- `npm run build` ✅ exit 0
- ブラウザ確認: `/signup`（1440/モバイル）・`/login` がBlueprintで描画、コンソールエラー0。`/alpha`→`/` リダイレクト確認。
- ⚠️ `/onboarding` は認証必須のため未ログインで視覚確認不可（ビルド通過・signup/loginと同部品なので問題なし想定。実機ログイン時に最終確認）。

**①コミット**: `9995dad` で push 済み（Vercel 自動デプロイ）。9 files, +375/-1011（/alpha 巨大ファイル削減）。

### ②アプリ内全体を Blueprint トークンに統一（同セッションで実施）

**調査**: アプリ内は `var(--color-*)` トークンを **348箇所/37ファイル**使用、ハードコード青/オレンジは少数 → トークン差し替えで大部分が連動する低リスク構造と判明。

**実施**:
1. `globals.css` `:root` を v0.3 Blueprint に差し替え:
   - `--color-primary` #2563EB→**#0B3D91**(紺) / `--color-accent` #F97316→**#FF6B35** / `--color-bg` #EDF1F7→**#F4F1E8**(ベージュ) / `--sidebar-bg` #0E1726→**#0A2A63**(紺) / 枠線をベージュ調・テキストを navy ink に。sidebar active を amber 強調に。
2. ハードコード残りを一括置換（dead な `hero-demo.tsx` は除外）: `#F97316`→`#FF6B35` / `#2563EB`→`#0B3D91` / rgba 同様。対象: app-sidebar, right-panel, dm-group-shortcut, file-confirm-modal, dashboard(page/plan-status-bar), groups(page/chat), quotes/page。
3. Tailwind 青クラス2箇所を navy arbitrary に: quote-detail の issued バッジ、plan-change-modal の初回契約 info box。
   - 注: 作業画面には方眼(bp-grid)等の重い装飾は入れず、色のみで統一（可読性優先）。

**検証**:
- `tsc --noEmit` ✅ / `npm run build` ✅ exit 0
- ⚠️ ダッシュボード等アプリ内は認証必須で直接スクショ不可。代わりにトークンを使う公開ページ `/privacy` を確認 → ベージュ背景＋navy テキスト＋navy ロゴで破綻なく描画、コントラスト良好。トークンのカスケードが効くことを確認。
- **ユーザー確認待ち**: ダッシュボード実画面の目視（ベージュ背景の強さ・色味の最終OK）。トークン1個なので調整は容易。

**残課題候補**: trial-banner の active 状態は意味的 info としてTailwind青のまま（必要なら navy 化）。dead code `hero-demo.tsx` は削除検討可。

---

## 2026-05-28

### LP を「Blueprint（製図・青写真）」デザインに全面刷新 → 表示検証完了

**背景**: アルファテスター告知に向け、LP の世界観を「建設×製図」に寄せた差別化デザインへ刷新。朝に `/alpha`、夜にホーム `/` を同デザインで統一。

**コミット（全て push 済み = 本番反映済み）**:
- `79710a6` ホーム `/` を Blueprint デザインに全面刷新（page.tsx, 6セクション構成）
- `395e978` `/alpha` v3 — TORU差別化軸の訴求 + プロ品質モーション追加
- `8196bdd` `/alpha` を「TORU 正規 LP（ベータ版）」に再構築
- `ba96deb` `/alpha` を「ブループリント（製図・青焼き）」デザインで全面リデザイン

**デザイン仕様**: 方眼背景 / 濃紺 `#0B3D91` / モノスペースの技術ラベル（DOC. / REV. / SEC NN）/「見積書」アンバー強調 / `components/blueprint-motion.tsx`（ScrollProgress, Reveal, BlueprintParallaxBg 等）。
ホーム構成: Hero(SEC00) → 課題(01) → フロー(02) → 機能(03) → 強み(04) → 料金(05) → FAQ(06) → FinalCta → Footer。

**検証（このセッションで実施）**:
- dev サーバー + Playwright で `/` を 1440 / 390(モバイル) 撮影。
- ⚠️ fullPage 撮影では Hero 以下が空白 → `Reveal` の IntersectionObserver が programmatic 撮影で未発火だっただけ（DOM には全セクション存在、実スクロールで `opacity:0` 残存 **0個**）。実害なし。
- スクロール後の再撮影で全セクション正常描画を確認。コンソールエラー 0。
- 結論: **ホーム Blueprint 刷新は完成・正常動作・本番反映済み**。

**残課題候補（次回判断）**:
- `/` と `/alpha` の役割整理（両方 Blueprint 化済み。アルファ告知でどちらを配るか）
- 実機（スマホ実端末）での最終確認

---

## 2026-05-26

### 🚀 Claude を「事業パートナー」に格上げ + Supabase直接アクセス手段確立

**背景**: ユーザーが「TORU を副業ではなく **AI ビジネスの柱（メイン候補）** として位置付ける」と方針宣言。これに伴い Claude の役割を「実装代行」から「戦略コンサル+実装者」に格上げ。同時に「pending タスクを残さず即実行」「Opus 4.7 をフル活用」の方針も確定。

**実施**:

1. **Supabase Admin SDK 経由の直接 DB アクセス基盤を構築**
   - `npm install @supabase/supabase-js dotenv` 実行（web/ 配下）
   - `scripts/db/client.mjs` 新規作成 — Admin クライアント（service_role キー / RLS バイパス）
   - `scripts/db/ping.mjs` 接続テスト → ✅ 成功
   - これまでユーザーが Supabase SQL Editor で手動実行していた検証系SQLを **Claude が完全自動化** 可能に

2. **P0-① STEP C: クリーンアップ検証 完全実行**（タスク #18）
   - `scripts/db/verify-cleanup.mjs` 作成・実行
   - 結果:
     - (1) ✅ company_member 重複なし（5名ユニーク）
     - (2) ✅ 孤児会社なし（5社全てメンバー存在）
     - (3) ✅ 全員1社のみ所属
     - (4) ✅ developer=ahoyu1031のみ / alpha=aoki1031movieのみ（意図通り）
   - 所属マッピング確定:
     - ahoyu1031@gmail.com → 北陸電工 (team_unlimited)
     - skaken1003@icloud.com → ke (trial)
     - aoki.ai@gmail.com → aoki company (team_unlimited)
     - studioalpha.c.s@gmail.com → 合同会社スタジオアルファ (trial)
     - aoki1031movie@gmail.com → 仮さん（個人）(trial)

3. **`TORU/CLAUDE.md` 新規作成** — ルートレベルの方針定義
   - 「事業パートナー」スタンス4点（戦略視点 / 判断軸提示 / 資源配分 / 能動消化）
   - DB 直接アクセス手段の運用ルール（SELECT自由 / UPDATE目的明確時 / DELETE確認必須）
   - 検証系タスクの即実行ルール
   - Opus 4.7 フル活用方針
   - 既存 `web/CLAUDE.md` は @include で継承

**深夜セッションでの追加実施**:

4. **#16 Webhook 修正完了** — `web/app/api/billing/webhook/route.ts` で stripe_customer_id / stripe_subscription_id を保存。マイグレーション SQL `supabase/migrations/20260526000001_add_stripe_subscription_id.sql` を Supabase SQL Editor で実行済み（カラム追加確認 ✅）

5. **#22 GDPR 対応は「やらない」決定** — MVP フェーズでは過剰防御。削除依頼来たら手動 SQL で対応する運用に。利用規約への1行追記も今夜は見送り。判断軸を `memory/project_toru_mvp_priority.md` に保存。

6. **6年ロードマップ + 来月計画ミーティング骨格** — 独立判定ライン: 月80万円 / 期限: 30歳まで / 戦略: 副業×複数プロダクト。来月の大目標仮: PMF探索（アルファ20名 + 強FB5件）。詳細は明朝以降のセッションで確定。

7. **朝1時間メニュー整備** — `docs/morning-menu.md` 作成（A/B/C/D の選択肢付き）。`docs/x-strategy-drafts.md` 作成（bio・固ツイ・公開記念ポスト案を先回り下書き）。明日朝の即時着手用。

**翌セッション (2026-05-27 朝1時間想定)**:
- 「メニュー〇〇でいきたい」と Claude に伝えれば即着手
- 候補: A(X実投稿) / B(来月計画詳細化) / C(決済テスト) / D(小タスク詰め合わせ)
- 推奨: B（脳冴えてる朝なら）or A（手を動かしたい朝）

---

## 2026-05-25

### アルファテスタープログラム運用整備

**背景**: MVP公開期間中、決済を経由せず無制限利用してもらう「アルファテスター」枠を運用するにあたり、承認フロー・テンプレ・SQL を1か所にまとめる必要があった。

**実施**:
- `docs/alpha-tester-runbook.md` 新規作成（226行）
  - 承認/取消 SQL（コピペ用 + RETURNING付き）
  - メール / X DM テンプレ
  - 状態確認SQL（個別 / 一覧 / 利用状況集計）
  - トラブルシュート表（7症状）
  - developer vs alpha tester の違いを明記（誤って `is_unlimited` を一般ユーザーに付けない）
  - Live切替時の永久半額対応メモ（先着10名・未実装）

**現状の運用フロー確定**:
```
Google Form 申込 → ahoyu1031@gmail.com 通知
→ Supabase で UPDATE users SET is_alpha_tester=true
→ 承認メール送信 → 即時無制限利用可
```

**仮さん (aoki1031movie) 状態確定**:
- `is_unlimited=false / is_alpha_tester=true` （オレンジバッジ）
- 開発者モード（紫バッジ）は `ahoyu1031` 専用に維持

**次タスク候補**: 承認連絡メール下書き整備 / スタジオα・ke へのDM文 / X告知

---

## 2026-05-23

### P0-① 重複所属クリーンアップ 実行 + 隠れバグ修正

**スキーマ発見**:
- `company_member` には `id`, `created_at` が**存在しない**
- 実カラム: `company_id`, `user_id`, `role`, `joined_at`
- 主キーは複合 `(company_id, user_id)` 想定、`ctid` 経由が安全

**実施した修正**:
- `web/lib/get-plan.ts`: `created_at`（実在しない列）参照を `joined_at` に変更 → UNIQUE制約後は `.maybeSingle()` で簡素化
- `web/lib/ensure-company.ts`: 23505（UNIQUE違反）ハンドリング追加 + 孤児会社削除
- `web/app/api/billing/checkout/route.ts`: 同上のガード追加
- ビルド ✅

**Supabase 実行（ユーザー）**:
- STEP A dry-run → KEEP=team_unlimited（cus_UYcp1IlbR7m5NU）/ DELETE=4行 確認OK
- STEP B migration → DELETE 4行 + `UNIQUE(user_id)` 制約付与 完了
- STEP C 検証 → ⏳ ユーザー実行待ち

### Claude Code ステータスバー — 完全復旧

- 3.7.0→3.8.1 再インストール後、`statusLine.command` を `"cs"` に再設定
- `core.py:519` の `LAST_STDIN_FALLBACK_MAX_AGE_S` を再パッチ（600→3600）
- `cs doctor` 全✅、5h/7d/$/cache 全表示確認
- メモリ `feedback_statusbar_check.md` 追加（次回以降の自動診断ルール）

### 🚨 重大バグ発見: 無料配布

`ensure-company.ts:50` で新規ユーザー全員に `plan: "team_unlimited"` を無料配布。Stripe決済が意味を失っている。

### 無料トライアル設計（ユーザー判断確定）

- 無料枠: **10回 / 7日間（先に尽きた方で終了）**
- 機能ロック: **図面解析のみ**（グループは D案: 個人プランでも参加OK、作成はteamのみ）
- 初期プラン状態: `companies.plan = NULL`（未契約）
- 既存25社: **検証後リセット予定**（実ユーザー不在のため）
- UI: 「10回中あと2回」バナー + 終了モーダル → プラン選択誘導

### 進め方プロトコル（明文化・以降この順を厳守）

1. **言語化** — 何を・なぜ・影響範囲・エッジケース
2. **確認** — ユーザー判断ポイント明示 → OK取る
3. **実装** — コード書く、隣接ファイルとの相関性チェック
4. **検証** — `npx tsc --noEmit` → `eslint` → `next build` → `code-review` → 必要なら `verify`
5. **記録** — LOG.md + memory に「なぜ」残す

### 待機中タスク

- ⏳ ユーザー: 検証SQL ①② 実行 → ✅ **5社のみ判明**（25は古いログ）。北陸電工=dev / 仮さん=テスト / 残り3社が要判断
- ⏳ ユーザー: STEP C 検証SQL 実行
- ⏳ ユーザー: リセットSQL 実行可否判断（5社のうちどれを残すか）
- ⏳ Claude: 無料トライアル実装（D案）の drafts 仕上げ

### 無料トライアル実装 進捗（下準備）

**完了**:
- (A) DB migration SQL（companies に `trial_started_at`, `trial_drawings_used`, `trial_ended_reason` 追加 + 既存5社を grandfathered=999 で埋め）→ **ユーザー実行済み**
- (B) `web/lib/ensure-company.ts`: 新規会社作成時 `plan: null` + trial 初期化に変更
- (C) `web/app/api/analyze-drawing/route.ts`: トライアル枠チェック分岐追加（402返却・残数/期間切れで `trialEnded: true`）
- (C') `web/app/(app)/drawings/actions.ts` (`saveDrawingAnalysis`): トライアル消費カウンタ +1 ロジック
- (F) `web/app/(app)/groups/actions.ts` (`createGroup`): D案ガード追加（team プラン以上のみ作成可）
- (G) `web/lib/plan.ts`: `TRIAL_DRAWING_LIMIT=10`, `TRIAL_DURATION_DAYS=7`, `isTrialActive()`, `getTrialStatus()`, `getPlanCapabilities()` 追加。`free` プラン定義削除。`null` プラン対応に全面リファクタ
- ビルド ✅ 全パス通過

**既存5社の処遇（ユーザー判断確定）**:
- 北陸電工（dev / ahoyu1031）: 変更なし、`team_unlimited` + `is_unlimited=true` 維持
- 仮さん（テスト / aoki1031movie）: 変更なし
- Aoki AI（aoki.ai）: 変更なし（自己管理）
- スタジオアルファ（studioalpha.c.s）: 🎁 トライアル状態にリセット（10回付与、データ保持）
- ke（友達 / skaken1003）: 🎁 同上

**機能マトリックス確定（lib/plan.ts に反映）**:
- 図面解析: 全プラン✅（トライアル中は10回まで、有料は月次）
- グループ作成: team プランのみ ❌（D案）
- グループ参加: 全プラン+トライアル ✅（D案）
- 見積作成: 全プラン+トライアル ✅（機能ロック=図面解析のみ方針）
- 単価マスター: 全プラン+トライアル ✅

### UI 実装 完了（同セッション内追加）

**新規ファイル**:
- `web/lib/get-company-trial.ts`: `getCompanyTrial(userId)` - React cache 付き、所属会社の trial_* 情報取得
- `web/components/trial-banner.tsx`: `<TrialBanner>` - active時(青/警告amber)・ended時(赤+CTA)の3状態を1コンポーネントで処理

**変更**:
- `web/lib/get-plan.ts`: 戻り値 `Promise<string>` → `Promise<string | null>` に変更。null=トライアル、文字列=有料プラン
- `web/app/(app)/dashboard/page.tsx`: `planType === null && trial` で TrialBanner、それ以外で PlanStatusBar の分岐表示。`PLAN_LIMITS` から `free` 削除
- `web/app/(app)/settings/plan/page.tsx`: `planType === null` 分岐で「無料体験」表示 + 残数バー追加。`PLAN_FEATURES` `PLAN_ORDER` から `free` 削除
- ビルド ✅ 全ルート通過

**未着手**:
- (E) `<TrialEndedModal>` (一旦バナーの ended 状態で代用、後で必要なら client modal 追加)
- 動作確認（次セッション or 仮さんで実機テスト時）: 新規サインアップ → トライアル → 10回消費 → 終了表示
- コミット & プッシュ → 本番デプロイ（次回ユーザーOK後）

---

## 2026-05-21

### Stripe 決済テスト動作確認 → `users.plan_type` → `companies.plan` 読み元統一

**前日の状況**:
- Stripe Checkout 経由で `team_unlimited` 購入完了、Webhook 4イベント 200 OK
- `companies.plan = team_unlimited` / `companies.stripe_customer_id = cus_UYHY0aD2MIgXCm` も DB に反映済み
- ただし UI は `users.plan_type` を読んでいて `developer 無制限` のままで反映されず

**今回の変更**:
- 新規 `web/lib/get-plan.ts` 追加（React `cache()` で会社プラン解決を request-scoped にメモ化）
  - `getUserPlan(userId)` が `company_member → companies(plan)` を join、未所属なら `"free"` を返す
- 以下6ファイルの読み元を `users.plan_type` → `getUserPlan(user.id)` に統一:
  - `web/app/(app)/settings/plan/page.tsx`
  - `web/app/(app)/dashboard/page.tsx`（リファクタで不要になった `isTeam` / `IndividualDashboard` / `Package` / `FileText` / `Settings` import を削除）
  - `web/app/(app)/unit-prices/page.tsx`
  - `web/app/(app)/groups/new/page.tsx`
  - `web/app/(app)/groups/page.tsx`
  - `web/app/api/analyze-drawing/route.ts`
- ボタン文言を「このプランに変更」→「プラン変更」に短縮（`upgrade-button.tsx`）

**検証**:
- `npx next build` ✅ 5.2秒コンパイル成功、TypeScript 4.7秒成功、ESLint エラー/警告 0

**残タスク**:
- ⏳ `users.is_unlimited` を一時 false にしてダッシュボード/プラン画面で `team (無制限)` 表示と使用量バー表示を実機確認
- ⏳ Webhook で `companies.stripe_subscription_id` も保存（要マイグレーション: カラム未存在）
- ⏳ 本番URLで残り3プラン（individual / team_5 / team_10）の購入動作確認

### `getUserPlan` 複数会社所属バグ修正

**症状**:
- `aoki1031movie@gmail.com`（カリさん、テスト用）は `company_member` に5行所属（テストで重複作成）
- 上で実装した `getUserPlan` は `.maybeSingle()` を使っていたため、複数行で error → `null` → `"free"` 返却
- カリさんの実プラン（最新: `team_unlimited`）が UI で「フリー」表示される乖離が発生

**修正**:
- `web/lib/get-plan.ts` を `.order("created_at", { ascending: false }).limit(1)` 方式に変更
- 複数所属時は最新加入の会社プランを採用
- `npx next build` ✅ 成功

**メモ — 使用量バーが消える件**:
- `settings/plan/page.tsx:107` と `plan-status-bar.tsx:65` が `{!isUnlimited && ...}` で使用量バーを隠す設計
- `ahoyu1031@gmail.com` は `users.is_unlimited = true`（developer）のため意図通り非表示
- テスト時は一時的に false に落とすか、UI 側で developer でも使用量を見せるか要判断

---

## 2026-05-22

### P0 タスク方針確定（実装着手前の言語化フェーズ）

**背景**:
- カリさん（aoki1031movie@gmail.com）が `company_member` に5行重複所属していて UI が「フリー」表示になる問題発覚
- これは MVP 商品化に向けて根幹的バグ（複数会社所属 = 課金カウントズレ・チーム枠圧迫）

**ユーザー判断（実装着手前の合意事項）**:
- P0-① **1ユーザー1会社制約** + 重複クリーンアップ → **最優先で着手**
- P0-② **アカウント完全削除機能**（個人情報保護法・GDPR 対応） → P0-① 完了後に着手
- 重複整理の優先順位: **最新の会社所属を残す**（カリさんなら `cus_UYcp1IlbR7m5NU` / team_unlimited）
- P1（開発環境のみのデータリセットボタン）は MVP に含めない

**進め方**:
1. `company_member` のスキーマ確認 SQL をユーザー実行 → 「最新」判定キー特定
2. 重複ユーザー一覧 SQL で影響範囲確定
3. クリーンアップ migration SQL 作成 → Supabase Dashboard で実行（バックアップ後）
4. `ALTER TABLE company_member ADD CONSTRAINT ... UNIQUE (user_id);`
5. `getUserPlan` を `.maybeSingle()` に戻して簡素化
6. グループ参加・チーム招待で「既に他会社所属」エラー処理追加
7. 「会社を変える」UI（`/settings/company` に追加）
8. ビルド・コミット・プッシュ

**P0-② 設計**:
- `/settings` 内に「危険ゾーン」セクション
- 削除確認モーダル（メール再入力で本人確認）
- 削除対象: users, company_member, drawings（Storage含む）, quotes, unit_price_master, feedback, groups, Stripe Customer
- チーム会社 owner で他にメンバー居る場合は削除不可（先に owner 譲渡）
- API: `DELETE /api/account` → Stripe 先処理 → DB 削除 → Supabase Auth ユーザー削除

### Claude Code ステータスバー消失問題 修正

**原因**:
- `claude-statusbar` の `core.py:519` で `LAST_STDIN_FALLBACK_MAX_AGE_S = 600`（10分）
- Claude が長時間応答中や `--continue` 直後で `last_stdin.json` が10分超古いとキャッシュ復元諦めて "unknown" 表示

**対処**:
- `core.py` の定数を `3600`（1時間）に書き換え
- 注意: `pip install -U claude-statusbar` で消える → 必要なら再パッチ

---

## 2026-05-20

### Stripe 決済機能 実装完了 → Vercel 本番デプロイ準備中

**実装したファイル**（Untracked、未コミット）:
- `web/lib/stripe.ts` — Stripe SDK 初期化（apiVersion: `2026-04-22.dahlia`）
- `web/lib/plan.ts` — `PAID_PLANS`, `getStripePriceId()`, `getPlanFromStripePriceId()` 追加
- `web/app/api/billing/checkout/route.ts` — Stripe Checkout 起動
- `web/app/api/billing/portal/route.ts` — Stripe Billing Portal 起動
- `web/app/api/billing/webhook/route.ts` — Webhook 受信 → `companies.plan` 更新
- `web/app/(app)/settings/plan/upgrade-button.tsx` — プラン変更ボタン Client
- `web/app/(app)/settings/plan/manage-button.tsx` — Portal ボタン Client
- `web/app/(app)/settings/plan/plan-result-toast.tsx` — 成功/失敗 Toast
- `web/app/(app)/settings/plan/page.tsx` — mailto: → Stripe 接続

**ユーザーが用意した情報**:
- Price ID 4種類（`.env.local` 記入済み）:
  - `STRIPE_PRICE_INDIVIDUAL=price_1TY4eCC9LDi3qklHcNIySePE`
  - `STRIPE_PRICE_TEAM_5=price_1TY5xVC9LDi3qklHBjKm94Ss`
  - `STRIPE_PRICE_TEAM_10=price_1TY5y4C9LDi3qklH4oQHLxAO`
  - `STRIPE_PRICE_TEAM_UNLIMITED=price_1TY5zjC9LDi3qklHnmYz3PIp`
- Stripe Secret Key（テストモード）`.env.local` 記入済み
- Stripe CLI で取得した whsec も `.env.local` 記入済み

**検証**:
- `npx tsc --noEmit` ✅ エラー0
- `npx eslint` ✅ エラー0
- `npx next build` ✅ 成功

**Supabase 現状調査結果**（重要発見）:
- `users.plan_type` CHECK: `('beta','individual','team_5','team_10','team_unlimited')`
- `companies.plan` CHECK: `('individual','team_5','team_10','team_unlimited')`（beta なし）
- 実データ: users → beta×4, individual×1 / companies → team_unlimited×25
- **UI は users.plan_type を読んでいる**ため、Stripe Webhook で companies.plan を更新しても画面に反映されない

**次回タスク**（優先順）:
1. ✅ Vercel 環境変数に Stripe キー6個を登録（2026-05-20 完了。全6個「敏感」・「制作とプレビュー」）
2. ✅ コミット & プッシュ（commit c175d35、Vercel 自動デプロイ済み）
3. ✅ Stripe Dashboard で本番URL Webhook エンドポイント登録完了
   - URL: `https://toru-app.vercel.app/api/billing/webhook`
   - イベント4種: `checkout.session.completed` / `customer.subscription.created` / `.updated` / `.deleted`
   - APIバージョン: `2026-04-22.dahlia`（コード側と一致）
   - 本番用 whsec: `whsec_NrdQuyOlUtmMuOo3uOdAITimEt0TYgYt`
4. 🔄 Vercel の `STRIPE_WEBHOOK_SECRET` を本番 whsec に上書き → 再展開
5. ⏳ 本番URLで決済テスト（4242 4242 4242 4242）
6. ⏳ `users.plan_type` → `companies.plan` の読み元統一（8ファイル要リファクタ）

**メモ**:
- ローカル開発用 `web/.env.local` の `STRIPE_WEBHOOK_SECRET` は CLI 用 `whsec_afaf81f1...` をそのまま残す
- Vercel側だけ本番用 `whsec_NrdQuy...` に置き換えることで、本番URL/ローカルを使い分け

**注意**: Vercel の `STRIPE_WEBHOOK_SECRET` には今 Stripe CLI ローカル用の値が入っているため、本番Webhook登録後の `whsec_` で必ず上書きすること。上書き前に「再展開」を押すと決済時にWebhookが署名エラーで弾かれる。

**フィードバック保存済み**:
- 作業ログは `LOG.md` (Git管理) に統一、メモリの worklog_xxx は今後作らない
- TORU は既に Vercel デプロイ済み。新機能テストは本番URLで

---

## 過去ログ（メモリから抜粋）

詳細はメモリ `worklog_20260517.md` `worklog_20260515.md` `worklog_20260510.md` 等を参照。

- **2026-05-17** ベータ廃止・新料金体系・プランゲート実装
- **2026-05-15** フィードバック導線改善・loading.tsx 大量追加・`getCurrentUser/ensureCompany` キャッシュ統一
- **2026-05-10** Vercel デプロイ完了
- **2026-05-04** グループチャットファイル共有完成・ダウンロード fix
- **2026-04-26** 図面解析修正・Slack風UI・actions再作成・seed data・ビルド成功
