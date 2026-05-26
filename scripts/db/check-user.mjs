/**
 * 指定ユーザーの現状確認（決済テスト前後で使う）
 * Usage: node scripts/db/check-user.mjs <email>
 */
import { admin } from "./client.mjs";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/db/check-user.mjs <email>");
  process.exit(1);
}

const { data: user, error: uErr } = await admin
  .from("users")
  .select("id, email, is_unlimited, is_alpha_tester, bonus_analyses")
  .eq("email", email)
  .maybeSingle();
if (uErr) { console.error(uErr); process.exit(1); }
if (!user) { console.error(`User not found: ${email}`); process.exit(1); }

const { data: membership } = await admin
  .from("company_member")
  .select("role, companies(id, name, plan, trial_drawings_used, trial_started_at, trial_ended_reason, stripe_customer_id, stripe_subscription_id)")
  .eq("user_id", user.id)
  .maybeSingle();

const co = membership && (Array.isArray(membership.companies) ? membership.companies[0] : membership.companies);

console.log(`\n=== User: ${email} ===`);
console.log(`  id:               ${user.id}`);
console.log(`  is_unlimited:     ${user.is_unlimited}`);
console.log(`  is_alpha_tester:  ${user.is_alpha_tester}`);
console.log(`  bonus_analyses:   ${user.bonus_analyses ?? 0}`);

if (co) {
  console.log(`\n=== Company ===`);
  console.log(`  id:                       ${co.id}`);
  console.log(`  name:                     ${co.name}`);
  console.log(`  plan:                     ${co.plan ?? "(null = trial)"}`);
  console.log(`  role:                     ${membership.role}`);
  console.log(`  trial_drawings_used:      ${co.trial_drawings_used}`);
  console.log(`  trial_started_at:         ${co.trial_started_at}`);
  console.log(`  trial_ended_reason:       ${co.trial_ended_reason ?? "(null)"}`);
  console.log(`  stripe_customer_id:       ${co.stripe_customer_id ?? "(null)"}`);
  console.log(`  stripe_subscription_id:   ${co.stripe_subscription_id ?? "(null)"}`);
} else {
  console.log(`\n⚠️  No company membership`);
}
