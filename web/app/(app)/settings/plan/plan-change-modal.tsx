"use client";

import { useState } from "react";
import { Loader2, AlertCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useToast } from "@/components/toast-context";
import { PLAN_PRICES, classifyPlanChange } from "@/lib/plan";

type Props = {
  currentPlan: string | null; // null = トライアル状態 = 既存サブスクなし
  newPlan: "individual" | "team_5" | "team_10" | "team_unlimited";
  onClose: () => void;
};

const PLAN_LABELS: Record<string, string> = {
  individual: "Individual",
  team_5: "Team 5",
  team_10: "Team 10",
  team_unlimited: "Team Unlimited",
};

export function PlanChangeModal({ currentPlan, newPlan, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const { error } = useToast();

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "プラン変更の処理に失敗しました");
      }
      window.location.href = data.url;
    } catch (e) {
      error((e as Error).message);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        style={{ background: "var(--color-surface)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4" style={{ color: "var(--color-text)" }}>
          プラン変更の確認
        </h2>

        <div className="space-y-3 mb-5">
          <div className="rounded-xl border p-3" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-text-muted)" }}>
              現在のプラン
            </p>
            <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
              {currentPlan ? PLAN_LABELS[currentPlan] : "無料体験"}
              <span className="ml-2 font-normal" style={{ color: "var(--color-text-muted)" }}>
                {currentPlan ? PLAN_PRICES[currentPlan] : "—"}
              </span>
            </p>
          </div>

          <div className="rounded-xl border-2 p-3" style={{ borderColor: "var(--color-primary)", background: "rgba(37,99,235,0.05)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--color-primary)" }}>
              変更後のプラン
            </p>
            <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
              {PLAN_LABELS[newPlan]}
              <span className="ml-2 font-semibold" style={{ color: "var(--color-primary)" }}>
                {PLAN_PRICES[newPlan]}
              </span>
            </p>
          </div>
        </div>

        {/* 動作説明: initial / upgrade / downgrade で表示分岐 */}
        {(() => {
          const direction = classifyPlanChange(currentPlan, newPlan);

          if (direction === "initial") {
            return (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 mb-5">
                <div className="flex gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-blue-600" />
                  <div className="text-xs text-blue-900 space-y-1">
                    <p className="font-semibold">初回プラン契約</p>
                    <p>次の画面（Stripe の安全な決済ページ）でカード情報を入力してください。</p>
                  </div>
                </div>
              </div>
            );
          }

          if (direction === "upgrade") {
            return (
              <div className="rounded-xl border border-green-200 bg-green-50 p-3 mb-5">
                <div className="flex gap-2">
                  <ArrowUpRight size={16} className="shrink-0 mt-0.5 text-green-700" />
                  <div className="text-xs text-green-900 space-y-1">
                    <p className="font-semibold">アップグレード — 今すぐ有効</p>
                    <p>次の画面（Stripeの安全な確認ページ）で<strong>差額金額を確認のうえ確定</strong>してください。確定すると新プランがすぐ使えるようになり、次回請求日から {PLAN_PRICES[newPlan]}。</p>
                  </div>
                </div>
              </div>
            );
          }

          // downgrade
          return (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 mb-5">
              <div className="flex gap-2">
                <ArrowDownRight size={16} className="shrink-0 mt-0.5 text-amber-700" />
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-semibold">ダウングレード — 次回請求日から有効</p>
                  <p>支払い済みの期間は<strong>現プラン（{currentPlan ? PLAN_PRICES[currentPlan] : ""}）のまま</strong>ご利用いただけます。<strong>次回請求日から自動的に {PLAN_PRICES[newPlan]} に切り替わります</strong>。</p>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl px-4 py-2 text-sm font-semibold transition hover:opacity-80 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            style={{ background: "var(--color-bg)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            style={{ background: "var(--color-primary)", color: "#fff" }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "処理中..." : "変更を確定"}
          </button>
        </div>
      </div>
    </div>
  );
}
