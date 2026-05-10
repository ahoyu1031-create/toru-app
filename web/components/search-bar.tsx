"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search, LayoutDashboard, FileText, Package,
  ScanLine, Users, Settings, ArrowRight,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type NavItem = {
  type: "nav";
  label: string;
  href: string;
  icon: React.ComponentType<{ size: number; style?: React.CSSProperties }>;
  keywords: string[];
};

type QuoteItem = {
  type: "quote";
  id: string;
  project_name: string | null;
  client_name: string | null;
};

type SearchItem = NavItem | QuoteItem;

const NAV_ITEMS: NavItem[] = [
  { type: "nav", label: "ダッシュボード", href: "/dashboard",   icon: LayoutDashboard, keywords: ["ホーム", "home", "dashboard"] },
  { type: "nav", label: "見積書",         href: "/quotes",      icon: FileText,         keywords: ["見積", "quote", "estimate"] },
  { type: "nav", label: "単価マスタ",     href: "/unit-prices", icon: Package,          keywords: ["単価", "マスタ", "unit", "price"] },
  { type: "nav", label: "図面解析",       href: "/drawings",    icon: ScanLine,         keywords: ["図面", "解析", "pdf", "drawing"] },
  { type: "nav", label: "グループ",       href: "/groups",      icon: Users,            keywords: ["グループ", "チーム", "group"] },
  { type: "nav", label: "設定",           href: "/settings",    icon: Settings,         keywords: ["設定", "プロフィール", "会社", "setting"] },
];

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredNav = query
    ? NAV_ITEMS.filter(
        (n) =>
          n.label.includes(query) ||
          n.keywords.some((k) => k.includes(query))
      )
    : NAV_ITEMS;

  const allItems: SearchItem[] = [...filteredNav, ...quotes];

  // 見積書検索
  useEffect(() => {
    if (!query) { setQuotes([]); return; }
    const supabase = createClient();
    supabase
      .from("quotes")
      .select("id, project_name, client_name")
      .is("deleted_at", null)
      .or(`project_name.ilike.%${query}%,client_name.ilike.%${query}%`)
      .limit(5)
      .then(({ data }) => {
        setQuotes(
          (data ?? []).map((q) => ({
            type: "quote" as const,
            id: q.id,
            project_name: q.project_name,
            client_name: q.client_name,
          }))
        );
      });
  }, [query]);

  useEffect(() => { setActiveIndex(0); }, [query]);

  // 外クリックで閉じる
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // ⌘K / Ctrl+K でフォーカス
  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  function go(item: SearchItem) {
    router.push(item.type === "nav" ? item.href : `/quotes/${item.id}`);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = allItems[activeIndex];
      if (item) go(item);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  const showDropdown = open && allItems.length > 0;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xs">
      <label
        className="flex items-center gap-2 rounded-lg px-3 py-2 cursor-text"
        style={{
          background: "var(--color-bg)",
          border: "1px solid var(--color-border)",
        }}
      >
        <Search size={15} className="shrink-0" style={{ color: "var(--color-text-muted)" }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="検索かコマンドを入力..."
          className="flex-1 bg-transparent text-sm outline-none min-w-0"
          style={{ color: "var(--color-text)" }}
        />
        <kbd
          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium hidden sm:block"
          style={{ background: "var(--color-border)", color: "var(--color-text-subtle)" }}
        >
          ⌘K
        </kbd>
      </label>

      {showDropdown && (
        <div
          className="absolute left-0 top-full mt-1 w-72 rounded-xl border shadow-lg py-1 z-50"
          style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
        >
          {/* ナビゲーション */}
          {filteredNav.length > 0 && (
            <>
              {query && (
                <p className="px-4 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-text-subtle)" }}>
                  ページ
                </p>
              )}
              {filteredNav.map((item, i) => {
                const Icon = item.icon;
                const active = i === activeIndex;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => go(item)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                    style={{
                      background: active ? "var(--color-primary-soft)" : "transparent",
                      color: active ? "var(--color-primary)" : "var(--color-text)",
                    }}
                  >
                    <Icon size={15} style={{ color: active ? "var(--color-primary)" : "var(--color-text-muted)" }} />
                    <span className="flex-1">{item.label}</span>
                    {active && <ArrowRight size={13} style={{ color: "var(--color-primary)" }} />}
                  </button>
                );
              })}
            </>
          )}

          {/* 見積書 */}
          {quotes.length > 0 && (
            <>
              <div className="mx-4 my-1 border-t" style={{ borderColor: "var(--color-border)" }} />
              <p className="px-4 pt-1 pb-1 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--color-text-subtle)" }}>
                見積書
              </p>
              {quotes.map((item, qi) => {
                const i = filteredNav.length + qi;
                const active = i === activeIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => go(item)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                    style={{
                      background: active ? "var(--color-primary-soft)" : "transparent",
                      color: active ? "var(--color-primary)" : "var(--color-text)",
                    }}
                  >
                    <FileText size={15} style={{ color: "var(--color-text-muted)" }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.project_name ?? "（無題）"}</p>
                      {item.client_name && (
                        <p className="truncate text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {item.client_name}
                        </p>
                      )}
                    </div>
                    {active && <ArrowRight size={13} className="shrink-0" style={{ color: "var(--color-primary)" }} />}
                  </button>
                );
              })}
            </>
          )}

          {/* 何も見つからない */}
          {query && allItems.length === 0 && (
            <p className="px-4 py-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
              「{query}」に一致する項目なし
            </p>
          )}
        </div>
      )}
    </div>
  );
}
