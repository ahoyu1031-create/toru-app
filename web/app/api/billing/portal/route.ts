import { NextResponse } from "next/server";
import { createAdminClient, getCurrentUser } from "@/lib/supabase/server";
import { requireStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("company_member")
    .select("companies(stripe_customer_id)")
    .eq("user_id", user.id)
    .maybeSingle();

  const company = Array.isArray(membership?.companies) ? membership?.companies[0] : membership?.companies;
  const customerId = company?.stripe_customer_id;

  if (!customerId) {
    return NextResponse.json({ error: "Stripe顧客が見つかりません" }, { status: 404 });
  }

  const stripe = requireStripe();
  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/settings/plan`,
  });

  return NextResponse.json({ url: session.url });
}
