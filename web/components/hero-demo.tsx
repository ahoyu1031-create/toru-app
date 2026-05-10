"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Sparkles, CheckCircle2 } from "lucide-react";

const ROWS = [
  { name: "ガス管 25A",     qty: "12", unit: "m",  price: "¥2,400" },
  { name: "エルボ 25A 90°", qty: "8",  unit: "個", price: "¥480"   },
  { name: "チーズ 25A",     qty: "4",  unit: "個", price: "¥680"   },
  { name: "バルブ 25A",     qty: "2",  unit: "個", price: "¥3,200" },
  { name: "サポート金具",   qty: "6",  unit: "個", price: "¥320"   },
];

type Stage = "upload" | "analyzing" | "results" | "quote";

const STAGE_LABELS: Record<Stage, string> = {
  upload:    "図面をアップロード",
  analyzing: "AIが解析中...",
  results:   "図面解析結果",
  quote:     "御見積書",
};

export function HeroDemo() {
  const [stage, setStage]         = useState<Stage>("upload");
  const [progress, setProgress]   = useState(0);
  const [visibleRows, setVisible] = useState(0);
  const [btnClicked, setBtnClicked] = useState(false);

  const timers    = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intervals = useRef<ReturnType<typeof setInterval>[]>([]);

  function clearAll() {
    timers.current.forEach(clearTimeout);
    intervals.current.forEach(clearInterval);
    timers.current = [];
    intervals.current = [];
  }

  useEffect(() => {
    clearAll();

    if (stage === "upload") {
      timers.current.push(setTimeout(() => setStage("analyzing"), 2200));
    }

    if (stage === "analyzing") {
      setProgress(0);
      let p = 0;
      const iv = setInterval(() => {
        p += 2;
        setProgress(Math.min(p, 100));
        if (p >= 100) clearInterval(iv);
      }, 52); // 52ms × 50steps = 2600ms → 完了後少し待つ
      intervals.current.push(iv);
      timers.current.push(setTimeout(() => {
        setVisible(0);
        setBtnClicked(false);
        setStage("results");
      }, 3000));
    }

    if (stage === "results") {
      // 1行ずつ登場
      for (let i = 0; i < ROWS.length; i++) {
        timers.current.push(
          setTimeout(() => setVisible(i + 1), 200 + i * 420),
        );
      }
      const afterRows = 200 + ROWS.length * 420; // ~2300ms
      // ボタンが押される演出
      timers.current.push(setTimeout(() => setBtnClicked(true), afterRows + 600));
      // 見積書へ
      timers.current.push(setTimeout(() => setStage("quote"), afterRows + 1200));
    }

    if (stage === "quote") {
      timers.current.push(setTimeout(() => setStage("upload"), 3200));
    }

    return clearAll;
  }, [stage]);

  const stepIndex: Record<Stage, number> = { upload: 0, analyzing: 1, results: 2, quote: 3 };

  return (
    <div
      className="overflow-hidden rounded-2xl w-full"
      style={{
        background: "#111827",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {/* ── ウィンドウバー ── */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0F172A" }}
      >
        <div className="h-3 w-3 rounded-full" style={{ background: "#EF4444" }} />
        <div className="h-3 w-3 rounded-full" style={{ background: "#F59E0B" }} />
        <div className="h-3 w-3 rounded-full" style={{ background: "#10B981" }} />

        {/* ステップドット */}
        <div className="ml-3 flex items-center gap-1.5">
          {(["upload", "analyzing", "results", "quote"] as Stage[]).map((s, i) => (
            <div
              key={s}
              className="rounded-full transition-all duration-500"
              style={{
                width:  stepIndex[stage] === i ? "20px" : "6px",
                height: "6px",
                background: stepIndex[stage] >= i
                  ? (s === "quote" ? "#F97316" : "#60A5FA")
                  : "rgba(255,255,255,0.12)",
              }}
            />
          ))}
        </div>

        <span className="ml-2 text-xs transition-all duration-300" style={{ color: "#475569" }}>
          {STAGE_LABELS[stage]}
        </span>
      </div>

      {/* ── コンテンツ（固定高さ・中身だけ切り替え） ── */}
      <div style={{ height: 360, overflow: "hidden" }}>
        {stage === "upload"    && <UploadStage    key="upload"    />}
        {stage === "analyzing" && <AnalyzingStage key="analyzing" progress={progress} />}
        {stage === "results"   && (
          <ResultsStage key="results" visibleRows={visibleRows} btnClicked={btnClicked} />
        )}
        {stage === "quote"     && <QuoteStage     key="quote"     />}
      </div>
    </div>
  );
}

/* ── ① アップロード ───────────────────────────────── */
function UploadStage() {
  return (
    <div className="stage-enter flex flex-col items-center justify-center p-10" style={{ height: 360 }}>
      <div
        className="flex w-full max-w-xs flex-col items-center gap-5 rounded-2xl px-8 py-8"
        style={{
          border: "2px dashed rgba(37,99,235,0.3)",
          background: "rgba(37,99,235,0.04)",
        }}
      >
        {/* PDFアイコン（上から落ちてくる） */}
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{
            background: "rgba(37,99,235,0.12)",
            border: "1px solid rgba(37,99,235,0.2)",
            animation: "lp-fade-up 0.6s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <FileText size={30} style={{ color: "#60A5FA" }} />
        </div>

        <div className="text-center">
          <p className="text-sm font-bold text-white">図面PDFをアップロード</p>
          <p className="mt-1 text-xs" style={{ color: "#475569" }}>
            ドラッグ＆ドロップ またはクリック
          </p>
        </div>

        {/* ファイル名バッジ */}
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-2"
          style={{
            background: "rgba(37,99,235,0.1)",
            border: "1px solid rgba(37,99,235,0.25)",
            animation: "lp-fade-up 0.6s 0.25s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <FileText size={13} style={{ color: "#60A5FA" }} />
          <span className="text-xs font-medium" style={{ color: "#93C5FD" }}>
            1F給排水設備図.pdf
          </span>
        </div>

        {/* アップロード完了インジケーター */}
        <div
          className="h-1.5 w-full overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #2563EB, #60A5FA)",
              animation: "upload-progress 1.6s 0.5s cubic-bezier(0.4,0,0.2,1) both",
              width: "100%",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes upload-progress {
          from { width: 0%; opacity: 0.6; }
          to   { width: 100%; opacity: 1; }
        }
      `}</style>
    </div>
  );
}

/* ── ② AI解析中 ──────────────────────────────────── */
function AnalyzingStage({ progress }: { progress: number }) {
  return (
    <div className="stage-enter flex flex-col items-center justify-center gap-7 p-10" style={{ height: 360 }}>
      {/* スパークルアイコン（パルス） */}
      <div
        className="relative flex h-18 w-18 items-center justify-center"
        style={{ width: 72, height: 72 }}
      >
        {/* 外側のリング */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: "2px solid rgba(37,99,235,0.2)",
            animation: "ring-pulse 1.8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute inset-2 rounded-full"
          style={{
            border: "2px solid rgba(37,99,235,0.15)",
            animation: "ring-pulse 1.8s 0.4s ease-in-out infinite",
          }}
        />
        <div
          className="relative flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(37,99,235,0.3)" }}
        >
          <Sparkles size={22} style={{ color: "#60A5FA" }} />
        </div>
      </div>

      <div className="w-full max-w-xs text-center">
        <p className="mb-1 text-sm font-bold text-white">AIが図面を解析中...</p>
        <p className="mb-5 text-xs" style={{ color: "#475569" }}>
          材料・数量・施工注意点を抽出しています
        </p>

        {/* プログレスバー */}
        <div
          className="h-2 overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, #1D4ED8, #60A5FA)",
              transition: "width 0.08s linear",
            }}
          />
        </div>
        <p className="mt-2 font-mono text-xs" style={{ color: "#60A5FA" }}>
          {progress}%
        </p>
      </div>

      <style>{`
        @keyframes ring-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}

/* ── ③ 解析結果 ──────────────────────────────────── */
function ResultsStage({
  visibleRows,
  btnClicked,
}: {
  visibleRows: number;
  btnClicked: boolean;
}) {
  return (
    <div className="stage-enter p-5" style={{ height: 360 }}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="h-3.5 w-36 rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="mt-1.5 h-2.5 w-20 rounded" style={{ background: "rgba(255,255,255,0.04)" }} />
        </div>
        {/* 見積書ボタン（クリック演出あり） */}
        <div
          className="rounded-lg px-3 py-1.5 text-xs font-bold"
          style={{
            background: btnClicked ? "#F97316" : "rgba(249,115,22,0.12)",
            color:      btnClicked ? "#fff"    : "#FB923C",
            border:     "1px solid rgba(249,115,22,0.25)",
            transform:  btnClicked ? "scale(0.94)" : "scale(1)",
            boxShadow:  btnClicked ? "0 0 16px rgba(249,115,22,0.5)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          見積書を作成
        </div>
      </div>

      <div className="overflow-hidden rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
        <div
          className="grid grid-cols-4 px-4 py-2 text-xs font-semibold"
          style={{ background: "rgba(255,255,255,0.04)", color: "#475569" }}
        >
          <span>材料名</span>
          <span className="text-center">数量</span>
          <span className="text-center">単位</span>
          <span className="text-right">単価</span>
        </div>

        {ROWS.map((row, i) => (
          <div
            key={row.name}
            className="grid grid-cols-4 px-4 py-2.5 text-xs"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.04)",
              background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
              color: "#94A3B8",
              opacity:   visibleRows > i ? 1 : 0,
              transform: visibleRows > i ? "translateY(0)" : "translateY(6px)",
              transition: "opacity 0.35s ease, transform 0.35s ease",
            }}
          >
            <span style={{ color: "#CBD5E1" }}>{row.name}</span>
            <span className="text-center">{row.qty}</span>
            <span className="text-center">{row.unit}</span>
            <span className="text-right" style={{ color: "#60A5FA" }}>{row.price}</span>
          </div>
        ))}
      </div>

      <div
        className="mt-3 flex justify-end"
        style={{
          opacity:    visibleRows >= ROWS.length ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        <div className="text-right">
          <p className="text-xs" style={{ color: "#475569" }}>合計金額</p>
          <p className="text-xl font-bold" style={{ color: "#F97316" }}>¥47,200</p>
        </div>
      </div>
    </div>
  );
}

/* ── ④ 見積書 ────────────────────────────────────── */
function QuoteStage() {
  return (
    <div className="stage-enter flex items-center justify-center p-6" style={{ height: 360 }}>
      <div
        className="w-full max-w-xs overflow-hidden rounded-2xl"
        style={{
          background: "#fff",
          boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        }}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #E2E8F0" }}>
          <div>
            <p className="text-xs font-black tracking-wider" style={{ color: "#0F172A" }}>TORU</p>
            <p className="text-[10px]" style={{ color: "#94A3B8" }}>御見積書</p>
          </div>
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{ background: "rgba(5,150,105,0.1)" }}
          >
            <CheckCircle2 size={15} style={{ color: "#10B981" }} />
          </div>
        </div>

        {/* 本文 */}
        <div className="p-4">
          <p className="mb-0.5 text-[10px] font-bold" style={{ color: "#0F172A" }}>○○建設株式会社 御中</p>
          <p className="mb-3 text-[10px]" style={{ color: "#94A3B8" }}>工事名：1F給排水設備工事</p>

          <div
            className="mb-2 overflow-hidden rounded-lg"
            style={{ border: "1px solid #E2E8F0" }}
          >
            <div
              className="grid grid-cols-3 px-3 py-1.5 text-[10px] font-semibold"
              style={{ background: "#F8FAFC", color: "#64748B" }}
            >
              <span>品目</span>
              <span className="text-center">数量</span>
              <span className="text-right">金額</span>
            </div>
            {[
              ["ガス管 25A",   "12m", "¥2,400"],
              ["エルボ 25A",   "8個", "¥960"],
              ["バルブ 25A",   "2個", "¥3,600"],
            ].map(([name, qty, price], i) => (
              <div
                key={name}
                className="grid grid-cols-3 px-3 py-2 text-[10px]"
                style={{
                  borderTop: "1px solid #F1F5F9",
                  color: "#334155",
                  animation: `lp-fade-up 0.4s ${i * 0.1 + 0.1}s ease-out both`,
                }}
              >
                <span>{name}</span>
                <span className="text-center">{qty}</span>
                <span className="text-right">{price}</span>
              </div>
            ))}
          </div>

          <div
            className="flex items-center justify-between rounded-lg px-3 py-2"
            style={{
              background: "#FFF7ED",
              animation: "lp-fade-up 0.4s 0.4s ease-out both",
            }}
          >
            <span className="text-xs font-bold" style={{ color: "#0F172A" }}>合計（税込）</span>
            <span className="text-sm font-black" style={{ color: "#F97316" }}>¥47,200</span>
          </div>
        </div>
      </div>
    </div>
  );
}
