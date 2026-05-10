"use client";

import { Users, MessageSquare, ChevronRight, X } from "lucide-react";
import { useRightPanel } from "./right-panel-context";

export function DmGroupShortcut() {
  const { open, toggle } = useRightPanel();

  if (open) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition"
        style={{
          background: "var(--color-primary)",
          color: "#fff",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users size={16} />
            <MessageSquare size={16} />
          </div>
          <span className="text-sm font-semibold">グループ・DM を表示中</span>
        </div>
        <X size={15} style={{ opacity: 0.7 }} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex w-full items-center justify-between rounded-xl px-4 py-4 text-left transition hover:shadow-md"
      style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: "rgba(37,99,235,0.08)" }}
        >
          <Users size={18} style={{ color: "var(--color-primary)" }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            グループ・DM
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            現場グループの確認・チームへのメッセージ
          </p>
        </div>
      </div>
      <ChevronRight size={16} style={{ color: "var(--color-text-subtle)" }} />
    </button>
  );
}
