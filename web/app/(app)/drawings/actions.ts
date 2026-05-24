"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type Mode = "all" | "materials" | "construction_notes" | "coordination" | "communication";
export type MaterialItem = { material_name: string; quantity: number; unit: string };
export type Result =
  | { type: "materials"; items: MaterialItem[] }
  | { type: "list"; items: string[] };
export type AllResult = {
  materials: Result | null;
  construction_notes: Result | null;
  coordination: Result | null;
  communication: Result | null;
};

export type AnalysisSummary = {
  id: string;
  file_name: string;
  trade: string;
  created_at: string;
  material_count: number;
};

export async function listAnalysesWithMaterials(): Promise<AnalysisSummary[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("drawing_analyses")
    .select("id, file_name, trade, created_at, all_result, result")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (!data) return [];

  return data
    .map((row: any) => {
      const items: unknown[] =
        row.all_result?.materials?.items ??
        (row.result?.type === "materials" ? row.result.items : null) ??
        [];
      return { id: row.id, file_name: row.file_name, trade: row.trade, created_at: row.created_at, material_count: items.length };
    })
    .filter((r) => r.material_count > 0);
}

export async function getAnalysisMaterials(id: string): Promise<MaterialItem[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("drawing_analyses")
    .select("all_result, result")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!data) return [];

  const items: MaterialItem[] =
    data.all_result?.materials?.items ??
    (data.result?.type === "materials" ? data.result.items : []) ??
    [];
  return items;
}

export async function saveDrawingAnalysis(params: {
  fileName: string;
  trade: string;
  mode: string;
  result?: Result;
  allResult?: AllResult;
}): Promise<{ id: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未ログイン" };

  const { data, error } = await supabase
    .from("drawing_analyses")
    .insert({
      user_id: user.id,
      file_name: params.fileName,
      trade: params.trade,
      mode: params.mode,
      result: params.result ?? null,
      all_result: params.allResult ?? null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[saveDrawingAnalysis] DB error:", error);
    return { error: error.message };
  }

  // トライアル中ユーザーは消費カウンタを +1（race condition 防止のため admin で直接）
  // 有料プラン / is_unlimited はノーオペ。
  try {
    const admin = createAdminClient();
    const { data: membership } = await admin
      .from("company_member")
      .select("company_id, companies(plan, trial_drawings_used)")
      .eq("user_id", user.id)
      .maybeSingle();

    const co = Array.isArray(membership?.companies)
      ? membership?.companies[0]
      : membership?.companies;

    if (co && co.plan === null) {
      await admin
        .from("companies")
        .update({ trial_drawings_used: (co.trial_drawings_used ?? 0) + 1 })
        .eq("id", membership!.company_id);
    }
  } catch (e) {
    console.error("[saveDrawingAnalysis] trial increment failed:", e);
    // 失敗してもユーザー体験は維持（後でcronで補正可能）
  }

  revalidatePath("/drawings");
  revalidatePath("/dashboard");
  return { id: data.id };
}
