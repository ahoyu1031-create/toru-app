import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * 課金は会社単位（Stripe Webhook が companies.plan を更新する）なので、
 * UI/ロジックの料金プラン判定は users.plan_type ではなく companies.plan を見る。
 * company_member は UNIQUE(user_id) 制約で 1 ユーザー 1 会社が DB レベル保証。
 */
export const getUserPlan = cache(async (userId: string): Promise<string | null> => {
  const admin = createAdminClient();
  const { data } = await admin
    .from("company_member")
    .select("companies(plan)")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  const companies = Array.isArray(data.companies) ? data.companies[0] : data.companies;
  return companies?.plan ?? null;
});
