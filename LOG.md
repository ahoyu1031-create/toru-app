# TORU 作業ログ

セッション毎の実行記録。新しい作業は **上に追記**（最新が一番上）。

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

**メモ — 使用量バーが消える件**:
- `settings/plan/page.tsx:107` と `plan-status-bar.tsx:65` が `{!isUnlimited && ...}` で使用量バーを隠す設計
- `ahoyu1031@gmail.com` は `users.is_unlimited = true`（developer）のため意図通り非表示
- テスト時は一時的に false に落とすか、UI 側で developer でも使用量を見せるか要判断

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
