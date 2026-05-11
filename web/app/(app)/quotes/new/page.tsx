import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureCompany } from "@/lib/ensure-company";
import { QuoteForm } from "./quote-form";

export default async function NewQuotePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await ensureCompany();

  const { data: masters } = await supabase
    .from("unit_price_master")
    .select("id, material_name, unit, unit_price, category")
    .is("deleted_at", null)
    .order("category")
    .order("material_name");

  return (
    <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <Link
            href="/quotes"
            className="text-sm text-[color:var(--color-text-muted)] hover:underline"
          >
            ← 見積書一覧
          </Link>
          <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">新規見積書</h1>
        </div>

        <QuoteForm masters={masters ?? []} />
      </div>
    </main>
  );
}
