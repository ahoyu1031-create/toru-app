-- companies テーブルに stripe_subscription_id カラム追加
-- Why: Webhook 受信時に subscription ID を保存して、後から解約/Portal 操作で
--      毎回 Stripe API を叩かずに DB から引けるようにする（運用効率化）
-- stripe_customer_id は既に存在、subscription_id だけ未追加だった

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- インデックスは Webhook → companies 検索用には不要（companies.id で検索するので）
-- 逆方向検索（subscription_id → company）が必要になったら以下を追加:
-- CREATE INDEX IF NOT EXISTS idx_companies_stripe_subscription_id
--   ON companies (stripe_subscription_id)
--   WHERE stripe_subscription_id IS NOT NULL;
