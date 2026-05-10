import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureCompany } from "@/lib/ensure-company";
import { Plus, ArrowLeft } from "lucide-react";
import { DeleteQuoteButton } from "../delete-quote-button";

export default async function QuoteDraftsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await ensureCompany();

  const { data: rows } = await supabase
    .from("quotes")
    .select("id, project_name, client_name, quote_date, total_amount, created_at")
    .eq("status", "draft")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="px-6 py-8">
      <div className="mx-auto w-full max-w-5xl">

        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/quotes"
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "var(--color-text-muted)" }}
          >
            <ArrowLeft size={15} />
            見積一覧
          </Link>
        </div>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>下書き</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
              作成中の見積書
            </p>
          </div>
          <Link
            href="/quotes/new"
            className="inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--color-primary-hover)]"
            style={{ background: "var(--color-primary)" }}
          >
            <Plus size={16} />
            新規作成
          </Link>
        </div>

        <section
          className="overflow-hidden rounded-xl border shadow-sm"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          {rows && rows.length > 0 ? (
            <div className="divide-y divide-[color:var(--color-border)]">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="group relative flex items-center gap-3 px-5 py-4 transition hover:bg-[color:var(--color-bg)] cursor-pointer"
                >
                  {/* 行全体リンク（z-1でコンテンツの上に重ねる） */}
                  <Link
                    href={`/quotes/${r.id}`}
                    className="absolute inset-0"
                    style={{ zIndex: 1 }}
                    aria-label={r.project_name ?? "下書きの詳細"}
                  />
                  {/* プロジェクト名・クライアント */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                      {r.project_name ?? "（無題）"}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {r.client_name ?? "クライアント未設定"}
                    </p>
                  </div>
                  {/* 金額・日付 */}
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-medium tabular-nums" style={{ color: "var(--color-text)" }}>
                      ¥{Number(r.total_amount ?? 0).toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {r.quote_date
                        ? new Date(r.quote_date).toLocaleDateString("ja-JP")
                        : new Date(r.created_at).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  {/* 削除ボタン（z-2でリンクの上に出す） */}
                  <div className="relative shrink-0" style={{ zIndex: 2 }}>
                    <DeleteQuoteButton id={r.id} label={r.project_name ?? "（無題）"} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-20 text-center">
              <p className="font-medium" style={{ color: "var(--color-text-muted)" }}>
                下書きの見積書はありません
              </p>
              <Link
                href="/quotes/new"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white"
                style={{ background: "var(--color-primary)" }}
              >
                <Plus size={16} />
                見積書を作成する
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
