"use client";

import React, { useRef, useState, useTransition, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Check, Loader2, Trash2 } from "lucide-react";
import { quickUpdateField, bulkDeleteUnitPrices } from "./actions";
import { DeleteButton } from "./delete-button";
import { ALL_CATEGORIES, TRADE_CATEGORIES } from "./category-picker";
import { UnitInput } from "@/components/unit-input";

type Row = {
  id: string;
  material_name: string;
  unit: string;
  unit_price: number;
  category: string | null;
  memo: string | null;
};

const baseCellStyle: React.CSSProperties = {
  background: "var(--color-bg)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  color: "var(--color-text)",
  fontSize: 13,
  padding: "5px 8px",
  width: "100%",
  outline: "none",
};

// ComboInput と同じ見た目・操作感で、createPortal でドロップダウンを body に出す
function CategoryPortalInput({
  value,
  onChange,
  onBlur,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
}) {
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [browseMode, setBrowseMode] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function openDropdown(browse: boolean) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const r = containerRef.current?.getBoundingClientRect();
    if (r) setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
    setOpen(true);
    setBrowseMode(browse);
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      setBrowseMode(false);
      setExpandedGroup(null);
      onBlur?.();
    }, 150);
  }

  function select(v: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setText(v);
    onChange(v);
    setOpen(false);
    setBrowseMode(false);
    setExpandedGroup(null);
  }

  const filtered = text.trim()
    ? ALL_CATEGORIES.filter((s) => s.toLowerCase().includes(text.toLowerCase()))
    : [];

  const showFiltered = open && !browseMode && filtered.length > 0;
  const showBrowse = open && browseMode;

  const dropdown = (showFiltered || showBrowse) && dropPos ? (
    <div
      style={{
        position: "fixed",
        top: dropPos.top,
        left: dropPos.left,
        width: Math.max(dropPos.width, 220),
        zIndex: 99999,
        background: "white",
        border: "1px solid var(--color-border)",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        maxHeight: 260,
        overflowY: "auto",
      }}
    >
      {showFiltered
        ? filtered.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); select(s); }}
              style={{
                display: "block",
                width: "100%",
                padding: "9px 14px",
                fontSize: 13,
                textAlign: "left",
                background: text === s ? "var(--color-primary-soft)" : "transparent",
                color: text === s ? "var(--color-primary)" : "var(--color-text)",
                fontWeight: text === s ? 600 : 400,
                border: "none",
                cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))
        : Object.entries(TRADE_CATEGORIES).map(([group, items]) => {
            const isExpanded = expandedGroup === group;
            return (
              <div key={group}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setExpandedGroup(isExpanded ? null : group);
                  }}
                  style={{
                    display: "flex",
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--color-text)",
                    background: isExpanded ? "var(--color-primary-soft)" : "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span>{group}</span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {isExpanded && items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); select(item); }}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "8px 26px",
                      fontSize: 13,
                      textAlign: "left",
                      background: text === item ? "var(--color-primary-soft)" : "var(--color-bg)",
                      color: text === item ? "var(--color-primary)" : "var(--color-text)",
                      fontWeight: text === item ? 600 : 400,
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            );
          })}
    </div>
  ) : null;

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          background: "var(--color-bg)",
          overflow: "hidden",
        }}
      >
        <input
          type="text"
          value={text}
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            onChange(v);
            if (v.trim()) openDropdown(false);
            else setOpen(false);
          }}
          onFocus={() => openDropdown(false)}
          onBlur={scheduleClose}
          placeholder="未設定"
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            padding: "5px 8px",
            fontSize: 13,
            color: "var(--color-text)",
            outline: "none",
          }}
        />
        <div style={{ width: 1, background: "var(--color-border)" }} />
        <button
          type="button"
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
            if (open && browseMode) { setOpen(false); setBrowseMode(false); }
            else openDropdown(true);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 8px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--color-text-muted)",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      {typeof document !== "undefined" && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </div>
  );
}

function EditableRow({ row, isSelected, onToggle }: { row: Row; isSelected: boolean; onToggle: () => void }) {
  const categoryRef = useRef(row.category ?? "");
  const [price, setPrice] = useState(String(row.unit_price || ""));
  const [unit, setUnit] = useState(row.unit);
  const [priceBorder, setPriceBorder] = useState(!row.unit_price ? "#FCA5A5" : "var(--color-border)");
  const [isPending, startTransition] = useTransition();

  function save(field: "category" | "unit_price" | "unit", value: string) {
    startTransition(() => { quickUpdateField(row.id, field, value); });
  }

  return (
    <tr style={{ borderBottom: "1px solid var(--color-border)", background: isSelected ? "var(--color-primary-soft)" : "var(--color-surface)" }}>
      {/* チェックボックス */}
      <td className="pl-4 py-2.5 align-middle w-8">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="h-4 w-4 cursor-pointer accent-[color:var(--color-primary)]"
        />
      </td>
      {/* 材料名 */}
      <td className="px-4 py-2.5 align-middle">
        <div className="font-medium text-sm" style={{ color: "var(--color-text)" }}>{row.material_name}</div>
        {row.memo && <div className="text-xs mt-0.5" style={{ color: "var(--color-text-subtle)" }}>{row.memo}</div>}
      </td>

      {/* カテゴリ */}
      <td className="px-2 py-2 align-middle w-40">
        <CategoryPortalInput
          value={row.category ?? ""}
          onChange={(v) => { categoryRef.current = v; }}
          onBlur={() => save("category", categoryRef.current)}
        />
      </td>

      {/* 単価 */}
      <td className="px-2 py-2 align-middle w-32">
        <input
          type="number"
          value={price}
          onChange={(e) => {
            setPrice(e.target.value);
            setPriceBorder(!e.target.value || Number(e.target.value) === 0 ? "#FCA5A5" : "var(--color-border)");
          }}
          onFocus={() => setPriceBorder("var(--color-primary)")}
          onBlur={() => {
            setPriceBorder(!price || Number(price) === 0 ? "#FCA5A5" : "var(--color-border)");
            save("unit_price", price);
          }}
          placeholder="0"
          min="0"
          style={{ ...baseCellStyle, textAlign: "right", borderColor: priceBorder }}
        />
      </td>

      {/* 単位 */}
      <td className="px-2 py-2 align-middle w-28">
        <UnitInput
          value={unit}
          onChange={(v) => { setUnit(v); save("unit", v); }}
          inputClassName="w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 text-[13px] text-[color:var(--color-text)] focus:outline-none focus:border-[color:var(--color-primary)]"
        />
      </td>

      {/* 操作 */}
      <td className="px-4 py-2.5 align-middle text-right">
        <div className="flex justify-end items-center gap-2">
          {isPending && <Loader2 size={13} className="animate-spin" style={{ color: "var(--color-text-muted)" }} />}
          <Link
            href={`/unit-prices/${row.id}`}
            className="inline-flex h-8 items-center justify-center rounded-lg border px-3 text-sm font-medium transition hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
            style={{ borderColor: "var(--color-border)" }}
          >
            詳細
          </Link>
          <DeleteButton id={row.id} label={row.material_name} />
        </div>
      </td>
    </tr>
  );
}

function ViewRow({ row }: { row: Row }) {
  return (
    <tr
      className="transition-colors hover:bg-[color:var(--color-bg)]"
      style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}
    >
      <td className="px-4 py-3 align-middle">
        <div className="font-medium text-sm" style={{ color: "var(--color-text)" }}>{row.material_name}</div>
        {row.memo && <div className="text-xs mt-0.5" style={{ color: "var(--color-text-subtle)" }}>{row.memo}</div>}
      </td>
      <td className="px-4 py-3 align-middle text-sm" style={{ color: row.category ? "var(--color-text)" : "var(--color-text-subtle)" }}>
        {row.category ?? "未設定"}
      </td>
      <td className="px-4 py-3 align-middle text-right font-medium tabular-nums text-sm" style={{ color: row.unit_price > 0 ? "var(--color-text)" : "var(--color-text-subtle)" }}>
        {row.unit_price > 0 ? `¥${Number(row.unit_price).toLocaleString()}` : "—"}
      </td>
      <td className="px-4 py-3 align-middle text-sm" style={{ color: row.unit ? "var(--color-text)" : "var(--color-text-subtle)" }}>
        {row.unit || "—"}
      </td>
      <td className="px-4 py-3 align-middle text-right">
        <div className="flex justify-end gap-2">
          <Link
            href={`/unit-prices/${row.id}`}
            className="inline-flex h-8 items-center justify-center rounded-lg border px-3 text-sm font-medium transition hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
            style={{ borderColor: "var(--color-border)" }}
          >
            編集
          </Link>
          <DeleteButton id={row.id} label={row.material_name} />
        </div>
      </td>
    </tr>
  );
}

function MobileViewCard({
  row,
  isSelected,
  editMode,
  onToggle,
}: {
  row: Row;
  isSelected: boolean;
  editMode: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3.5"
      style={{
        borderBottom: "1px solid var(--color-border)",
        background: isSelected ? "var(--color-primary-soft)" : "var(--color-surface)",
      }}
    >
      {editMode && (
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[color:var(--color-primary)]"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              {row.material_name}
            </p>
            {row.memo && (
              <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-subtle)" }}>{row.memo}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold tabular-nums" style={{ color: row.unit_price > 0 ? "var(--color-text)" : "var(--color-text-subtle)" }}>
              {row.unit_price > 0 ? `¥${Number(row.unit_price).toLocaleString()}` : "—"}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {row.unit || "単位未設定"}
            </p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{
              background: row.category ? "var(--color-primary-soft)" : "var(--color-bg)",
              color: row.category ? "var(--color-primary)" : "var(--color-text-subtle)",
              border: "1px solid var(--color-border)",
            }}
          >
            {row.category ?? "未設定"}
          </span>
          <div className="flex gap-1.5">
            <Link
              href={`/unit-prices/${row.id}`}
              className="inline-flex h-7 items-center justify-center rounded-lg border px-2.5 text-xs font-medium transition hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
            >
              編集
            </Link>
            <DeleteButton id={row.id} label={row.material_name} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function UnitPriceTable({ rows }: { rows: Row[] }) {
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [isBulkDeleting, startBulkDelete] = useTransition();
  const router = useRouter();

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGroup(ids: string[]) {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  }

  function handleBulkDelete() {
    startBulkDelete(async () => {
      await bulkDeleteUnitPrices(Array.from(selected));
      setSelected(new Set());
      setShowBulkConfirm(false);
      router.refresh();
    });
  }

  // カテゴリでグループ化
  const groups = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const row of rows) {
      const key = row.category ?? "未設定";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }
    return Array.from(map.entries());
  }, [rows]);

  // デフォルト: 全て折りたたみ
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(groups.map(([k]) => k)));

  function toggleCategory(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const allExpanded = collapsed.size === 0;

  return (
    <div>
      {/* 一括削除確認ダイアログ */}
      {showBulkConfirm && typeof document !== "undefined" && createPortal(
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowBulkConfirm(false)}
        >
          <div
            style={{ background: "var(--color-surface)", borderRadius: 16, padding: 24, width: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
              {selected.size}件を一括削除
            </h3>
            <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: 20 }}>
              選択した{selected.size}件の単価を削除します。この操作は取り消せません。
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowBulkConfirm(false)}
                style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "1.5px solid var(--color-border)", background: "var(--color-bg)", color: "var(--color-text-muted)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                style={{ height: 40, padding: "0 16px", borderRadius: 10, background: "#dc2626", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: isBulkDeleting ? 0.6 : 1, border: "none" }}
              >
                {isBulkDeleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="flex justify-end gap-2 mb-2">
        <button
          type="button"
          onClick={() => setCollapsed(allExpanded ? new Set(groups.map(([k]) => k)) : new Set())}
          className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-medium transition"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
        >
          {allExpanded ? "全て折りたたむ" : "全て展開"}
        </button>
        {editMode && selected.size > 0 && (
          <button
            type="button"
            onClick={() => setShowBulkConfirm(true)}
            className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition"
            style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#dc2626" }}
          >
            <Trash2 size={14} />
            {selected.size}件を削除
          </button>
        )}
        <button
          type="button"
          onClick={() => { setEditMode((v) => !v); setSelected(new Set()); }}
          className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition"
          style={
            editMode
              ? { background: "var(--color-primary)", color: "#fff" }
              : { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }
          }
        >
          {editMode ? <><Check size={14} />編集完了</> : <><Pencil size={14} />一括編集</>}
        </button>
      </div>

      <section className="overflow-hidden rounded-xl shadow-sm" style={{ border: "1px solid var(--color-border)" }}>

        {/* ── モバイル：カードリスト ── */}
        <div className="sm:hidden">
          {groups.map(([category, categoryRows]) => {
            const isCollapsed = collapsed.has(category);
            return (
              <React.Fragment key={category}>
                {/* カテゴリヘッダー */}
                <div
                  onClick={() => toggleCategory(category)}
                  className="flex cursor-pointer items-center gap-2 px-4 py-2.5 hover:opacity-80 transition-opacity"
                  style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}
                >
                  {editMode && (
                    <span onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={categoryRows.every((r) => selected.has(r.id))}
                        onChange={() => toggleGroup(categoryRows.map((r) => r.id))}
                        className="h-4 w-4 cursor-pointer accent-[color:var(--color-primary)]"
                      />
                    </span>
                  )}
                  <svg
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth={2.5}
                    style={{
                      color: "var(--color-text-muted)",
                      transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                      transition: "transform 0.18s",
                      flexShrink: 0,
                    }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                    {category}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ background: "var(--color-primary-soft)", color: "var(--color-primary)" }}
                  >
                    {categoryRows.length}件
                  </span>
                </div>
                {/* カード */}
                {!isCollapsed && categoryRows.map((r) => (
                  <MobileViewCard
                    key={r.id}
                    row={r}
                    isSelected={selected.has(r.id)}
                    editMode={editMode}
                    onToggle={() => toggleSelect(r.id)}
                  />
                ))}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── デスクトップ：テーブル ── */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
                {editMode && (
                  <th className="pl-4 py-3 w-8">
                    <input
                      type="checkbox"
                      checked={rows.length > 0 && rows.every((r) => selected.has(r.id))}
                      onChange={() => {
                        const allSelected = rows.every((r) => selected.has(r.id));
                        setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
                      }}
                      className="h-4 w-4 cursor-pointer accent-[color:var(--color-primary)]"
                    />
                  </th>
                )}
                {["材料名", "カテゴリ", "単価", "単位", "操作"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${i === 2 || i === 4 ? "text-right" : "text-left"}`}
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map(([category, categoryRows]) => {
                const isCollapsed = collapsed.has(category);
                return (
                  <React.Fragment key={category}>
                    <tr
                      onClick={() => toggleCategory(category)}
                      style={{
                        cursor: "pointer",
                        background: "var(--color-bg)",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                      className="hover:opacity-80 transition-opacity"
                    >
                      {editMode && (
                        <td className="pl-4 py-2.5 w-8" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={categoryRows.every((r) => selected.has(r.id))}
                            onChange={() => toggleGroup(categoryRows.map((r) => r.id))}
                            className="h-4 w-4 cursor-pointer accent-[color:var(--color-primary)]"
                          />
                        </td>
                      )}
                      <td colSpan={5} className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <svg
                            width="14" height="14" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" strokeWidth={2.5}
                            style={{
                              color: "var(--color-text-muted)",
                              transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)",
                              transition: "transform 0.18s",
                              flexShrink: 0,
                            }}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                          <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                            {category}
                          </span>
                          <span
                            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{ background: "var(--color-primary-soft)", color: "var(--color-primary)" }}
                          >
                            {categoryRows.length}件
                          </span>
                        </div>
                      </td>
                    </tr>
                    {!isCollapsed && categoryRows.map((r) =>
                      editMode
                        ? <EditableRow key={r.id} row={r} isSelected={selected.has(r.id)} onToggle={() => toggleSelect(r.id)} />
                        : <ViewRow key={r.id} row={r} />
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
