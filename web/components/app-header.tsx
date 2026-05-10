"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, LogOut, CheckCircle, AlertCircle, Loader2, UserCheck } from "lucide-react";
import Link from "next/link";
import { SearchBar } from "./search-bar";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAnalysis } from "./analysis-context";
import { useMentions } from "./mention-context";

interface AppHeaderProps {
  displayName: string;
  email: string;
  pendingJoinCount?: number;
}

export function AppHeader({ displayName, email, pendingJoinCount = 0 }: AppHeaderProps) {
  const router = useRouter();
  const [dropOpen, setDropOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const { state: analysis, markRead } = useAnalysis();
  const { mentions, clearMentions } = useMentions();

  const totalMentions = mentions.reduce((s, m) => s + m.count, 0);
  const hasAnyNotif = analysis.hasNotification || pendingJoinCount > 0 || totalMentions > 0;

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = (
    displayName
      .split(/\s+/)
      .map((w) => w[0] ?? "")
      .slice(0, 2)
      .join("")
      .toUpperCase() ||
    displayName[0]?.toUpperCase() ||
    "U"
  );

  return (
    <header
      className="flex h-16 shrink-0 items-center gap-4 px-5"
      style={{
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div className="hidden md:flex flex-1">
        <SearchBar />
      </div>

      <div className="ml-auto flex items-center gap-1">
        {/* Bell + 解析通知 */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              if (analysis.hasNotification) markRead();
            }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg transition hover:bg-[color:var(--color-bg)]"
            style={{ color: "var(--color-text-muted)" }}
            aria-label="通知"
          >
            {(analysis.status === "uploading" || analysis.status === "analyzing") ? (
              <Loader2 size={18} className="animate-spin" style={{ color: "var(--color-primary)" }} />
            ) : (
              <Bell size={18} />
            )}
            {hasAnyNotif && (
              totalMentions > 0 || pendingJoinCount > 0 ? (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
                  style={{ background: totalMentions > 0 ? "var(--color-primary)" : "var(--color-warning, #D97706)" }}
                >
                  {totalMentions > 0 ? totalMentions : pendingJoinCount}
                </span>
              ) : (
                <span
                  className="absolute right-0 top-0 h-2 w-2 rounded-full"
                  style={{ background: "var(--color-primary)" }}
                />
              )
            )}
          </button>

          {notifOpen && (analysis.status !== "idle" || pendingJoinCount > 0 || totalMentions > 0) && (
            <div
              className="absolute right-0 top-full mt-1 w-72 rounded-xl border shadow-lg overflow-hidden"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", zIndex: 50 }}
            >
              {/* @メンション通知 */}
              {mentions.map((m) => (
                <Link
                  key={m.groupId}
                  href={`/groups/${m.groupId}`}
                  onClick={() => { clearMentions(); setNotifOpen(false); }}
                  className="flex items-start gap-3 px-4 py-3 transition hover:opacity-80"
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <Bell size={16} className="shrink-0 mt-0.5" style={{ color: "var(--color-primary)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                      あなたへのメンション（{m.count}件）
                    </p>
                    <p className="mt-0.5 text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                      {m.groupName}
                    </p>
                  </div>
                </Link>
              ))}
              {/* 参加申請通知 */}
              {pendingJoinCount > 0 && (
                <Link
                  href="/groups"
                  onClick={() => setNotifOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 transition hover:opacity-80"
                  style={{ borderBottom: analysis.status !== "idle" ? "1px solid var(--color-border)" : "none" }}
                >
                  <UserCheck size={16} className="shrink-0 mt-0.5" style={{ color: "var(--color-warning, #D97706)" }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                      参加申請が {pendingJoinCount}件 あります
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      グループを開いて承認・拒否してください
                    </p>
                  </div>
                </Link>
              )}
              {/* 図面解析通知 */}
              {analysis.status !== "idle" && (
                <div className="px-4 py-3">
                  {(analysis.status === "uploading" || analysis.status === "analyzing") && (
                    <div className="flex items-center gap-3">
                      <Loader2 size={16} className="animate-spin shrink-0" style={{ color: "var(--color-primary)" }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                          {analysis.status === "uploading" ? "アップロード中..." : "解析中..."}
                        </p>
                        <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>{analysis.fileName}</p>
                      </div>
                    </div>
                  )}
                  {analysis.status === "done" && (
                    <div className="flex items-start gap-3">
                      <CheckCircle size={16} className="shrink-0 mt-0.5" style={{ color: "#059669" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>解析完了</p>
                        <p className="mt-0.5 text-xs truncate" style={{ color: "var(--color-text-muted)" }}>{analysis.fileName}</p>
                        {analysis.error && (
                          <p className="mt-0.5 text-xs" style={{ color: "var(--color-warning, #D97706)" }}>{analysis.error}</p>
                        )}
                        <Link
                          href={analysis.analysisId ? `/drawings/${analysis.analysisId}` : "/drawings"}
                          onClick={() => setNotifOpen(false)}
                          className="mt-2 inline-flex text-xs font-semibold"
                          style={{ color: "var(--color-primary)" }}
                        >
                          結果を確認する →
                        </Link>
                      </div>
                    </div>
                  )}
                  {analysis.status === "error" && (
                    <div className="flex items-start gap-3">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: "var(--color-danger)" }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>解析失敗</p>
                        <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>{analysis.error}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>


        {/* User dropdown */}
        <div className="relative" ref={dropRef}>
          <button
            type="button"
            onClick={() => setDropOpen((v) => !v)}
            className="flex h-9 items-center gap-2 rounded-lg px-2 transition hover:bg-[color:var(--color-bg)]"
            style={{ color: "var(--color-text)" }}
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shrink-0"
              style={{ background: "var(--color-primary)" }}
            >
              {initials}
            </div>
            <span className="hidden text-sm font-medium sm:block">{displayName}</span>
            <ChevronDown
              size={14}
              style={{
                color: "var(--color-text-muted)",
                transform: dropOpen ? "rotate(180deg)" : "none",
                transition: "transform 150ms ease",
              }}
            />
          </button>

          {dropOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-52 rounded-xl border py-1 shadow-lg"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-border)",
                zIndex: 50,
              }}
            >
              <div
                className="border-b px-4 py-3"
                style={{ borderColor: "var(--color-border)" }}
              >
                <p className="text-sm font-semibold truncate">{displayName}</p>
                <p className="mt-0.5 text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                  {email}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-[color:var(--color-bg)] disabled:opacity-60"
                style={{ color: "var(--color-danger)" }}
              >
                <LogOut size={15} />
                {loggingOut ? "ログアウト中..." : "ログアウト"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
