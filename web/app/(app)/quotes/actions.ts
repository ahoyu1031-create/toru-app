"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export type QuoteItemInput = {
  material_name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  unit_price_master_id: string | null;
  sort_order: number;
};

export async function createQuote(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  const { data: companies } = await supabase.from("companies").select("id").limit(1);
  const companyId = companies?.[0]?.id;
  if (!companyId) return { ok: false, error: "会社情報が見つかりません" };

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      company_id: companyId,
      project_name: (formData.get("project_name") as string) || null,
      client_name: (formData.get("client_name") as string) || null,
      quote_date: (formData.get("quote_date") as string) || null,
      delivery_date: (formData.get("delivery_date") as string) || null,
      delivery_location: (formData.get("delivery_location") as string) || null,
      payment_terms: (formData.get("payment_terms") as string) || null,
      valid_until: (formData.get("valid_until") as string) || null,
      notes: (formData.get("notes") as string) || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !quote) return { ok: false, error: error?.message ?? "作成に失敗しました" };

  // 明細アイテムを保存
  const itemsRaw = formData.get("items") as string | null;
  if (itemsRaw) {
    try {
      const items: QuoteItemInput[] = JSON.parse(itemsRaw);
      const validItems = items.filter((i) => i.material_name.trim() !== "");
      if (validItems.length > 0) {
        await supabase
          .from("quote_items")
          .insert(validItems.map((item) => ({ ...item, quote_id: quote.id })));
        const total = validItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
        await supabase.from("quotes").update({ total_amount: total }).eq("id", quote.id);
      }
    } catch {
      // JSON パース失敗は無視して見積書ページへ進む
    }
  }

  revalidatePath("/quotes");
  redirect(`/quotes/${quote.id}`);
}

export async function saveDraft(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  const { data: companies } = await supabase.from("companies").select("id").limit(1);
  const companyId = companies?.[0]?.id;
  if (!companyId) return { ok: false, error: "会社情報が見つかりません" };

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      company_id: companyId,
      status: "draft",
      project_name: (formData.get("project_name") as string) || null,
      client_name: (formData.get("client_name") as string) || null,
      quote_date: (formData.get("quote_date") as string) || null,
      delivery_date: (formData.get("delivery_date") as string) || null,
      delivery_location: (formData.get("delivery_location") as string) || null,
      payment_terms: (formData.get("payment_terms") as string) || null,
      valid_until: (formData.get("valid_until") as string) || null,
      notes: (formData.get("notes") as string) || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !quote) return { ok: false, error: error?.message ?? "保存に失敗しました" };

  const itemsRaw = formData.get("items") as string | null;
  if (itemsRaw) {
    try {
      const items: QuoteItemInput[] = JSON.parse(itemsRaw);
      const validItems = items.filter((i) => i.material_name.trim() !== "");
      if (validItems.length > 0) {
        await supabase
          .from("quote_items")
          .insert(validItems.map((item) => ({ ...item, quote_id: quote.id })));
        const total = validItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
        await supabase.from("quotes").update({ total_amount: total }).eq("id", quote.id);
      }
    } catch {
      // ignore
    }
  }

  revalidatePath("/quotes");
  revalidatePath("/quotes/drafts");
  redirect(`/quotes/${quote.id}`);
}

export async function updateQuoteHeader(
  quoteId: string,
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  const { error } = await supabase
    .from("quotes")
    .update({
      project_name: (formData.get("project_name") as string) || null,
      client_name: (formData.get("client_name") as string) || null,
      quote_date: (formData.get("quote_date") as string) || null,
      status: (formData.get("status") as string) || "draft",
      delivery_date: (formData.get("delivery_date") as string) || null,
      delivery_location: (formData.get("delivery_location") as string) || null,
      payment_terms: (formData.get("payment_terms") as string) || null,
      valid_until: (formData.get("valid_until") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", quoteId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/quotes/${quoteId}`);
  return { ok: true };
}

export async function replaceQuoteItems(
  quoteId: string,
  items: QuoteItemInput[],
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  const { error: delError } = await supabase
    .from("quote_items")
    .delete()
    .eq("quote_id", quoteId);
  if (delError) return { ok: false, error: delError.message };

  if (items.length > 0) {
    const rows = items.map((item) => ({ ...item, quote_id: quoteId }));
    const { error: insError } = await supabase.from("quote_items").insert(rows);
    if (insError) return { ok: false, error: insError.message };
  }

  const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  await supabase.from("quotes").update({ total_amount: total }).eq("id", quoteId);

  revalidatePath(`/quotes/${quoteId}`);
  return { ok: true };
}

export async function deleteQuote(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const quoteId = formData.get("quote_id") as string;
  await supabase.from("quotes").update({ deleted_at: new Date().toISOString() }).eq("id", quoteId);

  revalidatePath("/quotes");
  redirect("/quotes");
}

export async function deleteQuoteById(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "ログインが必要です" };

  const { error } = await supabase
    .from("quotes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/quotes");
  return { ok: true };
}
