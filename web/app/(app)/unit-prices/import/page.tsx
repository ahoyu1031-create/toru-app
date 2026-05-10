import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ImportWizard } from "./import-wizard";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ImportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="px-6 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6">
          <Link
            href="/unit-prices"
            className="mb-4 inline-flex items-center gap-1.5 text-sm transition hover:opacity-70"
            style={{ color: "var(--color-text-muted)" }}
          >
            <ArrowLeft size={14} />
            単価マスタ一覧に戻る
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            一括インポート
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            ExcelまたはCSVから単価マスタを一括登録します。業種・カテゴリを確認してから取り込めます。
          </p>
        </div>
        <ImportWizard />
      </div>
    </div>
  );
}
