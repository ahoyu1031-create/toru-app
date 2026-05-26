import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { createAdminClient, getCurrentUser } from "@/lib/supabase/server";
import { PLAN_PRICES, isTeamPlan, getMonthlyLimit, PAID_PLANS, type PaidPlan, getTrialStatus, TRIAL_DRAWING_LIMIT } from "@/lib/plan";
import { IS_LIVE_BILLING } from "@/lib/billing-mode";
import { getUserPlan } from "@/lib/get-plan";
import { getCompanyTrial } from "@/lib/get-company-trial";
import { Zap, Check, Lock, Gift, Sparkles } from "lucide-react";
import { UpgradeButton } from "./upgrade-button";
import { ManageButton } from "./manage-button";
import { PlanResultToast } from "./plan-result-toast";

const PLAN_FEATURES: Record<string, { analyses: string; unitPrices: boolean; joinGroup: boolean; createGroup: boolean }> = {
  individual:     { analyses: "30回/月",   unitPrices: true,  joinGroup: true,  createGroup: false },
  team_5:         { analyses: "100回/月",  unitPrices: true,  joinGroup: true,  createGroup: true  },
  team_10:        { analyses: "300回/月",  unitPrices: true,  joinGroup: true,  createGroup: true  },
  team_unlimited: { analyses: "無制限",    unitPrices: true,  joinGroup: true,  createGroup: true  },
};

const PLAN_ORDER = ["individual", "team_5", "team_10", "team_unlimited"] as const;

export default async function PlanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const { data: profile } = await admin
    .from("users")
    .select("bonus_analyses, is_unlimited, is_alpha_tester")
    .eq("id", user.id)
    .maybeSingle();

  const planType = await getUserPlan(user.id);
  const trial = await getCompanyTrial(user.id);
  const trialStatus = trial ? getTrialStatus(trial) : null;
  const isUnlimited = profile?.is_unlimited ?? false;
  const isAlphaTester = profile?.is_alpha_tester ?? false;
  const hasUnlimitedAccess = isUnlimited || isAlphaTester;
  const bonus = profile?.bonus_analyses ?? 0;
  const limit = hasUnlimitedAccess ? null : getMonthlyLimit(planType, bonus);

  // 使用回数（チームは合算）
  let usedThisMonth = 0;
  if (isTeamPlan(planType)) {
    const { data: membership } = await admin
      .from("company_member").select("company_id").eq("user_id", user.id).maybeSingle();
    if (membership?.company_id) {
      const { data: members } = await admin
        .from("company_member").select("user_id").eq("company_id", membership.company_id);
      const ids = (members ?? []).map((m: { user_id: string }) => m.user_id);
      const { count } = await admin
        .from("drawing_analyses").select("id", { count: "exact", head: true })
        .in("user_id", ids).is("deleted_at", null).gte("created_at", thisMonthStart.toISOString());
      usedThisMonth = count ?? 0;
    }
  } else {
    const { count } = await admin
      .from("drawing_analyses").select("id", { count: "exact", head: true })
      .eq("user_id", user.id).is("deleted_at", null).gte("created_at", thisMonthStart.toISOString());
    usedThisMonth = count ?? 0;
  }

  const pct = limit ? Math.min(100, Math.round((usedThisMonth / limit) * 100)) : 0;
  const remaining = limit !== null ? Math.max(0, limit - usedThisMonth) : null;
  const isWarning = remaining !== null && remaining <= 3;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-3xl space-y-8">

        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>プラン・請求</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            現在のプランと利用状況を確認できます
          </p>
        </div>

        {/* 現在のプラン */}
        <section className="rounded-2xl p-6" style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>現在のプラン</p>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                  {isUnlimited
                    ? "developer"
                    : isAlphaTester
                      ? "アルファテスター"
                      : planType ?? "無料体験中"}
                </h2>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                  style={
                    isUnlimited
                      ? { background: "rgba(139,92,246,0.12)", color: "#7C3AED" }
                      : isAlphaTester
                        ? { background: "rgba(245,158,11,0.12)", color: "#B45309" }
                        : planType === null
                          ? { background: "rgba(34,197,94,0.12)", color: "#16A34A" }
                          : { background: "rgba(37,99,235,0.12)", color: "var(--color-primary)" }
                  }
                >
                  {isUnlimited
                    ? "無制限"
                    : isAlphaTester
                      ? "無制限"
                      : planType === null
                        ? "無料体験"
                        : PLAN_PRICES[planType]}
                </span>
              </div>
            </div>
            <Zap size={28} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
          </div>

          {/* 課金中のみ「請求情報・解約」ボタンを表示 */}
          {planType !== null && (PAID_PLANS as readonly string[]).includes(planType) && !isUnlimited && (
            <div className="mt-4 flex justify-end">
              <ManageButton />
            </div>
          )}

          {/* トライアル中の残量表示 */}
          {planType === null && trialStatus && (
            <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gift size={16} className="text-green-700" />
                <span className="text-sm font-semibold text-green-900">無料体験中</span>
              </div>
              {trialStatus.active ? (
                <p className="text-sm text-green-800">
                  図面解析: 残り <span className="font-bold">{trialStatus.drawingsRemaining}</span> 回（全{TRIAL_DRAWING_LIMIT}回）/ あと <span className="font-bold">{trialStatus.daysRemaining}</span> 日
                </p>
              ) : IS_LIVE_BILLING ? (
                <p className="text-sm text-red-700">
                  体験期間が終了しました。下のプランから選択してください。
                </p>
              ) : (
                <p className="text-sm text-red-700">
                  体験期間が終了しました。
                  <Link href="/alpha" className="font-semibold underline ml-1">
                    アルファテスター枠（無料）に申込
                  </Link>
                </p>
              )}
            </div>
          )}

          {/* 利用状況バー (dev/alphaは無制限なので非表示) */}
          {!hasUnlimitedAccess && (
            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                  今月の図面解析
                  {isTeamPlan(planType) && <span className="ml-1 font-normal">（チーム合算）</span>}
                </span>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: isWarning ? "var(--color-danger)" : "var(--color-text)" }}
                >
                  {usedThisMonth} / {limit ?? "∞"}回
                  {bonus > 0 && <span className="ml-1 text-xs font-normal" style={{ color: "#7C3AED" }}>(+{bonus}ボーナス)</span>}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--color-border)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 100 ? "var(--color-danger)" : pct >= 80 ? "#f59e0b" : "var(--color-primary)",
                  }}
                />
              </div>
              {isWarning && (
                <p className="mt-1.5 text-xs font-semibold" style={{ color: "var(--color-danger)" }}>
                  {remaining === 0 ? "今月の解析上限に達しました" : `残り${remaining}回 — プランのアップグレードをご検討ください`}
                </p>
              )}
            </div>
          )}
        </section>

        {/* プラン比較 */}
        <section>
          <h3 className="mb-4 text-base font-semibold" style={{ color: "var(--color-text)" }}>プラン比較</h3>

          {/* MVP期間中: アルファテスター枠の選択肢も提示（有料プラン購入と並列） */}
          {!IS_LIVE_BILLING && (
            <Link
              href="/alpha"
              className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100 cursor-pointer"
            >
              <div className="flex items-start gap-2">
                <Sparkles size={18} className="shrink-0 mt-0.5 text-amber-700" />
                <div>
                  <p className="text-sm font-semibold text-amber-900">💡 もう一つの選択肢：アルファテスター枠（無料）</p>
                  <p className="text-xs text-amber-800 mt-0.5">
                    先着10名限定。全機能無料で使え、Live切替後も永久半額特典あり。フィードバックにご協力いただける方向け
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold text-amber-900 whitespace-nowrap">
                申込ページへ →
              </span>
            </Link>
          )}

          {/* 横並び4カラム（PC）/ 2カラム（タブレット）/ 1カラム（モバイル） */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PLAN_ORDER.map((plan) => {
              // dev / alpha tester は team_unlimited 相当として「現在のプラン」表示
              const isCurrent = hasUnlimitedAccess
                ? plan === "team_unlimited"
                : planType === plan;
              const isRecommended = plan === "team_10"; // 主力プラン強調
              const features = PLAN_FEATURES[plan];
              const isUpgrade = !isUnlimited && planType !== null
                && PLAN_ORDER.indexOf(plan) > PLAN_ORDER.indexOf(planType as typeof PLAN_ORDER[number]);

              return (
                <div
                  key={plan}
                  className="relative flex flex-col rounded-2xl p-5 transition"
                  style={{
                    background: isCurrent ? "rgba(37,99,235,0.04)" : "var(--color-surface)",
                    border: `${isRecommended || isCurrent ? "2px" : "1px"} solid ${
                      isCurrent ? "var(--color-primary)" :
                      isRecommended ? "rgba(37,99,235,0.4)" : "var(--color-border)"
                    }`,
                  }}
                >
                  {/* 上部バッジ */}
                  {isCurrent && (
                    <span
                      className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap"
                      style={
                        isUnlimited
                          ? { background: "#7C3AED", color: "#fff" }
                          : isAlphaTester
                            ? { background: "#B45309", color: "#fff" }
                            : { background: "var(--color-primary)", color: "#fff" }
                      }
                    >
                      {isUnlimited
                        ? "developer"
                        : isAlphaTester
                          ? "アルファテスター"
                          : "現在のプラン"}
                    </span>
                  )}
                  {!isCurrent && isRecommended && (
                    <span
                      className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-bold whitespace-nowrap"
                      style={{ background: "rgba(37,99,235,0.12)", color: "var(--color-primary)" }}
                    >
                      おすすめ
                    </span>
                  )}

                  {/* プラン名 + 価格 */}
                  <div className="mb-4">
                    <h4 className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
                      {plan}
                    </h4>
                    <p className="mt-1 text-xl font-bold tabular-nums" style={{ color: "var(--color-primary)" }}>
                      {PLAN_PRICES[plan]}
                    </p>
                  </div>

                  {/* 機能リスト（縦並びで視認性向上） */}
                  <ul className="mb-5 flex-1 space-y-2 text-xs">
                    <FeatureRow label={features.analyses} enabled />
                    <FeatureRow label="単価マスタ" enabled={features.unitPrices} />
                    <FeatureRow label="グループ参加" enabled={features.joinGroup} />
                    <FeatureRow label="グループ作成" enabled={features.createGroup} />
                  </ul>

                  {/* アクション */}
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full inline-flex h-9 items-center justify-center rounded-xl px-4 text-xs font-semibold cursor-not-allowed opacity-60"
                      style={{ background: "var(--color-bg)", color: "var(--color-text-muted)", border: "1px solid var(--color-border)" }}
                    >
                      現在のプラン
                    </button>
                  ) : (PAID_PLANS as readonly string[]).includes(plan) ? (
                    <UpgradeButton
                      plan={plan as PaidPlan}
                      currentPlan={planType}
                      variant={isRecommended || isUpgrade ? "primary" : "secondary"}
                    />
                  ) : (
                    <div className="h-9" />
                  )}
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
            決済は Stripe で安全に処理されます。いつでも解約・プラン変更可能です。
          </p>
        </section>

        {/* 請求情報・解約 (有料プラン契約者のみ表示・プラン比較の下) */}
        {planType !== null && (PAID_PLANS as readonly string[]).includes(planType) && !isUnlimited && (
          <section
            className="rounded-2xl p-6"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="text-base font-semibold" style={{ color: "var(--color-text)" }}>請求情報・解約</h2>
                <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  クレジットカードの変更、請求書のダウンロード、プランの解約は Stripe の安全な画面でご対応いただけます
                </p>
              </div>
            </div>
            <ul className="mb-4 space-y-1.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
              <li className="flex items-start gap-2">
                <Check size={14} className="mt-0.5 shrink-0" style={{ color: "var(--color-primary)" }} />
                <span>支払い方法の変更（カード追加・削除）</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="mt-0.5 shrink-0" style={{ color: "var(--color-primary)" }} />
                <span>過去の請求書ダウンロード（PDF）</span>
              </li>
              <li className="flex items-start gap-2">
                <Check size={14} className="mt-0.5 shrink-0" style={{ color: "var(--color-primary)" }} />
                <span>サブスクリプションの解約（次回更新日まで利用可）</span>
              </li>
            </ul>
            <ManageButton />
          </section>
        )}

      </div>

      <Suspense fallback={null}>
        <PlanResultToast />
      </Suspense>
    </div>
  );
}

function FeatureTag({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span
      className="flex items-center gap-1 text-xs"
      style={{ color: enabled ? "var(--color-text)" : "var(--color-text-subtle)" }}
    >
      {enabled
        ? <Check size={12} style={{ color: "#059669", flexShrink: 0 }} />
        : <Lock size={11} style={{ color: "var(--color-text-subtle)", flexShrink: 0 }} />}
      {label}
    </span>
  );
}

function FeatureRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <li
      className="flex items-center gap-1.5"
      style={{ color: enabled ? "var(--color-text)" : "var(--color-text-subtle)" }}
    >
      {enabled
        ? <Check size={14} style={{ color: "#059669", flexShrink: 0 }} />
        : <Lock size={12} style={{ color: "var(--color-text-subtle)", flexShrink: 0 }} />}
      <span className={enabled ? "" : "line-through"}>{label}</span>
    </li>
  );
}
