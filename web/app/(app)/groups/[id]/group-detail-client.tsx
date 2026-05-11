"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronLeft, ChevronDown, Crown, Trash2, LogOut, Users,
  PanelRightOpen, PanelRightClose, Sparkles, Loader2, Send, UserCheck, UserX,
  Paperclip, FileText, ImageIcon, Download, UserPlus,
} from "lucide-react";
import { GroupChat } from "./group-chat";
import { CopyButton, ShareLinkButton } from "./copy-button";
import { MobileShareDrawer } from "./share-buttons";
import { deleteGroup, leaveGroup, summarizeGroupMessages, askGroupChat, approveJoinRequest, rejectJoinRequest, getGroupFileUrl, inviteUserById } from "../actions";
import { useToast } from "@/components/toast-context";

type Member = {
  user_id: string;
  role: string;
  users: { display_name: string | null } | null;
};

type Group = {
  id: string;
  name: string;
  group_code: string;
  trust_level: string;
};

type JoinRequest = {
  id: string;
  user_id: string;
  display_name: string;
  created_at: string;
};

type GroupFile = {
  id: string;
  original_name: string;
  mime_type: string;
  file_size: number;
  created_at: string;
  user_id: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileSidebarItem({ file }: { file: GroupFile }) {
  const isImage = file.mime_type.startsWith("image/");

  // カード本体クリック → 新タブでプレビュー
  async function handlePreview() {
    const result = await getGroupFileUrl(file.id);
    if ("url" in result) window.open(result.url, "_blank");
  }

  // ダウンロードボタン → PCに保存
  async function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/groups/download/${file.id}`);
      if (!res.ok) throw new Error("download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.original_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(`/api/groups/download/${file.id}`, "_blank");
    }
  }

  const dateLabel = (() => {
    const diff = Date.now() - new Date(file.created_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "たった今";
    if (mins < 60) return `${mins}分前`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}時間前`;
    return `${Math.floor(hrs / 24)}日前`;
  })();

  return (
    <div
      onClick={handlePreview}
      className="flex items-center gap-2 rounded-xl p-2 transition"
      title="クリックしてプレビュー"
      style={{
        background: "var(--color-bg)",
        border: "1px solid var(--color-border)",
        cursor: "pointer",
        userSelect: "none",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-surface)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-bg)"; }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: isImage ? "rgba(37,99,235,0.08)" : "rgba(220,38,38,0.08)" }}
      >
        {isImage ? (
          <ImageIcon size={14} style={{ color: "var(--color-primary)" }} />
        ) : (
          <FileText size={14} style={{ color: "var(--color-danger)" }} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold" style={{ color: "var(--color-text)" }}>
          {file.original_name}
        </p>
        <p className="text-[9px]" style={{ color: "var(--color-text-subtle)" }}>
          {formatBytes(file.file_size)} · {dateLabel}
        </p>
      </div>
      <button
        type="button"
        onClick={handleDownload}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition hover:opacity-70"
        style={{ background: "var(--color-primary-soft)", color: "var(--color-primary)", cursor: "default" }}
        title="ダウンロード"
      >
        <Download size={11} />
      </button>
    </div>
  );
}

export function GroupDetailClient({
  group,
  currentUserId,
  myDisplayName,
  isOwner,
  members,
  initialMessages,
  joinRequests: initialJoinRequests,
  initialFiles,
}: {
  group: Group;
  currentUserId: string;
  myDisplayName: string;
  isOwner: boolean;
  members: Member[];
  initialMessages: Array<{ id: string; group_id: string; user_id: string; body: string; created_at: string }>;
  joinRequests: JoinRequest[];
  initialFiles: GroupFile[];
}) {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>(initialJoinRequests);
  const [requestLoading, setRequestLoading] = useState<string | null>(null);
  const [memberList, setMemberList] = useState<Member[]>(members);
  const [membersOpen, setMembersOpen] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(true);
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);
  const [groupFiles, setGroupFiles] = useState<GroupFile[]>(initialFiles);
  const [pendingMention, setPendingMention] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<"leave" | "delete" | null>(null);
  const [inviteUserId, setInviteUserId] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(256);

  // オーナーのみ: 参加申請がリアルタイムで来たらページを再取得して表示反映
  useEffect(() => {
    if (!isOwner) return;
    const supabase = createClient();
    const ch = supabase
      .channel(`join-req-${group.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_join_requests", filter: `group_id=eq.${group.id}` },
        () => { router.refresh(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [group.id, isOwner, router]);

  function handleResizeStart(e: React.MouseEvent) {
    e.preventDefault();
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMouseMove(ev: MouseEvent) {
      const delta = dragStartXRef.current - ev.clientX;
      const next = Math.max(200, Math.min(480, dragStartWidthRef.current + delta));
      setSidebarWidth(next);
    }
    function onMouseUp() {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }

  async function handleSummarize() {
    setAiLoading(true);
    const result = await summarizeGroupMessages(group.id);
    setAiLoading(false);
    if ("summary" in result) {
      setAiResponse(result.summary);
    } else {
      toastError("要約に失敗しました。しばらくしてから再試行してください。");
    }
  }

  async function handleAskQuestion() {
    const q = aiQuestion.trim();
    if (!q || aiLoading) return;
    setAiLoading(true);
    const result = await askGroupChat(group.id, q);
    setAiLoading(false);
    if ("answer" in result) {
      setAiResponse(result.answer);
      setAiQuestion("");
    } else {
      toastError("回答の取得に失敗しました。しばらくしてから再試行してください。");
    }
  }

  function onAiKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAskQuestion();
    }
  }

  async function handleApprove(requestId: string) {
    setRequestLoading(requestId);
    const req = joinRequests.find((r) => r.id === requestId);
    const result = await approveJoinRequest(requestId);
    setRequestLoading(null);
    if (result && "error" in result) {
      toastError(result.error ?? "承認に失敗しました");
    } else {
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
      // 承認済みメンバーを即座にリストへ追加
      if (req) {
        setMemberList((prev) => [
          ...prev,
          { user_id: req.user_id, role: "member", users: { display_name: req.display_name } },
        ]);
      }
      toastSuccess("メンバーを承認しました。");
      router.refresh();
    }
  }

  async function handleReject(requestId: string) {
    setRequestLoading(requestId);
    const result = await rejectJoinRequest(requestId);
    setRequestLoading(null);
    if (result && "error" in result) {
      toastError(result.error ?? "拒否に失敗しました");
    } else {
      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
      toastSuccess("申請を拒否しました。");
    }
  }

  async function handleDelete() {
    setConfirmModal("delete");
  }

  async function handleLeave() {
    setConfirmModal("leave");
  }

  async function handleInviteById(e: React.FormEvent) {
    e.preventDefault();
    const id = inviteUserId.trim();
    if (!id || inviteLoading) return;
    setInviteLoading(true);
    const result = await inviteUserById(group.id, id);
    setInviteLoading(false);
    if (result && "error" in result) {
      toastError(result.error ?? "エラーが発生しました");
    } else if (result && "ok" in result) {
      toastSuccess(`${result.displayName}をグループに追加しました`);
      setInviteUserId("");
      router.refresh();
    }
  }

  async function confirmDelete() {
    setConfirmModal(null);
    const result = await deleteGroup(group.id);
    if (result && "error" in result) {
      toastError("削除に失敗しました。");
      return;
    }
    toastSuccess("グループを削除しました。");
    router.push("/groups");
  }

  async function confirmLeave() {
    setConfirmModal(null);
    const result = await leaveGroup(group.id);
    if (result && "error" in result) {
      toastError("退出に失敗しました。");
      return;
    }
    toastSuccess("グループから退出しました。");
    router.push("/groups");
  }

  return (
    <div className="flex h-full flex-col" style={{ background: "var(--color-bg)" }}>

      {/* 退出・削除 確認モーダル */}
      {confirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => setConfirmModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 shadow-xl"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* アイコン */}
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: confirmModal === "delete" ? "rgba(220,38,38,0.1)" : "rgba(251,191,36,0.12)" }}
            >
              {confirmModal === "delete"
                ? <Trash2 size={22} style={{ color: "var(--color-danger)" }} />
                : <LogOut size={22} style={{ color: "#D97706" }} />
              }
            </div>

            {/* テキスト */}
            <h2 className="mb-2 text-center text-base font-bold" style={{ color: "var(--color-text)" }}>
              {confirmModal === "delete" ? "グループを削除" : "グループから退出"}
            </h2>
            <p className="mb-6 text-center text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              {confirmModal === "delete"
                ? `「${group.name}」を削除しますか？\nこの操作は元に戻せません。`
                : `「${group.name}」から退出しますか？`}
            </p>

            {/* ボタン */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition hover:opacity-80"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={confirmModal === "delete" ? confirmDelete : confirmLeave}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: confirmModal === "delete" ? "var(--color-danger)" : "#D97706" }}
              >
                {confirmModal === "delete" ? "削除する" : "退出する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className="flex shrink-0 items-center gap-3 px-4 py-3"
        style={{ background: "var(--color-surface)", borderBottom: "1px solid var(--color-border)" }}
      >
        <Link
          href="/groups"
          className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-80"
          style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
        >
          <ChevronLeft size={16} />
        </Link>

        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
          style={{ background: "var(--color-primary)" }}
        >
          {group.name[0]}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="truncate text-base font-bold" style={{ color: "var(--color-text)" }}>
            {group.name}
          </h1>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {memberList.length}人のメンバー
          </p>
        </div>

        {/* Mobile share drawer */}
        <MobileShareDrawer code={group.group_code} groupName={group.name} />

        {/* Mobile info button — ファイル・メンバー・AI を表示 */}
        <button
          type="button"
          onClick={() => setMobileInfoOpen(true)}
          className="relative flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-80 lg:hidden"
          style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          aria-label="ファイルとメンバーを表示"
        >
          <Paperclip size={14} />
          {groupFiles.length > 0 && (
            <span
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
              style={{ background: "var(--color-primary)" }}
            >
              {groupFiles.length}
            </span>
          )}
        </button>

        {/* Sidebar toggle (desktop only) */}
        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-80"
          style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          aria-label={sidebarOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
        >
          {sidebarOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
        </button>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">

        {/* Chat */}
        <div className="flex flex-1 flex-col overflow-hidden" style={{ minWidth: 320 }}>
          <GroupChat
            groupId={group.id}
            groupName={group.name}
            currentUserId={currentUserId}
            myDisplayName={myDisplayName}
            initialMessages={initialMessages}
            members={memberList}
            pendingMention={pendingMention}
            onMentionConsumed={() => setPendingMention(null)}
            onFileUploaded={(file) => setGroupFiles((prev) => [file, ...prev])}
          />
        </div>

        {/* Resize handle */}
        {sidebarOpen && (
          <div
            onMouseDown={handleResizeStart}
            className="hidden lg:flex shrink-0 items-center justify-center"
            style={{
              width: 6,
              cursor: "col-resize",
              background: "var(--color-border)",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-primary)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-border)"; }}
            title="ドラッグして幅を調整"
          />
        )}

        {/* モバイル：背景オーバーレイ */}
        {mobileInfoOpen && (
          <div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={() => setMobileInfoOpen(false)}
          />
        )}

        {/* 詳細パネル */}
        {(sidebarOpen || mobileInfoOpen) && (
          <div
            className={`${mobileInfoOpen ? "fixed inset-y-0 right-0 z-50 flex w-[85vw] max-w-sm shrink-0" : "hidden lg:flex"} flex-col gap-4 overflow-y-auto p-4`}
            style={{
              width: mobileInfoOpen ? undefined : sidebarWidth,
              borderLeft: "none",
              background: "var(--color-surface)",
              boxShadow: mobileInfoOpen ? "-8px 0 24px rgba(0,0,0,0.15)" : undefined,
            }}
          >
            {/* モバイル用クローズボタン */}
            {mobileInfoOpen && (
              <div className="-mx-4 -mt-4 mb-2 flex shrink-0 items-center justify-between px-4 py-3 lg:hidden" style={{ borderBottom: "1px solid var(--color-border)" }}>
                <p className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
                  グループ情報
                </p>
                <button
                  type="button"
                  onClick={() => setMobileInfoOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-bold transition hover:opacity-70"
                  style={{ color: "var(--color-text-muted)", background: "var(--color-bg)" }}
                  aria-label="閉じる"
                >
                  ×
                </button>
              </div>
            )}

            {/* 参加申請（オーナーのみ） */}
            {isOwner && joinRequests.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-warning)" }}>
                  <UserCheck size={11} />
                  参加申請
                  <span
                    className="ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold text-white"
                    style={{ background: "var(--color-warning)" }}
                  >
                    {joinRequests.length}
                  </span>
                </p>
                <div className="space-y-2">
                  {joinRequests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-xl p-3"
                      style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                    >
                      <p className="mb-2 text-xs font-semibold" style={{ color: "var(--color-text)" }}>
                        {req.display_name}
                      </p>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApprove(req.id)}
                          disabled={requestLoading === req.id}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-semibold text-white transition disabled:opacity-50"
                          style={{ background: "var(--color-primary)" }}
                        >
                          {requestLoading === req.id ? <Loader2 size={10} className="animate-spin" /> : <UserCheck size={10} />}
                          承認
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(req.id)}
                          disabled={requestLoading === req.id}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[11px] font-semibold transition disabled:opacity-50"
                          style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
                        >
                          <UserX size={10} />
                          拒否
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members */}
            <div>
              <button
                type="button"
                onClick={() => setMembersOpen((v) => !v)}
                className="mb-2 flex w-full items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition hover:opacity-70"
                style={{ color: "var(--color-text-subtle)" }}
              >
                <Users size={11} />
                メンバー {memberList.length}人
                <ChevronDown
                  size={11}
                  className="ml-auto transition-transform duration-200"
                  style={{ transform: membersOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
                />
              </button>
              {membersOpen && (
                <div className="space-y-1">
                  {memberList.map((m) => {
                    const name = m.users?.display_name;
                    const isMe = m.user_id === currentUserId;
                    const canMention = !isMe && !!name;
                    return (
                      <div
                        key={m.user_id}
                        onClick={() => canMention && setPendingMention(name!)}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition"
                        style={{
                          cursor: canMention ? "pointer" : "default",
                        }}
                        title={canMention ? `@${name} をメンション` : undefined}
                        onMouseEnter={(e) => { if (canMention) (e.currentTarget as HTMLElement).style.background = "var(--color-bg)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                      >
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                          style={{ background: m.role === "owner" ? "var(--color-primary)" : "var(--color-text-subtle)" }}
                        >
                          {(name ?? "?")[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium" style={{ color: "var(--color-text)" }}>
                            {name ?? "名前未設定"}
                            {isMe && (
                              <span className="ml-1" style={{ color: "var(--color-text-subtle)" }}>(自分)</span>
                            )}
                          </p>
                          {m.role === "owner" && (
                            <p className="flex items-center gap-0.5 text-[10px]" style={{ color: "var(--color-warning)" }}>
                              <Crown size={9} /> オーナー
                            </p>
                          )}
                        </div>
                        {canMention && (
                          <span className="text-[9px] opacity-0 group-hover:opacity-60 transition" style={{ color: "var(--color-text-subtle)" }}>
                            @
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Invite code */}
            <div>
              <button
                type="button"
                onClick={() => setInviteOpen((v) => !v)}
                className="mb-2 flex w-full items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition hover:opacity-70"
                style={{ color: "var(--color-text-subtle)" }}
              >
                招待コード
                <ChevronDown
                  size={11}
                  className="ml-auto transition-transform duration-200"
                  style={{ transform: inviteOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
                />
              </button>
              {inviteOpen && (
                <>
                  <div
                    className="rounded-xl p-3 text-center"
                    style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
                  >
                    <p className="font-mono text-xl font-bold tracking-[0.3em]" style={{ color: "var(--color-text)" }}>
                      {group.group_code}
                    </p>
                    <CopyButton code={group.group_code} fullWidth />
                    <ShareLinkButton code={group.group_code} />
                  </div>
                  <p className="mt-1.5 text-[10px]" style={{ color: "var(--color-text-subtle)" }}>
                    コードまたはリンクをメンバーに共有
                  </p>
                </>
              )}
            </div>

            {/* ユーザーIDで直接招待（オーナーのみ） */}
            {isOwner && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-subtle)" }}>
                  <UserPlus size={11} />
                  ユーザーIDで招待
                </p>
                <form onSubmit={handleInviteById} className="flex gap-1.5">
                  <input
                    type="text"
                    value={inviteUserId}
                    onChange={(e) => setInviteUserId(e.target.value)}
                    placeholder="ユーザーIDを貼り付け"
                    className="min-w-0 flex-1 rounded-lg px-2.5 py-1.5 text-[11px] outline-none"
                    style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                  />
                  <button
                    type="submit"
                    disabled={inviteLoading || !inviteUserId.trim()}
                    className="shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white transition disabled:opacity-50"
                    style={{ background: "var(--color-primary)" }}
                  >
                    {inviteLoading ? <Loader2 size={11} className="animate-spin" /> : "招待"}
                  </button>
                </form>
                <p className="mt-1 text-[10px]" style={{ color: "var(--color-text-subtle)" }}>
                  設定ページのユーザーIDを入力
                </p>
              </div>
            )}

            {/* Files */}
            {(() => {
              const photos = groupFiles.filter((f) => f.mime_type.startsWith("image/"));
              const docs = groupFiles.filter((f) => !f.mime_type.startsWith("image/"));
              return (
                <div>
                  <button
                    type="button"
                    onClick={() => setFilesOpen((v) => !v)}
                    className="mb-2 flex w-full items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition hover:opacity-70"
                    style={{ color: "var(--color-text-subtle)" }}
                  >
                    <Paperclip size={11} />
                    ファイル
                    {groupFiles.length > 0 && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                        style={{ background: "var(--color-primary-soft)", color: "var(--color-primary)" }}
                      >
                        {groupFiles.length}
                      </span>
                    )}
                    <ChevronDown
                      size={11}
                      className="ml-auto transition-transform duration-200"
                      style={{ transform: filesOpen ? "rotate(0deg)" : "rotate(-90deg)" }}
                    />
                  </button>
                  {filesOpen && (
                    <div className="space-y-3">
                      {groupFiles.length === 0 && (
                        <p className="py-3 text-center text-[11px]" style={{ color: "var(--color-text-subtle)" }}>
                          まだファイルがありません
                        </p>
                      )}

                      {/* 写真 */}
                      {photos.length > 0 && (
                        <div>
                          <p
                            className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: "var(--color-text-subtle)" }}
                          >
                            <ImageIcon size={9} />
                            写真
                            <span
                              className="ml-1 rounded-full px-1 py-0.5 text-[8px] font-bold"
                              style={{ background: "rgba(37,99,235,0.08)", color: "var(--color-primary)" }}
                            >
                              {photos.length}
                            </span>
                          </p>
                          <div className="space-y-1.5">
                            {photos.map((f) => <FileSidebarItem key={f.id} file={f} />)}
                          </div>
                        </div>
                      )}

                      {/* ドキュメント */}
                      {docs.length > 0 && (
                        <div>
                          <p
                            className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: "var(--color-text-subtle)" }}
                          >
                            <FileText size={9} />
                            ドキュメント
                            <span
                              className="ml-1 rounded-full px-1 py-0.5 text-[8px] font-bold"
                              style={{ background: "rgba(220,38,38,0.08)", color: "var(--color-danger)" }}
                            >
                              {docs.length}
                            </span>
                          </p>
                          <div className="space-y-1.5">
                            {docs.map((f) => <FileSidebarItem key={f.id} file={f} />)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* AI Assistant */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-subtle)" }}>
                <Sparkles size={11} /> AI アシスタント
              </p>

              {/* Quick action */}
              <button
                type="button"
                onClick={handleSummarize}
                disabled={aiLoading}
                className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition hover:opacity-80 disabled:opacity-50"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
              >
                {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {aiLoading ? "処理中…" : "最近の会話を要約"}
              </button>

              {/* Custom question input */}
              <div
                className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
              >
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  onKeyDown={onAiKeyDown}
                  placeholder="例：〇〇工区の進捗は？"
                  disabled={aiLoading}
                  className="flex-1 bg-transparent text-xs outline-none disabled:opacity-50"
                  style={{ color: "var(--color-text)" }}
                />
                <button
                  type="button"
                  onClick={handleAskQuestion}
                  disabled={!aiQuestion.trim() || aiLoading}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition disabled:opacity-30"
                  style={{ background: "var(--color-primary)", color: "#fff" }}
                  aria-label="送信"
                >
                  <Send size={10} />
                </button>
              </div>
              <p className="mt-1 text-[10px]" style={{ color: "var(--color-text-subtle)" }}>
                Enter で送信
              </p>

              {/* AI response */}
              {aiResponse && (
                <div
                  className="mt-2 rounded-xl p-3 text-xs leading-relaxed"
                  style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
                >
                  {aiResponse}
                  <button
                    type="button"
                    onClick={() => setAiResponse(null)}
                    className="mt-1.5 text-[10px] transition hover:opacity-80"
                    style={{ color: "var(--color-text-subtle)" }}
                  >
                    閉じる
                  </button>
                </div>
              )}
            </div>

            {/* Delete / Leave */}
            <div className="mt-auto">
              {isOwner ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition hover:opacity-80"
                  style={{ border: "1px solid var(--color-danger)", color: "var(--color-danger)" }}
                >
                  <Trash2 size={13} /> グループを削除
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLeave}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition hover:opacity-80"
                  style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
                >
                  <LogOut size={13} /> 退出
                </button>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
