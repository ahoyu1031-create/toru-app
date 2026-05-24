import { NextResponse } from "next/server";
import { createAdminClient, getCurrentUser } from "@/lib/supabase/server";
import { requireStripe } from "@/lib/stripe";
import { getStripePriceId, PAID_PLANS, type PaidPlan, getPlanFromStripePriceId, classifyPlanChange } from "@/lib/plan";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const { plan } = (await req.json().catch(() => ({}))) as { plan?: string };
  if (!plan || !(PAID_PLANS as readonly string[]).includes(plan)) {
    return NextResponse.json({ error: "プランが不正です" }, { status: 400 });
  }

  const priceId = getStripePriceId(plan as PaidPlan);
  if (!priceId) {
    return NextResponse.json({ error: `Price ID未設定: ${plan}` }, { status: 500 });
  }

  const stripe = requireStripe();
  const admin = createAdminClient();

  // ユーザーの所属 company を取得（なければ作成 — individual プラン用に1人会社）
  const { data: membership } = await admin
    .from("company_member")
    .select("company_id, companies(id, name, stripe_customer_id)")
    .eq("user_id", user.id)
    .maybeSingle();

  let companyId: string;
  let stripeCustomerId: string | null = null;

  if (membership?.company_id) {
    companyId = membership.company_id;
    const company = Array.isArray(membership.companies) ? membership.companies[0] : membership.companies;
    stripeCustomerId = company?.stripe_customer_id ?? null;
  } else {
    // 個人プラン用に1人会社を作成
    const { data: profile } = await admin
      .from("users").select("display_name").eq("id", user.id).maybeSingle();
    const companyName = profile?.display_name ? `${profile.display_name}（個人）` : "個人";
    const { data: newCompany, error: cErr } = await admin
      .from("companies")
      .insert({ name: companyName, plan: plan as PaidPlan, created_by: user.id })
      .select("id")
      .single();
    if (cErr || !newCompany) {
      return NextResponse.json({ error: `会社作成失敗: ${cErr?.message ?? "unknown"}` }, { status: 500 });
    }
    companyId = newCompany.id;
    const { error: mErr } = await admin.from("company_member").insert({
      company_id: companyId, user_id: user.id, role: "owner",
    });
    if (mErr) {
      // 並列リクエストで他会社に紐付いた → 作成した孤児会社を削除し既存所属を採用
      await admin.from("companies").delete().eq("id", companyId);
      if (mErr.code === "23505") {
        const { data: existing } = await admin
          .from("company_member")
          .select("company_id, companies(stripe_customer_id)")
          .eq("user_id", user.id)
          .maybeSingle();
        if (existing) {
          companyId = existing.company_id;
          const co = Array.isArray(existing.companies) ? existing.companies[0] : existing.companies;
          stripeCustomerId = co?.stripe_customer_id ?? null;
        } else {
          return NextResponse.json({ error: "会社情報の整合性エラー。再ログインしてください" }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: `会社所属の作成に失敗: ${mErr.message}` }, { status: 500 });
      }
    }
  }

  // Stripe Customer がまだなら作成
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { company_id: companyId, user_id: user.id },
    });
    stripeCustomerId = customer.id;
    await admin.from("companies").update({ stripe_customer_id: stripeCustomerId }).eq("id", companyId);
  }

  const origin = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  // 既存アクティブサブスクリプションを確認（多重契約防止）
  const existingSubs = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "active",
    limit: 100,
  });

  // ケースA: 既に1つアクティブ → アップグレード or ダウングレード で動作分岐
  if (existingSubs.data.length === 1) {
    const sub = existingSubs.data[0];
    const item = sub.items.data[0];

    // 既に同じ price なら 400 で防御（UI 側でもボタンは disabled だが念のため）
    if (item.price.id === priceId) {
      return NextResponse.json(
        { error: "既に同じプランをご利用中です" },
        { status: 400 }
      );
    }

    const currentPlanFromStripe = getPlanFromStripePriceId(item.price.id);
    const direction = classifyPlanChange(currentPlanFromStripe, plan);

    if (direction === "upgrade") {
      // アップグレード: 即時切替 + 差額を今すぐ請求（権利と義務を一致させる公平な動作）
      await stripe.subscriptions.update(sub.id, {
        items: [{ id: item.id, price: priceId }],
        proration_behavior: "always_invoice",
        metadata: { company_id: companyId, plan },
      });
      // Webhook customer.subscription.updated が companies.plan を更新
      return NextResponse.json({
        url: `${origin}/settings/plan?success=1&updated=1&direction=upgrade`,
        updated: true,
        direction: "upgrade",
      });
    }

    // ダウングレード: 次回請求日まで現プラン維持 → 期末に新プランへ自動切替
    // Stripe Subscription Schedules で実現（ユーザーは支払った期間まで現プラン権利保持）

    // 既にスケジュール有り（前回ダウングレード予約）なら releaseしてやり直し
    if (sub.schedule) {
      const existingScheduleId = typeof sub.schedule === "string" ? sub.schedule : sub.schedule.id;
      await stripe.subscriptionSchedules.release(existingScheduleId);
    }

    const schedule = await stripe.subscriptionSchedules.create({
      from_subscription: sub.id,
    });

    // Stripe API では current_period_* が item 単位に移行済み
    const itemWithPeriod = item as typeof item & {
      current_period_start: number;
      current_period_end: number;
    };
    const periodStart = itemWithPeriod.current_period_start;
    const periodEnd = itemWithPeriod.current_period_end;

    await stripe.subscriptionSchedules.update(schedule.id, {
      end_behavior: "release",
      phases: [
        {
          // 現在のフェーズ: 期末まで現プラン維持
          items: [{ price: item.price.id, quantity: 1 }],
          start_date: periodStart,
          end_date: periodEnd,
        },
        {
          // 期末以降: 新プラン(ダウングレード後)へ自動切替
          items: [{ price: priceId, quantity: 1 }],
          metadata: { company_id: companyId, plan },
        },
      ],
      metadata: { company_id: companyId, downgrade_to: plan },
    });

    return NextResponse.json({
      url: `${origin}/settings/plan?success=1&scheduled=1&direction=downgrade`,
      scheduled: true,
      direction: "downgrade",
      effective_at: periodEnd,
    });
  }

  // ケースB: 複数アクティブ（過去のバグ状態）→ 全部キャンセルして新規作成
  if (existingSubs.data.length > 1) {
    for (const sub of existingSubs.data) {
      await stripe.subscriptions.cancel(sub.id);
    }
  }

  // ケースC: アクティブなし → 従来通り Checkout で新規作成
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings/plan?success=1`,
    cancel_url: `${origin}/settings/plan?canceled=1`,
    metadata: { company_id: companyId, plan },
    subscription_data: { metadata: { company_id: companyId, plan } },
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
