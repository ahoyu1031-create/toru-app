"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useActionState } from "react";
import { TRADE_CATEGORIES, CATEGORY_MATERIAL_SUGGESTIONS } from "./category-picker";
import { UNIT_GROUPS } from "./unit-picker";

type UnitPrice = {
  id?: string;
  material_name?: string | null;
  unit?: string | null;
  unit_price?: number | null;
  category?: string | null;
  memo?: string | null;
};

type ActionResult = { ok: true } | { ok: false; error: string };

type Props = {
  initial?: UnitPrice;
  action: (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;
  submitLabel: string;
};

type ActiveField = "category" | "material" | "unit" | null;

export function UnitPriceForm({ initial, action, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(action, null);

  const [category, setCategory] = useState(initial?.category ?? "");
  const [materialName, setMaterialName] = useState(initial?.material_name ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "");
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [materialFilter, setMaterialFilter] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(() => {
    if (!initial?.category) return null;
    return Object.entries(TRADE_CATEGORIES).find(
      ([, items]) => items.includes(initial.category!)
    )?.[0] ?? null;
  });

  const subCatsForGroup = selectedGroup
    ? (TRADE_CATEGORIES[selectedGroup] ?? []).filter((item) => item !== selectedGroup)
    : [];

  const materialRef = useRef<HTMLInputElement>(null);
  const unitRef = useRef<HTMLInputElement>(null);

  const materialSuggestions = CATEGORY_MATERIAL_SUGGESTIONS[category] ?? [];
  const filteredMaterials = materialFilter.trim()
    ? materialSuggestions.filter((m) => m.toLowerCase().includes(materialFilter.toLowerCase()))
    : materialSuggestions;

  function selectCategory(cat: string) {
    setCategory(cat);
    setSelectedGroup(null);
    setActiveField("material");
    setMaterialFilter("");
    setTimeout(() => materialRef.current?.focus(), 50);
  }

  function selectMaterial(m: string) {
    setMaterialName(m);
    setMaterialFilter("");
    setActiveField(null);
  }

  function selectUnit(u: string) {
    setUnit(u);
    setActiveField(null);
    unitRef.current?.blur();
  }

  return (
    <div className="flex gap-6 items-start">
      {/* ── 左：フォーム ── */}
      <form
        action={formAction}
        className="w-[400px] shrink-0 rounded-xl border p-6 shadow-sm"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {/* カテゴリ */}
        <div className="mb-5">
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
            カテゴリ
          </label>
          {category ? (
            <div className="flex items-center gap-2">
              <span
                className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium"
                style={{
                  background: "var(--color-primary-soft)",
                  color: "var(--color-primary)",
                  border: "1.5px solid var(--color-primary)",
                }}
              >
                {category}
              </span>
              <button
                type="button"
                onClick={() => { setCategory(""); setSelectedGroup(null); setActiveField("category"); }}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-sm transition hover:opacity-70"
                style={{ background: "var(--color-bg)", border: "1.5px solid var(--color-border)", color: "var(--color-text-muted)" }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setActiveField("category")}
              className="w-full rounded-lg px-4 py-2.5 text-left text-sm transition"
              style={{
                background: activeField === "category" ? "var(--color-primary-soft)" : "var(--color-bg)",
                border: `1.5px solid ${activeField === "category" ? "var(--color-primary)" : "var(--color-border)"}`,
                color: "var(--color-text-muted)",
              }}
            >
              右のパネルからカテゴリを選択...
            </button>
          )}
          <input type="hidden" name="category" value={category} />
        </div>

        {/* 材料名 */}
        <div className="mb-5">
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
            材料名 <span style={{ color: "var(--color-danger)" }}>*</span>
          </label>
          <input
            ref={materialRef}
            name="material_name"
            type="text"
            required
            value={materialName}
            onChange={(e) => { setMaterialName(e.target.value); setMaterialFilter(e.target.value); }}
            onFocus={() => setActiveField("material")}
            placeholder={category ? `${category}の材料名を入力` : "材料名を入力"}
            autoComplete="off"
            className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition"
            style={{
              background: "var(--color-bg)",
              border: `1.5px solid ${activeField === "material" ? "var(--color-primary)" : "var(--color-border)"}`,
              color: "var(--color-text)",
            }}
          />
        </div>

        {/* 単価・単位 */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
              単価（円） <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <input
              name="unit_price"
              type="number"
              step="1"
              min="0"
              required
              defaultValue={initial?.unit_price ?? ""}
              placeholder="0"
              onFocus={() => setActiveField(null)}
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition"
              style={{
                background: "var(--color-bg)",
                border: "1.5px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
              単位 <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>
            <input
              ref={unitRef}
              name="unit"
              type="text"
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              onFocus={() => setActiveField("unit")}
              placeholder="右から選択または入力"
              autoComplete="off"
              className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition"
              style={{
                background: "var(--color-bg)",
                border: `1.5px solid ${activeField === "unit" ? "var(--color-primary)" : "var(--color-border)"}`,
                color: "var(--color-text)",
              }}
            />
          </div>
        </div>

        {/* メモ */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
            メモ（任意）
          </label>
          <textarea
            name="memo"
            rows={3}
            defaultValue={initial?.memo ?? ""}
            placeholder="仕入先・注意点など"
            onFocus={() => setActiveField(null)}
            className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition resize-none"
            style={{
              background: "var(--color-bg)",
              border: "1.5px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          />
        </div>

        {state && !state.ok && (
          <p className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(220,38,38,0.08)", color: "var(--color-danger)", border: "1px solid var(--color-danger)" }}>
            {state.error}
          </p>
        )}

        <div className="flex gap-3">
          <Link
            href="/unit-prices"
            className="flex-1 rounded-xl py-2.5 text-center text-sm font-medium transition hover:opacity-80"
            style={{ background: "var(--color-bg)", border: "1.5px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}
          >
            {isPending ? "保存中..." : submitLabel}
          </button>
        </div>
      </form>

      {/* ── 右：候補パネル ── */}
      <div className="flex-1 min-w-0">
        {activeField === "category" && (
          <div
            className="rounded-xl border p-5 shadow-sm"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <div className="mb-3 flex items-baseline gap-3">
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>カテゴリを選択</p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>業種を選択→サブカテゴリを選択（任意）</p>
            </div>
            <div className="space-y-2">
              {Object.entries(TRADE_CATEGORIES).map(([group, items]) => {
                const subCats = items.filter((item) => item !== group);
                const isSelected = category === group;
                const isExpanded = selectedGroup === group;
                return (
                  <div key={group}>
                    {/* メインカテゴリ：フルwidthボタン */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGroup(isExpanded && subCats.length > 0 ? null : group);
                        setCategory(group);
                      }}
                      className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-bold transition-all hover:opacity-80"
                      style={{
                        cursor: "pointer",
                        background: isSelected ? "var(--color-primary)" : "var(--color-primary-soft)",
                        color: isSelected ? "#fff" : "var(--color-primary)",
                        border: `2px solid ${isSelected || isExpanded ? "var(--color-primary)" : "transparent"}`,
                      }}
                    >
                      <span className="flex items-center justify-between">
                        {group}
                        {subCats.length > 0 && (
                          <span style={{ fontSize: "11px", opacity: 0.6 }}>{isExpanded ? "▲" : "▼"}</span>
                        )}
                      </span>
                    </button>
                    {/* サブカテゴリ：展開時のみ表示 */}
                    {isExpanded && subCats.length > 0 && (
                      <div className="mt-2 ml-3 flex flex-wrap gap-2 pb-1">
                        {subCats.map((sub) => {
                          const isSubSelected = category === sub;
                          return (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => selectCategory(sub)}
                              className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:shadow-[0_0_0_2px_var(--color-primary)]"
                              style={{
                                cursor: "pointer",
                                background: isSubSelected ? "var(--color-primary)" : "var(--color-bg)",
                                color: isSubSelected ? "#fff" : "var(--color-text)",
                                border: `1.5px solid ${isSubSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                              }}
                            >
                              {sub}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeField === "material" && (
          <div
            className="rounded-xl border p-5 shadow-sm"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <p className="mb-1 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              材料名の候補
              {category && <span className="ml-2 text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>{category}</span>}
            </p>
            {filteredMaterials.length === 0 ? (
              <p className="mt-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
                {category ? "このカテゴリの候補はありません" : "カテゴリを選ぶと候補が絞られます"}
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {filteredMaterials.map((m) => {
                  const isSelected = materialName === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => selectMaterial(m)}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:shadow-[0_0_0_2px_var(--color-primary)]"
                      style={{
                        cursor: "pointer",
                        background: isSelected ? "var(--color-primary)" : "var(--color-bg)",
                        color: isSelected ? "#fff" : "var(--color-text)",
                        border: `1.5px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeField === "unit" && (
          <div
            className="rounded-xl border p-5 shadow-sm"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <p className="mb-4 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              単位を選択
            </p>
            <div className="space-y-4">
              {Object.entries(UNIT_GROUPS).map(([group, items]) => (
                <div key={group}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-muted)" }}>
                    {group}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => {
                      const isSelected = unit === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => selectUnit(item)}
                          className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:shadow-[0_0_0_2px_var(--color-primary)]"
                          style={{
                            cursor: "pointer",
                            background: isSelected ? "var(--color-primary)" : "var(--color-bg)",
                            color: isSelected ? "#fff" : "var(--color-text)",
                            border: `1.5px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                          }}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeField === null && (
          <div
            className="rounded-xl border p-8 text-center"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
          >
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              フォームのフィールドをクリックすると<br />ここに候補が表示されます
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
