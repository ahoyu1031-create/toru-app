/**
 * Customer の詳細（balance / active subs / recent invoices）を表示
 * Usage: node scripts/stripe/inspect-customer.mjs <customer_id>
 */
import { stripe } from "./client.mjs";

const customerId = process.argv[2];
if (!customerId) { console.error("Usage: node scripts/stripe/inspect-customer.mjs <customer_id>"); process.exit(1); }

const customer = await stripe.customers.retrieve(customerId);
console.log("=== Customer ===");
console.log(`  id:       ${customer.id}`);
console.log(`  email:    ${customer.email}`);
console.log(`  balance:  ${customer.balance}  (negative = credit owed to customer)`);
console.log(`  currency: ${customer.currency}`);

console.log("\n=== Active Subscriptions ===");
const subs = await stripe.subscriptions.list({ customer: customerId, status: "active", limit: 100 });
for (const s of subs.data) {
  console.log(`\nSubscription: ${s.id}`);
  console.log(`  status:  ${s.status}`);
  console.log(`  created: ${new Date(s.created * 1000).toISOString()}`);
  for (const item of s.items.data) {
    const periodStart = item.current_period_start ? new Date(item.current_period_start * 1000).toISOString() : "-";
    const periodEnd = item.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : "-";
    console.log(`  item ${item.id}:`);
    console.log(`    price:    ${item.price.id} = ${item.price.unit_amount} ${item.price.currency}`);
    console.log(`    product:  ${item.price.product}`);
    console.log(`    nickname: ${item.price.nickname ?? "-"}`);
    console.log(`    period:   ${periodStart} → ${periodEnd}`);
  }
}

console.log("\n=== Recent Invoices (last 10) ===");
const invoices = await stripe.invoices.list({ customer: customerId, limit: 10 });
for (const inv of invoices.data) {
  console.log(`\nInvoice: ${inv.id}`);
  console.log(`  created:  ${new Date(inv.created * 1000).toISOString()}`);
  console.log(`  status:   ${inv.status}`);
  console.log(`  total:    ${inv.total} (paid=${inv.amount_paid}, remaining=${inv.amount_remaining})`);
  if (inv.lines?.data?.length) {
    console.log(`  lines:`);
    for (const line of inv.lines.data) {
      const amt = line.amount;
      const desc = line.description ?? "-";
      const priceId = line.price?.id ?? "-";
      console.log(`    - ${amt} | price=${priceId} | ${desc}`);
    }
  }
}

console.log("\n=== Upcoming Invoice (next bill) ===");
try {
  const upcoming = await stripe.invoices.retrieveUpcoming({ customer: customerId });
  console.log(`  total: ${upcoming.total}`);
  console.log(`  next_payment_attempt: ${upcoming.next_payment_attempt ? new Date(upcoming.next_payment_attempt * 1000).toISOString() : "-"}`);
  if (upcoming.lines?.data?.length) {
    for (const line of upcoming.lines.data) {
      console.log(`    - ${line.amount} | ${line.description ?? "-"}`);
    }
  }
} catch (e) {
  console.log(`  (none or error: ${e.message})`);
}
