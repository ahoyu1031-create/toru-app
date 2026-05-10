"use server";

import { createClient } from "@/lib/supabase/server";
import { ensureCompany } from "@/lib/ensure-company";
import { redirect } from "next/navigation";

export async function completeOnboarding(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const companyName  = (formData.get("company_name") as string)?.trim();
  const displayName  = (formData.get("display_name") as string)?.trim();
  const tel          = (formData.get("tel") as string)?.trim() || null;
  const contactName  = (formData.get("contact_name") as string)?.trim() || null;

  if (!companyName) return; // ブラウザ側の required で通常はブロック済み

  // 会社行を作成 or 取得
  const result = await ensureCompany();
  if (!result?.companyId) return;

  // 会社情報を更新
  await supabase
    .from("companies")
    .update({ name: companyName, tel, contact_name: contactName })
    .eq("id", result.companyId);

  // 表示名を更新
  if (displayName) {
    await supabase
      .from("users")
      .update({ display_name: displayName })
      .eq("id", user.id);
  }

  redirect("/drawings/new?onboarding=1");
}
