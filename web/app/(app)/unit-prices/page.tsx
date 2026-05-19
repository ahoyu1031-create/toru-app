import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getCurrentUser, createAdminClient } from "@/lib/supabase/server";
import { ensureCompany } from "@/lib/ensure-company";
import { PublicMasterPicker } from "./public-master-picker";
import { TRADE_CATEGORIES } from "./category-picker";
import { UnitPriceTable } from "./inline-row";
import { Plus, Upload, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { canUseUnitPrices } from "@/lib/plan";

const PAGE_SIZE = 20;

type SearchParams = Promise<{ q?: string; category?: string; trade?: string; page?: string }>;

export default async function UnitPricesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const { data: planProfile } = await admin.from("users").select("plan_type").eq("id", user.id).maybeSingle();
  if (!canUseUnitPrices(planProfile?.plan_type ?? "free")) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <div className="mx-auto w-full max-w-5xl">
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>単価マスタ</h1>
          <div
            className="mt-6 flex flex-col items-center rounded-2xl px-8 py-16 text-center"
            style={{ background: "var(--color-surface)", border: "2px dashed var(--color-border)" }}
          >
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "rgba(37,99,235,0.08)" }}>
              <Lock size={28} style={{ color: "var(--color-primary)" }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>単価マスタは有料プランで利用できます</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              individual以上のプランにアップグレードすると、自社の材料単価を登録・管理できます。
              見積書作成時に単価が自動で入力されます。
            </p>
            <Link
              href="/settings/plan"
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl px-8 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: "var(--color-primary)" }}
            >
              プランを確認する
            </Link>
            <p className="mt-3 text-xs" style={{ color: "var(--color-text-subtle)" }}>individual ¥1,480/月〜</p>
          </div>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  await ensureCompany();

  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const category = params.category?.trim() ?? "";
  const trade = params.trade?.trim() ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;

  // trade が選択されている場合、そのカテゴリ群に絞る
  const tradeCategories = trade ? (TRADE_CATEGORIES[trade] ?? []) : [];

  let countQuery = supabase
    .from("unit_price_master")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);

  let query = supabase
    .from("unit_price_master")
    .select("id, material_name, unit, unit_price, category, memo, updated_at")
    .is("deleted_at", null)
    .order("category", { ascending: true })
    .order("material_name", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  if (q) { query = query.ilike("material_name", `%${q}%`); countQuery = countQuery.ilike("material_name", `%${q}%`); }
  if (category) { query = query.eq("category", category); countQuery = countQuery.eq("category", category); }
  else if (trade && tradeCategories.length > 0) { query = query.in("category", tradeCategories); countQuery = countQuery.in("category", tradeCategories); }

  const [{ data: rows }, { count: totalCount }, { data: publicRows }, { data: allNames }] = await Promise.all([
    query,
    countQuery,
    supabase
      .from("public_unit_price_master")
      .select("id, material_name, unit, unit_price, category, subcategory")
      .order("category")
      .order("material_name"),
    supabase
      .from("unit_price_master")
      .select("material_name")
      .is("deleted_at", null),
  ]);
  const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE);

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-5xl">

        {/* Page Header */}
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[color:var(--color-text)]">単価マスタ</h1>
            <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
              自社の材料単価を管理します
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/unit-prices/import"
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[color:var(--color-border)] px-3 text-sm font-medium text-[color:var(--color-text-muted)] transition hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)] sm:flex-none sm:px-4"
            >
              <Upload size={15} />
              <span className="hidden sm:inline">一括</span>インポート
            </Link>
            <Link
              href="/unit-prices/new"
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--color-primary-hover)] sm:flex-none sm:px-4"
            >
              <Plus size={16} />
              新規登録
            </Link>
          </div>
        </div>

        {/* 業種タブ */}
        <div
          className="mb-2 flex gap-1 overflow-x-auto rounded-xl p-1"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          {[{ key: "", label: "すべて" }, ...Object.keys(TRADE_CATEGORIES).map((t) => ({ key: t, label: t }))].map(({ key, label }) => {
            const isActive = trade === key;
            const ps = new URLSearchParams();
            if (q) ps.set("q", q);
            if (key) ps.set("trade", key);
            const qs = ps.toString();
            const href = `/unit-prices${qs ? `?${qs}` : ""}`;
            return (
              <Link
                key={key}
                href={href}
                className="shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium transition"
                style={{
                  background: isActive ? "var(--color-primary)" : "transparent",
                  color: isActive ? "#fff" : "var(--color-text-muted)",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* サブカテゴリチップ - 業種選択時に表示 */}
        {trade && (TRADE_CATEGORIES[trade]?.filter((s) => s !== trade).length ?? 0) > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5 px-1">
            {(TRADE_CATEGORIES[trade] ?? []).filter((s) => s !== trade).map((sub) => {
              const isActive = category === sub;
              const ps = new URLSearchParams();
              if (q) ps.set("q", q);
              ps.set("trade", trade);
              if (!isActive) ps.set("category", sub);
              return (
                <Link
                  key={sub}
                  href={`/unit-prices?${ps}`}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-all hover:shadow-[0_0_0_2px_var(--color-primary)]"
                  style={{
                    background: isActive ? "var(--color-primary-soft)" : "transparent",
                    color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                    border: `1px solid ${isActive ? "var(--color-primary)" : "var(--color-border)"}`,
                  }}
                >
                  {sub}
                </Link>
              );
            })}
          </div>
        )}

        {/* Search */}
        <form className="mb-4 flex flex-wrap items-end gap-3">
          {trade && <input type="hidden" name="trade" value={trade} />}
          <div className="min-w-0 flex-1">
            <label htmlFor="q" className="block text-xs font-semibold text-[color:var(--color-text-muted)] mb-1">
              材料名で検索
            </label>
            <input
              id="q"
              name="q"
              type="text"
              defaultValue={q}
              placeholder="塩ビ管"
              className="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm focus:border-[color:var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)]/20"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-[color:var(--color-primary)] px-4 text-sm font-semibold text-white transition hover:bg-[color:var(--color-primary-hover)]"
            >
              絞り込み
            </button>
            {(q || category) && (
              <Link
                href={trade ? `/unit-prices?trade=${trade}` : "/unit-prices"}
                className="inline-flex h-9 items-center text-sm text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)]"
              >
                クリア
              </Link>
            )}
          </div>
        </form>

        {/* Table Card */}
        {rows && rows.length > 0 ? (
          <>
            <UnitPriceTable rows={rows} />

            {/* ページネーション */}
            {totalPages > 1 && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {(page - 1) * PAGE_SIZE + 1}〜{Math.min(page * PAGE_SIZE, totalCount ?? 0)}件 / 全{totalCount}件
                </p>
                <div className="flex items-center gap-1">
                  {page > 1 ? (
                    <Link
                      href={`/unit-prices?${new URLSearchParams({ ...(q && { q }), ...(category && { category }), ...(trade && { trade }), page: String(page - 1) })}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
                    >
                      <ChevronLeft size={14} />
                    </Link>
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border opacity-30" style={{ borderColor: "var(--color-border)" }}>
                      <ChevronLeft size={14} />
                    </span>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Link
                      key={p}
                      href={`/unit-prices?${new URLSearchParams({ ...(q && { q }), ...(category && { category }), ...(trade && { trade }), page: String(p) })}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition"
                      style={{
                        background: p === page ? "var(--color-primary)" : "transparent",
                        color: p === page ? "#fff" : "var(--color-text-muted)",
                        borderColor: p === page ? "var(--color-primary)" : "var(--color-border)",
                      }}
                    >
                      {p}
                    </Link>
                  ))}
                  {page < totalPages ? (
                    <Link
                      href={`/unit-prices?${new URLSearchParams({ ...(q && { q }), ...(category && { category }), ...(trade && { trade }), page: String(page + 1) })}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
                      style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
                    >
                      <ChevronRight size={14} />
                    </Link>
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border opacity-30" style={{ borderColor: "var(--color-border)" }}>
                      <ChevronRight size={14} />
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <section className="overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-sm">
            <div className="px-6 py-20 text-center">
              <p className="font-medium text-[color:var(--color-text-muted)]">
                {q || category ? "条件に一致する単価が見つかりません" : "まだ登録されていません"}
              </p>
              <Link
                href="/unit-prices/new"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-5 text-sm font-semibold text-white hover:bg-[color:var(--color-primary-hover)]"
              >
                <Plus size={16} />
                最初の単価を登録する
              </Link>
              <p className="mt-6 text-sm text-[color:var(--color-text-subtle)]">
                または下の公開マスタからコピーしてスタート
              </p>
            </div>
          </section>
        )}

        {/* Public master copy */}
        <section id="public-master" className="mt-4">
          <PublicMasterPicker
            rows={publicRows ?? []}
            existingNames={(allNames ?? []).map((r) => r.material_name)}
          />
        </section>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)] ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}
