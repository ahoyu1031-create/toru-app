"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

type UnitPriceMaster = {
  id: string;
  material_name: string;
  unit: string;
  unit_price: number;
  category: string | null;
};

export function MasterPickerModal({
  masters,
  onPick,
  onClose,
}: {
  masters: UnitPriceMaster[];
  onPick: (m: UnitPriceMaster) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("");

  const allCategories = useMemo(
    () => Array.from(new Set(masters.map((m) => m.category ?? "その他"))),
    [masters],
  );

  const filtered = useMemo(
    () =>
      masters.filter((m) => {
        if (activeCategory && (m.category ?? "その他") !== activeCategory) return false;
        if (q && !m.material_name.toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      }),
    [masters, q, activeCategory],
  );

  const grouped = useMemo(() => {
    if (activeCategory) return [[activeCategory, filtered] as [string, UnitPriceMaster[]]];
    const map = new Map<string, UnitPriceMaster[]>();
    for (const m of filtered) {
      const key = m.category ?? "その他";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries());
  }, [filtered, activeCategory]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="flex h-[72vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div
          className="flex shrink-0 items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div>
            <h3 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
              単価マスタから選択
            </h3>
            <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
              選択すると材料名・単位・単価が自動入力されます
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold transition hover:opacity-70"
            style={{ color: "var(--color-text-muted)", background: "var(--color-bg)" }}
          >
            ×
          </button>
        </div>

        {/* 検索 */}
        <div className="shrink-0 px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <input
            autoFocus
            type="text"
            value={q}
            onChange={(e) => { setQ(e.target.value); setActiveCategory(""); }}
            placeholder="材料名で検索..."
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          />
        </div>

        {/* 2ペイン */}
        <div className="flex flex-1 overflow-hidden">
          {/* 左サイドバー */}
          <div
            className="flex w-44 shrink-0 flex-col overflow-y-auto"
            style={{ borderRight: "1px solid var(--color-border)", background: "var(--color-bg)" }}
          >
            <button
              type="button"
              onClick={() => setActiveCategory("")}
              className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-semibold transition"
              style={{
                background: activeCategory === "" ? "var(--color-primary)" : "transparent",
                color: activeCategory === "" ? "#fff" : "var(--color-text)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <span>すべて</span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  background: activeCategory === "" ? "rgba(255,255,255,0.22)" : "var(--color-primary-soft)",
                  color: activeCategory === "" ? "#fff" : "var(--color-primary)",
                }}
              >
                {masters.length}
              </span>
            </button>
            {allCategories.map((cat) => {
              const count = masters.filter((m) => (m.category ?? "その他") === cat).length;
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition"
                  style={{
                    background: isActive ? "var(--color-primary)" : "transparent",
                    color: isActive ? "#fff" : "var(--color-text-muted)",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span className="min-w-0 truncate leading-snug">{cat}</span>
                  <span
                    className="ml-1 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
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

          {/* 右パネル */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  {q ? `「${q}」に一致する材料がありません` : "登録された材料がありません"}
                </p>
              </div>
            ) : (
              grouped.map(([cat, items]) => (
                <div key={cat}>
                  {!activeCategory && (
                    <div
                      className="sticky top-0 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider"
                      style={{
                        color: "var(--color-text-subtle)",
                        background: "var(--color-primary-soft)",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      {cat}
                    </div>
                  )}
                  {items.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onPick(m)}
                      className="flex w-full items-center justify-between px-5 py-3 text-left transition"
                      style={{ borderBottom: "1px solid var(--color-border)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-primary-soft)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                          {m.material_name}
                        </p>
                        <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                          単位: {m.unit}
                        </p>
                      </div>
                      <span
                        className="ml-6 shrink-0 text-base font-bold tabular-nums"
                        style={{ color: "var(--color-primary)" }}
                      >
                        ¥{Number(m.unit_price).toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* フッター */}
        <div
          className="flex shrink-0 items-center justify-between px-5 py-3"
          style={{ borderTop: "1px solid var(--color-border)", background: "var(--color-bg)" }}
        >
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {filtered.length} / {masters.length} 件
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-5 py-2 text-sm font-medium transition hover:opacity-80"
            style={{
              background: "var(--color-surface)",
              color: "var(--color-text-muted)",
              border: "1px solid var(--color-border)",
            }}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
