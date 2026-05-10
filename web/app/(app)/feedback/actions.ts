"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const FEEDBACK_BONUS = 5;
const BONUS_CAP = 5; // クレジット付与は初回1回のみ

type Result = { ok: true } | { ok: false; error: string };

export async function submitFeedback(_prev: Result | null, formData: FormData): Promise<Result> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  const body = (formData.get("body") as string)?.trim();
  if (!body) return { ok: false, error: "内容を入力してください" };

  const rating = formData.get("rating") ? Number(formData.get("rating")) : null;
  const category = (formData.get("category") as string) || null;
  const job_title = (formData.get("job_title") as string)?.trim() || null;
  const company_size = (formData.get("company_size") as string) || null;

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    body,
    rating,
    category,
    job_title,
    company_size,
  });

  if (error) return { ok: false, error: error.message };

  // フィードバック送信ボーナス：+5クレジット（上限20）
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("users")
    .select("bonus_analyses")
    .eq("id", user.id)
    .maybeSingle();
  const current = profile?.bonus_analyses ?? 0;
  if (current < BONUS_CAP) {
    await admin
      .from("users")
      .update({ bonus_analyses: Math.min(current + FEEDBACK_BONUS, BONUS_CAP) })
      .eq("id", user.id);
  }

  revalidatePath("/feedback");
  return { ok: true };
}
