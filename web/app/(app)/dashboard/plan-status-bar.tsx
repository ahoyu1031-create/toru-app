"use client";

import { useState } from "react";
import { Zap, ChevronRight, ChevronDown } from "lucide-react";

const PLAN_NAMES: Record<string, string> = {
  free: "free", individual: "individual",
  team_5: "team (5名)", team_10: "team (10名)", team_unlimited: "team (無制限)",
};

interface Props {
  planType: string;
  isUnlimited: boolean;
  isAlphaTester?: boolean;
  baseLimit: number | null;
  usedThisMonth: number;
  bonus: number;
  companyName: string | null;
}

export function PlanStatusBar({ planType, isUnlimited, isAlphaTester = false, baseLimit, usedThisMonth, bonus, companyName }: Props) {
  const [expanded, setExpanded] = useState(false);

  const planName = isUnlimited
    ? "開発者"
    : isAlphaTester
      ? "アルファテスター"
      : (PLAN_NAMES[planType] ?? "free");
  const totalLimit = baseLimit !== null ? baseLimit + bonus : null;
  const remaining = totalLimit !== null ? Math.max(0, totalLimit - usedThisMonth) : null;
  const pctUsed = totalLimit ? Math.min(100, Math.round((usedThisMonth / totalLimit) * 100)) : 0;
  const isLow = remaining !== null && remaining <= 3;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      {/* メイン行 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
        {/* 左：プラン名 */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ background: "rgba(11,61,145,0.1)" }}
          >
            <Zap size={16} style={{ color: "var(--color-primary)" }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
                {planName}
              </span>
              {isUnlimited && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: "rgba(139,92,246,0.12)", color: "#7C3AED" }}
                >
                  無制限
                </span>
              )}
              {!isUnlimited && isAlphaTester && (
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ background: "rgba(245,158,11,0.12)", color: "#B45309" }}
                >
                  アルファ
                </span>
              )}
            </div>
            {companyName && (
              <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{companyName}</p>
            )}
          </div>
        </div>

        {/* 中：解析プログレス（dev/alphaは無制限なので非表示） */}
        {!isUnlimited && !isAlphaTester && totalLimit !== null && (
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
                今月の図面解析
              </span>
              <span
                className="text-xs font-bold tabular-nums"
                style={{ color: isLow ? "var(--color-danger)" : "var(--color-text)" }}
              >
                {usedThisMonth} / {totalLimit}回
                <span
                  className="ml-1.5 font-semibold"
                  style={{ color: isLow ? "var(--color-danger)" : pctUsed >= 70 ? "#FF6B35" : "var(--color-text-muted)" }}
                >
                  ({pctUsed}%)
                </span>
                {bonus > 0 && (
                  <span className="ml-1 font-normal" style={{ color: "#7C3AED" }}>
                    (+{bonus}ボーナス)
                  </span>
                )}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--color-bg)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pctUsed}%`,
                  background: isLow ? "var(--color-danger)" : pctUsed >= 70 ? "#FF6B35" : "var(--color-primary)",
                }}
              />
            </div>
            {isLow && (
              <p className="mt-1 text-[10px]" style={{ color: "var(--color-danger)" }}>
                {remaining === 0 ? "今月の解析上限に達しました" : `残り${remaining}回`}
                {bonus === 0 && " — フィードバックでクレジット追加できます（1回限り）"}
              </p>
            )}
          </div>
        )}

        {/* 右：詳細トグル */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:opacity-80"
          style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
        >
          プラン詳細
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
      </div>

      {/* 展開パネル */}
      {expanded && (
        <div
          className="grid grid-cols-3 gap-3 px-4 pb-4 pt-1"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <StatCell
            label="月の解析上限"
            value={baseLimit !== null ? `${baseLimit}回` : "無制限"}
          />
          <StatCell
            label="ボーナスクレジット"
            value={`+${bonus}`}
            valueColor="#7C3AED"
          />
          <StatCell
            label="今月の合計上限"
            value={totalLimit !== null ? `${totalLimit}回` : "無制限"}
            valueColor="var(--color-primary)"
          />
          <StatCell
            label="今月の使用"
            value={`${usedThisMonth}回`}
          />
          <StatCell
            label="残り"
            value={remaining !== null ? `${remaining}回` : "無制限"}
            valueColor={isLow ? "var(--color-danger)" : "var(--color-text)"}
          />
          <StatCell
            label="使用率"
            value={totalLimit !== null ? `${pctUsed}%` : "—"}
            valueColor={isLow ? "var(--color-danger)" : pctUsed >= 70 ? "#FF6B35" : "var(--color-text)"}
          />
        </div>
      )}
    </div>
  );
}

function StatCell({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div
      className="rounded-xl p-3 text-center"
      style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
    >
      <p className="text-lg font-bold" style={{ color: valueColor ?? "var(--color-text)" }}>{value}</p>
      <p className="mt-0.5 text-[11px]" style={{ color: "var(--color-text-muted)" }}>{label}</p>
    </div>
  );
}
