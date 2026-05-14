import { redirect, notFound } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { ensureCompany } from "@/lib/ensure-company";
import { PrintView } from "./print-view";

export default async function QuotePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const companyResult = await ensureCompany();
  const companyId = companyResult?.companyId;

  const { data: quote } = await supabase
    .from("quotes")
    .select(
      "id, project_name, client_name, quote_date, total_amount, status, created_at, delivery_date, delivery_location, payment_terms, valid_until, notes",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!quote) notFound();

  const { data: items } = await supabase
    .from("quote_items")
    .select("id, material_name, unit, quantity, unit_price, subtotal, sort_order")
    .eq("quote_id", id)
    .order("sort_order");

  const { data: company } = companyId
    ? await supabase
        .from("companies")
        .select("name, postal_code, address, tel, fax, contact_name")
        .eq("id", companyId)
        .single()
    : { data: null };

  const quoteNo = `TQ-${new Date(quote.created_at)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}-${id.slice(0, 5).toUpperCase()}`;

  return (
    <PrintView
      quote={quote}
      items={items ?? []}
      company={company}
      quoteNo={quoteNo}
    />
  );
}
