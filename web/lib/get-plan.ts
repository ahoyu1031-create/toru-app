import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * 課金は会社単位（Stripe Webhook が companies.plan を更新する）なので、
 * UI/ロジックの料金プラン判定は users.plan_type ではなく companies.plan を見る。
 * users.plan_type は今後 deprecated 扱いで、移行完了後に列ごと削除する想定。
 *
 * 1 ユーザーが複数会社に所属するケース（テスト用に重複作成された等）があるため、
 * 最新加入の会社を採用する。
 */
export const getUserPlan = cache(async (userId: string): Promise<string> => {
  const admin = createAdminClient();
  const { data } = await admin
    .from("company_member")
    .select("created_at, companies(plan)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (!data || data.length === 0) return "free";
  const row = data[0];
  const companies = Array.isArray(row.companies) ? row.companies[0] : row.companies;
  return companies?.plan ?? "free";
});
