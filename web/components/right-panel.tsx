"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  MessageSquare,
  Plus,
  Hash,
  ChevronLeft,
  Send,
  Crown,
  X,
  LogOut,
} from "lucide-react";
import { useRightPanel } from "./right-panel-context";

// ─── 型定義 ───────────────────────────────────────────────────────

interface Group {
  id: string;
  group_code: string;
  name: string;
  description: string | null;
  trust_level: "trusted" | "mixed";
  created_by: string;
}

interface GroupMember {
  user_id: string;
  role: "owner" | "member";
  display_name: string;
}

interface DmConversation {
  partner_id: string;
  partner_name: string;
  last_body: string;
  last_at: string;
  unread: number;
}

interface DmMessage {
  id: string;
  from_user_id: string;
  body: string;
  created_at: string;
}

type PanelView =
  | { tag: "group_list" }
  | { tag: "group_detail"; group: Group }
  | { tag: "dm_list" }
  | { tag: "dm_chat"; partnerId: string; partnerName: string };

// ─── メイン ───────────────────────────────────────────────────────

interface RightPanelProps {
  userId: string;
  displayName: string;
  plan: string;
}

export function RightPanel({ userId, displayName, plan }: RightPanelProps) {
  const [tab, setTab] = useState<"groups" | "dm">("groups");
  const [view, setView] = useState<PanelView>({ tag: "group_list" });

  const isCorporate = plan !== "individual";

  // タブ切替時にビューをリセット
  function switchTab(t: "groups" | "dm") {
    setTab(t);
    setView(t === "groups" ? { tag: "group_list" } : { tag: "dm_list" });
  }

  return (
    <aside
      className="flex h-full flex-col shrink-0"
      style={{
        width: 300,
        borderLeft: "1px solid var(--color-border)",
        background: "var(--color-surface)",
      }}
    >
      {/* タブヘッダー */}
      <div
        className="flex h-12 shrink-0 items-center"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <button
          type="button"
          onClick={() => switchTab("groups")}
          className="flex flex-1 items-center justify-center gap-1.5 h-full text-xs font-semibold transition-colors"
          style={{
            color: tab === "groups" ? "var(--color-primary)" : "var(--color-text-muted)",
            borderBottom: tab === "groups" ? "2px solid var(--color-primary)" : "2px solid transparent",
          }}
        >
          <Users size={13} />
          グループ
        </button>
        <button
          type="button"
          onClick={() => switchTab("dm")}
          className="flex flex-1 items-center justify-center gap-1.5 h-full text-xs font-semibold transition-colors"
          style={{
            color: tab === "dm" ? "var(--color-primary)" : "var(--color-text-muted)",
            borderBottom: tab === "dm" ? "2px solid var(--color-primary)" : "2px solid transparent",
          }}
        >
          <MessageSquare size={13} />
          DM
        </button>
      </div>

      {/* コンテンツ */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {view.tag === "group_list" && (
          <GroupList
            userId={userId}
            isCorporate={isCorporate}
            onSelect={(g) => setView({ tag: "group_detail", group: g })}
          />
        )}
        {view.tag === "group_detail" && (
          <GroupDetail
            group={view.group}
            userId={userId}
            onBack={() => setView({ tag: "group_list" })}
            onOpenDm={(partnerId, partnerName) => {
              setTab("dm");
              setView({ tag: "dm_chat", partnerId, partnerName });
            }}
          />
        )}
        {view.tag === "dm_list" && (
          <DmList
            userId={userId}
            onSelect={(partnerId, partnerName) =>
              setView({ tag: "dm_chat", partnerId, partnerName })
            }
          />
        )}
        {view.tag === "dm_chat" && (
          <DmChat
            userId={userId}
            partnerId={view.partnerId}
            partnerName={view.partnerName}
            onBack={() => setView({ tag: "dm_list" })}
          />
        )}
      </div>
    </aside>
  );
}

// ─── グループ一覧 ─────────────────────────────────────────────────

function GroupList({
  userId,
  isCorporate,
  onSelect,
}: {
  userId: string;
  isCorporate: boolean;
  onSelect: (g: Group) => void;
}) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [newMsgGroups, setNewMsgGroups] = useState<Set<string>>(new Set());
  const { setHasUnread } = useRightPanel();

  // ① グループ読み込み + 未読チェック
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("project_group_members")
      .select("group_id, project_groups(*)")
      .eq("user_id", userId)
      .then(async ({ data }) => {
        const gs = (data ?? [])
          .map((row: any) => row.project_groups)
          .filter(Boolean)
          .filter((g: any) => !g.deleted_at) as Group[];
        setGroups(gs);
        setLoading(false);
        if (gs.length > 0) await checkUnread(supabase, gs);
      });
  }, [userId]);

  async function checkUnread(supabase: ReturnType<typeof createClient>, gs: Group[]) {
    const results = await Promise.all(
      gs.map((g) =>
        supabase
          .from("group_messages")
          .select("group_id, created_at, user_id")
          .eq("group_id", g.id)
          .is("deleted_at", null)
          .neq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      )
    );
    const hasNew = new Set<string>();
    for (const { data } of results) {
      if (!data) continue;
      const lastSeen = localStorage.getItem(`group_seen_${data.group_id}`);
      if (!lastSeen || new Date(data.created_at) > new Date(lastSeen)) {
        hasNew.add(data.group_id);
      }
    }
    setNewMsgGroups(hasNew);
    setHasUnread(hasNew.size > 0);
  }

  // ② Realtime: 他メンバーの新規メッセージをリアルタイム検知
  useEffect(() => {
    if (groups.length === 0) return;
    const supabase = createClient();
    const groupIds = groups.map((g) => g.id);

    const channel = supabase
      .channel(`group-unread-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "group_messages" },
        (payload) => {
          const msg = payload.new as { group_id: string; user_id: string; created_at: string };
          if (!groupIds.includes(msg.group_id) || msg.user_id === userId) return;
          const lastSeen = localStorage.getItem(`group_seen_${msg.group_id}`);
          if (!lastSeen || new Date(msg.created_at) > new Date(lastSeen)) {
            setNewMsgGroups((prev) => {
              const next = new Set(prev);
              next.add(msg.group_id);
              setHasUnread(true);
              return next;
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groups, userId]);

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setJoining(true);
    setJoinError("");
    const supabase = createClient();

    const { data: group } = await supabase
      .from("project_groups")
      .select("*")
      .eq("group_code", joinCode.toUpperCase().trim())
      .is("deleted_at", null)
      .maybeSingle();

    if (!group) {
      setJoinError("グループが見つかりません");
      setJoining(false);
      return;
    }

    const { error } = await supabase.from("project_group_members").insert({
      group_id: group.id,
      user_id: userId,
      role: "member",
    });

    if (error && !error.message.includes("duplicate")) {
      setJoinError("参加に失敗しました");
      setJoining(false);
      return;
    }

    setGroups((prev) => [...prev, group]);
    // Mark newly joined group as seen now (no unread from before you joined)
    localStorage.setItem(`group_seen_${group.id}`, new Date().toISOString());
    setJoinCode("");
    setShowJoin(false);
    setJoining(false);
  }

  function handleSelect(g: Group) {
    localStorage.setItem(`group_seen_${g.id}`, new Date().toISOString());
    setNewMsgGroups((prev) => {
      const next = new Set(prev);
      next.delete(g.id);
      setHasUnread(next.size > 0);
      return next;
    });
    onSelect(g);
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* アクションバー */}
      <div className="flex items-center gap-2 px-3 py-2.5" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <button
          type="button"
          onClick={() => setShowJoin((v) => !v)}
          className="flex flex-1 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition hover:opacity-80"
          style={{ background: "var(--color-bg)", color: "var(--color-text-muted)" }}
        >
          <Hash size={12} />
          コードで参加
        </button>
        {isCorporate && (
          <a
            href="/groups/new"
            className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:opacity-80"
            style={{ background: "var(--color-primary)", color: "#fff" }}
            title="グループを作成"
          >
            <Plus size={14} />
          </a>
        )}
      </div>

      {/* コード入力 */}
      {showJoin && (
        <div className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="例: TK7P2M"
              maxLength={6}
              className="flex-1 rounded-lg px-3 py-1.5 text-xs font-mono outline-none"
              style={{
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={joining || !joinCode.trim()}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50"
              style={{ background: "var(--color-primary)", color: "#fff" }}
            >
              {joining ? "..." : "参加"}
            </button>
          </div>
          {joinError && (
            <p className="mt-1.5 text-xs" style={{ color: "var(--color-danger)" }}>
              {joinError}
            </p>
          )}
        </div>
      )}

      {/* グループ一覧 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-xs" style={{ color: "var(--color-text-muted)" }}>
            読み込み中...
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
            <Users size={28} style={{ color: "var(--color-text-subtle)" }} />
            <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              参加中のグループなし
            </p>
            <p className="text-[11px]" style={{ color: "var(--color-text-subtle)" }}>
              コードで参加するか
              {isCorporate ? "グループを作成してください" : "招待を受けてください"}
            </p>
          </div>
        ) : (
          groups.map((g) => {
            const isNew = newMsgGroups.has(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => handleSelect(g)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[color:var(--color-bg)]"
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  borderLeft: isNew ? "3px solid var(--color-warning)" : "3px solid transparent",
                }}
              >
                {/* Avatar + dot */}
                <div className="relative shrink-0">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                    style={{ background: "var(--color-accent)" }}
                  >
                    {g.name[0]}
                  </div>
                  {isNew && (
                    <span
                      className="absolute -right-1 -top-1 h-3 w-3 rounded-full"
                      style={{
                        background: "#F97316",
                        boxShadow: "0 0 0 2px var(--color-surface)",
                      }}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-sm"
                    style={{
                      color: "var(--color-text)",
                      fontWeight: isNew ? 700 : 500,
                    }}
                  >
                    {g.name}
                  </p>
                  <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                    {g.group_code}
                  </p>
                </div>

                {isNew && (
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: "rgba(249,115,22,0.15)", color: "#F97316" }}
                  >
                    NEW
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* 全グループ管理リンク */}
      <div className="px-3 py-2.5" style={{ borderTop: "1px solid var(--color-border)" }}>
        <a
          href="/groups"
          className="flex items-center justify-center gap-1.5 text-xs font-medium transition hover:opacity-80"
          style={{ color: "var(--color-text-muted)" }}
        >
          <Users size={12} />
          グループ管理ページを開く
        </a>
      </div>
    </div>
  );
}

// ─── グループ詳細 ─────────────────────────────────────────────────

function GroupDetail({
  group,
  userId,
  onBack,
  onOpenDm,
}: {
  group: Group;
  userId: string;
  onBack: () => void;
  onOpenDm: (partnerId: string, partnerName: string) => void;
}) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwner = group.created_by === userId;

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("project_group_members")
      .select("user_id, role, users(display_name)")
      .eq("group_id", group.id)
      .then(({ data }) => {
        const ms = (data ?? []).map((row: any) => ({
          user_id: row.user_id,
          role: row.role,
          display_name: row.users?.display_name ?? "不明",
        }));
        setMembers(ms);
        setLoading(false);
      });
  }, [group.id]);

  async function handleLeave() {
    if (!confirm("グループを退出しますか？")) return;
    setLeaving(true);
    const supabase = createClient();
    await supabase
      .from("project_group_members")
      .delete()
      .eq("group_id", group.id)
      .eq("user_id", userId);
    onBack();
  }

  function copyCode() {
    navigator.clipboard.writeText(group.group_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ヘッダー */}
      <div
        className="flex h-12 shrink-0 items-center gap-2 px-3"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-[color:var(--color-bg)]"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ChevronLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            {group.name}
          </p>
        </div>
        {isOwner && (
          <a
            href={`/groups/${group.id}`}
            className="text-[11px] font-medium transition hover:opacity-70"
            style={{ color: "var(--color-primary)" }}
          >
            管理
          </a>
        )}
      </div>

      {/* グループコード */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-subtle)" }}>
          招待コード
        </p>
        <button
          type="button"
          onClick={copyCode}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition hover:opacity-80"
          style={{ background: "var(--color-bg)" }}
        >
          <span className="font-mono text-sm font-bold tracking-widest" style={{ color: "var(--color-text)" }}>
            {group.group_code}
          </span>
          <span className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
            {copied ? "コピー済み ✓" : "タップでコピー"}
          </span>
        </button>
      </div>

      {/* メンバー一覧 */}
      <div className="flex-1 overflow-y-auto">
        <p
          className="px-4 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-text-subtle)" }}
        >
          メンバー {loading ? "" : `(${members.length}人)`}
        </p>
        {loading ? (
          <div className="py-6 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
            読み込み中...
          </div>
        ) : (
          members.map((m) => (
            <div
              key={m.user_id}
              className="flex items-center gap-3 px-4 py-2.5"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: m.role === "owner" ? "var(--color-primary)" : "var(--color-text-subtle)" }}
              >
                {m.display_name[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium" style={{ color: "var(--color-text)" }}>
                  {m.display_name}
                  {m.user_id === userId && (
                    <span className="ml-1" style={{ color: "var(--color-text-subtle)" }}>(自分)</span>
                  )}
                </p>
                {m.role === "owner" && (
                  <p className="flex items-center gap-0.5 text-[10px]" style={{ color: "var(--color-warning)" }}>
                    <Crown size={9} /> オーナー
                  </p>
                )}
              </div>
              {m.user_id !== userId && (
                <button
                  type="button"
                  onClick={() => onOpenDm(m.user_id, m.display_name)}
                  className="flex h-6 w-6 items-center justify-center rounded-lg transition hover:opacity-80"
                  style={{ background: "var(--color-bg)", color: "var(--color-text-muted)" }}
                  title="DMを送る"
                >
                  <MessageSquare size={11} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* 退出 */}
      {!isOwner && (
        <div className="px-3 py-3" style={{ borderTop: "1px solid var(--color-border)" }}>
          <button
            type="button"
            onClick={handleLeave}
            disabled={leaving}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition hover:opacity-80 disabled:opacity-50"
            style={{ color: "var(--color-danger)", background: "var(--color-bg)" }}
          >
            <LogOut size={12} />
            グループを退出
          </button>
        </div>
      )}
    </div>
  );
}

// ─── DM 一覧 ──────────────────────────────────────────────────────

function DmList({
  userId,
  onSelect,
}: {
  userId: string;
  onSelect: (partnerId: string, partnerName: string) => void;
}) {
  const [convs, setConvs] = useState<DmConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConvs();
  }, [userId]);

  async function loadConvs() {
    const supabase = createClient();
    const { data } = await supabase
      .from("direct_messages")
      .select("id, from_user_id, to_user_id, body, created_at, read_at")
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    // パートナーIDごとに集約
    const map = new Map<string, DmConversation>();
    for (const msg of data) {
      const partnerId = msg.from_user_id === userId ? msg.to_user_id : msg.from_user_id;
      if (!map.has(partnerId)) {
        map.set(partnerId, {
          partner_id: partnerId,
          partner_name: "",
          last_body: msg.body,
          last_at: msg.created_at,
          unread: (!msg.read_at && msg.to_user_id === userId) ? 1 : 0,
        });
      } else {
        const conv = map.get(partnerId)!;
        if (!msg.read_at && msg.to_user_id === userId) conv.unread++;
      }
    }

    // ユーザー名を取得
    if (map.size > 0) {
      const partnerIds = Array.from(map.keys());
      const { data: users } = await supabase
        .from("users")
        .select("id, display_name")
        .in("id", partnerIds);
      for (const u of users ?? []) {
        const conv = map.get(u.id);
        if (conv) conv.partner_name = u.display_name ?? "不明";
      }
    }

    setConvs(Array.from(map.values()));
    setLoading(false);
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "たった今";
    if (diffMin < 60) return `${diffMin}分前`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}時間前`;
    return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-xs" style={{ color: "var(--color-text-muted)" }}>
            読み込み中...
          </div>
        ) : convs.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 px-4 text-center">
            <MessageSquare size={28} style={{ color: "var(--color-text-subtle)" }} />
            <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              DMなし
            </p>
            <p className="text-[11px]" style={{ color: "var(--color-text-subtle)" }}>
              グループのメンバーからDMを送れます
            </p>
          </div>
        ) : (
          convs.map((c) => (
            <button
              key={c.partner_id}
              type="button"
              onClick={() => onSelect(c.partner_id, c.partner_name)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[color:var(--color-bg)]"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <div
                className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: "var(--color-primary)" }}
              >
                {c.partner_name[0]?.toUpperCase() ?? "?"}
                {c.unread > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-0.5 text-[9px] font-bold text-white"
                    style={{ background: "var(--color-danger)" }}
                  >
                    {c.unread}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p
                    className="truncate text-xs font-semibold"
                    style={{ color: c.unread > 0 ? "var(--color-text)" : "var(--color-text)" }}
                  >
                    {c.partner_name}
                  </p>
                  <span className="shrink-0 text-[10px]" style={{ color: "var(--color-text-subtle)" }}>
                    {formatTime(c.last_at)}
                  </span>
                </div>
                <p className="truncate text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                  {c.last_body}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── DM チャット ──────────────────────────────────────────────────

function DmChat({
  userId,
  partnerId,
  partnerName,
  onBack,
}: {
  userId: string;
  partnerId: string;
  partnerName: string;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    // 初期ロード
    supabase
      .from("direct_messages")
      .select("id, from_user_id, body, created_at")
      .or(
        `and(from_user_id.eq.${userId},to_user_id.eq.${partnerId}),and(from_user_id.eq.${partnerId},to_user_id.eq.${userId})`
      )
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages((data ?? []) as DmMessage[]);
        setLoading(false);
        // 既読マーク
        supabase
          .from("direct_messages")
          .update({ read_at: new Date().toISOString() })
          .eq("from_user_id", partnerId)
          .eq("to_user_id", userId)
          .is("read_at", null)
          .then(() => {});
      });

    // リアルタイム購読
    const channel = supabase
      .channel(`dm_${userId}_${partnerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `to_user_id=eq.${userId}`,
        },
        (payload) => {
          const msg = payload.new as DmMessage;
          if (msg.from_user_id === partnerId) {
            setMessages((prev) => [...prev, msg]);
            // 既読
            supabase
              .from("direct_messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", msg.id)
              .then(() => {});
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, partnerId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    const supabase = createClient();

    const tempMsg: DmMessage = {
      id: crypto.randomUUID(),
      from_user_id: userId,
      body: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setBody("");

    const { data: inserted } = await supabase
      .from("direct_messages")
      .insert({ from_user_id: userId, to_user_id: partnerId, body: text })
      .select("id, from_user_id, body, created_at")
      .single();

    if (inserted) {
      setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? inserted : m)));
    }
    setSending(false);
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* ヘッダー */}
      <div
        className="flex h-12 shrink-0 items-center gap-2 px-3"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <button
          type="button"
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:bg-[color:var(--color-bg)]"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ChevronLeft size={16} />
        </button>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white shrink-0"
          style={{ background: "var(--color-primary)" }}
        >
          {partnerName[0]?.toUpperCase() ?? "?"}
        </div>
        <p className="truncate text-sm font-semibold" style={{ color: "var(--color-text)" }}>
          {partnerName}
        </p>
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-xs" style={{ color: "var(--color-text-muted)" }}>
            読み込み中...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
            <p className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              {partnerName}さんへの最初のメッセージ
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.from_user_id === userId;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className="max-w-[80%] rounded-2xl px-3 py-2"
                  style={{
                    background: isMine ? "var(--color-primary)" : "var(--color-bg)",
                    color: isMine ? "#fff" : "var(--color-text)",
                  }}
                >
                  <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{msg.body}</p>
                  <p
                    className="mt-0.5 text-right text-[9px] opacity-70"
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <div
        className="shrink-0 px-3 py-2.5"
        style={{ borderTop: "1px solid var(--color-border)" }}
      >
        <div
          className="flex items-end gap-2 rounded-xl px-3 py-2"
          style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
        >
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="メッセージを入力..."
            rows={1}
            className="flex-1 resize-none bg-transparent text-xs outline-none leading-relaxed"
            style={{ color: "var(--color-text)", maxHeight: 80 }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!body.trim() || sending}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition disabled:opacity-40"
            style={{ background: "var(--color-primary)", color: "#fff" }}
          >
            <Send size={11} />
          </button>
        </div>
        <p className="mt-1 text-center text-[9px]" style={{ color: "var(--color-text-subtle)" }}>
          Enter で送信 / Shift+Enter で改行
        </p>
      </div>
    </div>
  );
}
