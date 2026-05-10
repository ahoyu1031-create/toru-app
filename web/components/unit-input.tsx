"use client";

import { useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

export const UNIT_SUGGESTIONS = ["本", "m", "m²", "m³", "個", "枚", "式", "kg", "t", "L", "箱", "缶", "mm", "セット", "台", "基", "ヶ所", "人工"];

export function UnitInput({
  value,
  onChange,
  placeholder = "m",
  inputClassName = "w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-3 py-2 text-sm focus:border-[color:var(--color-primary)] focus:outline-none",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<{ top: number; left: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleFocus = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const r = inputRef.current?.getBoundingClientRect();
    if (r) setDropPos({ top: r.bottom + 4, left: r.left });
    setOpen(true);
  }, []);

  const handleBlur = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }, []);

  function pick(u: string) {
    onChange(u);
    setOpen(false);
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }

  const dropdown = open && dropPos ? (
    <div
      style={{
        position: "fixed",
        top: dropPos.top,
        left: dropPos.left,
        width: 252,
        zIndex: 99999,
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        padding: "10px",
      }}
    >
      <p
        style={{ color: "var(--color-text-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", paddingBottom: 6 }}
      >
        よく使う単位
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {UNIT_SUGGESTIONS.map((u) => (
          <button
            key={u}
            type="button"
            onMouseDown={(e) => { e.preventDefault(); pick(u); }}
            style={{
              background: value === u ? "var(--color-primary)" : "var(--color-bg)",
              color: value === u ? "#fff" : "var(--color-text)",
              border: `1px solid ${value === u ? "var(--color-primary)" : "var(--color-border)"}`,
              borderRadius: 8,
              padding: "4px 10px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {u}
          </button>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={inputClassName}
      />
      {typeof document !== "undefined" && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </div>
  );
}
