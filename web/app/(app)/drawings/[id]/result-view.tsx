"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, Printer, ArrowUp } from "lucide-react";
import type { Mode, Result, AllResult, MaterialItem } from "@/components/analysis-context";

const MODE_LABELS: Record<Exclude<Mode, "all">, string> = {
  materials: "材料拾い出し",
  construction_notes: "施工注意事項",
  coordination: "他業者との緩衝",
  communication: "他業者への伝達事項",
};

const ORDER: Exclude<Mode, "all">[] = [
  "materials",
  "construction_notes",
  "coordination",
  "communication",
];

function isMaterialsResult(result: Result): boolean {
  if (result.type === "materials") return true;
  if (
    Array.isArray(result.items) &&
    result.items.length > 0 &&
    typeof result.items[0] === "object" &&
    result.items[0] !== null &&
    "material_name" in (result.items[0] as object)
  )
    return true;
  return false;
}

export function DrawingResultView({
  mode,
  result,
  allResult,
}: {
  mode: string;
  result: Result | null;
  allResult: AllResult | null;
}) {
  const router = useRouter();

  const materialsResult: Result | null =
    allResult?.materials ??
    (result && isMaterialsResult(result) ? result : null);

  const [checked, setChecked] = useState<boolean[]>(() =>
    materialsResult ? materialsResult.items.map(() => true) : []
  );
  const selectedCount = checked.filter(Boolean).length;
  const hasMaterials = materialsResult != null;

  function goToNewQuote() {
    if (!materialsResult || !isMaterialsResult(materialsResult)) return;
    const selected = (materialsResult.items as MaterialItem[]).filter((_, i) => checked[i]);
    sessionStorage.setItem("toru_drawing_materials", JSON.stringify(selected));
    router.push("/quotes/new");
  }

  let sections: { key: Exclude<Mode, "all">; result: Result }[] = [];
  if (allResult) {
    sections = ORDER.filter((k) => allResult[k] != null).map((k) => ({
      key: k,
      result: allResult[k]!,
    }));
  } else if (result) {
    sections = [{ key: mode as Exclude<Mode, "all">, result }];
  }

  if (sections.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        結果データがありません
      </p>
    );
  }

  return (
    <div>
      <style>{`
        @media print {
          .drawing-no-print { display: none !important; }
          .drawing-print-deselected { opacity: 1 !important; }
        }
      `}</style>

      {/* フローティングサイドナビ（lg以上） */}
      <FloatingNav
        sections={sections.map((s) => s.key)}
        hasMaterials={hasMaterials}
        selectedCount={selectedCount}
        onGoToQuote={goToNewQuote}
      />

      {/* 上部アクションバー */}
      <div className="drawing-no-print mb-6 flex flex-wrap items-center gap-3">
        {hasMaterials && (
          <button
            type="button"
            onClick={goToNewQuote}
            disabled={selectedCount === 0}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[color:var(--color-primary-hover)] disabled:opacity-50"
          >
            <FileText size={15} />
            見積書を作成（{selectedCount} 件選択中）
          </button>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-[color:var(--color-border)] bg-white px-5 text-sm font-semibold transition hover:bg-[color:var(--color-bg)]"
          style={{ color: "var(--color-text)" }}
        >
          <Printer size={15} />
          PDF出力
        </button>
      </div>

      {/* 解析結果セクション群 */}
      <div className="space-y-6">
        {sections.map(({ key, result: sectionResult }) => (
          <div key={key} id={`section-${key}`}>
            <ResultSection
              mode={key}
              result={sectionResult}
              checked={key === "materials" ? checked : []}
              setChecked={key === "materials" ? setChecked : () => {}}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── フローティングサイドナビ ──────────────────────────────────────

function FloatingNav({
  sections,
  hasMaterials,
  selectedCount,
  onGoToQuote,
}: {
  sections: Exclude<Mode, "all">[];
  hasMaterials: boolean;
  selectedCount: number;
  onGoToQuote: () => void;
}) {
  const [activeKey, setActiveKey] = useState<string>(sections[0] ?? "");

  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>('[data-print="main"]') ?? document.documentElement;
    function onScroll() {
      let current = sections[0] ?? "";
      for (const key of sections) {
        const el = document.getElementById(`section-${key}`);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 160) current = key;
      }
      setActiveKey(current);
    }
    scroller.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [sections]);

  return (
    <div className="drawing-no-print fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-2 w-40">

      {/* セクションナビ */}
      {sections.length > 1 && (
        <nav
          className="rounded-2xl border bg-white shadow-md overflow-hidden"
          style={{ borderColor: "var(--color-border)" }}
        >
          <p className="px-3 pt-3 pb-1 text-[10px] font-bold tracking-wider uppercase" style={{ color: "var(--color-text-muted)" }}>
            解析項目
          </p>
          {sections.map((key) => {
            const isActive = activeKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveKey(key);
                  document.getElementById(`section-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-left transition"
                style={
                  isActive
                    ? { background: "var(--color-primary)", color: "#fff" }
                    : { color: "var(--color-text-muted)" }
                }
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "var(--color-bg)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "";
                }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: isActive ? "#fff" : "var(--color-border)" }}
                />
                {MODE_LABELS[key]}
              </button>
            );
          })}
        </nav>
      )}

      {/* アクション */}
      <div
        className="rounded-2xl border bg-white shadow-md overflow-hidden"
        style={{ borderColor: "var(--color-border)" }}
      >
        <p className="px-3 pt-3 pb-1 text-[10px] font-bold tracking-wider uppercase" style={{ color: "var(--color-text-muted)" }}>
          アクション
        </p>
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-left transition hover:bg-[color:var(--color-bg)]"
          style={{ color: "var(--color-text)" }}
        >
          <Printer size={13} className="shrink-0" />
          PDF出力
        </button>
        {hasMaterials && (
          <button
            type="button"
            onClick={onGoToQuote}
            disabled={selectedCount === 0}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-left border-t transition hover:bg-[color:var(--color-primary-soft)] disabled:opacity-40"
            style={{ borderColor: "var(--color-border)", color: "var(--color-primary)" }}
          >
            <FileText size={13} className="shrink-0" />
            <span>
              見積書を作成
              <span className="block text-[10px] font-normal opacity-70">{selectedCount}件選択中</span>
            </span>
          </button>
        )}
      </div>

      {/* トップへ */}
      <button
        type="button"
        onClick={() => {
          const scroller = document.querySelector<HTMLElement>('[data-print="main"]');
          if (scroller) scroller.scrollTo({ top: 0, behavior: "smooth" });
          else window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className="rounded-2xl border bg-white shadow-md px-3 py-2.5 text-xs font-medium flex items-center justify-center gap-1.5 transition hover:bg-[color:var(--color-bg)]"
        style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
      >
        <ArrowUp size={13} />
        トップへ
      </button>
    </div>
  );
}

// ── 解析結果セクション ────────────────────────────────────────────

function ResultSection({
  mode,
  result,
  checked,
  setChecked,
}: {
  mode: Exclude<Mode, "all">;
  result: Result;
  checked: boolean[];
  setChecked: React.Dispatch<React.SetStateAction<boolean[]>>;
}) {
  const label = MODE_LABELS[mode] ?? mode;
  const isMat = isMaterialsResult(result);

  return (
    <section className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{label} — 解析結果</h2>
        <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {result.items.length} 件
        </span>
      </div>

      {isMat ? (
        <div className="overflow-x-auto rounded-lg border border-[color:var(--color-border)]">
          <table className="min-w-full text-sm">
            <thead className="bg-[color:var(--color-primary-soft)]">
              <tr>
                <th className="w-10 py-2.5 pl-4 drawing-no-print">
                  <input
                    type="checkbox"
                    checked={checked.length > 0 && checked.every(Boolean)}
                    onChange={(e) => setChecked(checked.map(() => e.target.checked))}
                    className="h-4 w-4 rounded accent-[color:var(--color-primary)]"
                  />
                </th>
                <th className="py-2.5 pr-4 text-left text-xs font-semibold text-[color:var(--color-primary)]">材料名</th>
                <th className="py-2.5 pr-4 text-right text-xs font-semibold text-[color:var(--color-primary)]">数量</th>
                <th className="py-2.5 pr-4 text-left text-xs font-semibold text-[color:var(--color-primary)]">単位</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--color-border)] bg-white">
              {(result.items as MaterialItem[]).map((m, i) => (
                <tr
                  key={i}
                  onClick={() => setChecked((prev) => prev.map((v, j) => (j === i ? !v : v)))}
                  className={`cursor-pointer transition hover:bg-gray-50 drawing-print-deselected ${checked[i] ? "" : "opacity-40"}`}
                >
                  <td className="py-2.5 pl-4 drawing-no-print">
                    <input
                      type="checkbox"
                      checked={checked[i] ?? false}
                      onChange={() => setChecked((prev) => prev.map((v, j) => (j === i ? !v : v)))}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded accent-[color:var(--color-primary)]"
                    />
                  </td>
                  <td className="py-2.5 pr-4 font-medium">{m.material_name}</td>
                  <td className="py-2.5 pr-4 text-right">{m.quantity}</td>
                  <td className="py-2.5 pr-4" style={{ color: "var(--color-text-muted)" }}>{m.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="space-y-3">
          {(result.items as string[]).map((item, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-lg border border-[color:var(--color-border)] bg-white px-4 py-3 text-sm"
            >
              <span className="mt-0.5 shrink-0 font-bold text-[color:var(--color-primary)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
