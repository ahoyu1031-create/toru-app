"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { listAnalysesWithMaterials, getAnalysisMaterials } from "@/app/(app)/drawings/actions";
import type { AnalysisSummary, MaterialItem } from "@/app/(app)/drawings/actions";

export function AnalysisPickerModal({
  onAdd,
  onClose,
}: {
  onAdd: (items: MaterialItem[]) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"list" | "items">("list");
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisSummary | null>(null);
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [checked, setChecked] = useState<boolean[]>([]);

  useEffect(() => {
    listAnalysesWithMaterials().then((data) => {
      setAnalyses(data);
      setLoading(false);
    });
  }, []);

  async function pickAnalysis(analysis: AnalysisSummary) {
    setSelectedAnalysis(analysis);
    setItemsLoading(true);
    setStep("items");
    const data = await getAnalysisMaterials(analysis.id);
    setItems(data);
    setChecked(data.map(() => true));
    setItemsLoading(false);
  }

  const selected = items.filter((_, i) => checked[i]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl flex flex-col"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center gap-2">
            {step === "items" && (
              <button
                type="button"
                onClick={() => setStep("list")}
                className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:opacity-70"
                style={{ color: "var(--color-text-muted)", background: "var(--color-bg)" }}
              >
                ←
              </button>
            )}
            <div>
              <h3 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
                {step === "list" ? "解析結果から選択" : selectedAnalysis?.file_name ?? ""}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {step === "list"
                  ? "材料拾い出しがある解析を選んでください"
                  : `${items.length} 件の材料`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-70"
            style={{ color: "var(--color-text-muted)", background: "var(--color-bg)" }}
          >
            ×
          </button>
        </div>

        {/* コンテンツ */}
        <div className="overflow-y-auto flex-1">
          {step === "list" && (
            <>
              {loading ? (
                <div className="py-10 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                  読み込み中...
                </div>
              ) : analyses.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    材料拾い出しの解析結果がありません。
                  </p>
                  <a
                    href="/drawings"
                    onClick={onClose}
                    className="mt-4 inline-flex h-9 items-center justify-center rounded-lg px-4 text-sm font-medium"
                    style={{ background: "var(--color-primary)", color: "#fff" }}
                  >
                    図面解析へ
                  </a>
                </div>
              ) : (
                <ul className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                  {analyses.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => pickAnalysis(a)}
                        className="w-full px-5 py-3.5 text-left transition hover:bg-[color:var(--color-bg)] flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>
                            {a.file_name}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                            {a.trade} ·{" "}
                            {new Date(a.created_at).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                          style={{ background: "var(--color-primary-soft)", color: "var(--color-primary)" }}
                        >
                          {a.material_count}件
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {step === "items" && (
            <>
              {itemsLoading ? (
                <div className="py-10 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                  読み込み中...
                </div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="sticky top-0">
                    <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-primary-soft)" }}>
                      <th className="w-10 py-2.5 pl-4">
                        <input
                          type="checkbox"
                          checked={checked.length > 0 && checked.every(Boolean)}
                          onChange={(e) => setChecked(items.map(() => e.target.checked))}
                          className="h-4 w-4 rounded"
                          style={{ accentColor: "var(--color-primary)" }}
                        />
                      </th>
                      <th className="py-2.5 pr-4 text-left text-xs font-semibold" style={{ color: "var(--color-primary)" }}>材料名</th>
                      <th className="py-2.5 pr-4 text-right text-xs font-semibold" style={{ color: "var(--color-primary)" }}>数量</th>
                      <th className="py-2.5 pr-4 text-left text-xs font-semibold" style={{ color: "var(--color-primary)" }}>単位</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((m, i) => (
                      <tr
                        key={i}
                        onClick={() => setChecked((prev) => prev.map((v, j) => (j === i ? !v : v)))}
                        className={`cursor-pointer transition hover:bg-[color:var(--color-bg)] ${checked[i] ? "" : "opacity-40"}`}
                        style={{ borderBottom: "1px solid var(--color-border)" }}
                      >
                        <td className="py-2.5 pl-4">
                          <input
                            type="checkbox"
                            checked={checked[i] ?? false}
                            onChange={() => setChecked((prev) => prev.map((v, j) => (j === i ? !v : v)))}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 rounded"
                            style={{ accentColor: "var(--color-primary)" }}
                          />
                        </td>
                        <td className="py-2.5 pr-4 font-medium" style={{ color: "var(--color-text)" }}>{m.material_name}</td>
                        <td className="py-2.5 pr-4 text-right" style={{ color: "var(--color-text)" }}>{m.quantity}</td>
                        <td className="py-2.5 pr-4" style={{ color: "var(--color-text-muted)" }}>{m.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>

        {/* フッター（材料選択ステップのみ） */}
        {step === "items" && !itemsLoading && (
          <div
            className="flex items-center justify-between px-5 py-4 shrink-0"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setChecked(items.map(() => true))}
                className="text-xs transition hover:underline"
                style={{ color: "var(--color-text-muted)" }}
              >
                全選択
              </button>
              <button
                type="button"
                onClick={() => setChecked(items.map(() => false))}
                className="text-xs transition hover:underline"
                style={{ color: "var(--color-text-muted)" }}
              >
                全解除
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {selected.length}件選択中
              </span>
              <button
                type="button"
                disabled={selected.length === 0}
                onClick={() => { onAdd(selected); onClose(); }}
                className="inline-flex h-10 items-center justify-center rounded-lg px-5 text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}
              >
                明細に追加
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
