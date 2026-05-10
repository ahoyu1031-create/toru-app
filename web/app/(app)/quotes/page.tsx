import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureCompany } from "@/lib/ensure-company";
import { Plus } from "lucide-react";
import { DeleteQuoteButton } from "./delete-quote-button";

const STATUS_LABEL: Record<string, string> = {
  draft: "下書き",
  issued: "発行済",
  accepted: "受注",
  rejected: "不採用",
};

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft:    { bg: "rgba(100,116,139,0.1)", color: "#64748B" },
  issued:   { bg: "rgba(37,99,235,0.1)",  color: "#2563EB" },
  accepted: { bg: "rgba(5,150,105,0.1)",  color: "#059669" },
  rejected: { bg: "rgba(220,38,38,0.1)",  color: "#DC2626" },
};

const COLS = "grid-cols-[1fr_140px_96px_112px_88px_40px]";

export default async function QuotesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensureCompany();

  const { data: rows } = await supabase
    .from("quotes")
    .select("id, project_name, client_name, quote_date, total_amount, status, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="px-6 py-8">
      <div className="mx-auto w-full max-w-5xl">

        {/* Page Header */}
        <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[color:var(--color-text)]">見積書</h1>
            <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
              見積書の作成・管理
            </p>
          </div>
          <Link
            href="/quotes/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--color-primary-hover)] sm:justify-start"
          >
            <Plus size={16} />
            新規作成
          </Link>
        </div>

        {/* List Card */}
        <section className="overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-sm">
          {rows && rows.length > 0 ? (
            <>
              {/* Header */}
              <div
                className={`grid ${COLS} gap-3 border-b border-[color:var(--color-border)] px-4 py-3`}
                style={{ background: "var(--color-bg)" }}
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">プロジェクト名</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">クライアント</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">見積日</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)] text-right">合計金額</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">ステータス</span>
                <span />
              </div>

              {/* Rows */}
              <div className="divide-y divide-[color:var(--color-border)]">
                {rows.map((r) => {
                  const s = STATUS_STYLE[r.status] ?? STATUS_STYLE.draft;
                  return (
                    <div
                      key={r.id}
                      className={`group relative grid ${COLS} gap-3 items-center px-4 py-3.5 transition-colors hover:bg-[color:var(--color-bg)] cursor-pointer`}
                    >
                      {/* 行全体のリンク（z-1でコンテンツの上に重ねる） */}
                      <Link
                        href={`/quotes/${r.id}`}
                        className="absolute inset-0"
                        style={{ zIndex: 1 }}
                        aria-label={r.project_name ?? "見積書の詳細"}
                      />

                      <span className="min-w-0 truncate font-medium text-sm text-[color:var(--color-text)]">
                        {r.project_name ?? "（未設定）"}
                      </span>
                      <span className="min-w-0 truncate text-sm text-[color:var(--color-text-muted)]">
                        {r.client_name ?? "-"}
                      </span>
                      <span className="text-sm text-[color:var(--color-text-muted)]">
                        {r.quote_date
                          ? new Date(r.quote_date).toLocaleDateString("ja-JP")
                          : "-"}
                      </span>
                      <span className="text-right font-medium tabular-nums text-sm text-[color:var(--color-text)]">
                        ¥{Number(r.total_amount).toLocaleString()}
                      </span>
                      <span>
                        <span
                          className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{ background: s.bg, color: s.color }}
                        >
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                      </span>
                      <span className="relative flex justify-end" style={{ zIndex: 2 }}>
                        <DeleteQuoteButton id={r.id} label={r.project_name ?? "（未設定）"} />
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="px-6 py-20 text-center">
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: "var(--color-primary-soft)" }}
              >
                <Plus size={24} style={{ color: "var(--color-primary)" }} />
              </div>
              <p className="font-medium text-[color:var(--color-text-muted)]">
                まだ見積書がありません
              </p>
              <p className="mt-1 text-sm text-[color:var(--color-text-subtle)]">
                最初の見積書を作成してみましょう
              </p>
              <Link
                href="/quotes/new"
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[color:var(--color-primary-hover)]"
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
