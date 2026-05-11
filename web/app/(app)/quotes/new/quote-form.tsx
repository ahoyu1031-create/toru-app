"use client";

import { Fragment, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { MasterPickerModal } from "@/components/master-picker-modal";
import { createQuote, saveDraft } from "../actions";
import { UnitInput } from "@/components/unit-input";
import { AnalysisPickerModal } from "@/components/analysis-picker-modal";
import type { MaterialItem } from "@/app/(app)/drawings/actions";

type DrawingMaterial = {
  material_name: string;
  quantity: number;
  unit: string;
};

type UnitPriceMaster = {
  id: string;
  material_name: string;
  unit: string;
  unit_price: number;
  category: string | null;
};

type ItemRow = {
  key: number;
  material_name: string;
  unit: string;
  quantity: string;
  unit_price: string;
  unit_price_master_id: string | null;
};

/* ── 材料名の正規化マッチング ─────────────────────── */
function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    // 全角英数字 → 半角
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    // ダッシュ系を統一
    .replace(/[－ー―]/g, "-")
    // 中点・カッコ類を除去
    .replace(/[・（）()]/g, "");
}

function findMasterMatch(name: string, masters: UnitPriceMaster[]): UnitPriceMaster | null {
  const n = normalizeName(name);
  return masters.find((m) => normalizeName(m.material_name) === n) ?? null;
}

function findPartialMatches(name: string, masters: UnitPriceMaster[], limit = 3): UnitPriceMaster[] {
  if (!name.trim()) return [];
  const n = normalizeName(name);
  const tokens = n.match(/[a-zぁ-鿿＀-￯]+|\d+/g) ?? [];
  if (tokens.length === 0) return [];
  const threshold = Math.max(1, Math.floor(tokens.length * 0.5));
  return masters
    .map((m) => {
      const mn = normalizeName(m.material_name);
      const matchCount = tokens.filter((t) => mn.includes(t)).length;
      return { m, matchCount, mn };
    })
    .filter(({ matchCount }) => matchCount >= threshold)
    .sort((a, b) => {
      if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
      return Math.abs(a.mn.length - n.length) - Math.abs(b.mn.length - n.length);
    })
    .slice(0, limit)
    .map(({ m }) => m);
}

let keyCounter = 0;
function newRow(): ItemRow {
  return {
    key: ++keyCounter,
    material_name: "",
    unit: "",
    quantity: "",
    unit_price: "",
    unit_price_master_id: null,
  };
}

function subtotal(row: ItemRow): number {
  const q = parseFloat(row.quantity) || 0;
  const p = parseFloat(row.unit_price) || 0;
  return q * p;
}

export function QuoteForm({ masters }: { masters: UnitPriceMaster[] }) {
  const [state, action, pending] = useActionState(createQuote, null);
  const [, draftAction, draftPending] = useActionState(saveDraft, null);
  const [rows, setRows] = useState<ItemRow[]>([newRow()]);

  // mastersはサーバー側で固定なのでrefで安全に参照
  const mastersRef = useRef(masters);
  mastersRef.current = masters;

  useEffect(() => {
    const raw = sessionStorage.getItem("toru_drawing_materials");
    if (!raw) return;
    sessionStorage.removeItem("toru_drawing_materials");
    try {
      const materials: DrawingMaterial[] = JSON.parse(raw);
      if (materials.length > 0) {
        setRows(
          materials.map((m) => {
            const match = findMasterMatch(m.material_name, mastersRef.current);
            return {
              key: ++keyCounter,
              material_name: m.material_name,
              unit: m.unit,
              quantity: String(m.quantity),
              unit_price: match ? String(match.unit_price) : "",
              unit_price_master_id: match?.id ?? null,
            };
          }),
        );
      }
    } catch {
      // ignore
    }
  }, []);
  const [showMasterPicker, setShowMasterPicker] = useState<number | null>(null);
  const [showAnalysisPicker, setShowAnalysisPicker] = useState(false);
  // どの行の候補ドロップダウンが開いているか
  const [openCandidateRow, setOpenCandidateRow] = useState<number | null>(null);

  const total = rows.reduce((s, r) => s + subtotal(r), 0);

  // 各行の部分一致候補を事前計算（完全一致済み行はスキップ）
  const rowCandidates = useMemo(() => {
    const map = new Map<number, UnitPriceMaster[]>();
    for (const row of rows) {
      if (row.unit_price_master_id || !row.material_name) {
        map.set(row.key, []);
      } else {
        map.set(row.key, findPartialMatches(row.material_name, masters));
      }
    }
    return map;
  }, [rows, masters]);

  function updateRow(key: number, patch: Partial<ItemRow>) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  function addRow() {
    setRows((prev) => [...prev, newRow()]);
  }

  function removeRow(key: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  function pickMaster(rowKey: number, master: UnitPriceMaster) {
    updateRow(rowKey, {
      material_name: master.material_name,
      unit: master.unit,
      unit_price: String(master.unit_price),
      unit_price_master_id: master.id,
    });
    setShowMasterPicker(null);
  }

  function addAnalysisItems(selected: MaterialItem[]) {
    const newRows = selected.map((m) => {
      const match = findMasterMatch(m.material_name, masters);
      return {
        key: ++keyCounter,
        material_name: m.material_name,
        unit: m.unit,
        quantity: String(m.quantity),
        unit_price: match ? String(match.unit_price) : "",
        unit_price_master_id: match?.id ?? null,
      };
    });
    setRows((prev) => {
      const hasEmpty = prev.length === 1 && !prev[0].material_name;
      return hasEmpty ? newRows : [...prev, ...newRows];
    });
  }

  function buildItemsJson(): string {
    return JSON.stringify(
      rows.map((r, i) => ({
        material_name: r.material_name,
        unit: r.unit,
        quantity: parseFloat(r.quantity) || 0,
        unit_price: parseFloat(r.unit_price) || 0,
        unit_price_master_id: r.unit_price_master_id,
        sort_order: i,
      })),
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
    {/* 解析結果選択モーダル */}
    {showAnalysisPicker && (
      <AnalysisPickerModal
        onAdd={addAnalysisItems}
        onClose={() => setShowAnalysisPicker(false)}
      />
    )}

    {/* マスタ選択モーダル */}
    {showMasterPicker !== null && (
      <MasterPickerModal
        masters={masters}
        onPick={(m) => pickMaster(showMasterPicker, m)}
        onClose={() => setShowMasterPicker(null)}
      />
    )}

    <form action={action} className="space-y-8">
      {/* header fields */}
      <section className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <h2 className="text-lg font-semibold">基本情報</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium">
              プロジェクト名
            </label>
            <input
              name="project_name"
              type="text"
              placeholder="例: ○○ビル配管工事"
              className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-base focus:border-[color:var(--color-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              クライアント名
            </label>
            <input
              name="client_name"
              type="text"
              placeholder="例: 株式会社○○"
              className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-base focus:border-[color:var(--color-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">見積日</label>
            <input
              name="quote_date"
              type="date"
              defaultValue={today}
              className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-base focus:border-[color:var(--color-primary)] focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* conditions */}
      <section className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <h2 className="text-lg font-semibold">見積条件</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">1. 受渡期日</label>
            <input
              name="delivery_date"
              type="text"
              placeholder="例: 3週間後、令和8年3月末"
              className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-base focus:border-[color:var(--color-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">2. 納入場所</label>
            <input
              name="delivery_location"
              type="text"
              placeholder="例: 貴社指定通り"
              className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-base focus:border-[color:var(--color-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">3. 支払条件</label>
            <input
              name="payment_terms"
              type="text"
              defaultValue="従来通り"
              className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-base focus:border-[color:var(--color-primary)] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">4. 有効期限</label>
            <input
              name="valid_until"
              type="text"
              defaultValue="30日"
              className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-base focus:border-[color:var(--color-primary)] focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">備考</label>
            <textarea
              name="notes"
              rows={2}
              placeholder="見積書下部に表示されます"
              className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-base focus:border-[color:var(--color-primary)] focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* items */}
      <section className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">明細</h2>
          <div className="flex items-center gap-2">
            {masters.length > 0 && (
              <span className="hidden text-xs text-[color:var(--color-text-muted)] sm:block">
                「マスタから選択」で単価を自動入力できます
              </span>
            )}
            <button
              type="button"
              onClick={() => setShowAnalysisPicker(true)}
              className="inline-flex h-9 items-center justify-center rounded-lg border-2 px-3 text-sm font-medium transition"
              style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
            >
              解析結果から選択
            </button>
          </div>
        </div>

        {/* デスクトップ：テーブルレイアウト */}
        <div className="mt-4 hidden overflow-x-auto sm:block">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-[color:var(--color-border)]">
                <th className="py-2 pr-3 text-left text-xs font-semibold text-[color:var(--color-text-muted)] w-[36%]">
                  材料名
                </th>
                <th className="py-2 pr-3 text-left text-xs font-semibold text-[color:var(--color-text-muted)] w-[12%]">
                  単位
                </th>
                <th className="py-2 pr-3 text-right text-xs font-semibold text-[color:var(--color-text-muted)] w-[14%]">
                  数量
                </th>
                <th className="py-2 pr-3 text-right text-xs font-semibold text-[color:var(--color-text-muted)] w-[16%]">
                  単価
                </th>
                <th className="py-2 pr-3 text-right text-xs font-semibold text-[color:var(--color-text-muted)] w-[16%]">
                  小計
                </th>
                <th className="py-2 w-[6%]" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const candidates = rowCandidates.get(row.key) ?? [];
                const hasCandidates = candidates.length > 0;
                const isMasterApplied = !!row.unit_price_master_id;
                const isCandidateOpen = openCandidateRow === row.key;

                return (
                <Fragment key={row.key}>
                  {/* メイン行 */}
                  <tr className="border-b border-[color:var(--color-border)]">
                    {/* 材料名 */}
                    <td className="py-2 pr-3">
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={row.material_name}
                          onChange={(e) =>
                            updateRow(row.key, {
                              material_name: e.target.value,
                              unit_price_master_id: null,
                            })
                          }
                          placeholder="塩ビ管 VU50"
                          className="w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
                        />
                        {masters.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowMasterPicker(row.key)}
                            className="shrink-0 rounded-lg border-2 border-[color:var(--color-border)] bg-white px-2 text-xs text-[color:var(--color-text-muted)] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
                            title="マスタから選択"
                          >
                            選択
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 単位 */}
                    <td className="py-2 pr-3">
                      <UnitInput
                        value={row.unit}
                        onChange={(v) => updateRow(row.key, { unit: v })}
                      />
                    </td>

                    {/* 数量 */}
                    <td className="py-2 pr-3">
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                        placeholder="0"
                        min="0"
                        step="1"
                        className="w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-3 py-2 text-right text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
                      />
                    </td>

                    {/* 単価 — 状態で3色切替 */}
                    <td className="py-2 pr-3">
                      <div className="relative">
                        <input
                          type="number"
                          value={row.unit_price}
                          onChange={(e) =>
                            updateRow(row.key, {
                              unit_price: e.target.value,
                              unit_price_master_id: null,
                            })
                          }
                          placeholder="0"
                          min="0"
                          step="1"
                          className="w-full rounded-lg border-2 bg-white py-2 pl-2 text-right text-sm focus:outline-none"
                          style={{
                            paddingRight: isMasterApplied || hasCandidates ? "3.5rem" : "0.75rem",
                            borderColor: isMasterApplied
                              ? "var(--color-success)"
                              : hasCandidates
                                ? "#f59e0b"
                                : "var(--color-border)",
                          }}
                        />
                        {isMasterApplied ? (
                          <span
                            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                            style={{ background: "var(--color-success)", color: "#fff" }}
                          >
                            マスタ
                          </span>
                        ) : hasCandidates ? (
                          <button
                            type="button"
                            onClick={() =>
                              setOpenCandidateRow((prev) =>
                                prev === row.key ? null : row.key,
                              )
                            }
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full px-1.5 py-0.5 text-[9px] font-bold transition hover:opacity-80"
                            style={{ background: "#f59e0b", color: "#fff" }}
                          >
                            {isCandidateOpen ? "▲" : "候補▼"}
                          </button>
                        ) : null}
                      </div>
                    </td>

                    {/* 小計 */}
                    <td className="py-2 pr-3 text-right text-sm font-medium">
                      ¥{subtotal(row).toLocaleString()}
                    </td>

                    {/* 削除 */}
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        disabled={rows.length === 1}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-[color:var(--color-text-subtle)] hover:bg-red-50 hover:text-[color:var(--color-danger)] disabled:opacity-30"
                      >
                        ×
                      </button>
                    </td>
                  </tr>

                  {/* 候補展開行 */}
                  {isCandidateOpen && hasCandidates && (
                    <tr className="border-b border-[color:var(--color-border)]">
                      <td colSpan={6} style={{ padding: 0 }}>
                        <div
                          className="flex flex-wrap items-center gap-2 px-4 py-2.5"
                          style={{ background: "#fffbeb", borderTop: "1px solid #fde68a" }}
                        >
                          <span className="text-[11px] font-semibold" style={{ color: "#92400e" }}>
                            単価候補
                          </span>
                          {candidates.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                pickMaster(row.key, c);
                                setOpenCandidateRow(null);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium transition hover:opacity-80"
                              style={{
                                background: "#fff",
                                borderColor: "#f59e0b",
                                color: "#78350f",
                              }}
                            >
                              <span className="max-w-[140px] truncate">{c.material_name}</span>
                              <span className="shrink-0 font-bold" style={{ color: "#d97706" }}>
                                ¥{Number(c.unit_price).toLocaleString()}
                              </span>
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* モバイル：カードレイアウト */}
        <div className="mt-4 space-y-3 sm:hidden">
          {rows.map((row, idx) => {
            const candidates = rowCandidates.get(row.key) ?? [];
            const hasCandidates = candidates.length > 0;
            const isMasterApplied = !!row.unit_price_master_id;
            const isCandidateOpen = openCandidateRow === row.key;

            return (
              <div
                key={row.key}
                className="rounded-xl border-2 border-[color:var(--color-border)] bg-white p-3"
              >
                {/* ヘッダー：番号と削除 */}
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[color:var(--color-text-muted)]">
                    No. {idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeRow(row.key)}
                    disabled={rows.length === 1}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--color-text-subtle)] hover:bg-red-50 hover:text-[color:var(--color-danger)] disabled:opacity-30"
                    aria-label="行を削除"
                  >
                    ×
                  </button>
                </div>

                {/* 材料名 + マスタ選択 */}
                <label className="block text-[11px] font-semibold text-[color:var(--color-text-muted)]">
                  材料名
                </label>
                <div className="mt-1 flex gap-1.5">
                  <input
                    type="text"
                    value={row.material_name}
                    onChange={(e) =>
                      updateRow(row.key, {
                        material_name: e.target.value,
                        unit_price_master_id: null,
                      })
                    }
                    placeholder="塩ビ管 VU50"
                    className="min-w-0 flex-1 rounded-lg border-2 border-[color:var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
                  />
                  {masters.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowMasterPicker(row.key)}
                      className="shrink-0 rounded-lg border-2 border-[color:var(--color-border)] bg-white px-3 text-xs font-medium text-[color:var(--color-text-muted)] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
                    >
                      マスタ
                    </button>
                  )}
                </div>

                {/* 単位 / 数量 / 単価 */}
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-[color:var(--color-text-muted)]">
                      単位
                    </label>
                    <div className="mt-1">
                      <UnitInput
                        value={row.unit}
                        onChange={(v) => updateRow(row.key, { unit: v })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[color:var(--color-text-muted)]">
                      数量
                    </label>
                    <input
                      type="number"
                      value={row.quantity}
                      onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                      placeholder="0"
                      min="0"
                      step="1"
                      className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-2 py-2 text-right text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-[color:var(--color-text-muted)]">
                      単価
                    </label>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        value={row.unit_price}
                        onChange={(e) =>
                          updateRow(row.key, {
                            unit_price: e.target.value,
                            unit_price_master_id: null,
                          })
                        }
                        placeholder="0"
                        min="0"
                        step="1"
                        className="w-full rounded-lg border-2 bg-white py-2 pl-2 pr-2 text-right text-sm focus:outline-none"
                        style={{
                          borderColor: isMasterApplied
                            ? "var(--color-success)"
                            : hasCandidates
                              ? "#f59e0b"
                              : "var(--color-border)",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 状態バッジ＋小計 */}
                <div className="mt-3 flex items-center justify-between border-t border-[color:var(--color-border)] pt-2.5">
                  <div className="flex items-center gap-1.5">
                    {isMasterApplied && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: "var(--color-success)", color: "#fff" }}
                      >
                        マスタ適用
                      </span>
                    )}
                    {!isMasterApplied && hasCandidates && (
                      <button
                        type="button"
                        onClick={() =>
                          setOpenCandidateRow((prev) =>
                            prev === row.key ? null : row.key,
                          )
                        }
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold transition hover:opacity-80"
                        style={{ background: "#f59e0b", color: "#fff" }}
                      >
                        {isCandidateOpen ? "候補を閉じる ▲" : "候補を表示 ▼"}
                      </button>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-[color:var(--color-text-muted)]">小計</span>
                    <span className="text-base font-bold">
                      ¥{subtotal(row).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 候補展開 */}
                {isCandidateOpen && hasCandidates && (
                  <div
                    className="mt-2 flex flex-wrap items-center gap-1.5 rounded-lg px-2.5 py-2"
                    style={{ background: "#fffbeb", border: "1px solid #fde68a" }}
                  >
                    {candidates.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          pickMaster(row.key, c);
                          setOpenCandidateRow(null);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition hover:opacity-80"
                        style={{
                          background: "#fff",
                          borderColor: "#f59e0b",
                          color: "#78350f",
                        }}
                      >
                        <span className="max-w-[120px] truncate">{c.material_name}</span>
                        <span className="shrink-0 font-bold" style={{ color: "#d97706" }}>
                          ¥{Number(c.unit_price).toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="mt-3 inline-flex h-9 items-center gap-1 rounded-lg border-2 border-dashed border-[color:var(--color-border)] px-4 text-sm text-[color:var(--color-text-muted)] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
        >
          + 行を追加
        </button>

        <div className="mt-6 flex justify-end border-t border-[color:var(--color-border)] pt-4">
          <div className="text-right">
            <p className="text-sm text-[color:var(--color-text-muted)]">合計金額</p>
            <p className="mt-1 text-3xl font-bold">
              ¥{total.toLocaleString()}
            </p>
          </div>
        </div>
      </section>

      {state && !state.ok && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-[color:var(--color-danger)]">
          {state.error}
        </p>
      )}

      {/* hidden items json */}
      <input type="hidden" name="items" value={buildItemsJson()} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={pending || draftPending}
          className="order-1 inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-lg bg-[color:var(--color-primary)] px-8 text-base font-semibold text-white shadow-sm transition hover:bg-[color:var(--color-primary-hover)] disabled:opacity-60 sm:order-3 sm:w-auto"
        >
          {pending ? "保存中..." : "見積書を作成する"}
        </button>
        <button
          type="submit"
          formAction={draftAction}
          disabled={draftPending || pending}
          className="order-2 inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-lg border-2 border-[color:var(--color-border)] px-6 text-base font-medium text-[color:var(--color-text-muted)] transition hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)] disabled:opacity-50 sm:order-2 sm:w-auto"
        >
          {draftPending ? "保存中..." : "下書き保存"}
        </button>
        <a
          href="/quotes"
          className="order-3 inline-flex h-12 w-full items-center justify-center whitespace-nowrap rounded-lg border-2 border-[color:var(--color-border)] px-6 text-base font-medium text-[color:var(--color-text-muted)] hover:border-[color:var(--color-border-strong)] sm:order-1 sm:w-auto"
        >
          キャンセル
        </a>
      </div>
    </form>
    </>
  );
}

