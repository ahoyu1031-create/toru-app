import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { ensureCompany } from "@/lib/ensure-company";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";

const MODE_LABELS: Record<string, string> = {
  all: "全て解析",
  materials: "材料拾い出し",
  construction_notes: "施工注意事項",
  coordination: "他業者との緩衝",
  communication: "他業者への伝達事項",
};

function parseModeLabels(mode: string): string[] {
  if (mode === "all") return ["材料拾い出し", "施工注意事項", "他業者との緩衝", "他業者への伝達事項"];
  return mode.split(",").map((m) => MODE_LABELS[m.trim()] ?? m.trim()).filter(Boolean);
}

export default async function DrawingsPage({
  searchParams,
}: {
  searchParams: Promise<{ trade?: string }>;
}) {
  const { trade: rawTrade } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  await ensureCompany();

  const { data: allAnalyses } = await supabase
    .from("drawing_analyses")
    .select("id, file_name, trade, mode, created_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const safeAnalyses = allAnalyses ?? [];

  // 業種別の件数を集計
  const tradeCounts = new Map<string, number>();
  for (const a of safeAnalyses) {
    tradeCounts.set(a.trade, (tradeCounts.get(a.trade) ?? 0) + 1);
  }
  const tradeList = Array.from(tradeCounts.entries()).sort((a, b) => b[1] - a[1]);

  const activeTrade = rawTrade && tradeCounts.has(rawTrade) ? rawTrade : null;
  const analyses = activeTrade
    ? safeAnalyses.filter((a) => a.trade === activeTrade)
    : safeAnalyses;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-4xl">

        {/* ヘッダー */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>図面解析</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
              AIが現場に必要な情報を自動抽出します
            </p>
          </div>
          <Link
            href="/drawings/new"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--color-primary-hover)] sm:w-auto sm:justify-start"
            style={{ background: "var(--color-primary)" }}
          >
            <Plus size={16} />
            新規解析
          </Link>
        </div>

        {/* 業種フィルタピル（2業種以上ある場合のみ表示） */}
        {tradeList.length >= 2 && (
          <div
            className="mb-4 flex gap-2 overflow-x-auto pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            <TradePill href="/drawings" active={activeTrade === null} label="すべて" count={safeAnalyses.length} />
            {tradeList.map(([trade, count]) => (
              <TradePill
                key={trade}
                href={`/drawings?trade=${encodeURIComponent(trade)}`}
                active={activeTrade === trade}
                label={trade}
                count={count}
              />
            ))}
          </div>
        )}

        {/* 解析履歴 */}
        {analyses && analyses.length > 0 ? (
          <div
            className="rounded-xl border divide-y divide-[color:var(--color-border)]"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            {analyses.map((a) => {
              const dateLabel = new Date(a.created_at).toLocaleDateString("ja-JP", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <Link
                  key={a.id}
                  href={`/drawings/${a.id}`}
                  className="flex gap-3 px-4 py-3.5 transition hover:bg-[color:var(--color-bg)] sm:gap-4 sm:px-5 sm:py-4"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "var(--color-primary-soft)" }}
                  >
                    <FileText size={18} style={{ color: "var(--color-primary)" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 truncate text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                        {a.file_name}
                      </p>
                      <span className="shrink-0 text-[11px] whitespace-nowrap" style={{ color: "var(--color-text-muted)" }}>
                        {dateLabel}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {a.trade}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {parseModeLabels(a.mode).map((label) => (
                        <span
                          key={label}
                          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ background: "var(--color-primary-soft)", color: "var(--color-primary)" }}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : activeTrade ? (
          <div
            className="rounded-xl border px-6 py-14 text-center"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <p className="font-medium" style={{ color: "var(--color-text-muted)" }}>
              「{activeTrade}」の解析はありません
            </p>
            <Link
              href="/drawings"
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border-2 px-4 text-sm font-medium transition hover:opacity-80"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
            >
              すべて表示
            </Link>
          </div>
        ) : (
          /* 空ステート */
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-center"
            style={{ borderColor: "var(--color-border)" }}
          >
            <span className="text-5xl mb-4">📄</span>
            <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
              まだ解析がありません
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
              図面PDFをアップロードして最初の解析を始めましょう
            </p>
            <Link
              href="/drawings/new"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white"
              style={{ background: "var(--color-primary)" }}
            >
              <Plus size={15} />
              最初の解析を始める
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

function TradePill({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition"
      style={{
        background: active ? "var(--color-primary)" : "var(--color-surface)",
        color: active ? "#fff" : "var(--color-text-muted)",
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
