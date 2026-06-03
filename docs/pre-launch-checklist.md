# 本番公開（Live切替）前チェックリスト

ベータ → 正式公開 に切り替えるときに「まとめてやる」項目。気づいたら随時追記する。
※ MVP/ベータ期間中は意図的に後回しにしている（[[project_toru_mvp_priority]] の方針）。

最終更新: 2026-06-03

---

## 1. 決済を有効化（最重要・1フラグ＋Stripe Live化）

- [ ] `NEXT_PUBLIC_BILLING_MODE` を `test` → `live`（Vercel環境変数）→ 再デプロイ
      - これだけでプラン変更ボタン（→Stripe Checkout）が全部解放される（裏のシステムは実装済み・維持してある）
- [ ] Stripe を test → live キーに（`sk_live_*` / `pk_live_*`）
- [ ] Webhook を **Live** エンドポイントで登録し直し、`STRIPE_WEBHOOK_SECRET` を Live の `whsec_` に
- [ ] Stripe Customer Portal 設定を **Live** で実施
- [ ] Price ID 4種を Live のものに差し替え（`STRIPE_PRICE_*`）
- [ ] 4242テストカードではなく実カードで1プラン購入→Webhook→`companies.plan`更新 を本番確認

## 2. コピー・文言の見直し（過剰表現の調整）

- [ ] 認証画面の信頼バッジ「クレジットカード不要 / 登録は約1分で完了 / ベータ期間中は無料」を見直し（過剰）
      - ⚠️ 既知バグ: `components/auth-shell.tsx` の3バッジが **signup と login の共通パネル**に出ている。
        → **ログイン画面にも「登録は約1分で完了」が出てちぐはぐ**。login と signup でバッジを出し分ける or login では非表示に。
- [ ] 「ベータ期間中は無料」系の表記を全面撤去・更新（LP / 認証 / プラン画面 / バナー）
- [ ] プラン画面フッター・トライアルバナーの「ベータ」文言を正式版に
- [ ] LP（`/`）を本番版に：料金プランをきちんと載せた版に更新（今はアルファ版デザイン）

## 3. プラン / 課金まわりのロジック確認

- [ ] 無料トライアル（10回/7日）の条件を正式運用の値に（必要なら見直し）
- [ ] アルファテスター枠：Live切替後の「永久半額特典（先着10名）」を実装 or 整理（未実装）
- [ ] トライアル終了バナーの導線（現状: Googleフォーム）を、Live後は「プラン選択」へ切替（`trial-banner.tsx` の `IS_LIVE_BILLING` 分岐で対応済み・要確認）

## 4. テスト/開発アカウントの整理

- [ ] developer（青木優 / ahoyu1031）・カリさん（aoki1031movie）等のテストアカウントを本番データから除外 or リセット
- [ ] カリさんに残っている team_unlimited のテスト課金データ（前のStripeテスト購入）をクリーンアップ
- [ ] `is_unlimited` / `is_alpha_tester` の付与状況を棚卸し

## 5. コンテンツ・発信物

- [ ] 紹介動画を Blueprint 配色で撮り直し（任意。現行は旧配色 / 固定ツイ用に60fps版は作成済み）
- [ ] 固定ツイ・bio を正式版に（`docs/x-strategy-drafts.md`）

---

## 関連
- 決済モード切替の詳細 → `web/lib/billing-mode.ts`
- アルファ承認 → `docs/alpha-tester-runbook.md`
- トライアル動作確認 → `docs/trial-test-runbook.md`
