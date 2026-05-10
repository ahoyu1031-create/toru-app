import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureCompany } from "@/lib/ensure-company";
import { QuoteDetailClient } from "./quote-detail-client";

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const companyResult = await ensureCompany();
  const companyId = companyResult?.companyId;

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, project_name, client_name, quote_date, total_amount, status, created_at, delivery_date, delivery_location, payment_terms, valid_until, notes")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (!quote) notFound();

  const { data: items } = await supabase
    .from("quote_items")
    .select("id, material_name, unit, quantity, unit_price, subtotal, sort_order, unit_price_master_id")
    .eq("quote_id", id)
    .order("sort_order");

  const { data: masters } = await supabase
    .from("unit_price_master")
    .select("id, material_name, unit, unit_price, category")
    .is("deleted_at", null)
    .order("category")
    .order("material_name");

  const { data: company } = companyId
    ? await supabase
        .from("companies")
        .select("name, postal_code, address, tel, fax, contact_name")
        .eq("id", companyId)
        .single()
    : { data: null };

  return (
    <main className="flex flex-1 flex-col px-6 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8">
          <Link
            href="/quotes"
            className="text-sm text-[color:var(--color-text-muted)] hover:underline"
          >
            ← 見積書一覧
          </Link>
        </div>

        <QuoteDetailClient
          quote={quote}
          items={items ?? []}
          masters={masters ?? []}
          company={company}
        />
      </div>
    </main>
  );
}
