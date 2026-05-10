"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertTriangle,
  ChevronRight, X, CheckSquare, Square, RotateCcw,
} from "lucide-react";
import { UnitInput } from "@/components/unit-input";
import { TRADE_CATEGORIES } from "../category-picker";
import { importFromCsv } from "../actions";
import { useToast } from "@/components/toast-context";

// ─── 型 ──────────────────────────────────────────────────────────────

type ImportRow = {
  key: number;
  material_name: string;
  unit: string;
  unit_price: number;
  category: string | null;
  memo: string | null;
  _valid: boolean;
  _error?: string;
};

type Step = "upload" | "review" | "done";

// ─── ヘルパー ─────────────────────────────────────────────────────────

const ALL_TRADES = Object.keys(TRADE_CATEGORIES);

function tradeFromCategory(cat: string | null): string {
  if (!cat) return "";
  for (const [trade, cats] of Object.entries(TRADE_CATEGORIES)) {
    if ((cats as string[]).includes(cat)) return trade;
  }
  return "";
}

const JAPANESE_HEADER_MAP: Record<string, string> = {
  "材料名": "material_name", "品名": "material_name", "品目": "material_name", "名称": "material_name",
  "単位": "unit",
  "単価": "unit_price", "価格": "unit_price", "金額": "unit_price",
  "カテゴリ": "category", "カテゴリー": "category", "分類": "category",
  "メモ": "memo", "備考": "memo",
};

function normalizeHeader(h: string): string {
  const t = h.trim();
  return JAPANESE_HEADER_MAP[t] ?? t.toLowerCase().replace(/\s+/g, "_");
}

async function parseFile(file: File): Promise<ImportRow[]> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  let sheetData: Record<string, string>[];

  if (ext === "csv") {
    // CSV パース
    const text = await file.text();
    const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
    if (lines.length < 2) return [];

    function splitCsvLine(line: string): string[] {
      const res: string[] = [];
      let field = "";
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inQ) {
          if (c === '"' && line[i + 1] === '"') { field += '"'; i++; }
          else if (c === '"') inQ = false;
          else field += c;
        } else {
          if (c === '"') inQ = true;
          else if (c === ",") { res.push(field.trim()); field = ""; }
          else field += c;
        }
      }
      res.push(field.trim());
      return res;
    }

    const headers = splitCsvLine(lines[0]).map(normalizeHeader);
    sheetData = lines.slice(1).map((line) => {
      const vals = splitCsvLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
      return row;
    });
  } else {
    // Excel パース (xlsx)
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
    if (raw.length < 2) return [];
    const headers = (raw[0] as any[]).map((h: any) => normalizeHeader(String(h ?? "")));
    sheetData = raw.slice(1).map((row: any[]) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = String(row[i] ?? "").trim(); });
      return obj;
    });
  }

  let counter = 0;
  return sheetData
    .filter((row) => Object.values(row).some(Boolean))
    .map((row, idx): ImportRow => {
      const name = row["material_name"]?.trim() ?? "";
      const unit = row["unit"]?.trim() ?? "";
      const priceRaw = (row["unit_price"] ?? "").replace(/[,，¥￥\s]/g, "");
      const price = parseFloat(priceRaw);
      const cat = row["category"]?.trim() || null;
      const memo = row["memo"]?.trim() || null;

      if (!name) return { key: ++counter, material_name: "", unit, unit_price: 0, category: cat, memo, _valid: false, _error: `行${idx + 2}: 材料名が空` };
      if (priceRaw && (isNaN(price) || price < 0)) return { key: ++counter, material_name: name, unit, unit_price: 0, category: cat, memo, _valid: false, _error: `行${idx + 2}: 単価「${priceRaw}」が不正` };
      return { key: ++counter, material_name: name, unit, unit_price: isNaN(price) ? 0 : price, category: cat, memo, _valid: true };
    });
}

// ─── メインコンポーネント ────────────────────────────────────────────

export function ImportWizard() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [step, setStep] = useState<Step>("upload");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);

  // review state
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkTrade, setBulkTrade] = useState("");
  const [bulkCat, setBulkCat] = useState("");
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const validRows = rows.filter((r) => r._valid);
  const invalidRows = rows.filter((r) => !r._valid);

  // ── ファイル処理 ──────────────────────────────────────────────────

  async function handleFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["csv", "xlsx", "xls"].includes(ext)) {
      toastError("CSV または Excel ファイルを選択してください（.csv / .xlsx / .xls）");
      return;
    }
    setParsing(true);
    setFileName(file.name);
    try {
      const parsed = await parseFile(file);
      if (parsed.length === 0) { toastError("データが見つかりませんでした"); setParsing(false); return; }
      if (parsed.filter(r => r._valid).length > 500) { toastError("一度にインポートできるのは500行までです"); setParsing(false); return; }
      setRows(parsed);
      setSelected(new Set(parsed.filter(r => r._valid).map(r => r.key)));
      setStep("review");
    } catch (e) {
      toastError("ファイルの読み込みに失敗しました");
    }
    setParsing(false);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, []);

  // ── レビュー操作 ──────────────────────────────────────────────────

  function toggleSelect(key: number) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleAll() {
    const validKeys = validRows.map(r => r.key);
    const allSelected = validKeys.every(k => selected.has(k));
    setSelected(allSelected ? new Set() : new Set(validKeys));
  }

  function updateRow(key: number, patch: Partial<ImportRow>) {
    setRows(prev => prev.map(r => r.key === key ? { ...r, ...patch } : r));
  }

  function applyBulk() {
    if (!bulkCat && !bulkTrade) return;
    setRows(prev => prev.map(r => {
      if (!selected.has(r.key) || !r._valid) return r;
      if (bulkCat) return { ...r, category: bulkCat };
      // bulkTrade only: auto-pick single subcategory if trade has only one
      const cats = TRADE_CATEGORIES[bulkTrade] ?? [];
      return { ...r, category: cats.length === 1 ? cats[0] : r.category };
    }));
  }

  // ── インポート実行 ────────────────────────────────────────────────

  async function doImport() {
    const toImport = validRows.filter(r => selected.has(r.key));
    if (!toImport.length) return;
    setImporting(true);
    const result = await importFromCsv(
      toImport.map(({ _valid, _error, ...r }) => r)
    );
    setImporting(false);
    if ("ok" in result && result.ok) {
      setImportedCount("inserted" in result ? (result.inserted ?? toImport.length) : toImport.length);
      setStep("done");
    } else {
      toastError("error" in result ? result.error ?? "インポートに失敗しました" : "インポートに失敗しました");
    }
  }

  // ── レンダリング ──────────────────────────────────────────────────

  if (step === "done") {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "rgba(34,197,94,0.1)" }}
        >
          <CheckCircle2 size={32} style={{ color: "#16A34A" }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
          インポート完了
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
          {importedCount}件の単価を登録しました
        </p>
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={() => { setStep("upload"); setRows([]); setFileName(""); setSelected(new Set()); }}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition hover:opacity-80"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >
            <RotateCcw size={14} />
            続けてインポート
          </button>
          <button
            type="button"
            onClick={() => router.push("/unit-prices")}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "var(--color-primary)" }}
          >
            単価一覧を確認
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  if (step === "upload") {
    return (
      <div className="space-y-6">
        {/* ファイル形式の説明 */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            対応フォーマット
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Excel", ext: ".xlsx / .xls", desc: "Excelで管理している単価表をそのまま読み込めます" },
              { label: "CSV", ext: ".csv", desc: "UTF-8またはShift-JIS形式のCSVファイル" },
            ].map((f) => (
              <div
                key={f.label}
                className="rounded-xl p-3"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{f.label}</p>
                <p className="text-xs font-mono mt-0.5" style={{ color: "var(--color-primary)" }}>{f.ext}</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl px-4 py-3" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
            <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
              読み取れる列名
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                ["材料名 / 品名 / 品目 / 名称", "必須"],
                ["単価 / 価格 / 金額", "任意"],
                ["単位", "任意"],
                ["カテゴリ / 分類", "任意"],
                ["メモ / 備考", "任意"],
              ].map(([col, req]) => (
                <span
                  key={col}
                  className="rounded-md px-2 py-0.5 text-xs font-mono"
                  style={{
                    background: req === "必須" ? "rgba(59,130,246,0.08)" : "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    color: req === "必須" ? "var(--color-primary)" : "var(--color-text-muted)",
                  }}
                >
                  {col}
                  <span className="ml-1 text-[10px] opacity-60">{req}</span>
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs" style={{ color: "var(--color-text-subtle)" }}>
              ※ カテゴリが空欄でも取り込めます。次の画面で業種・カテゴリを一括設定できます。
            </p>
          </div>
        </div>

        {/* ドロップゾーン */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className="relative rounded-2xl transition-all"
          style={{
            border: dragging ? "2px solid var(--color-primary)" : "2px dashed var(--color-border)",
            background: dragging ? "var(--color-primary-soft)" : "var(--color-surface)",
          }}
        >
          <label className="flex cursor-pointer flex-col items-center justify-center gap-4 py-16">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: dragging ? "var(--color-primary)" : "var(--color-bg)", border: "1px solid var(--color-border)" }}
            >
              {parsing
                ? <div className="h-6 w-6 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: "var(--color-primary)" }} />
                : <FileSpreadsheet size={28} style={{ color: dragging ? "#fff" : "var(--color-primary)" }} />
              }
            </div>
            <div className="text-center">
              <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
                {parsing ? "読み込み中..." : "ファイルをドロップ、またはクリックして選択"}
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
                Excel (.xlsx / .xls) または CSV (.csv) に対応
              </p>
            </div>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
              disabled={parsing}
            />
          </label>
        </div>
      </div>
    );
  }

  // ── Step 2: レビュー ─────────────────────────────────────────────

  const selectedValid = validRows.filter(r => selected.has(r.key));
  const allValidSelected = validRows.length > 0 && validRows.every(r => selected.has(r.key));
  const bulkCatOptions = bulkTrade ? (TRADE_CATEGORIES[bulkTrade] ?? []) : [];

  return (
    <div className="space-y-4">
      {/* サマリーバー */}
      <div
        className="flex flex-wrap items-center gap-4 rounded-2xl px-5 py-4"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-3">
          <FileSpreadsheet size={20} style={{ color: "var(--color-primary)" }} />
          <div>
            <p className="text-sm font-semibold truncate max-w-xs" style={{ color: "var(--color-text)" }}>{fileName}</p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span style={{ color: "#16A34A", fontWeight: 600 }}>{validRows.length}件 取り込み可能</span>
              {invalidRows.length > 0 && (
                <span className="ml-2" style={{ color: "#B91C1C", fontWeight: 600 }}>
                  {invalidRows.length}件 スキップ
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setStep("upload"); setRows([]); setFileName(""); setSelected(new Set()); }}
          className="ml-auto flex items-center gap-1.5 text-xs transition hover:opacity-70"
          style={{ color: "var(--color-text-muted)" }}
        >
          <RotateCcw size={12} />
          ファイルを変更
        </button>
      </div>

      {/* エラー行 */}
      {invalidRows.length > 0 && (
        <div className="rounded-xl px-4 py-3 text-xs space-y-0.5" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
          <p className="font-semibold mb-1" style={{ color: "#B91C1C" }}>
            <AlertTriangle size={12} className="inline mr-1" />
            以下の行はスキップされます
          </p>
          {invalidRows.map((r) => <p key={r.key} style={{ color: "#B91C1C" }}>{r._error}</p>)}
        </div>
      )}

      {/* 一括設定ツールバー */}
      <div
        className="rounded-2xl px-5 py-4 space-y-3"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            一括設定
          </span>
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            — チェックした行に業種・カテゴリをまとめて割り当て
          </span>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>業種</label>
            <select
              value={bulkTrade}
              onChange={(e) => { setBulkTrade(e.target.value); setBulkCat(""); }}
              className="rounded-xl px-3 py-2 text-sm outline-none"
              style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)", minWidth: 120 }}
            >
              <option value="">選択してください</option>
              {ALL_TRADES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>カテゴリ</label>
            <select
              value={bulkCat}
              onChange={(e) => setBulkCat(e.target.value)}
              disabled={!bulkTrade}
              className="rounded-xl px-3 py-2 text-sm outline-none disabled:opacity-40"
              style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)", minWidth: 140 }}
            >
              <option value="">{bulkTrade ? "カテゴリを選択" : "業種を先に選択"}</option>
              {bulkCatOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button
            type="button"
            onClick={applyBulk}
            disabled={!bulkTrade || selectedValid.length === 0}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            style={{ background: "var(--color-primary)" }}
          >
            選択中 {selectedValid.length}件 に適用
          </button>
        </div>
      </div>

      {/* テーブル */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--color-border)" }}
      >
        <div
          className="flex items-center gap-3 px-4 py-2.5"
          style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}
        >
          <button type="button" onClick={toggleAll} className="flex items-center gap-2 text-xs transition hover:opacity-70" style={{ color: "var(--color-text-muted)" }}>
            {allValidSelected
              ? <CheckSquare size={15} style={{ color: "var(--color-primary)" }} />
              : <Square size={15} />
            }
            全選択 / 解除
          </button>
          <span className="text-xs" style={{ color: "var(--color-text-subtle)" }}>
            {selectedValid.length}/{validRows.length} 件選択中
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}>
                <th className="w-10 px-3 py-2.5" />
                <th className="px-3 py-2.5 text-left text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>材料名</th>
                <th className="w-24 px-2 py-2.5 text-left text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>単位</th>
                <th className="w-32 px-2 py-2.5 text-left text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>単価</th>
                <th className="w-28 px-2 py-2.5 text-left text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>業種</th>
                <th className="w-36 px-2 py-2.5 text-left text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>カテゴリ</th>
              </tr>
            </thead>
            <tbody>
              {validRows.map((row, i) => {
                const isSelected = selected.has(row.key);
                const rowTrade = tradeFromCategory(row.category);
                const catOptions = rowTrade ? (TRADE_CATEGORIES[rowTrade] ?? []) : [];
                return (
                  <tr
                    key={row.key}
                    onClick={() => toggleSelect(row.key)}
                    className="cursor-pointer transition-colors"
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      background: isSelected
                        ? "var(--color-primary-soft)"
                        : i % 2 === 0 ? "var(--color-surface)" : "var(--color-bg)",
                    }}
                  >
                    <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(row.key)}
                        className="h-4 w-4 cursor-pointer rounded"
                        style={{ accentColor: "var(--color-primary)" }}
                      />
                    </td>
                    <td className="px-3 py-2.5 font-medium" style={{ color: "var(--color-text)" }}>
                      {row.material_name}
                    </td>

                    {/* 単位（UnitInput） */}
                    <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                      <UnitInput
                        value={row.unit}
                        onChange={(v) => updateRow(row.key, { unit: v })}
                        placeholder="単位"
                        inputClassName="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                      />
                    </td>

                    {/* 単価（インライン編集） */}
                    <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number"
                        value={row.unit_price || ""}
                        onChange={(e) => updateRow(row.key, { unit_price: parseFloat(e.target.value) || 0, _valid: true })}
                        placeholder="0"
                        min="0"
                        className="w-full rounded-lg px-2 py-1.5 text-xs outline-none tabular-nums"
                        style={{
                          background: "var(--color-bg)",
                          border: row.unit_price > 0 ? "1px solid var(--color-border)" : "1px solid #FCA5A5",
                          color: row.unit_price > 0 ? "var(--color-text)" : "var(--color-text-subtle)",
                        }}
                      />
                    </td>

                    {/* 業種セレクト */}
                    <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={rowTrade}
                        onChange={(e) => {
                          const newTrade = e.target.value;
                          const cats = TRADE_CATEGORIES[newTrade] ?? [];
                          updateRow(row.key, { category: cats.length === 1 ? cats[0] : null });
                        }}
                        className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
                        style={{
                          background: "var(--color-bg)",
                          border: "1px solid var(--color-border)",
                          color: rowTrade ? "var(--color-text)" : "var(--color-text-subtle)",
                        }}
                      >
                        <option value="">未設定</option>
                        {ALL_TRADES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>

                    {/* カテゴリセレクト */}
                    <td className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={row.category ?? ""}
                        onChange={(e) => updateRow(row.key, { category: e.target.value || null })}
                        disabled={!rowTrade}
                        className="w-full rounded-lg px-2 py-1.5 text-xs outline-none disabled:opacity-40"
                        style={{
                          background: "var(--color-bg)",
                          border: "1px solid var(--color-border)",
                          color: row.category ? "var(--color-text)" : "var(--color-text-subtle)",
                        }}
                      >
                        <option value="">{rowTrade ? "選択" : "—"}</option>
                        {catOptions.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* フッター */}
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          カテゴリ未設定のまま取り込んでも後から変更できます
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setStep("upload"); setRows([]); setFileName(""); }}
            className="rounded-xl px-5 py-2.5 text-sm font-medium transition hover:opacity-80"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={doImport}
            disabled={importing || selectedValid.length === 0}
            className="rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "var(--color-primary)" }}
          >
            {importing ? "取り込み中..." : `${selectedValid.length}件 を単価マスタに登録`}
          </button>
        </div>
      </div>
    </div>
  );
}
