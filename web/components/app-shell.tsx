"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, ScanLine, Users, Package } from "lucide-react";
import { AppSidebar } from "./app-sidebar";
import { AppHeader } from "./app-header";
import { RightPanel } from "./right-panel";
import { RightPanelProvider, useRightPanel } from "./right-panel-context";
import { AnalysisProvider } from "./analysis-context";
import { ToastProvider } from "./toast-context";
import { MentionProvider } from "./mention-context";
import { GroupNotificationListener } from "./group-notification-listener";

interface AppShellProps {
  children: React.ReactNode;
  displayName: string;
  email: string;
  plan: string | null;
  userId: string;
  pendingJoinCount?: number;
  myGroups?: { id: string; name: string }[];
}

const BOTTOM_TABS = [
  { href: "/dashboard",   icon: LayoutDashboard, label: "ホーム" },
  { href: "/quotes",      icon: FileText,        label: "見積書" },
  { href: "/drawings",    icon: ScanLine,        label: "図面解析" },
  { href: "/groups",      icon: Users,           label: "グループ" },
  { href: "/unit-prices", icon: Package,         label: "単価マスタ" },
];

function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden"
      style={{
        background: "var(--color-surface)",
        borderTop: "1px solid var(--color-border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {BOTTOM_TABS.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2"
          >
            <Icon
              size={22}
              style={{ color: isActive ? "var(--color-primary)" : "var(--color-text-muted)" }}
            />
            <span
              className="text-[10px] font-medium"
              style={{ color: isActive ? "var(--color-primary)" : "var(--color-text-muted)" }}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children, displayName, email, plan, userId, pendingJoinCount = 0, myGroups = [] }: AppShellProps) {
  return (
    <ToastProvider>
      <AnalysisProvider>
        <MentionProvider>
          <RightPanelProvider>
            <AppShellInner
              displayName={displayName}
              email={email}
              plan={plan}
              userId={userId}
              pendingJoinCount={pendingJoinCount}
              myGroups={myGroups}
            >
              {children}
            </AppShellInner>
          </RightPanelProvider>
        </MentionProvider>
      </AnalysisProvider>
    </ToastProvider>
  );
}

function AppShellInner({
  children,
  displayName,
  email,
  plan,
  userId,
  pendingJoinCount,
  myGroups,
}: Omit<AppShellProps, "children"> & { children: React.ReactNode }) {
  const [expanded, setExpanded] = useState(true);
  const { open: rightOpen } = useRightPanel();

  return (
    <div data-print="root" className="flex h-dvh overflow-hidden" style={{ background: "var(--color-bg)" }}>
      <GroupNotificationListener groups={myGroups ?? []} myDisplayName={displayName} />

      {/* サイドバー — PCのみ表示 */}
      <div data-print="hide" className="hidden md:block">
        <AppSidebar expanded={expanded} onToggle={() => setExpanded((v) => !v)} plan={plan} pendingJoinCount={pendingJoinCount} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div data-print="hide">
          <AppHeader displayName={displayName} email={email} pendingJoinCount={pendingJoinCount ?? 0} />
        </div>
        {/* モバイルで下タブ分の余白を追加 */}
        <main data-print="main" className="flex-1 overflow-y-auto flex flex-col pb-16 md:pb-0">
          {children}
        </main>
      </div>

      {/* 右パネル */}
      <div
        style={{
          width: rightOpen ? 300 : 0,
          transition: "width 220ms cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {rightOpen && (
          <RightPanel userId={userId} displayName={displayName} plan={plan} />
        )}
      </div>

      {/* モバイル下タブナビ */}
      <MobileBottomNav />
    </div>
  );
}
