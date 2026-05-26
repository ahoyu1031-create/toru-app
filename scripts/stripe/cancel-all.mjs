/**
 * 指定 customer の全 active subscription / schedule をキャンセル&リリース
 * Usage: node scripts/stripe/cancel-all.mjs <customer_id>
 */
import { stripe } from "./client.mjs";

const customerId = process.argv[2];
if (!customerId) {
  console.error("Usage: node scripts/stripe/cancel-all.mjs <customer_id>");
  process.exit(1);
}

let count = 0;

// 1. Schedules を release（先にやらないと subscription cancel と競合することがある）
const schedules = await stripe.subscriptionSchedules.list({ customer: customerId, limit: 100 });
for (const sch of schedules.data) {
  if (sch.status === "active" || sch.status === "not_started") {
    try {
      await stripe.subscriptionSchedules.release(sch.id);
      console.log(`✅ Released schedule: ${sch.id}`);
      count++;
    } catch (e) {
      console.log(`⚠️  Skip schedule ${sch.id}: ${e.message}`);
    }
  }
}

// 2. Active subscriptions を cancel（即時）
const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
for (const s of subs.data) {
  if (s.status === "active" || s.status === "trialing" || s.status === "past_due" || s.status === "unpaid") {
    await stripe.subscriptions.cancel(s.id);
    console.log(`✅ Canceled subscription: ${s.id} (was ${s.status})`);
    count++;
  }
}

console.log(`\nDone. ${count} item(s) cancelled/released.`);
