/**
 * 指定ユーザーの is_alpha_tester を切り替える
 * Usage:
 *   node scripts/db/toggle-alpha.mjs <email> on
 *   node scripts/db/toggle-alpha.mjs <email> off
 */
import { admin } from "./client.mjs";

const email = process.argv[2];
const mode = process.argv[3];
if (!email || !["on", "off"].includes(mode)) {
  console.error("Usage: node scripts/db/toggle-alpha.mjs <email> <on|off>");
  process.exit(1);
}

const newValue = mode === "on";

const { data, error } = await admin
  .from("users")
  .update({ is_alpha_tester: newValue })
  .eq("email", email)
  .select("email, is_unlimited, is_alpha_tester")
  .single();

if (error) { console.error(error); process.exit(1); }

console.log(`✅ ${email} → is_alpha_tester=${data.is_alpha_tester}`);
console.log(`   (is_unlimited=${data.is_unlimited} は変更なし)`);
