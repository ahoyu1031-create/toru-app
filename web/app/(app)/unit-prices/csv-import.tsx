"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, X, FileSpreadsheet, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";
import { importFromCsv, type CsvRow } from "./actions";
import { useToast } from "@/components/toast-context";

type ParsedRow = CsvRow & { _valid: boolean; _error?: string };

const EXPECTED_HEADERS = ["material_name", "unit", "unit_price", "category", "memo"] as const;
const JAPANESE_HEADERS: Record<string, string> = {
  "材料名": "material_name",
  "品名": "material_name",
  "品目": "material_name",
  "単位": "unit",
  "単価": "unit_price",
  "価格": "unit_price",
  "金額": "unit_price",
  "カテゴリ": "category",
  "カテゴリー": "category",
  "分類": "category",
  "メモ": "memo",
  "備考": "memo",
  "notes": "memo",
};

function normalizeHeader(h: string): string {
  const cleaned = h.trim().toLowerCase().replace(/\s+/g, "_");
  return JAPANESE_HEADERS[h.trim()] ?? EXPECTED_HEADERS.find((e) => e === cleaned) ?? cleaned;
}

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };

  function splitLine(line: string): string[] {
    const result: string[] = [];
    let field = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuote) {
        if (c === '"' && line[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') { inQuote = false; }
        else { field += c; }
      } else {
        if (c === '"') { inQuote = true; }
        else if (c === ",") { result.push(field.trim()); field = ""; }
        else { field += c; }
      }
    }
    result.push(field.trim());
    return result;
  }

  const rawHeaders = splitLine(lines[0]).map(normalizeHeader);
  const rows = lines.slice(1).map((line) => {
    const values = splitLine(line);
    const row: Record<string, string> = {};
    rawHeaders.forEach((h, i) => { row[h] = values[i] ?? ""; });
    return row;
  });
  return { headers: rawHeaders, rows };
}

function validateRow(row: Record<string, string>, idx: number): ParsedRow {
  const material_name = row["material_name"]?.trim() ?? "";
  const unit = row["unit"]?.trim() ?? "";
  const unitPriceStr = row["unit_price"]?.replace(/[,，¥￥\s]/g, "").trim() ?? "0";
  const unit_price = parseFloat(unitPriceStr);

  if (!material_name) {
    return { material_name: "", unit, unit_price: 0, category: null, memo: null, _valid: false, _error: `行${idx + 2}: 材料名が空` };
  }
  if (isNaN(unit_price) || unit_price < 0) {
    return { material_name, unit, unit_price: 0, category: null, memo: null, _valid: false, _error: `行${idx + 2}: 単価が不正` };
  }
  return {
    material_name,
    unit,
    unit_price,
    category: row["category"]?.trim() || null,
    memo: row["memo"]?.trim() || null,
    _valid: true,
  };
}

export function CsvImport() {
  const [open, setOpen] = useState(false);
  const [parsed, setParsed] = useState<ParsedRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const { success, error: toastError } = useToast();

  function reset() {
    setParsed(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCsv(text);

      if (!headers.includes("material_name")) {
        toastError("CSVに「材料名」列が見つかりません。列名を確認してください。");
        reset();
        return;
      }
      if (rows.length === 0) {
        toastError("データ行がありません");
        reset();
        return;
      }
      if (rows.length > 500) {
        toastError("一度にインポートできるのは500行までです");
        reset();
        return;
      }
      setParsed(rows.map((r, i) => validateRow(r, i)));
    };
    reader.readAsText(file, "UTF-8");
  }

  const validRows = parsed?.filter((r) => r._valid) ?? [];
  const invalidRows = parsed?.filter((r) => !r._valid) ?? [];

  function doImport() {
    if (!validRows.length) return;
    startTransition(async () => {
      const result = await importFromCsv(validRows.map(({ _valid, _error, ...r }) => r));
      if (result.ok) {
        success(`${result.inserted}件のデータをインポートしました`);
        reset();
        setOpen(false);
      } else {
        toastError(result.error ?? "インポートに失敗しました");
      }
    });
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid var(--color-border)", background: "var(--color-surface)" }}
    >
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); if (open) reset(); }}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:opacity-80"
      >
        <FileSpreadsheet size={18} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>CSVインポート</p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            CSV / Excelから一括登録（最大500行）
          </p>
        </div>
        {open ? <ChevronUp size={16} style={{ color: "var(--color-text-muted)" }} /> : <ChevronDown size={16} style={{ color: "var(--color-text-muted)" }} />}
      </button>

      {open && (
        <div
          className="border-t px-5 pb-5 pt-4 space-y-4"
          style={{ borderColor: "var(--color-border)" }}
        >
          {/* Format hint */}
          <div
            className="rounded-xl px-4 py-3 text-xs space-y-1"
            style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
          >
            <p className="font-semibold" style={{ color: "var(--color-text)" }}>CSVフォーマット</p>
            <p style={{ color: "var(--color-text-muted)" }}>
              1行目をヘッダー行として認識します。以下の列名に対応しています：
            </p>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {[
                ["材料名 / 品名 / 品目", "必須"],
                ["単位", "任意"],
                ["単価 / 価格", "任意"],
                ["カテゴリ / 分類", "任意"],
                ["メモ / 備考", "任意"],
              ].map(([col, req]) => (
                <span
                  key={col}
                  className="rounded-md px-2 py-0.5 font-mono"
                  style={{
                    background: req === "必須" ? "rgba(var(--color-primary-rgb,59,130,246),0.08)" : "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    color: req === "必須" ? "var(--color-primary)" : "var(--color-text-muted)",
                  }}
                >
                  {col}
                  <span className="ml-1 text-[10px] opacity-70">{req}</span>
                </span>
              ))}
            </div>
          </div>

          {/* File input */}
          {!parsed ? (
            <label
              className="flex flex-col items-center justify-center gap-3 rounded-xl py-8 cursor-pointer transition hover:opacity-80"
              style={{ border: "2px dashed var(--color-border)", background: "var(--color-bg)" }}
            >
              <Upload size={24} style={{ color: "var(--color-text-muted)" }} />
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  クリックしてCSVファイルを選択
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  UTF-8形式のCSVファイル（.csv）
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFile}
              />
            </label>
          ) : (
            <div className="space-y-3">
              {/* File info */}
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={15} style={{ color: "var(--color-primary)" }} />
                <span className="text-sm font-medium flex-1 truncate" style={{ color: "var(--color-text)" }}>
                  {fileName}
                </span>
                <button type="button" onClick={reset} className="shrink-0 opacity-60 hover:opacity-100 transition">
                  <X size={14} style={{ color: "var(--color-text-muted)" }} />
                </button>
              </div>

              {/* Summary */}
              <div className="flex gap-3 flex-wrap text-sm">
                <span className="flex items-center gap-1.5 font-medium" style={{ color: "#065F46" }}>
                  <CheckCircle2 size={14} /> {validRows.length}件 インポート可能
                </span>
                {invalidRows.length > 0 && (
                  <span className="flex items-center gap-1.5 font-medium" style={{ color: "#B91C1C" }}>
                    <AlertTriangle size={14} /> {invalidRows.length}件 スキップ
                  </span>
                )}
              </div>

              {/* Error list */}
              {invalidRows.length > 0 && (
                <div
                  className="rounded-xl px-4 py-3 text-xs space-y-0.5"
                  style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}
                >
                  {invalidRows.map((r, i) => (
                    <p key={i} style={{ color: "#B91C1C" }}>{r._error}</p>
                  ))}
                </div>
              )}

              {/* Preview table (first 10) */}
              {validRows.length > 0 && (
                <div
                  className="overflow-hidden rounded-xl"
                  style={{ border: "1px solid var(--color-border)" }}
                >
                  <div
                    className="px-3 py-2 text-xs font-semibold"
                    style={{ background: "var(--color-bg)", color: "var(--color-text-muted)", borderBottom: "1px solid var(--color-border)" }}
                  >
                    プレビュー（先頭{Math.min(validRows.length, 10)}件）
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)" }}>
                          {["材料名", "単位", "単価", "カテゴリ"].map((h) => (
                            <th key={h} className="px-3 py-1.5 text-left font-semibold" style={{ color: "var(--color-text-muted)" }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {validRows.slice(0, 10).map((r, i) => (
                          <tr
                            key={i}
                            style={{
                              borderBottom: "1px solid var(--color-border)",
                              background: i % 2 === 0 ? "var(--color-surface)" : "var(--color-bg)",
                            }}
                          >
                            <td className="px-3 py-1.5 font-medium" style={{ color: "var(--color-text)" }}>{r.material_name}</td>
                            <td className="px-3 py-1.5" style={{ color: "var(--color-text-muted)" }}>{r.unit || "-"}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums" style={{ color: "var(--color-text)" }}>
                              ¥{r.unit_price.toLocaleString()}
                            </td>
                            <td className="px-3 py-1.5" style={{ color: "var(--color-text-muted)" }}>{r.category || "-"}</td>
                          </tr>
                        ))}
                        {validRows.length > 10 && (
                          <tr style={{ background: "var(--color-surface)" }}>
                            <td colSpan={4} className="px-3 py-1.5 text-center" style={{ color: "var(--color-text-muted)" }}>
                              … 他 {validRows.length - 10}件
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import button */}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={reset}
                  className="h-9 rounded-xl px-4 text-sm font-medium transition hover:opacity-80"
                  style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={doImport}
                  disabled={isPending || validRows.length === 0}
                  className="h-9 rounded-xl px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--color-primary)" }}
                >
                  {isPending ? "インポート中..." : `${validRows.length}件をインポート`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
