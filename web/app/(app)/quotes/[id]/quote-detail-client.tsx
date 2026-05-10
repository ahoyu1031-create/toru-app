"use client";

import { useActionState, useState } from "react";
import { createPortal } from "react-dom";
import { updateQuoteHeader, replaceQuoteItems, deleteQuote } from "../actions";
import type { QuoteItemInput } from "../actions";
import { updateCompanyInfo } from "@/app/(app)/settings/actions";
import { UnitInput } from "@/components/unit-input";
import { AnalysisPickerModal } from "@/components/analysis-picker-modal";
import { MasterPickerModal } from "@/components/master-picker-modal";
import type { MaterialItem } from "@/app/(app)/drawings/actions";

type Quote = {
  id: string;
  project_name: string | null;
  client_name: string | null;
  quote_date: string | null;
  total_amount: number;
  status: string;
  delivery_date?: string | null;
  delivery_location?: string | null;
  payment_terms?: string | null;
  valid_until?: string | null;
  notes?: string | null;
};

type QuoteItem = {
  id: string;
  material_name: string;
  unit: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  sort_order: number | null;
  unit_price_master_id: string | null;
};

type UnitPriceMaster = {
  id: string;
  material_name: string;
  unit: string;
  unit_price: number;
  category: string | null;
};

type Company = {
  name: string;
  postal_code?: string | null;
  address?: string | null;
  tel?: string | null;
  fax?: string | null;
  contact_name?: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "下書き",
  issued: "発行済",
  accepted: "受注",
  rejected: "不採用",
};

const STATUS_CLASS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  issued: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
};

type ItemRow = {
  key: number;
  material_name: string;
  unit: string;
  quantity: string;
  unit_price: string;
  unit_price_master_id: string | null;
};

let keyCounter = 0;
function fromExisting(item: QuoteItem): ItemRow {
  return {
    key: ++keyCounter,
    material_name: item.material_name,
    unit: item.unit ?? "",
    quantity: String(item.quantity),
    unit_price: String(item.unit_price),
    unit_price_master_id: item.unit_price_master_id,
  };
}

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
  return (parseFloat(row.quantity) || 0) * (parseFloat(row.unit_price) || 0);
}

export function QuoteDetailClient({
  quote,
  items,
  masters,
  company,
}: {
  quote: Quote;
  items: QuoteItem[];
  masters: UnitPriceMaster[];
  company: Company | null;
}) {
  const [editingHeader, setEditingHeader] = useState(false);
  const [editingItems, setEditingItems] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [companyState, companyAction, companyPending] = useActionState<
    { ok: true } | { ok: false; error: string } | null,
    FormData
  >(updateCompanyInfo, null);
  const [rows, setRows] = useState<ItemRow[]>(() =>
    items.length > 0 ? items.map(fromExisting) : [newRow()],
  );
  const [showMasterPicker, setShowMasterPicker] = useState<number | null>(null);
  const [showAnalysisPicker, setShowAnalysisPicker] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [itemsSaving, setItemsSaving] = useState(false);

  const updateHeader = updateQuoteHeader.bind(null, quote.id);
  const [headerState, headerAction, headerPending] = useActionState(updateHeader, null);

  const total = rows.reduce((s, r) => s + subtotal(r), 0);

  function updateRow(key: number, patch: Partial<ItemRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
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
    const newRows = selected.map((m) => ({
      key: ++keyCounter,
      material_name: m.material_name,
      unit: m.unit,
      quantity: String(m.quantity),
      unit_price: "",
      unit_price_master_id: null,
    }));
    setRows((prev) => {
      const hasEmpty = prev.length === 1 && !prev[0].material_name;
      return hasEmpty ? newRows : [...prev, ...newRows];
    });
  }

  async function saveItems() {
    setItemsError(null);
    setItemsSaving(true);
    const itemInputs: QuoteItemInput[] = rows.map((r, i) => ({
      material_name: r.material_name,
      unit: r.unit,
      quantity: parseFloat(r.quantity) || 0,
      unit_price: parseFloat(r.unit_price) || 0,
      unit_price_master_id: r.unit_price_master_id ?? null,
      sort_order: i,
    }));
    const result = await replaceQuoteItems(quote.id, itemInputs);
    setItemsSaving(false);
    if (result.ok) {
      setEditingItems(false);
    } else {
      setItemsError(result.error);
    }
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {quote.project_name ?? "（プロジェクト名未設定）"}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-[color:var(--color-text-muted)]">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[quote.status] ?? STATUS_CLASS.draft}`}
            >
              {STATUS_LABEL[quote.status] ?? quote.status}
            </span>
            {quote.client_name && <span>クライアント: {quote.client_name}</span>}
            {quote.quote_date && (
              <span>
                見積日:{" "}
                {new Date(quote.quote_date).toLocaleDateString("ja-JP")}
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href={`/quotes/${quote.id}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 text-sm font-medium hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
          >
            PDF出力
          </a>
          <button
            onClick={() => setEditingHeader(!editingHeader)}
            className="inline-flex h-10 items-center justify-center rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 text-sm font-medium hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
          >
            {editingHeader ? "閉じる" : "編集"}
          </button>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="inline-flex h-10 items-center justify-center rounded-lg border-2 border-red-200 bg-white px-4 text-sm font-medium text-[color:var(--color-danger)] hover:bg-red-50"
          >
            削除
          </button>
        </div>
      </div>

      {/* header edit form */}
      {editingHeader && (
        <form
          action={headerAction}
          className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6"
        >
          <h2 className="mb-4 text-base font-semibold">基本情報を編集</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">プロジェクト名</label>
              <input
                name="project_name"
                defaultValue={quote.project_name ?? ""}
                className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-base focus:border-[color:var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">クライアント名</label>
              <input
                name="client_name"
                defaultValue={quote.client_name ?? ""}
                className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-base focus:border-[color:var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">見積日</label>
              <input
                name="quote_date"
                type="date"
                defaultValue={quote.quote_date ?? ""}
                className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-base focus:border-[color:var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">ステータス</label>
              <select
                name="status"
                defaultValue={quote.status}
                className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-base focus:border-[color:var(--color-primary)] focus:outline-none"
              >
                {Object.entries(STATUS_LABEL).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 border-t border-[color:var(--color-border)] pt-4">
            <h3 className="mb-3 text-sm font-semibold text-[color:var(--color-text-muted)]">見積条件</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">1. 受渡期日</label>
                <input
                  name="delivery_date"
                  type="text"
                  defaultValue={quote.delivery_date ?? ""}
                  placeholder="例: 3週間後"
                  className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-base focus:border-[color:var(--color-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">2. 納入場所</label>
                <input
                  name="delivery_location"
                  type="text"
                  defaultValue={quote.delivery_location ?? ""}
                  placeholder="例: 貴社指定通り"
                  className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-base focus:border-[color:var(--color-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">3. 支払条件</label>
                <input
                  name="payment_terms"
                  type="text"
                  defaultValue={quote.payment_terms ?? "従来通り"}
                  className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-base focus:border-[color:var(--color-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">4. 有効期限</label>
                <input
                  name="valid_until"
                  type="text"
                  defaultValue={quote.valid_until ?? "30日"}
                  className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-base focus:border-[color:var(--color-primary)] focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium">備考</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={quote.notes ?? ""}
                  placeholder="見積書下部に表示されます"
                  className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-base focus:border-[color:var(--color-primary)] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {headerState && !headerState.ok && (
            <p className="mt-3 text-sm text-[color:var(--color-danger)]">
              {headerState.error}
            </p>
          )}
          {headerState?.ok && (
            <p className="mt-3 text-sm text-[color:var(--color-success)]">
              保存しました
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={headerPending}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-[color:var(--color-primary)] px-6 text-sm font-semibold text-white hover:bg-[color:var(--color-primary-hover)] disabled:opacity-60"
            >
              {headerPending ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      )}

      {/* items */}
      {showAnalysisPicker && (
        <AnalysisPickerModal
          onAdd={addAnalysisItems}
          onClose={() => setShowAnalysisPicker(false)}
        />
      )}
      {showMasterPicker !== null && (
        <MasterPickerModal
          masters={masters}
          onPick={(m) => pickMaster(showMasterPicker, m)}
          onClose={() => setShowMasterPicker(null)}
        />
      )}
      <section className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">明細</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!editingItems) {
                  setRows(items.length > 0 ? items.map(fromExisting) : [newRow()]);
                }
                setEditingItems(!editingItems);
                setItemsError(null);
              }}
              className="inline-flex h-9 items-center justify-center rounded-lg border-2 border-[color:var(--color-border)] px-3 text-sm font-medium hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
            >
              {editingItems ? "キャンセル" : "明細を編集"}
            </button>
            {editingItems && (
              <button
                type="button"
                onClick={() => setShowAnalysisPicker(true)}
                className="inline-flex h-9 items-center justify-center rounded-lg border-2 px-3 text-sm font-medium transition"
                style={{ borderColor: "var(--color-primary)", color: "var(--color-primary)" }}
              >
                解析結果から選択
              </button>
            )}
          </div>
        </div>

        {editingItems ? (
          <div className="mt-4">
            <div className="overflow-x-auto">
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
                <tbody className="divide-y divide-[color:var(--color-border)]">
                  {rows.map((row) => (
                    <tr key={row.key}>
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
                            placeholder="材料名"
                            className="w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
                          />
                          {masters.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setShowMasterPicker(row.key)}
                              className="shrink-0 rounded-lg border-2 border-[color:var(--color-border)] bg-white px-2 text-xs text-[color:var(--color-text-muted)] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
                            >
                              選択
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-3">
                        <UnitInput
                          value={row.unit}
                          onChange={(v) => updateRow(row.key, { unit: v })}
                        />
                      </td>
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
                      <td className="py-2 pr-3">
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
                          className="w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-3 py-2 text-right text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
                        />
                      </td>
                      <td className="py-2 pr-3 text-right text-sm font-medium">
                        ¥{subtotal(row).toLocaleString()}
                      </td>
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
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addRow}
              className="mt-3 inline-flex h-9 items-center gap-1 rounded-lg border-2 border-dashed border-[color:var(--color-border)] px-4 text-sm text-[color:var(--color-text-muted)] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
            >
              + 行を追加
            </button>
            <div className="mt-4 flex items-center justify-between">
              {itemsError && (
                <p className="text-sm text-[color:var(--color-danger)]">{itemsError}</p>
              )}
              <div className="ml-auto flex gap-3">
                <p className="self-center text-lg font-bold">
                  合計: ¥{total.toLocaleString()}
                </p>
                <button
                  type="button"
                  onClick={saveItems}
                  disabled={itemsSaving}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-[color:var(--color-primary)] px-6 text-sm font-semibold text-white hover:bg-[color:var(--color-primary-hover)] disabled:opacity-60"
                >
                  {itemsSaving ? "保存中..." : "明細を保存"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            {items.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-[color:var(--color-border)]">
                      <th className="py-2 pr-4 text-left text-xs font-semibold text-[color:var(--color-text-muted)]">
                        材料名
                      </th>
                      <th className="py-2 pr-4 text-left text-xs font-semibold text-[color:var(--color-text-muted)]">
                        単位
                      </th>
                      <th className="py-2 pr-4 text-right text-xs font-semibold text-[color:var(--color-text-muted)]">
                        数量
                      </th>
                      <th className="py-2 pr-4 text-right text-xs font-semibold text-[color:var(--color-text-muted)]">
                        単価
                      </th>
                      <th className="py-2 text-right text-xs font-semibold text-[color:var(--color-text-muted)]">
                        小計
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[color:var(--color-border)]">
                    {items.map((item) => (
                      <tr key={item.id} className="text-sm">
                        <td className="py-2.5 pr-4 font-medium">
                          {item.material_name}
                        </td>
                        <td className="py-2.5 pr-4 text-[color:var(--color-text-muted)]">
                          {item.unit ?? "-"}
                        </td>
                        <td className="py-2.5 pr-4 text-right">
                          {Number(item.quantity).toLocaleString()}
                        </td>
                        <td className="py-2.5 pr-4 text-right">
                          ¥{Number(item.unit_price).toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right font-medium">
                          ¥{Number(item.subtotal).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-[color:var(--color-text-muted)]">
                明細がまだありません
              </p>
            )}

            <div className="mt-4 flex justify-end border-t border-[color:var(--color-border)] pt-4">
              <div className="text-right">
                <p className="text-sm text-[color:var(--color-text-muted)]">合計金額</p>
                <p className="mt-1 text-3xl font-bold">
                  ¥{Number(quote.total_amount).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* company info */}
      <section className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">発行者情報</h2>
            <p className="mt-0.5 text-xs text-[color:var(--color-text-muted)]">PDFの発行者欄に表示されます</p>
          </div>
          <button
            onClick={() => { setEditingCompany(!editingCompany); }}
            className="inline-flex h-9 items-center justify-center rounded-lg border-2 border-[color:var(--color-border)] px-3 text-sm font-medium hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
          >
            {editingCompany ? "閉じる" : "編集"}
          </button>
        </div>

        {!editingCompany && (
          <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="text-[color:var(--color-text-muted)]">会社名</dt>
              <dd className="font-medium">{company?.name ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-[color:var(--color-text-muted)]">郵便番号</dt>
              <dd>{company?.postal_code ?? "—"}</dd>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <dt className="text-[color:var(--color-text-muted)]">住所</dt>
              <dd>{company?.address ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-[color:var(--color-text-muted)]">TEL</dt>
              <dd>{company?.tel ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-[color:var(--color-text-muted)]">FAX</dt>
              <dd>{company?.fax ?? "—"}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-[color:var(--color-text-muted)]">担当者名</dt>
              <dd>{company?.contact_name ?? "—"}</dd>
            </div>
          </dl>
        )}

        {editingCompany && (
          <form action={companyAction} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium">会社名 <span className="text-[color:var(--color-danger)]">*</span></label>
                <input
                  name="name"
                  required
                  defaultValue={company?.name ?? ""}
                  placeholder="株式会社○○"
                  className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">郵便番号</label>
                <input
                  name="postal_code"
                  defaultValue={company?.postal_code ?? ""}
                  placeholder="〒000-0000"
                  className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium">住所</label>
                <input
                  name="address"
                  defaultValue={company?.address ?? ""}
                  placeholder="○○県○○市..."
                  className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">TEL</label>
                <input
                  name="tel"
                  defaultValue={company?.tel ?? ""}
                  placeholder="090-0000-0000"
                  className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">FAX</label>
                <input
                  name="fax"
                  defaultValue={company?.fax ?? ""}
                  placeholder="0765-00-0000"
                  className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">担当者名</label>
                <input
                  name="contact_name"
                  defaultValue={company?.contact_name ?? ""}
                  placeholder="山田 太郎"
                  className="mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-sm focus:border-[color:var(--color-primary)] focus:outline-none"
                />
              </div>
            </div>
            {companyState && !companyState.ok && (
              <p className="text-sm text-[color:var(--color-danger)]">{companyState.error}</p>
            )}
            {companyState?.ok && (
              <p className="text-sm text-[color:var(--color-success)]">保存しました</p>
            )}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={companyPending}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[color:var(--color-primary)] px-6 text-sm font-semibold text-white hover:bg-[color:var(--color-primary-hover)] disabled:opacity-60"
              >
                {companyPending ? "保存中..." : "保存"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* delete confirm */}
      {deleteConfirm && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">見積書を削除しますか？</h3>
            <p className="mt-2 text-sm text-[color:var(--color-text-muted)]">
              「{quote.project_name ?? "（無題）"}」を削除します。この操作は元に戻せません。
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="flex-1 rounded-lg border-2 border-[color:var(--color-border)] py-2.5 text-sm font-medium"
              >
                キャンセル
              </button>
              <form action={deleteQuote} className="flex-1">
                <input type="hidden" name="quote_id" value={quote.id} />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[color:var(--color-danger)] py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  削除する
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

