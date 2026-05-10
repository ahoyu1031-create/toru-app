"use client";

import { Download } from "lucide-react";
import { useToast } from "@/components/toast-context";

type Row = {
  material_name: string;
  unit: string | null;
  unit_price: number;
  category: string | null;
  memo: string | null;
};

export function CsvExport({ rows }: { rows: Row[] }) {
  const { success, error } = useToast();

  function download() {
    if (!rows.length) {
      error("エクスポートするデータがありません");
      return;
    }

    const headers = ["材料名", "単位", "単価", "カテゴリ", "メモ"];
    const csvRows = [
      headers.join(","),
      ...rows.map((r) => [
        `"${(r.material_name ?? "").replace(/"/g, '""')}"`,
        `"${(r.unit ?? "").replace(/"/g, '""')}"`,
        r.unit_price,
        `"${(r.category ?? "").replace(/"/g, '""')}"`,
        `"${(r.memo ?? "").replace(/"/g, '""')}"`,
      ].join(",")),
    ];

    const bom = "﻿"; // UTF-8 BOM for Excel compatibility
    const blob = new Blob([bom + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unit_price_master_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    success(`${rows.length}件のデータをエクスポートしました`);
  }

  return (
    <button
      type="button"
      onClick={download}
      className="inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium transition hover:opacity-80"
      style={{
        border: "1px solid var(--color-border)",
        background: "var(--color-surface)",
        color: "var(--color-text-muted)",
      }}
    >
      <Download size={15} />
      CSVエクスポート
    </button>
  );
}
