import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createAdminClient, getCurrentUser } from "@/lib/supabase/server";
import { ensureCompany } from "@/lib/ensure-company";
import { getUserPlan } from "@/lib/get-plan";
import { TrendingUp, TrendingDown, ArrowRight, ScanLine, Clock } from "lucide-react";
import { PlanStatusBar } from "./plan-status-bar";

const PLAN_LIMITS: Record<string, number | null> = {
  free: 15, individual: 30, team_5: 100, team_10: 300, team_unlimited: null,
};

/* ─── helpers ─────────────────────────────── */
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfLastMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() - 1, 1);
}
function pct(current: number, previous: number) {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
function last6Months() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: `${d.getMonth() + 1}月`, year: d.getFullYear(), month: d.getMonth() };
  });
}

const STATUS_LABEL: Record<string, string> = {
  draft: "下書き", issued: "発行済", accepted: "受注", rejected: "不採用",
};
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  draft:    { bg: "rgba(100,116,139,0.1)", color: "#64748B" },
  issued:   { bg: "rgba(37,99,235,0.1)",  color: "#2563EB" },
  accepted: { bg: "rgba(5,150,105,0.1)",  color: "#059669" },
  rejected: { bg: "rgba(220,38,38,0.1)",  color: "#DC2626" },
};

/* ─── page ────────────────────────────────── */
type PageProps = { searchParams: Promise<{ view?: string }> };

export default async function DashboardPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await ensureCompany();
  const supabase = await createClient();
  const admin = createAdminClient();

  void searchParams; // 開発中は詳細ビュー固定

  /* ─── corporate: 統計ダッシュボード ─── */
  const now = new Date();
  const thisMonthStart = startOfMonth(now).toISOString();
  const lastMonthStart = startOfLastMonth(now).toISOString();
  const sixMonthsAgo   = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();

  // すべてのクエリを1段階で並列実行。月別の見積書は allQuotes から派生（6ヶ月分に直近2ヶ月が含まれる）
  const [
    { data: companies },
    { data: userProfile },
    { data: allQuotes },
    { data: allTimeQuotes },
    { data: recentAnalyses },
    { count: unitPriceCount },
    { count: analysisCount },
    { count: thisMonthAnalysisCount },
  ] = await Promise.all([
    supabase.from("companies").select("name, plan"),
    admin.from("users").select("bonus_analyses, is_unlimited").eq("id", user.id).maybeSingle(),
    supabase
      .from("quotes")
      .select("id, project_name, client_name, total_amount, status, created_at")
      .is("deleted_at", null)
      .gte("created_at", sixMonthsAgo)
      .order("created_at", { ascending: false }),
    // 受注率・下書き数は全期間
    supabase
      .from("quotes")
      .select("status")
      .is("deleted_at", null),
    // 最近の解析（3件）
    supabase
      .from("drawing_analyses")
      .select("id, file_name, trade, mode, created_at")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(3),
    // はじめにチェックリスト用
    supabase
      .from("unit_price_master")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
    supabase
      .from("drawing_analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null),
    // 今月の解析数
    supabase
      .from("drawing_analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .gte("created_at", thisMonthStart),
  ]);

  const company = companies?.[0] ?? null;
  const planType = await getUserPlan(user.id);
  const bonusAnalyses = userProfile?.bonus_analyses ?? 0;
  const isUnlimited = userProfile?.is_unlimited ?? false;
  const monthLimit = isUnlimited ? null : (PLAN_LIMITS[planType] ?? 15);

  // allQuotes（6ヶ月分）から今月・先月を派生
  const thisMonthQuotes = (allQuotes ?? []).filter((q) => q.created_at >= thisMonthStart);
  const lastMonthQuotes = (allQuotes ?? []).filter(
    (q) => q.created_at >= lastMonthStart && q.created_at < thisMonthStart
  );

  const thisTotal   = thisMonthQuotes.reduce((s, q) => s + Number(q.total_amount), 0);
  const lastTotal   = lastMonthQuotes.reduce((s, q) => s + Number(q.total_amount), 0);
  const issuedCount = thisMonthQuotes.filter((q) => q.status === "issued").length;

  // 受注率（全期間の完了案件ベース）
  const accepted  = (allTimeQuotes ?? []).filter((q) => q.status === "accepted").length;
  const rejected  = (allTimeQuotes ?? []).filter((q) => q.status === "rejected").length;
  const closed    = accepted + rejected;
  const winRate   = closed > 0 ? Math.round((accepted / closed) * 100) : null;

  // 下書き中件数（早めに発行すべき案件）
  const draftCount = (allTimeQuotes ?? []).filter((q) => q.status === "draft").length;

  const months = last6Months();
  const monthlyData = months.map(({ label, year, month }) => {
    const total = (allQuotes ?? [])
      .filter((q) => {
        const d = new Date(q.created_at);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((s, q) => s + Number(q.total_amount), 0);
    return { label, total };
  });
  const maxMonthly = Math.max(...monthlyData.map((m) => m.total), 1);
  const recentQuotes = (allQuotes ?? []).slice(0, 5);

  // はじめにチェックリスト
  const unitPricesDone = (unitPriceCount ?? 0) > 0;
  const analysisDone   = (analysisCount ?? 0) > 0;
  const quoteDone      = (allTimeQuotes ?? []).length > 0;
  const allDone        = unitPricesDone && analysisDone && quoteDone;
  const doneCount      = [unitPricesDone, analysisDone, quoteDone].filter(Boolean).length;

  const MODE_LABELS: Record<string, string> = {
    all: "全て解析", materials: "材料拾い出し",
    construction_notes: "施工注意事項", coordination: "他業者との緩衝", communication: "伝達事項",
  };

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-6xl space-y-5 sm:space-y-6">

        {/* Plan status widget */}
        <PlanStatusBar
          planType={planType}
          isUnlimited={isUnlimited}
          baseLimit={monthLimit}
          usedThisMonth={thisMonthAnalysisCount ?? 0}
          bonus={bonusAnalyses}
          companyName={company?.name ?? null}
        />

        {/* はじめに checklist — hide once all done */}
        {!allDone && (
          <div
            className="rounded-xl border p-5"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold">TORUをはじめよう</h2>
                <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  3ステップで本格的に使い始められます
                </p>
              </div>
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ background: "var(--color-primary-soft)", color: "var(--color-primary)" }}
              >
                {doneCount} / 3
              </span>
            </div>
            <div className="space-y-2.5">
              <ChecklistItem
                done={unitPricesDone}
                href="/unit-prices/new"
                label="単価マスタに材料を登録する"
                desc="見積書の単価が自動で埋まります"
                cta="単価を登録する"
              />
              <ChecklistItem
                done={analysisDone}
                href="/drawings/new"
                label="図面を解析する"
                desc="AIが材料を自動で拾い出します"
                cta="解析を始める"
              />
              <ChecklistItem
                done={quoteDone}
                href="/quotes/new"
                label="見積書を作成する"
                desc="PDF出力して取引先に送れます"
                cta="見積書を作成する"
              />
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon="¥"
            label="今月の見積金額"
            value={`¥${thisTotal.toLocaleString()}`}
            pctChange={pct(thisTotal, lastTotal)}
            hint="先月比"
          />
          <StatCard
            icon="%"
            label="受注率"
            value={winRate !== null ? `${winRate}%` : "—"}
            pctChange={null}
            hint={closed > 0 ? `完了案件 ${closed}件ベース` : "完了案件なし"}
            accentColor="#059669"
          />
          <StatCard
            icon="!"
            label="発行済み・返答待ち"
            value={`${issuedCount}件`}
            pctChange={null}
            hint="今月"
            accentColor="#F97316"
          />
          <StatCard
            icon="✎"
            label="下書き中"
            value={`${draftCount}件`}
            pctChange={null}
            hint="要発行"
            accentColor={draftCount > 0 ? "#D97706" : "#8B5CF6"}
          />
        </div>

        {/* Chart + Status */}
        <div className="grid gap-4 xl:grid-cols-3">
          <div
            className="xl:col-span-2 rounded-xl border p-6"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <div className="mb-6">
              <h2 className="text-base font-semibold">月別見積金額</h2>
              <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                過去6ヶ月の推移
              </p>
            </div>
            <BarChart data={monthlyData} max={maxMonthly} />
          </div>

          <div
            className="rounded-xl border p-6"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <h2 className="text-base font-semibold mb-1">ステータス別</h2>
            <p className="text-xs mb-5" style={{ color: "var(--color-text-muted)" }}>
              全期間の見積書
            </p>
            <StatusBreakdown quotes={allQuotes ?? []} />
          </div>
        </div>

        {/* Recent Quotes */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div>
              <h2 className="text-base font-semibold">直近の見積書</h2>
              <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>最新5件</p>
            </div>
            <Link
              href="/quotes"
              className="flex items-center gap-1 text-xs font-medium transition hover:opacity-70"
              style={{ color: "var(--color-primary)" }}
            >
              すべて見る <ArrowRight size={12} />
            </Link>
          </div>

          {recentQuotes.length > 0 ? (
            <>
              {/* デスクトップ：テーブル */}
              <div className="hidden sm:block">
                <div
                  className="grid grid-cols-[1fr_120px_88px_104px_80px] gap-3 border-b px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                  style={{ background: "var(--color-bg)", borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
                >
                  <span>プロジェクト名</span>
                  <span>クライアント</span>
                  <span>見積日</span>
                  <span className="text-right">金額</span>
                  <span>ステータス</span>
                </div>
                <div className="divide-y divide-[color:var(--color-border)]">
                  {recentQuotes.map((r) => {
                    const s = STATUS_STYLE[r.status] ?? STATUS_STYLE.draft;
                    return (
                      <div
                        key={r.id}
                        className="relative grid grid-cols-[1fr_120px_88px_104px_80px] gap-3 items-center px-4 py-3 transition-colors hover:bg-[color:var(--color-bg)] cursor-pointer"
                      >
                        <Link href={`/quotes/${r.id}`} className="absolute inset-0" style={{ zIndex: 1 }} aria-label={r.project_name ?? "見積書の詳細"} />
                        <span className="relative min-w-0 truncate text-sm font-medium" style={{ color: "var(--color-text)" }}>
                          {r.project_name ?? "（未設定）"}
                        </span>
                        <span className="relative min-w-0 truncate text-sm" style={{ color: "var(--color-text-muted)" }}>
                          {r.client_name ?? "-"}
                        </span>
                        <span className="relative text-sm" style={{ color: "var(--color-text-muted)" }}>
                          {new Date(r.created_at).toLocaleDateString("ja-JP")}
                        </span>
                        <span className="relative text-right text-sm font-medium tabular-nums" style={{ color: "var(--color-text)" }}>
                          ¥{Number(r.total_amount).toLocaleString()}
                        </span>
                        <span className="relative">
                          <span
                            className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ background: s.bg, color: s.color }}
                          >
                            {STATUS_LABEL[r.status] ?? r.status}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* モバイル：カードリスト */}
              <div className="divide-y divide-[color:var(--color-border)] sm:hidden">
                {recentQuotes.map((r) => {
                  const s = STATUS_STYLE[r.status] ?? STATUS_STYLE.draft;
                  return (
                    <Link
                      key={r.id}
                      href={`/quotes/${r.id}`}
                      className="block px-4 py-3 transition hover:bg-[color:var(--color-bg)]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                            {r.project_name ?? "（未設定）"}
                          </p>
                          <p className="mt-0.5 truncate text-xs" style={{ color: "var(--color-text-muted)" }}>
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
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {new Date(r.created_at).toLocaleDateString("ja-JP")}
                        </span>
                        <span className="text-sm font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
                          ¥{Number(r.total_amount).toLocaleString()}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-[color:var(--color-text-muted)]">まだ見積書がありません</p>
              <Link
                href="/quotes/new"
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: "var(--color-primary)" }}
              >
                最初の見積書を作成する
              </Link>
            </div>
          )}
        </div>

        {/* Recent Analyses */}
        {recentAnalyses && recentAnalyses.length > 0 && (
          <div
            className="rounded-xl border overflow-hidden"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b"
              style={{ borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center gap-2">
                <Clock size={15} style={{ color: "var(--color-text-muted)" }} />
                <h2 className="text-base font-semibold">最近の図面解析</h2>
              </div>
              <Link
                href="/drawings"
                className="flex items-center gap-1 text-xs font-medium transition hover:opacity-70"
                style={{ color: "var(--color-primary)" }}
              >
                すべて見る <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-[color:var(--color-border)]">
              {recentAnalyses.map((a) => (
                <Link
                  key={a.id}
                  href={`/drawings/${a.id}`}
                  className="flex items-center gap-4 px-6 py-3.5 transition hover:bg-[color:var(--color-bg)]"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "var(--color-primary-soft)" }}
                  >
                    <ScanLine size={14} style={{ color: "var(--color-primary)" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: "var(--color-text)" }}>
                      {a.file_name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {a.trade} · {MODE_LABELS[a.mode] ?? a.mode}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(a.created_at).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ═══ Stat Card ══════════════════════════════ */
function StatCard({
  icon, label, value, pctChange, hint, accentColor,
}: {
  icon: string; label: string; value: string;
  pctChange: number | null; hint: string; accentColor?: string;
}) {
  const color = accentColor ?? "var(--color-primary)";
  const isUp = pctChange !== null && pctChange >= 0;

  return (
    <div
      className="rounded-xl border p-5"
      style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-lg font-bold"
          style={{ background: `${color}18`, color }}
        >
          {icon}
        </div>
        {pctChange !== null && (
          <span
            className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={
              isUp
                ? { background: "rgba(5,150,105,0.1)", color: "#059669" }
                : { background: "rgba(220,38,38,0.1)", color: "#DC2626" }
            }
          >
            {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(pctChange)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-sm text-[color:var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-[color:var(--color-text)]">{value}</p>
      <p className="mt-1 text-xs text-[color:var(--color-text-subtle)]">{hint}</p>
    </div>
  );
}

/* ═══ Bar Chart (SVG) ════════════════════════ */
function BarChart({ data, max }: { data: { label: string; total: number }[]; max: number }) {
  const h = 160;
  const barW = 32;
  const gap = 16;
  const svgW = data.length * (barW + gap) - gap;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${svgW} ${h + 28}`} style={{ width: "100%", minWidth: svgW }}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1={0} y1={h - ratio * h} x2={svgW} y2={h - ratio * h}
            stroke="var(--color-border)" strokeWidth={1}
          />
        ))}
        {data.map(({ label, total: val }, i) => {
          const barH = max > 0 ? (val / max) * h : 0;
          const x = i * (barW + gap);
          const isEmpty = val === 0;
          return (
            <g key={label}>
              <rect
                x={x} y={isEmpty ? h - 2 : h - barH}
                width={barW} height={isEmpty ? 2 : barH}
                rx={4}
                fill={isEmpty ? "var(--color-border)" : "var(--color-primary)"}
                opacity={isEmpty ? 1 : 0.85}
              />
              {!isEmpty && (
                <text x={x + barW / 2} y={h - barH - 4} textAnchor="middle" fontSize={9} fill="var(--color-text-muted)">
                  {val >= 10000 ? `¥${Math.round(val / 10000)}万` : `¥${val}`}
                </text>
              )}
              <text x={x + barW / 2} y={h + 18} textAnchor="middle" fontSize={11} fill="var(--color-text-muted)">
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ═══ Checklist Item ════════════════════════ */
function ChecklistItem({
  done, href, label, desc, cta,
}: {
  done: boolean; href: string; label: string; desc: string; cta: string;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg p-3"
      style={{
        background: done ? "var(--color-bg)" : "var(--color-bg)",
        border: `1px solid ${done ? "var(--color-border)" : "var(--color-border)"}`,
        opacity: done ? 0.7 : 1,
      }}
    >
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={done
          ? { background: "rgba(5,150,105,0.15)", color: "#059669" }
          : { background: "var(--color-primary-soft)", color: "var(--color-primary)" }
        }
      >
        {done ? "✓" : "○"}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold"
          style={{
            color: done ? "var(--color-text-muted)" : "var(--color-text)",
            textDecoration: done ? "line-through" : "none",
          }}
        >
          {label}
        </p>
        {!done && (
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{desc}</p>
        )}
      </div>
      {!done && (
        <Link
          href={href}
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
          style={{ background: "var(--color-primary)" }}
        >
          {cta}
        </Link>
      )}
    </div>
  );
}

/* ═══ Status Breakdown ═══════════════════════ */
function StatusBreakdown({ quotes }: { quotes: Array<{ status: string }> }) {
  const total = quotes.length;
  if (total === 0) {
    return <p className="text-sm text-center py-8 text-[color:var(--color-text-subtle)]">データなし</p>;
  }
  return (
    <div className="space-y-3">
      {(["draft", "issued", "accepted", "rejected"] as const).map((s) => {
        const count = quotes.filter((q) => q.status === s).length;
        const style = STATUS_STYLE[s];
        return (
          <div key={s}>
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{ background: style.bg, color: style.color }}
              >
                {STATUS_LABEL[s]}
              </span>
              <span className="text-sm font-semibold text-[color:var(--color-text)]">{count}件</span>
            </div>
            <div className="h-1.5 w-full rounded-full overflow-hidden bg-[color:var(--color-bg)]">
              <div
                className="h-full rounded-full"
                style={{ width: `${(count / total) * 100}%`, background: style.color }}
              />
            </div>
          </div>
        );
      })}
      <p className="pt-2 text-right text-xs text-[color:var(--color-text-subtle)]">合計 {total}件</p>
    </div>
  );
}
