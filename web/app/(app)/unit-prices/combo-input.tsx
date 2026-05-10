"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  name: string;
  id?: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  suggestions: string[];
  groups?: Record<string, string[]>;
  onChange?: (value: string) => void;
  sizeClass?: string;
};

type Mode = null | "filter" | "browse";

export function ComboInput({
  name,
  id,
  defaultValue = "",
  placeholder = "",
  required,
  suggestions,
  groups,
  onChange,
  sizeClass = "py-3",
}: Props) {
  const [text, setText] = useState(defaultValue);
  const [mode, setMode] = useState<Mode>(null);
  const [openUp, setOpenUp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = text.trim()
    ? suggestions.filter((s) => s.toLowerCase().includes(text.toLowerCase()))
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMode(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // パネルを開くとき、下に空きがなければ上向きに開く
  useEffect(() => {
    if (mode === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setOpenUp(spaceBelow < 380 && rect.top > 300);
  }, [mode]);

  const select = (v: string) => {
    setText(v);
    onChange?.(v);
    setMode(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setText(v);
    onChange?.(v);
    if (v.trim().length === 0) { setMode(null); return; }
    const hasMatch = suggestions.some((s) => s.toLowerCase().includes(v.toLowerCase()));
    setMode(hasMatch ? "filter" : null);
  };

  const handleToggleBrowse = () => setMode((m) => (m === "browse" ? null : "browse"));

  const isOpen = mode !== null && (mode === "browse" || filtered.length > 0);
  const hasGroups = groups && Object.keys(groups).length > 0;

  return (
    <div ref={containerRef} className="relative">
      {/* 入力欄 */}
      <div className="flex rounded-lg border-2 border-[color:var(--color-border)] bg-white focus-within:border-[color:var(--color-primary)]">
        <input
          id={id}
          name={name}
          type="text"
          required={required}
          value={text}
          onChange={handleTextChange}
          placeholder={placeholder}
          autoComplete="off"
          className={`min-w-0 flex-1 rounded-l-lg bg-transparent px-4 ${sizeClass} text-base outline-none placeholder:text-[color:var(--color-text-muted)]`}
        />
        <div className="w-px self-stretch bg-[color:var(--color-border)]" />
        <button
          type="button"
          tabIndex={-1}
          onClick={handleToggleBrowse}
          aria-label="候補を表示"
          className={`flex items-center justify-center px-3 transition-colors hover:text-[color:var(--color-primary)] ${
            mode === "browse" ? "text-[color:var(--color-primary)]" : "text-[color:var(--color-text-muted)]"
          }`}
        >
          <svg
            className={`h-4 w-4 transition-transform duration-150 ${mode === "browse" ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* ドロップダウン */}
      {isOpen && (
        <div
          className="absolute left-0 z-50 overflow-y-auto rounded-xl bg-white shadow-xl"
          style={{
            border: "1px solid var(--color-border)",
            minWidth: "min(480px, 90vw)",
            maxHeight: "60vh",
            ...(openUp
              ? { bottom: "calc(100% + 4px)" }
              : { top: "calc(100% + 4px)" }),
          }}
        >
          {mode === "filter" ? (
            /* テキスト検索フィルター：フラットリスト */
            <div className="p-2">
              {filtered.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => select(s)}
                  className={`w-full rounded-lg px-4 py-2.5 text-left text-sm transition-colors hover:bg-[color:var(--color-primary-soft)] ${
                    text === s ? "font-semibold text-[color:var(--color-primary)]" : "text-[color:var(--color-text)]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : hasGroups ? (
            /* ブラウズ：グループをすべて展開してチップ表示 */
            <div className="p-4 space-y-5">
              {Object.entries(groups!).map(([group, items]) => (
                <div key={group}>
                  <p
                    className="mb-2 text-[11px] font-semibold uppercase tracking-widest"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {group}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => {
                      const isSelected = text === item;
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => select(item)}
                          className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                          style={{
                            background: isSelected ? "var(--color-primary)" : "var(--color-bg)",
                            color: isSelected ? "#fff" : "var(--color-text)",
                            border: `1.5px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = "var(--color-primary-soft)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = "var(--color-bg)";
                          }}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* グループなし：フラットチップ */
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => {
                  const isSelected = text === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => select(s)}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                      style={{
                        background: isSelected ? "var(--color-primary)" : "var(--color-bg)",
                        color: isSelected ? "#fff" : "var(--color-text)",
                        border: `1.5px solid ${isSelected ? "var(--color-primary)" : "var(--color-border)"}`,
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "var(--color-primary-soft)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = "var(--color-bg)";
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
