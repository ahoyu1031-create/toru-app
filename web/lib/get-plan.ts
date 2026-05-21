import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * 課金は会社単位（Stripe Webhook が companies.plan を更新する）なので、
 * UI/ロジックの料金プラン判定は users.plan_type ではなく companies.plan を見る。
 * users.plan_type は今後 deprecated 扱いで、移行完了後に列ごと削除する想定。
 */
export const getUserPlan = cache(async (userId: string): Promise<string> => {
  const admin = createAdminClient();
  const { data } = await admin
    .from("company_member")
    .select("companies(plan)")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return "free";
  const companies = Array.isArray(data.companies) ? data.companies[0] : data.companies;
  return companies?.plan ?? "free";
});
