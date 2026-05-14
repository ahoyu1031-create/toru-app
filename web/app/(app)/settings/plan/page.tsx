import { redirect } from "next/navigation";
import { createClient, createAdminClient, getCurrentUser } from "@/lib/supabase/server";
import { Sparkles } from "lucide-react";

const PLAN_DISPLAY: Record<string, string> = {
  beta: "ベータ版", individual: "個人", corp_s: "法人 S",
  corp_m: "法人 M", corp_l: "法人 L", unlimited: "開発者プラン",
};
const PLAN_LIMITS: Record<string, number | null> = {
  beta: 10, individual: 30, corp_s: 100, corp_m: 300, corp_l: null, unlimited: null,
};


export default async function PlanPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const admin = createAdminClient();
  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const [{ data: profile }, { count: usedThisMonth }] = await Promise.all([
    admin.from("users").select("bonus_analyses, is_unlimited, plan_type").eq("id", user.id).maybeSingle(),
    supabase.from("drawing_analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .gte("created_at", thisMonthStart.toISOString()),
  ]);

  const planType = profile?.plan_type ?? "beta";
  const isUnlimited = profile?.is_unlimited ?? false;
  const bonusAnalyses = profile?.bonus_analyses ?? 0;
  const baseLimit = isUnlimited ? null : (PLAN_LIMITS[planType] ?? 10);
  const totalLimit = baseLimit !== null ? baseLimit + bonusAnalyses : null;
  const planDisplayName = isUnlimited ? "開発者プラン" : (PLAN_DISPLAY[planType] ?? "ベータ版");
  const used = usedThisMonth ?? 0;
  const usagePercent = totalLimit ? Math.min(100, Math.round((used / totalLimit) * 100)) : 0;
  const remaining = totalLimit !== null ? Math.max(0, totalLimit - used) : null;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-4xl space-y-8">

        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>プラン・請求</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            現在のご利用状況とプランをご確認いただけます
          </p>
        </div>

        {/* 現在のプラン */}
        <section
          className="rounded-2xl p-6"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>現在のプラン</p>
              <div className="mt-1 flex items-center gap-2">
                <h2 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                  {planDisplayName}
                </h2>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                  style={{ background: "rgba(139,92,246,0.12)", color: "#7C3AED" }}
                >
                  {isUnlimited ? "無制限" : "無料"}
                </span>
              </div>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
                {isUnlimited
                  ? "開発・テスト用アカウントです。すべての機能が無制限で利用できます。"
                  : "ベータ期間中は無料でご利用いただけます。フィードバックへのご協力をお願いします。"}
              </p>
            </div>
            <Sparkles size={32} style={{ color: "#7C3AED", flexShrink: 0 }} />
          </div>

          {!isUnlimited && (
            <div className="mt-5 space-y-4">
              {/* 利用状況バー */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>今月の図面解析</span>
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: used >= (totalLimit ?? Infinity) ? "var(--color-danger)" : "var(--color-text)" }}
                  >
                    {used} / {totalLimit ?? "∞"}回
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--color-border)" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${usagePercent}%`,
                      background: usagePercent >= 100 ? "var(--color-danger)" : usagePercent >= 80 ? "#f59e0b" : "var(--color-primary)",
                    }}
                  />
                </div>
                <p className="mt-1 text-xs" style={{ color: remaining === 0 ? "var(--color-danger)" : "var(--color-text-muted)" }}>
                  {remaining === 0
                    ? "今月の解析上限に達しました"
                    : remaining !== null
                    ? `残り ${remaining} 回`
                    : "無制限"}
                </p>
              </div>

              {/* 内訳 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl p-3 text-center" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                  <p className="text-xl font-bold" style={{ color: "var(--color-text)" }}>{baseLimit ?? "∞"}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>基本上限</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                  <p className="text-xl font-bold" style={{ color: "#7C3AED" }}>+{bonusAnalyses}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>ボーナス</p>
                </div>
                <div className="rounded-xl p-3 text-center" style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}>
                  <p className="text-xl font-bold" style={{ color: "var(--color-primary)" }}>{totalLimit ?? "∞"}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>合計上限</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ベータ期間中の案内 */}
        <section
          className="rounded-2xl p-5"
          style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}
        >
          <p className="text-sm font-semibold" style={{ color: "#7C3AED" }}>ベータ期間中のご案内</p>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            現在はベータテスト中のため、全機能を無料でご利用いただけます。
            正式リリース後は各種プランをご用意する予定です。ご利用のフィードバックをぜひお聞かせください。
          </p>
        </section>

      </div>
    </div>
  );
}
