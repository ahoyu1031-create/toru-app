# TORU 作業ログ

セッション毎の実行記録。新しい作業は **上に追記**（最新が一番上）。

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
1. ⏳ Vercel 環境変数に Stripe キー6個を登録
2. ⏳ Stripe Dashboard で本番URL の Webhook エンドポイント登録（`whsec_` を Vercel 側に追加）
3. ⏳ 本番URLで決済テスト（4242 4242 4242 4242）
4. ⏳ `users.plan_type` → `companies.plan` の読み元統一（8ファイル要リファクタ）
5. ⏳ コミット & プッシュ

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
