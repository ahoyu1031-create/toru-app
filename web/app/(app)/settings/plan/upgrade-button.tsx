"use client";

import { useState } from "react";
import { PlanChangeModal } from "./plan-change-modal";

type Props = {
  plan: "individual" | "team_5" | "team_10" | "team_unlimited";
  currentPlan: string | null;
  label?: string;
  variant?: "primary" | "secondary";
};

export function UpgradeButton({ plan, currentPlan, label = "プラン変更", variant = "primary" }: Props) {
  const [open, setOpen] = useState(false);

  const styleByVariant = variant === "primary"
    ? { background: "var(--color-primary)", color: "#fff" }
    : { background: "var(--color-surface)", color: "var(--color-text)", border: "1px solid var(--color-border)" };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-semibold transition hover:opacity-90"
        style={styleByVariant}
      >
        {label}
      </button>
      {open && (
        <PlanChangeModal
          currentPlan={currentPlan}
          newPlan={plan}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
