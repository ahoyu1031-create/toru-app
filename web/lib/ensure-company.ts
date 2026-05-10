import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * 現在のユーザーに会社が紐付いていなければ、個人用会社を自動作成する。
 * - サインアップ直後の初回アクセス時に、透過的にセットアップ完了させるのが目的
 * - 会社名は display_name or email のローカル部分を流用
 * - 後から /settings で変更可能
 *
 * company/company_member の INSERT は RLS をバイパスするために
 * service_role クライアントを使用する（鶏と卵問題の回避）。
 */
export async function ensureCompany(): Promise<{ companyId: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

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
      plan: "team_unlimited",
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
    console.error("ensureCompany: failed to create membership", memberError);
    return null;
  }

  return { companyId: company.id };
}
