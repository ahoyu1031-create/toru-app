import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * ユーザーの所属会社の課金/トライアル情報を取得。
 * UNIQUE(user_id) 制約があるので所属は 0 or 1 行。
 * React cache でリクエスト内重複排除。
 */
export type CompanyTrialInfo = {
  companyId: string;
  plan: string | null;
  trial_started_at: string | null;
  trial_drawings_used: number | null;
  trial_ended_reason: string | null;
};

export const getCompanyTrial = cache(
  async (userId: string): Promise<CompanyTrialInfo | null> => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("company_member")
      .select(
        "company_id, companies(plan, trial_started_at, trial_drawings_used, trial_ended_reason)"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (!data) return null;
    const c = Array.isArray(data.companies) ? data.companies[0] : data.companies;
    if (!c) return null;

    return {
      companyId: data.company_id,
      plan: c.plan ?? null,
      trial_started_at: c.trial_started_at ?? null,
      trial_drawings_used: c.trial_drawings_used ?? null,
      trial_ended_reason: c.trial_ended_reason ?? null,
    };
  }
);
