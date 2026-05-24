import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createAdminClient, getCurrentUser } from "@/lib/supabase/server";
import { PLAN_PRICES, isTeamPlan, getMonthlyLimit, PAID_PLANS, type PaidPlan, getTrialStatus, TRIAL_DRAWING_LIMIT } from "@/lib/plan";
import { getUserPlan } from "@/lib/get-plan";
import { getCompanyTrial } from "@/lib/get-company-trial";
import { Zap, Check, Lock, Gift } from "lucide-react";
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
    .select("bonus_analyses, is_unlimited")
    .eq("id", user.id)
    .maybeSingle();

  const planType = await getUserPlan(user.id);
  const trial = await getCompanyTrial(user.id);
  const trialStatus = trial ? getTrialStatus(trial) : null;
  const isUnlimited = profile?.is_unlimited ?? false;
  const bonus = profile?.bonus_analyses ?? 0;
  const limit = isUnlimited ? null : getMonthlyLimit(planType, bonus);

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
                  {isUnlimited ? "developer" : planType ?? "無料体験中"}
                </h2>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                  style={planType === null
                    ? { background: "rgba(34,197,94,0.12)", color: "#16A34A" }
                    : { background: "rgba(37,99,235,0.12)", color: "var(--color-primary)" }}
                >
                  {isUnlimited ? "無制限" : planType === null ? "無料体験" : PLAN_PRICES[planType]}
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
              ) : (
                <p className="text-sm text-red-700">
                  体験期間が終了しました。下のプランから選択してください。
                </p>
              )}
            </div>
          )}

          {/* 利用状況バー */}
          {!isUnlimited && (
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
          <div className="space-y-3">
            {PLAN_ORDER.map((plan) => {
              const isCurrent = !isUnlimited && planType === plan;
              const features = PLAN_FEATURES[plan];
              const isUpgrade = PLAN_ORDER.indexOf(plan) > PLAN_ORDER.indexOf(planType as typeof PLAN_ORDER[number]);

              return (
                <div
                  key={plan}
                  className="rounded-2xl p-4 sm:p-5"
                  style={{
                    background: isCurrent ? "rgba(37,99,235,0.05)" : "var(--color-surface)",
                    border: `1px solid ${isCurrent ? "var(--color-primary)" : "var(--color-border)"}`,
                  }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold" style={{ color: "var(--color-text)" }}>{plan}</span>
                          {isCurrent && (
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: "var(--color-primary)", color: "#fff" }}>
                              現在のプラン
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--color-primary)" }}>
                          {PLAN_PRICES[plan]}
                        </p>
                      </div>
                    </div>

                    {/* 機能リスト */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <FeatureTag label={features.analyses} enabled />
                      <FeatureTag label="単価マスタ" enabled={features.unitPrices} />
                      <FeatureTag label="グループ参加" enabled={features.joinGroup} />
                      <FeatureTag label="グループ作成" enabled={features.createGroup} />
                    </div>

                    {/* アクション: 有料プラン かつ 現在のプランでない場合のみ表示 */}
                    {!isCurrent && (PAID_PLANS as readonly string[]).includes(plan) && (
                      <UpgradeButton
                        plan={plan as PaidPlan}
                        variant={isUpgrade ? "primary" : "secondary"}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-center" style={{ color: "var(--color-text-muted)" }}>
            決済は Stripe で安全に処理されます。いつでも解約・プラン変更可能です。
          </p>
        </section>

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
