"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useAnalysis } from "@/components/analysis-context";
import type { NonAllMode } from "@/components/analysis-context";
import { ALPHA_FORM_URL } from "@/lib/billing-mode";
import Link from "next/link";

const TRADES = [
  "給排水衛生設備",
  "ガス設備",
  "電気設備",
  "空調・換気設備",
  "消防設備",
  "建築・躯体",
  "内装・仕上げ",
  "その他",
];

const MODES: { id: NonAllMode; label: string; desc: string }[] = [
  {
    id: "materials",
    label: "材料拾い出し",
    desc: "図面に記載された材料・部材を数量・単位付きで一覧化します",
  },
  {
    id: "construction_notes",
    label: "施工注意事項",
    desc: "安全管理・品質管理・施工順序など現場で押さえるべき注意事項を抽出します",
  },
  {
    id: "coordination",
    label: "他業者との緩衝",
    desc: "電気・空調・建築など他業者とのスペース干渉・取り合いポイントを特定します",
  },
  {
    id: "communication",
    label: "他業者への伝達事項",
    desc: "先行工事の依頼・納まり調整・開口補強依頼など、他業者への連絡事項をまとめます",
  },
];

export function DrawingAnalyzeClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedModes, setSelectedModes] = useState<Set<NonAllMode>>(
    new Set(["materials", "construction_notes", "coordination", "communication"])
  );
  const [trade, setTrade] = useState<string>(TRADES[0]);
  const didStartRef = useRef(false);

  const { state: analysis, startAnalysis, clearResult } = useAnalysis();
  const analyzing = analysis.status === "uploading" || analysis.status === "analyzing";
  const error = analysis.status === "error" ? analysis.error : null;

  useEffect(() => {
    if (didStartRef.current && analysis.status === "done" && analysis.analysisId) {
      didStartRef.current = false;
      router.push(`/drawings/${analysis.analysisId}`);
    }
  }, [analysis.status, analysis.analysisId, router]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    clearResult();
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type === "application/pdf") {
      setFile(f);
      clearResult();
    }
  }

  function toggleMode(id: NonAllMode) {
    setSelectedModes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    clearResult();
  }

  function toggleAll() {
    if (selectedModes.size === MODES.length) {
      setSelectedModes(new Set());
    } else {
      setSelectedModes(new Set(MODES.map((m) => m.id)));
    }
    clearResult();
  }

  async function analyze() {
    if (selectedModes.size === 0) return;
    if (!file) {
      fileInputRef.current?.click();
      return;
    }
    didStartRef.current = true;
    await startAnalysis(file, Array.from(selectedModes), trade);
  }

  const allSelected = selectedModes.size === MODES.length;

  return (
    <section className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
      {/* PDF upload */}
      <h2 className="mb-4 text-lg font-semibold">図面PDFをアップロード</h2>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition"
        style={{
          borderColor: isDragging ? "var(--color-primary)" : "var(--color-border)",
          background: isDragging ? "var(--color-primary-soft)" : "var(--color-bg)",
        }}
      >
        <span className="text-3xl">{isDragging ? "⬇️" : "📄"}</span>
        {file ? (
          <span className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>{file.name}</span>
        ) : isDragging ? (
          <span className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>ここにドロップ</span>
        ) : (
          <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            クリックして選択、またはPDFをドラッグ&ドロップ
          </span>
        )}
      </button>
      <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={onFileChange} />

      {/* Trade */}
      <h2 className="mb-3 mt-6 text-lg font-semibold">業種を選択</h2>
      <div className="flex flex-wrap gap-2">
        {TRADES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTrade(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              trade === t
                ? "bg-[color:var(--color-primary)] text-white"
                : "border border-[color:var(--color-border)] bg-white text-[color:var(--color-text-muted)] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Mode — 複数選択 */}
      <div className="mt-6 mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          解析モードを選択
          <span className="ml-2 text-sm font-normal" style={{ color: "var(--color-text-muted)" }}>
            （複数選択可）
          </span>
        </h2>
        <button
          type="button"
          onClick={toggleAll}
          className="rounded-lg px-3 py-1 text-xs font-semibold transition hover:opacity-80"
          style={{
            background: allSelected ? "var(--color-primary-soft)" : "var(--color-bg)",
            color: allSelected ? "var(--color-primary)" : "var(--color-text-muted)",
            border: "1px solid var(--color-border)",
          }}
        >
          {allSelected ? "全て解除" : "全て選択"}
        </button>
      </div>
      <p className="mb-3 text-xs" style={{ color: "var(--color-text-subtle)" }}>
        {selectedModes.size} / {MODES.length} 選択中
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {MODES.map((m) => {
          const isSelected = selectedModes.has(m.id);
          return (
            <label
              key={m.id}
              className={`flex cursor-pointer gap-3 rounded-xl border-2 p-4 transition ${
                isSelected
                  ? "border-[color:var(--color-primary)] bg-[color:var(--color-primary-soft)]"
                  : "border-[color:var(--color-border)] bg-white hover:border-[color:var(--color-primary)]"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleMode(m.id)}
                className="mt-0.5 shrink-0 accent-[color:var(--color-primary)]"
              />
              <div>
                <p className="font-semibold text-sm">{m.label}</p>
                <p className="mt-0.5 text-xs text-[color:var(--color-text-muted)]">{m.desc}</p>
              </div>
            </label>
          );
        })}
      </div>

      {/* Error (トライアル終了・ベータ完了以外) */}
      {error && !analysis.betaComplete && !analysis.trialEnded && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-[color:var(--color-danger)]">
          {error}
        </div>
      )}

      {/* トライアル終了モーダル */}
      {analysis.trialEnded && typeof document !== "undefined" && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "var(--color-surface)", borderRadius: 20, padding: 32, maxWidth: 460, width: "100%", textAlign: "center", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎁</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
              無料体験が終了しました
            </h2>
            <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: 24 }}>
              {analysis.trialReason === "limit_reached"
                ? "無料体験の解析回数を使い切りました。"
                : "無料体験期間が終了しました。"}
              {" "}引き続きTORUをご利用いただくには、アルファテスター枠（無料）または有料プランをご選択ください。
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
              <a
                href={ALPHA_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white"
                style={{ background: "var(--color-primary)" }}
              >
                アルファ枠（無料）に申込
              </a>
              <Link
                href="/settings/plan"
                className="inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-semibold"
                style={{ background: "var(--color-bg)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
              >
                プランを見る
              </Link>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ベータ完了モーダル */}
      {analysis.betaComplete && typeof document !== "undefined" && createPortal(
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "var(--color-surface)", borderRadius: 20, padding: 32, maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 24px 64px rgba(0,0,0,0.2)" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>
              ベータ版のご利用ありがとうございました！
            </h2>
            <p style={{ fontSize: 14, color: "var(--color-text-muted)", marginBottom: analysis.betaBonusUsed ? 24 : 8 }}>
              今月の解析回数の上限に達しました。ご利用のご感想をお聞かせください。
            </p>
            {!analysis.betaBonusUsed && (
              <p style={{ fontSize: 14, marginBottom: 24 }}>
                フィードバックを送ると、追加で<strong style={{ color: "#7C3AED" }}>+5回</strong>の解析クレジットが付与されます。
              </p>
            )}
            <Link
              href="/feedback"
              className="inline-flex h-11 items-center justify-center rounded-xl px-8 text-sm font-semibold text-white"
              style={{ background: "#7C3AED" }}
            >
              フィードバックを送る
            </Link>
          </div>
        </div>,
        document.body
      )}

      {/* Submit */}
      <div className="mt-6 flex items-center justify-between">
        {analyzing && (
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            解析中です。他のページに移動しても続行されます
          </p>
        )}
        <button
          type="button"
          onClick={analyze}
          disabled={selectedModes.size === 0 || analyzing}
          className="ml-auto inline-flex h-11 items-center justify-center rounded-lg bg-[color:var(--color-primary)] px-8 text-base font-semibold text-white shadow-sm transition hover:bg-[color:var(--color-primary-hover)] disabled:opacity-40"
          style={{ cursor: selectedModes.size === 0 || analyzing ? "default" : "pointer" }}
        >
          {analyzing
            ? `解析中… (${analysis.selectedModes.length}項目)`
            : selectedModes.size === 0
            ? "モードを選択してください"
            : `解析する (${selectedModes.size}項目)`}
        </button>
      </div>
    </section>
  );
}
