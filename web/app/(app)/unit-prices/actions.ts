"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function createUnitPrice(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  const { data: companies } = await supabase.from("companies").select("id").limit(1);
  const companyId = companies?.[0]?.id;
  if (!companyId) return { ok: false, error: "会社情報が見つかりません" };

  const material_name = formData.get("material_name") as string;
  if (!material_name?.trim()) return { ok: false, error: "材料名は必須です" };

  const { error } = await supabase.from("unit_price_master").insert({
    company_id: companyId,
    material_name: material_name.trim(),
    unit: (formData.get("unit") as string) || "",
    unit_price: parseFloat(formData.get("unit_price") as string) || 0,
    category: (formData.get("category") as string) || null,
    memo: (formData.get("memo") as string) || null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/unit-prices");
  return { ok: true };
}

export async function updateUnitPrice(
  id: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  const material_name = formData.get("material_name") as string;
  if (!material_name?.trim()) return { ok: false, error: "材料名は必須です" };

  const { error } = await supabase
    .from("unit_price_master")
    .update({
      material_name: material_name.trim(),
      unit: (formData.get("unit") as string) || "",
      unit_price: parseFloat(formData.get("unit_price") as string) || 0,
      category: (formData.get("category") as string) || null,
      memo: (formData.get("memo") as string) || null,
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/unit-prices");
  return { ok: true };
}

export async function deleteUnitPrice(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  const { error } = await supabase
    .from("unit_price_master")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/unit-prices");
  return { ok: true };
}

export type CsvRow = {
  material_name: string;
  unit: string;
  unit_price: number;
  category: string | null;
  memo: string | null;
};

export async function importFromCsv(rows: CsvRow[]): Promise<ActionResult & { inserted?: number }> {
  if (!rows.length) return { ok: false, error: "データがありません" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  const { data: companies } = await supabase.from("companies").select("id").limit(1);
  const companyId = companies?.[0]?.id;
  if (!companyId) return { ok: false, error: "会社情報が見つかりません" };

  const insertRows = rows.map((r) => ({
    company_id: companyId,
    material_name: r.material_name,
    unit: r.unit,
    unit_price: r.unit_price,
    category: r.category || null,
    memo: r.memo || null,
  }));

  const { error } = await supabase.from("unit_price_master").insert(insertRows);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/unit-prices");
  return { ok: true, inserted: insertRows.length };
}

export async function quickUpdateField(
  id: string,
  field: "category" | "unit_price" | "unit",
  value: string,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  const patch: Record<string, string | number | null> = {};
  if (field === "unit_price") {
    const n = parseFloat(value);
    patch.unit_price = isNaN(n) ? 0 : n;
  } else if (field === "category") {
    patch.category = value.trim() || null;
  } else {
    patch.unit = value.trim();
  }

  const { error } = await supabase.from("unit_price_master").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/unit-prices");
  return { ok: true };
}

export async function bulkDeleteUnitPrices(ids: string[]): Promise<ActionResult> {
  if (ids.length === 0) return { ok: false, error: "選択してください" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  const { error } = await supabase
    .from("unit_price_master")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", ids);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/unit-prices");
  return { ok: true };
}

export async function copyFromPublicMaster(selectedIds: string[]): Promise<ActionResult> {
  if (selectedIds.length === 0) return { ok: false, error: "選択してください" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  const { data: companies } = await supabase.from("companies").select("id").limit(1);
  const companyId = companies?.[0]?.id;
  if (!companyId) return { ok: false, error: "会社情報が見つかりません" };

  const { data: masters, error: fetchError } = await supabase
    .from("public_unit_price_master")
    .select("id, material_name, unit, unit_price, category, subcategory")
    .in("id", selectedIds);

  if (fetchError || !masters) return { ok: false, error: fetchError?.message ?? "取得に失敗しました" };

  const rows = masters.map((m) => ({
    company_id: companyId,
    material_name: m.material_name,
    unit: m.unit,
    unit_price: m.unit_price,
    category: m.subcategory ?? m.category,
    source_master_id: m.id,
  }));

  const { error } = await supabase.from("unit_price_master").insert(rows);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/unit-prices");
  return { ok: true };
}
