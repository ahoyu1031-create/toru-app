import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UnitPriceForm } from "../form";
import { createUnitPrice } from "../actions";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewUnitPricePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="px-6 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6">
          <Link
            href="/unit-prices"
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "var(--color-text-muted)" }}
          >
            <ArrowLeft size={15} />
            単価マスタ一覧に戻る
          </Link>
          <h1 className="mt-3 text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            新しい単価を登録
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            左のフォームを入力し、右のパネルから候補を選択できます
          </p>
        </div>

        <UnitPriceForm action={createUnitPrice} submitLabel="登録する" />
      </div>
    </div>
  );
}
