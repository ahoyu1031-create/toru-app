import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
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
  issued:   { bg: "rgba(11,61,145,0.1)",  color: "#0B3D91" },
  accepted: { bg: "rgba(5,150,105,0.1)",  color: "#059669" },
  rejected: { bg: "rgba(220,38,38,0.1)",  color: "#DC2626" },
};

const COLS = "grid-cols-[1fr_140px_96px_112px_88px_40px]";

const STATUS_ORDER = ["draft", "issued", "accepted", "rejected"] as const;
type StatusKey = (typeof STATUS_ORDER)[number];

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const activeFilter: StatusKey | null =
    rawStatus && (STATUS_ORDER as readonly string[]).includes(rawStatus) ? (rawStatus as StatusKey) : null;

  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  await ensureCompany();

  const { data: allRows } = await supabase
    .from("quotes")
    .select("id, project_name, client_name, quote_date, total_amount, status, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const safeRows = allRows ?? [];
  const counts: Record<StatusKey | "all", number> = {
    all: safeRows.length,
    draft: 0,
    issued: 0,
    accepted: 0,
    rejected: 0,
  };
  for (const r of safeRows) {
    const k = r.status as StatusKey;
    if (k in counts) counts[k] += 1;
  }

  const rows = activeFilter
    ? safeRows.filter((r) => r.status === activeFilter)
    : safeRows;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-5xl">

        {/* Page Header */}
        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[color:var(--color-text)]">見積書</h1>
            <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
              見積書の作成・管理
            </p>
          </div>
          <Link
            href="/quotes/new"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--color-primary-hover)] sm:w-auto sm:justify-start"
          >
            <Plus size={16} />
            新規作成
          </Link>
        </div>

        {/* フィルタピル（ステータス別） */}
        {safeRows.length > 0 && (
          <div
            className="mb-4 flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            <FilterPill href="/quotes" active={activeFilter === null} label="すべて" count={counts.all} />
            {STATUS_ORDER.map((k) => (
              <FilterPill
                key={k}
                href={`/quotes?status=${k}`}
                active={activeFilter === k}
                label={STATUS_LABEL[k]}
                count={counts[k]}
                accent={STATUS_STYLE[k]}
              />
            ))}
          </div>
        )}

        {/* List Card */}
        <section className="overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-sm">
          {rows && rows.length > 0 ? (
            <>
              {/* デスクトップ：テーブルヘッダー */}
              <div
                className={`hidden sm:grid ${COLS} gap-3 border-b border-[color:var(--color-border)] px-4 py-3`}
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
                  const dateLabel = r.quote_date
                    ? new Date(r.quote_date).toLocaleDateString("ja-JP")
                    : "-";
                  return (
                    <div
                      key={r.id}
                      className="group relative transition-colors hover:bg-[color:var(--color-bg)]"
                    >
                      {/* 行全体のリンク */}
                      <Link
                        href={`/quotes/${r.id}`}
                        className="absolute inset-0"
                        style={{ zIndex: 1 }}
                        aria-label={r.project_name ?? "見積書の詳細"}
                      />

                      {/* デスクトップ：グリッド行 */}
                      <div className={`hidden sm:grid ${COLS} gap-3 items-center px-4 py-3.5`}>
                        <span className="min-w-0 truncate font-medium text-sm text-[color:var(--color-text)]">
                          {r.project_name ?? "（未設定）"}
                        </span>
                        <span className="min-w-0 truncate text-sm text-[color:var(--color-text-muted)]">
                          {r.client_name ?? "-"}
                        </span>
                        <span className="text-sm text-[color:var(--color-text-muted)]">
                          {dateLabel}
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

                      {/* モバイル：カード行 */}
                      <div className="flex flex-col gap-2 px-4 py-3.5 sm:hidden">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[color:var(--color-text)]">
                              {r.project_name ?? "（未設定）"}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-[color:var(--color-text-muted)]">
                              {r.client_name ?? "クライアント未設定"}
                            </p>
                          </div>
                          <span
                            className="shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ background: s.bg, color: s.color }}
                          >
                            {STATUS_LABEL[r.status] ?? r.status}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-[color:var(--color-text-muted)]">
                            {dateLabel}
                          </span>
                          <span className="text-sm font-bold tabular-nums text-[color:var(--color-text)]">
                            ¥{Number(r.total_amount).toLocaleString()}
                          </span>
                        </div>
                        <div className="relative flex justify-end" style={{ zIndex: 2 }}>
                          <DeleteQuoteButton id={r.id} label={r.project_name ?? "（未設定）"} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : activeFilter ? (
            <div className="px-6 py-16 text-center">
              <p className="font-medium text-[color:var(--color-text-muted)]">
                「{STATUS_LABEL[activeFilter]}」の見積書はありません
              </p>
              <Link
                href="/quotes"
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border-2 border-[color:var(--color-border)] px-4 text-sm font-medium text-[color:var(--color-text-muted)] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
              >
                すべて表示
              </Link>
            </div>
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

function FilterPill({
  href,
  active,
  label,
  count,
  accent,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
  accent?: { bg: string; color: string };
}) {
  return (
    <Link
      href={href}
      className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition"
      style={{
        background: active
          ? accent?.color ?? "var(--color-primary)"
          : "var(--color-surface)",
        color: active ? "#fff" : accent?.color ?? "var(--color-text-muted)",
        border: "1px solid " + (active ? "transparent" : "var(--color-border)"),
      }}
    >
      {label}
      <span
        className="rounded-full px-1.5 text-[10px] font-bold tabular-nums"
        style={{
          background: active ? "rgba(255,255,255,0.22)" : "var(--color-bg)",
          color: active ? "#fff" : "var(--color-text-subtle)",
        }}
      >
        {count}
      </span>
    </Link>
  );
}
