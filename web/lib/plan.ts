/**
 * 無料トライアル仕様:
 *  - 新規サインアップ時に companies.plan = null で開始
 *  - 図面解析を TRIAL_DRAWING_LIMIT 回 OR TRIAL_DURATION_DAYS 日のいずれか早い方まで使える
 *  - 使い切り / 期限切れ → 図面解析ロック → /settings/plan へ誘導
 *  - グループは「参加」のみ可（D案: 業界実態に合わせ個人プランでも参加OK）
 */
export const TRIAL_DRAWING_LIMIT = 10;
export const TRIAL_DURATION_DAYS = 7;

export const PLAN_MONTHLY_LIMITS: Record<string, number | null> = {
  individual: 30,
  team_5: 100,
  team_10: 300,
  team_unlimited: null,
};

export const PLAN_DISPLAY_NAMES: Record<string, string> = {
  individual: "individual",
  team_5: "team (5名)",
  team_10: "team (10名)",
  team_unlimited: "team (無制限)",
};

export const PLAN_PRICES: Record<string, string> = {
  individual: "¥1,480/月",
  team_5: "¥9,800/月",
  team_10: "¥16,800/月",
  team_unlimited: "¥29,800/月",
};

export const PAID_PLANS = ["individual", "team_5", "team_10", "team_unlimited"] as const;
export type PaidPlan = typeof PAID_PLANS[number];

/**
 * プランの「上下関係」を定義。ティア値が大きい = 上位プラン。
 * アップグレード判定（即時切替 OK） / ダウングレード判定（期末切替で公平性確保）に使う。
 */
export const PLAN_TIER: Record<string, number> = {
  individual: 1,
  team_5: 2,
  team_10: 3,
  team_unlimited: 4,
};

/**
 * 新プランへの変更が「アップグレード」か「ダウングレード」か「同等(=変更不要)」かを判定。
 * トライアル(null) からは全て「アップグレード」扱い（初回 Checkout 用）。
 */
export type PlanChangeDirection = "upgrade" | "downgrade" | "same" | "initial";
export function classifyPlanChange(
  currentPlan: string | null,
  newPlan: string
): PlanChangeDirection {
  if (currentPlan === null) return "initial";
  if (currentPlan === newPlan) return "same";
  const current = PLAN_TIER[currentPlan] ?? 0;
  const next = PLAN_TIER[newPlan] ?? 0;
  return next > current ? "upgrade" : "downgrade";
}

export function getStripePriceId(plan: PaidPlan): string | null {
  const map: Record<PaidPlan, string | undefined> = {
    individual:     process.env.STRIPE_PRICE_INDIVIDUAL,
    team_5:         process.env.STRIPE_PRICE_TEAM_5,
    team_10:        process.env.STRIPE_PRICE_TEAM_10,
    team_unlimited: process.env.STRIPE_PRICE_TEAM_UNLIMITED,
  };
  return map[plan] ?? null;
}

export function getPlanFromStripePriceId(priceId: string): PaidPlan | null {
  if (priceId === process.env.STRIPE_PRICE_INDIVIDUAL) return "individual";
  if (priceId === process.env.STRIPE_PRICE_TEAM_5) return "team_5";
  if (priceId === process.env.STRIPE_PRICE_TEAM_10) return "team_10";
  if (priceId === process.env.STRIPE_PRICE_TEAM_UNLIMITED) return "team_unlimited";
  return null;
}

export function isTeamPlan(plan: string | null): boolean {
  return plan === "team_5" || plan === "team_10" || plan === "team_unlimited";
}

export function isPaidPlan(plan: string | null): plan is PaidPlan {
  return plan !== null && (PAID_PLANS as readonly string[]).includes(plan);
}

/**
 * トライアル状態判定。
 * companies テーブルの該当行を渡す。plan=null かつ枠/期限の残りがあれば true。
 */
export function isTrialActive(company: {
  plan: string | null;
  trial_started_at: string | null;
  trial_drawings_used: number | null;
}): boolean {
  if (company.plan !== null) return false;
  if (!company.trial_started_at) return false;
  const used = company.trial_drawings_used ?? 0;
  if (used >= TRIAL_DRAWING_LIMIT) return false;
  const startedMs = new Date(company.trial_started_at).getTime();
  const elapsedDays = (Date.now() - startedMs) / (1000 * 60 * 60 * 24);
  if (elapsedDays >= TRIAL_DURATION_DAYS) return false;
  return true;
}

/**
 * トライアル残量サマリ（UIバナー表示用）。
 */
export function getTrialStatus(company: {
  plan: string | null;
  trial_started_at: string | null;
  trial_drawings_used: number | null;
}): {
  active: boolean;
  drawingsRemaining: number;
  daysRemaining: number;
  reason?: "limit_reached" | "expired" | "paid";
} {
  if (company.plan !== null) {
    return { active: false, drawingsRemaining: 0, daysRemaining: 0, reason: "paid" };
  }
  const used = company.trial_drawings_used ?? 0;
  const drawingsRemaining = Math.max(0, TRIAL_DRAWING_LIMIT - used);
  const startedMs = company.trial_started_at ? new Date(company.trial_started_at).getTime() : Date.now();
  const elapsedDays = (Date.now() - startedMs) / (1000 * 60 * 60 * 24);
  const daysRemaining = Math.max(0, Math.ceil(TRIAL_DURATION_DAYS - elapsedDays));
  const active = drawingsRemaining > 0 && daysRemaining > 0;
  const reason = !active
    ? drawingsRemaining === 0 ? "limit_reached" : "expired"
    : undefined;
  return { active, drawingsRemaining, daysRemaining, reason };
}

/**
 * 機能アクセス制御の唯一の真実。UI/API どちらからもここを参照する。
 */
export type PlanCapabilities = {
  canAnalyzeDrawings: boolean;  // トライアル中も true（API側で枠チェック）
  canCreateGroups: boolean;     // team プランのみ
  canJoinGroups: boolean;       // 全プラン+トライアルOK（D案）
  canCreateQuotes: boolean;
  canUseUnitPrices: boolean;
  maxGroupMembers: number;      // Infinity は team_unlimited
};

export function getPlanCapabilities(plan: string | null): PlanCapabilities {
  const isTeam = isTeamPlan(plan);
  return {
    canAnalyzeDrawings: true, // 実際の使用可否は API 側で trial 枠 + 月次上限判定
    canCreateGroups: isTeam,  // D案: 作成は team プランのみ
    canJoinGroups: true,       // D案: 全プラン+トライアル参加OK
    canCreateQuotes: true,     // 機能ロックは図面解析のみの方針
    canUseUnitPrices: true,    // 同上
    maxGroupMembers:
      plan === "team_5" ? 5 :
      plan === "team_10" ? 10 :
      plan === "team_unlimited" ? Infinity : 0,
  };
}

/** 旧シグネチャ互換（呼び出し元が string で渡してくる箇所のため残す） */
export function canCreateGroup(plan: string | null): boolean {
  return getPlanCapabilities(plan).canCreateGroups;
}
export function canJoinGroup(plan: string | null): boolean {
  return getPlanCapabilities(plan).canJoinGroups;
}
export function canUseUnitPrices(plan: string | null): boolean {
  return getPlanCapabilities(plan).canUseUnitPrices;
}

/**
 * 有料プランの月次解析上限。
 * トライアル（plan=null）は月次ではなくライフタイム枠 (trial_drawings_used) で別管理するので null を返す。
 * → 呼び出し側は plan===null の場合に getTrialStatus() を使うこと。
 */
export function getMonthlyLimit(plan: string | null, bonus = 0): number | null {
  if (plan === null) return null;
  const base = PLAN_MONTHLY_LIMITS[plan];
  if (base === null || base === undefined) return base ?? null;
  return base + bonus;
}

export function getUsageLevel(used: number, limit: number | null): "ok" | "warning" | "blocked" {
  if (limit === null) return "ok";
  const remaining = limit - used;
  if (remaining <= 0) return "blocked";
  if (remaining <= 3) return "warning";
  return "ok";
}
