import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { ensureCompany } from "@/lib/ensure-company";
import { UnitPriceForm } from "../form";
import { updateUnitPrice } from "../actions";

type Params = Promise<{ id: string }>;

export default async function EditUnitPricePage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  await ensureCompany();

  const { data: row } = await supabase
    .from("unit_price_master")
    .select("id, material_name, unit, unit_price, category, memo")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!row) notFound();

  const action = updateUnitPrice.bind(null, id);

  return (
    <main className="flex flex-1 flex-col px-6 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          href="/unit-prices"
          className="text-sm text-[color:var(--color-text-muted)] hover:underline"
        >
          ← 単価マスタ一覧に戻る
        </Link>
        <h1 className="mt-2 text-3xl font-bold">単価を編集</h1>
        <p className="mt-1 text-[color:var(--color-text-muted)]">
          {row.material_name}
        </p>

        <div className="mt-8 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-sm">
          <UnitPriceForm
            initial={row}
            action={action}
            submitLabel="更新する"
          />
        </div>
      </div>
    </main>
  );
}
