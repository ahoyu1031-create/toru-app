/**
 * 指定 customer の全 subscription を一覧表示
 * Usage: node scripts/stripe/list-subs.mjs <customer_id>
 */
import { stripe } from "./client.mjs";

const customerId = process.argv[2];
if (!customerId) {
  console.error("Usage: node scripts/stripe/list-subs.mjs <customer_id>");
  process.exit(1);
}

const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });

console.log(`\n=== Customer ${customerId} subscriptions (${subs.data.length}) ===\n`);
if (subs.data.length === 0) { console.log("(none)"); process.exit(0); }

for (const s of subs.data) {
  const item = s.items.data[0];
  console.log(`Subscription: ${s.id}`);
  console.log(`  status:        ${s.status}`);
  console.log(`  price_id:      ${item?.price.id}`);
  console.log(`  price_nickname:${item?.price.nickname ?? "-"}`);
  console.log(`  amount:        ${item?.price.unit_amount} ${item?.price.currency}`);
  console.log(`  schedule:      ${typeof s.schedule === "string" ? s.schedule : s.schedule?.id ?? "(none)"}`);
  console.log(`  cancel_at_period_end: ${s.cancel_at_period_end}`);
  console.log("");
}

// Schedule もリスト表示
const schedules = await stripe.subscriptionSchedules.list({ customer: customerId, limit: 100 });
if (schedules.data.length > 0) {
  console.log(`=== Subscription Schedules (${schedules.data.length}) ===\n`);
  for (const sch of schedules.data) {
    console.log(`Schedule: ${sch.id}`);
    console.log(`  status:        ${sch.status}`);
    console.log(`  subscription:  ${sch.subscription}`);
    console.log(`  phases:        ${sch.phases.length}`);
    sch.phases.forEach((p, i) => {
      const item = p.items[0];
      console.log(`    phase[${i}]:  ${item?.price} (start=${p.start_date}, end=${p.end_date ?? "-"})`);
    });
    console.log("");
  }
}
