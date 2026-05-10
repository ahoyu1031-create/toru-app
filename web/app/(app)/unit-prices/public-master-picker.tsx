"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { copyFromPublicMaster } from "./actions";

type Row = {
  id: string;
  material_name: string;
  unit: string;
  unit_price: number;
  category: string | null;
  subcategory: string | null;
};

type Props = {
  rows: Row[];
  existingNames: string[];
};

const INDUSTRIES = [
  "給排水衛生設備",
  "電気設備",
  "ダクト・空調設備",
  "ガス設備",
  "消防設備",
  "建築・躯体",
  "内装・仕上げ",
];

export function PublicMasterPicker({ rows, existingNames }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndustry, setActiveIndustry] = useState<string>("");
  const [activeSubcategory, setActiveSubcategory] = useState<string>("");

  const router = useRouter();
  const existingSet = useMemo(() => new Set(existingNames), [existingNames]);

  const subcategories = useMemo(() => {
    if (!activeIndustry) return [];
    const subs = new Set<string>();
    rows.forEach((r) => {
      if (r.category === activeIndustry && r.subcategory) subs.add(r.subcategory);
    });
    return Array.from(subs);
  }, [rows, activeIndustry]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (searchQuery && !r.material_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (activeIndustry && r.category !== activeIndustry) return false;
      if (activeSubcategory && r.subcategory !== activeSubcategory) return false;
      return true;
    });
  }, [rows, searchQuery, activeIndustry, activeSubcategory]);

  const duplicateCount = useMemo(
    () => rows.filter((r) => existingSet.has(r.material_name)).length,
    [rows, existingSet],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllFiltered() {
    setSelected((prev) => {
      const next = new Set(prev);
      filteredRows.forEach((r) => next.add(r.id));
      return next;
    });
  }

  function clearAll() {
    setSelected(new Set());
  }

  function handleIndustryClick(industry: string) {
    setActiveIndustry((prev) => (prev === industry ? "" : industry));
    setActiveSubcategory("");
  }

  function handleSubcategoryClick(sub: string) {
    setActiveSubcategory((prev) => (prev === sub ? "" : sub));
  }

  function handleCopy() {
    if (selected.size === 0) {
      setMessage("1件以上選択してください");
      return;
    }
    startTransition(async () => {
      const result = await copyFromPublicMaster(Array.from(selected));
      if (!result.ok) {
        setMessage(`失敗: ${result.error}`);
        return;
      }
      setMessage(`${selected.size}件を取り込みました`);
      setSelected(new Set());
      // revalidatePathが反映されるよう少し待ってからリロード
      setTimeout(() => window.location.reload(), 600);
    });
  }

  const isFiltering = searchQuery || activeIndustry || activeSubcategory;

  return (
    <div className="overflow-hidden rounded-xl border border-[color:var(--color-border)]">
      {/* ヘッダー */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between bg-white px-5 py-4 text-left hover:bg-[color:var(--color-primary-soft)]"
      >
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold">公開マスタから取り込む</span>
          {rows.length > 0 && (
            <span className="rounded-full bg-[color:var(--color-primary-soft)] px-2.5 py-0.5 text-xs font-medium text-[color:var(--color-primary)]">
              {rows.length}件
            </span>
          )}
          {duplicateCount > 0 && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              既存あり {duplicateCount}件
            </span>
          )}
        </div>
        <svg
          className={`h-5 w-5 shrink-0 text-[color:var(--color-text-muted)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="border-t border-[color:var(--color-border)]">
          {rows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-[color:var(--color-text-muted)]">
              公開マスタはまだ登録されていません
            </p>
          ) : (
            <>
              {/* 説明 */}
              <div className="bg-[color:var(--color-surface)] px-5 py-3">
                <p className="text-sm text-[color:var(--color-text-muted)]">
                  公開データを自社マスタにコピーできます。コピー後は自由に編集可能です。
                </p>
              </div>

              {/* 業種タブ */}
              <div className="border-t border-[color:var(--color-border)] bg-white px-5 py-3">
                <p className="mb-2 text-xs font-semibold text-[color:var(--color-text-muted)]">業種</p>
                <div className="flex flex-wrap gap-1.5">
                  {INDUSTRIES.map((industry) => {
                    const isActive = activeIndustry === industry;
                    const count = rows.filter((r) => r.category === industry).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={industry}
                        type="button"
                        onClick={() => handleIndustryClick(industry)}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition"
                        style={{
                          background: isActive ? "var(--color-primary)" : "var(--color-surface)",
                          color: isActive ? "#fff" : "var(--color-text-muted)",
                          border: `1px solid ${isActive ? "var(--color-primary)" : "var(--color-border)"}`,
                        }}
                      >
                        {industry}
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
                          style={{
                            background: isActive ? "rgba(255,255,255,0.22)" : "var(--color-primary-soft)",
                            color: isActive ? "#fff" : "var(--color-primary)",
                          }}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* サブカテゴリ */}
              {activeIndustry && subcategories.length > 0 && (
                <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {subcategories.map((sub) => {
                      const isActive = activeSubcategory === sub;
                      const count = rows.filter(
                        (r) => r.category === activeIndustry && r.subcategory === sub,
                      ).length;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => handleSubcategoryClick(sub)}
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition"
                          style={{
                            background: isActive ? "var(--color-primary-soft)" : "transparent",
                            color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                            border: `1px solid ${isActive ? "var(--color-primary)" : "var(--color-border)"}`,
                          }}
                        >
                          {sub}
                          <span className="opacity-60">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 検索 + 操作バー */}
              <div className="flex flex-wrap items-center gap-3 border-t border-[color:var(--color-border)] bg-white px-5 py-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="材料名で検索..."
                  className="min-w-0 flex-1 rounded-lg border border-[color:var(--color-border)] px-3 py-2 text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
                />
                <span className="shrink-0 text-sm text-[color:var(--color-text-muted)]">
                  {isFiltering
                    ? `${filteredRows.length} / ${rows.length}件`
                    : `${rows.length}件`}
                  {selected.size > 0 && (
                    <span className="ml-2 font-medium text-[color:var(--color-primary)]">
                      · {selected.size}件選択中
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="shrink-0 text-sm text-[color:var(--color-primary)] hover:underline"
                >
                  表示中を全選択
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="shrink-0 text-sm text-[color:var(--color-text-muted)] hover:underline"
                >
                  選択クリア
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={isPending || selected.size === 0}
                  className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-primary)] px-4 text-sm font-semibold text-white hover:bg-[color:var(--color-primary-hover)] disabled:opacity-50"
                >
                  {isPending ? "取り込み中..." : "選択した項目を取り込む"}
                </button>
              </div>

              {message && (
                <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-primary-soft)] px-5 py-2.5 text-sm text-[color:var(--color-primary)]">
                  {message}
                </div>
              )}

              {/* テーブル */}
              <div className="max-h-96 overflow-y-auto">
                {filteredRows.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-[color:var(--color-text-muted)]">
                    条件に一致する材料が見つかりません
                  </p>
                ) : (
                  <table className="min-w-full divide-y divide-[color:var(--color-border)]">
                    <thead className="sticky top-0 bg-[color:var(--color-primary-soft)]">
                      <tr>
                        <th className="w-12 px-4 py-2.5 text-left text-xs font-semibold uppercase text-[color:var(--color-primary)]">
                          選択
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-[color:var(--color-primary)]">
                          材料名
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-[color:var(--color-primary)]">
                          サブカテゴリ
                        </th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-[color:var(--color-primary)]">
                          単価
                        </th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-[color:var(--color-primary)]">
                          単位
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--color-border)] bg-white">
                      {filteredRows.map((r) => {
                        const isDuplicate = existingSet.has(r.material_name);
                        return (
                          <tr
                            key={r.id}
                            className={
                              selected.has(r.id)
                                ? "bg-[color:var(--color-primary-soft)]"
                                : "hover:bg-gray-50"
                            }
                          >
                            <td className="px-4 py-2.5">
                              <input
                                type="checkbox"
                                checked={selected.has(r.id)}
                                onChange={() => toggle(r.id)}
                                className="h-5 w-5 cursor-pointer accent-[color:var(--color-primary)]"
                              />
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium">{r.material_name}</span>
                                {isDuplicate && (
                                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                                    既存あり
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-sm text-[color:var(--color-text-muted)]">
                              {r.subcategory ?? r.category ?? "-"}
                            </td>
                            <td className="px-4 py-2.5 text-right text-sm">
                              ¥{Number(r.unit_price).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5 text-sm">{r.unit}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
