"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/toast-context";

type Props = {
  plan: "individual" | "team_5" | "team_10" | "team_unlimited";
  label?: string;
  variant?: "primary" | "secondary";
};

export function UpgradeButton({ plan, label = "このプランに変更", variant = "primary" }: Props) {
  const [loading, setLoading] = useState(false);
  const { error } = useToast();

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "決済ページの作成に失敗しました");
      }
      window.location.href = data.url;
    } catch (e) {
      error((e as Error).message);
      setLoading(false);
    }
  };

  const styleByVariant = variant === "primary"
    ? { background: "var(--color-primary)", color: "#fff" }
    : { background: "var(--color-surface)", color: "var(--color-text)", border: "1px solid var(--color-border)" };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="shrink-0 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-semibold transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
      style={styleByVariant}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {loading ? "決済ページを準備中..." : label}
    </button>
  );
}
