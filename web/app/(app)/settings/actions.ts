"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  const displayName = (formData.get("display_name") as string)?.trim() || null;

  const { error } = await supabase
    .from("users")
    .update({ display_name: displayName })
    .eq("id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  return { ok: true };
}

export async function updateCompanyInfo(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  const { data: companies } = await supabase
    .from("companies")
    .select("id")
    .limit(1);
  const companyId = companies?.[0]?.id;
  if (!companyId) return { ok: false, error: "会社情報が見つかりません" };

  const name = formData.get("name") as string;
  if (!name?.trim()) return { ok: false, error: "会社名は必須です" };

  const { error } = await supabase
    .from("companies")
    .update({
      name: name.trim(),
      postal_code: (formData.get("postal_code") as string) || null,
      address: (formData.get("address") as string) || null,
      tel: (formData.get("tel") as string) || null,
      fax: (formData.get("fax") as string) || null,
      contact_name: (formData.get("contact_name") as string) || null,
    })
    .eq("id", companyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  revalidatePath("/quotes");
  return { ok: true };
}
