"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/components/toast-context";

export function ManageButton() {
  const [loading, setLoading] = useState(false);
  const { error } = useToast();

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "請求ポータルの取得に失敗しました");
      }
      window.location.href = data.url;
    } catch (e) {
      error((e as Error).message);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="inline-flex h-9 items-center gap-1.5 rounded-xl px-4 text-xs font-semibold transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ background: "var(--color-surface)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={13} />}
      {loading ? "ポータルを準備中..." : "請求情報・解約"}
    </button>
  );
}
