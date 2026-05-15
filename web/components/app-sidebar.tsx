"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  FileText,
  Package,
  ScanLine,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  MessageSquare,
  ChevronDown,
  MessageCircleHeart,
  type LucideIcon,
} from "lucide-react";
import { useRightPanel } from "./right-panel-context";

type SubItem = {
  href: string;
  label: string;
  soon?: boolean;
};

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  children?: SubItem[];
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "ダッシュボード",
    children: [
      { href: "/dashboard",         label: "概要" },
      { href: "/dashboard/reports", label: "レポート・統計", soon: true },
    ],
  },
  {
    href: "/quotes",
    icon: FileText,
    label: "見積書",
    children: [
      { href: "/quotes",            label: "見積一覧" },
      { href: "/quotes/new",        label: "見積書作成" },
      { href: "/quotes/drafts",     label: "下書き" },
      { href: "/quotes/templates",  label: "テンプレート", soon: true },
    ],
  },
  {
    href: "/unit-prices",
    icon: Package,
    label: "単価マスタ",
    children: [
      { href: "/unit-prices",             label: "単価一覧" },
      { href: "/unit-prices/categories",  label: "カテゴリ管理", soon: true },
      { href: "/unit-prices/import",      label: "一括インポート" },
    ],
  },
  {
    href: "/drawings",
    icon: ScanLine,
    label: "図面解析",
    children: [
      { href: "/drawings",     label: "解析一覧" },
      { href: "/drawings/new", label: "新規解析" },
    ],
  },
  {
    href: "/groups",
    icon: Users,
    label: "グループ",
  },
  {
    href: "/settings",
    icon: Settings,
    label: "設定",
    children: [
      { href: "/settings",         label: "プロフィール" },
      { href: "/settings/company", label: "会社情報" },
      { href: "/settings/plan",    label: "プラン・請求" },
    ],
  },
];

/* ─── Sidebar ─── */
export function AppSidebar({
  expanded,
  onToggle,
  plan,
  pendingJoinCount = 0,
}: {
  expanded: boolean;
  onToggle: () => void;
  plan: string;
  pendingJoinCount?: number;
}) {
  const pathname = usePathname();
  const { open: panelOpen, toggle: panelToggle, hasUnread } = useRightPanel();

  // アクティブなパスを含むセクションを初期展開
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const s = new Set<string>();
    for (const item of NAV_ITEMS) {
      if (item.children && (pathname === item.href || pathname.startsWith(item.href + "/"))) {
        s.add(item.href);
      }
    }
    return s;
  });

  // パス変更時も自動展開
  useEffect(() => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      for (const item of NAV_ITEMS) {
        if (item.children && (pathname === item.href || pathname.startsWith(item.href + "/"))) {
          next.add(item.href);
        }
      }
      return next;
    });
  }, [pathname]);

  function toggleSection(href: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(href) ? next.delete(href) : next.add(href);
      return next;
    });
  }

  return (
    <aside
      style={{
        width: expanded ? 240 : 72,
        transition: "width 220ms cubic-bezier(0.4, 0, 0.2, 1)",
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
      className="relative flex h-full flex-col shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div
        className="flex h-16 shrink-0 items-center gap-3 px-4"
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold text-white text-sm"
          style={{ background: "var(--color-primary)" }}
        >
          T
        </div>
        {expanded && (
          <div className="overflow-hidden">
            <span className="block font-bold text-white text-base tracking-wide whitespace-nowrap">
              TORU
            </span>
            <span
              className="block text-[10px] font-medium whitespace-nowrap"
              style={{ color: "var(--sidebar-text)" }}
            >
              建設現場 管理システム
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-3 flex-1 overflow-y-auto">
        {expanded && (
          <p
            className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: "var(--sidebar-text)" }}
          >
            メニュー
          </p>
        )}

        {NAV_ITEMS.map((item) => {
          const { href, icon: Icon, label, children } = item;
          const isParentActive = pathname === href || pathname.startsWith(href + "/");
          const isOpen = openSections.has(href);
          const hasChildren = !!children?.length;

          return (
            <div key={href}>
              {/* 親アイテム */}
              <div className="flex items-center">
                <Link
                  href={href}
                  title={!expanded ? label : undefined}
                  style={
                    isParentActive
                      ? {
                          background: "var(--sidebar-active-bg)",
                          color: "var(--sidebar-active-text)",
                          borderLeft: "3px solid var(--sidebar-active-border)",
                        }
                      : {
                          color: "var(--sidebar-text)",
                          borderLeft: "3px solid transparent",
                        }
                  }
                  className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isParentActive ? "" : "hover:bg-white/5"
                  } ${hasChildren && expanded ? "rounded-r-none" : ""}`}
                  onMouseEnter={(e) => {
                    if (!isParentActive)
                      (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isParentActive)
                      (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text)";
                  }}
                >
                  <span className="relative shrink-0">
                    <Icon
                      size={18}
                      style={isParentActive ? { color: "var(--sidebar-active-border)" } : {}}
                    />
                    {/* 申請ドット（グループのみ、折り畳み時） */}
                    {!expanded && href === "/groups" && pendingJoinCount > 0 && (
                      <span
                        className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2"
                        style={{ background: "#F97316", borderColor: "var(--sidebar-bg)" }}
                      />
                    )}
                  </span>
                  {expanded && (
                    <span className="flex-1 whitespace-nowrap overflow-hidden">{label}</span>
                  )}
                  {/* 申請ドット（グループのみ、展開時） */}
                  {expanded && href === "/groups" && pendingJoinCount > 0 && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: "#F97316" }}
                    />
                  )}
                </Link>

                {/* 開閉ボタン（サイドバー展開時のみ） */}
                {hasChildren && expanded && (
                  <button
                    type="button"
                    onClick={() => toggleSection(href)}
                    className="flex h-full items-center px-2 rounded-r-lg transition-all hover:bg-white/5"
                    style={{
                      color: isParentActive ? "var(--sidebar-active-text)" : "var(--sidebar-text)",
                      background: isParentActive ? "var(--sidebar-active-bg)" : "transparent",
                      borderLeft: isParentActive ? "none" : "none",
                    }}
                    aria-label={isOpen ? "折り畳む" : "展開する"}
                  >
                    <ChevronDown
                      size={14}
                      style={{
                        transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                        transition: "transform 180ms ease",
                        opacity: 0.7,
                      }}
                    />
                  </button>
                )}
              </div>

              {/* サブアイテム */}
              {hasChildren && expanded && isOpen && (
                <div className="mt-0.5 ml-3 flex flex-col gap-0.5 border-l pl-3"
                  style={{ borderColor: "var(--sidebar-border)" }}
                >
                  {children!.map((child) => {
                    const childActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium transition-all hover:bg-white/5"
                        style={{
                          color: childActive
                            ? "var(--sidebar-active-border)"
                            : "var(--sidebar-text)",
                          background: childActive ? "var(--sidebar-active-bg)" : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!childActive)
                            (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text-hover)";
                        }}
                        onMouseLeave={(e) => {
                          if (!childActive)
                            (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text)";
                        }}
                      >
                        <span>{child.label}</span>
                        {child.soon && (
                          <span
                            className="rounded px-1 py-0.5 text-[9px] font-semibold"
                            style={{
                              background: "rgba(255,255,255,0.08)",
                              color: "var(--sidebar-text)",
                            }}
                          >
                            準備中
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* メッセージ */}
      <div
        className="shrink-0 p-3"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        <button
          type="button"
          onClick={panelToggle}
          title={!expanded ? "メッセージ" : undefined}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150"
          style={{
            background: panelOpen ? "var(--sidebar-active-bg)" : "transparent",
            color: panelOpen ? "var(--sidebar-active-text)" : "var(--sidebar-text)",
            borderLeft: panelOpen ? "3px solid var(--sidebar-active-border)" : "3px solid transparent",
          }}
          onMouseEnter={(e) => {
            if (!panelOpen)
              (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text-hover)";
          }}
          onMouseLeave={(e) => {
            if (!panelOpen)
              (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text)";
          }}
        >
          <div className="relative shrink-0">
            <MessageSquare
              size={18}
              style={panelOpen ? { color: "var(--sidebar-active-border)" } : {}}
            />
            {hasUnread && (
              <span
                className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full"
                style={{ background: "#F97316", boxShadow: "0 0 0 2px var(--sidebar-bg)" }}
              />
            )}
          </div>
          {expanded && (
            <span className="whitespace-nowrap overflow-hidden">メッセージ</span>
          )}
        </button>
      </div>

      {/* フィードバック */}
      <div
        className="shrink-0 px-3 pb-1"
      >
        <Link
          href="/feedback"
          title={!expanded ? "フィードバック" : undefined}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150"
          style={{
            color: pathname === "/feedback" ? "var(--sidebar-active-text)" : "var(--sidebar-text)",
            background: pathname === "/feedback" ? "var(--sidebar-active-bg)" : "transparent",
            borderLeft: pathname === "/feedback" ? "3px solid var(--sidebar-active-border)" : "3px solid transparent",
          }}
          onMouseEnter={(e) => {
            if (pathname !== "/feedback")
              (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text-hover)";
          }}
          onMouseLeave={(e) => {
            if (pathname !== "/feedback")
              (e.currentTarget as HTMLElement).style.color = "var(--sidebar-text)";
          }}
        >
          <MessageCircleHeart
            size={18}
            className="shrink-0"
            style={pathname === "/feedback" ? { color: "var(--sidebar-active-border)" } : {}}
          />
          {expanded && (
            <span className="whitespace-nowrap overflow-hidden">フィードバック</span>
          )}
        </Link>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderTop: "1px solid var(--sidebar-border)" }}
      >
        {expanded && (
          <span
            className="text-[11px] font-medium whitespace-nowrap"
            style={{ color: "var(--sidebar-text)" }}
          >
            v0.1
          </span>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-white/10 ml-auto"
          style={{ color: "var(--sidebar-text)" }}
          aria-label={expanded ? "サイドバーを閉じる" : "サイドバーを開く"}
        >
          {expanded ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
        </button>
      </div>
    </aside>
  );
}
