"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Building2, Sparkles } from "lucide-react";

const SETTINGS_TABS = [
  { href: "/settings",         label: "プロフィール", icon: User },
  { href: "/settings/company", label: "会社情報",     icon: Building2 },
  { href: "/settings/plan",    label: "プラン・請求", icon: Sparkles },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* モバイル用タブナビ（PCはサイドバーがあるので非表示） */}
      <div
        className="md:hidden flex gap-1 px-4 pt-4 pb-0 shrink-0"
      >
        {SETTINGS_TABS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition"
              style={{
                background: isActive ? "var(--color-primary)" : "var(--color-surface)",
                color: isActive ? "#fff" : "var(--color-text-muted)",
                border: `1px solid ${isActive ? "transparent" : "var(--color-border)"}`,
              }}
            >
              <Icon size={14} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
