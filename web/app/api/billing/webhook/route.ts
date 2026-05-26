import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { requireStripe } from "@/lib/stripe";
import { getPlanFromStripePriceId } from "@/lib/plan";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "署名 or whsec が未設定" }, { status: 400 });
  }

  const stripe = requireStripe();
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    return NextResponse.json({ error: `署名検証失敗: ${(err as Error).message}` }, { status: 400 });
  }

  const admin = createAdminClient();

  type CompanyUpdate = {
    plan?: string | null;
    stripe_customer_id?: string;
    stripe_subscription_id?: string | null;
  };

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const companyId = session.metadata?.company_id;
        const plan = session.metadata?.plan;
        if (companyId && plan) {
          const updates: CompanyUpdate = { plan };
          if (typeof session.customer === "string") updates.stripe_customer_id = session.customer;
          if (typeof session.subscription === "string") updates.stripe_subscription_id = session.subscription;
          await admin.from("companies").update(updates).eq("id", companyId);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const companyId = sub.metadata?.company_id;
        const priceId = sub.items.data[0]?.price.id;
        const plan = priceId ? getPlanFromStripePriceId(priceId) : null;
        if (companyId && plan) {
          const updates: CompanyUpdate = { plan, stripe_subscription_id: sub.id };
          if (typeof sub.customer === "string") updates.stripe_customer_id = sub.customer;
          await admin.from("companies").update(updates).eq("id", companyId);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const companyId = sub.metadata?.company_id;
        if (companyId) {
          // 解約 → plan を NULL に。subscription_id もクリア（customer_id は将来の再契約のため残す）
          await admin.from("companies").update({
            plan: null,
            stripe_subscription_id: null,
          }).eq("id", companyId);
        }
        break;
      }
      default:
        // 未処理イベントは無視
        break;
    }
  } catch (err) {
    console.error("[stripe webhook]", event.type, err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
