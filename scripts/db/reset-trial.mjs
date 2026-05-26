/**
 * 指定ユーザーの会社をトライアル状態に戻す（決済テスト用）
 * - companies.plan = null
 * - trial_started_at = 今
 * - trial_drawings_used = 0
 * - stripe_subscription_id = null
 * - stripe_customer_id は残す（Stripe Customer は使い回し可能）
 *
 * Usage: node scripts/db/reset-trial.mjs <email>
 */
import { admin } from "./client.mjs";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/db/reset-trial.mjs <email>");
  process.exit(1);
}

const { data: user, error: uErr } = await admin
  .from("users").select("id").eq("email", email).maybeSingle();
if (uErr || !user) { console.error("User not found"); process.exit(1); }

const { data: membership } = await admin
  .from("company_member").select("company_id, companies(name)").eq("user_id", user.id).maybeSingle();
if (!membership) { console.error("No company membership"); process.exit(1); }

const co = Array.isArray(membership.companies) ? membership.companies[0] : membership.companies;

const { data, error } = await admin
  .from("companies")
  .update({
    plan: null,
    trial_started_at: new Date().toISOString(),
    trial_drawings_used: 0,
    trial_ended_reason: null,
    stripe_subscription_id: null,
  })
  .eq("id", membership.company_id)
  .select("name, plan, trial_started_at, trial_drawings_used, stripe_customer_id, stripe_subscription_id")
  .single();

if (error) { console.error(error); process.exit(1); }

console.log(`✅ Reset trial for ${email} (${co?.name})`);
console.log(`   plan:                   ${data.plan ?? "(null = trial)"}`);
console.log(`   trial_started_at:       ${data.trial_started_at}`);
console.log(`   trial_drawings_used:    ${data.trial_drawings_used}`);
console.log(`   stripe_customer_id:     ${data.stripe_customer_id ?? "(null)"}`);
console.log(`   stripe_subscription_id: ${data.stripe_subscription_id ?? "(null)"}`);
