import { cache } from "react";
import { createClient, createAdminClient, getCurrentUser } from "@/lib/supabase/server";

/**
 * 現在のユーザーに会社が紐付いていなければ、個人用会社を自動作成する。
 * - サインアップ直後の初回アクセス時に、透過的にセットアップ完了させるのが目的
 * - 会社名は display_name or email のローカル部分を流用
 * - 後から /settings で変更可能
 *
 * company/company_member の INSERT は RLS をバイパスするために
 * service_role クライアントを使用する（鶏と卵問題の回避）。
 *
 * React cache で1リクエスト内の重複呼び出しを排除。
 */
export const ensureCompany = cache(async (): Promise<{ companyId: string } | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();

  // admin クライアントで確認（RLS の循環依存を回避するため）
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("company_member")
    .select("company_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { companyId: existing.company_id };
  }

  // 会社が未作成 → service_role クライアントで RLS をバイパスして作成

  const { data: profile } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const baseName =
    profile?.display_name?.trim() ||
    user.email?.split("@")[0] ||
    "マイ会社";

  const { data: company, error: companyError } = await admin
    .from("companies")
    .insert({
      name: baseName,
      plan: null, // 未契約 = 無料トライアル中
      trial_started_at: new Date().toISOString(),
      trial_drawings_used: 0,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (companyError || !company) {
    console.error("ensureCompany: failed to create company", companyError);
    return null;
  }

  const { error: memberError } = await admin.from("company_member").insert({
    company_id: company.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberError) {
    // UNIQUE(user_id) 違反 = 並列リクエストで既に別会社が紐付いた
    // 作成した会社は孤児化するので削除し、既存所属を返す
    await admin.from("companies").delete().eq("id", company.id);
    if (memberError.code === "23505") {
      const { data: existingMember } = await admin
        .from("company_member")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (existingMember) return { companyId: existingMember.company_id };
    }
    console.error("ensureCompany: failed to create membership", memberError);
    return null;
  }

  return { companyId: company.id };
});
