export const PLAN_MONTHLY_LIMITS: Record<string, number | null> = {
  free: 15,
  individual: 30,
  team_5: 100,
  team_10: 300,
  team_unlimited: null,
};

export const PLAN_DISPLAY_NAMES: Record<string, string> = {
  free: "free",
  individual: "individual",
  team_5: "team (5名)",
  team_10: "team (10名)",
  team_unlimited: "team (無制限)",
};

export const PLAN_PRICES: Record<string, string> = {
  free: "無料",
  individual: "¥1,480/月",
  team_5: "¥9,800/月",
  team_10: "¥16,800/月",
  team_unlimited: "¥29,800/月",
};

export const PAID_PLANS = ["individual", "team_5", "team_10", "team_unlimited"] as const;
export type PaidPlan = typeof PAID_PLANS[number];

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

export function isTeamPlan(plan: string): boolean {
  return ["team_5", "team_10", "team_unlimited"].includes(plan);
}

export function canUseUnitPrices(plan: string): boolean {
  return plan !== "free";
}

export function canCreateGroup(plan: string): boolean {
  return isTeamPlan(plan);
}

export function canJoinGroup(plan: string): boolean {
  return plan !== "free";
}

export function getMonthlyLimit(plan: string, bonus = 0): number | null {
  const base = PLAN_MONTHLY_LIMITS[plan] ?? 15;
  if (base === null) return null;
  return base + bonus;
}

export function getUsageLevel(used: number, limit: number | null): "ok" | "warning" | "blocked" {
  if (limit === null) return "ok";
  const remaining = limit - used;
  if (remaining <= 0) return "blocked";
  if (remaining <= 3) return "warning";
  return "ok";
}
