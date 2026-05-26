/**
 * companies テーブルのスキーマ確認（stripe_customer_id / stripe_subscription_id の有無）
 */
import { admin } from "./client.mjs";

// 1行取得してキー一覧を見る
const { data, error } = await admin.from("companies").select("*").limit(1);
if (error) { console.error("ERR:", error); process.exit(1); }

if (!data || data.length === 0) {
  console.log("⚠️  No rows. Run a SELECT against information_schema instead.");
  process.exit(0);
}

console.log("Columns on companies:");
Object.keys(data[0]).sort().forEach((k) => {
  const v = data[0][k];
  const t = v === null ? "null" : typeof v;
  console.log(`  - ${k} (${t})`);
});

console.log("\nStripe-related columns:");
const stripeKeys = Object.keys(data[0]).filter((k) => k.toLowerCase().includes("stripe"));
if (stripeKeys.length === 0) console.log("  ❌ NONE — need to add stripe_customer_id / stripe_subscription_id");
else stripeKeys.forEach((k) => console.log(`  ✅ ${k}`));
