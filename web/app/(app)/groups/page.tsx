import { createClient, createAdminClient, getCurrentUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Plus, Hash, Crown, MessageSquare, ChevronRight, Bell, Lock } from "lucide-react";

export default async function GroupsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const { data: profile } = await supabase.from("users").select("display_name, plan_type").eq("id", user.id).maybeSingle();
  const myDisplayName = profile?.display_name ?? "";
  if (false) {
    return <GroupUpgradeWall />;
  }

  const { data: rows } = await supabase
    .from("project_group_members")
    .select("role, project_groups(*)")
    .eq("user_id", user.id);

  const groups = (rows ?? [])
    .filter((r: any) => r.project_groups && !r.project_groups.deleted_at)
    .map((r: any) => ({ ...r.project_groups, myRole: r.role }));

  const groupIds = groups.map((g: any) => g.id);

  // オーナーグループの申請数をグループ別に取得
  const ownedGroupIds = groups
    .filter((g: any) => g.myRole === "owner")
    .map((g: any) => g.id as string);

  const pendingCountMap = new Map<string, number>();
  if (ownedGroupIds.length > 0) {
    const admin = createAdminClient();
    const { data: pendingRows } = await admin
      .from("group_join_requests")
      .select("group_id")
      .in("group_id", ownedGroupIds)
      .eq("status", "pending");
    for (const row of pendingRows ?? []) {
      pendingCountMap.set(row.group_id, (pendingCountMap.get(row.group_id) ?? 0) + 1);
    }
  }

  // 各グループのメンバー数を一括取得
  const { data: memberRows } = groupIds.length > 0
    ? await supabase
        .from("project_group_members")
        .select("group_id")
        .in("group_id", groupIds)
    : { data: [] };

  const memberCountMap = new Map<string, number>();
  for (const row of memberRows ?? []) {
    memberCountMap.set(row.group_id, (memberCountMap.get(row.group_id) ?? 0) + 1);
  }

  // 各グループの最新メッセージを取得
  const { data: latestMsgs } = groupIds.length > 0
    ? await supabase
        .from("group_messages")
        .select("group_id, body, created_at, user_id")
        .in("group_id", groupIds)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(groupIds.length * 5)
    : { data: [] };

  const latestMsgMap = new Map<string, { body: string; created_at: string; isMe: boolean }>();
  for (const msg of latestMsgs ?? []) {
    if (!latestMsgMap.has(msg.group_id)) {
      latestMsgMap.set(msg.group_id, {
        body: msg.body,
        created_at: msg.created_at,
        isMe: msg.user_id === user.id,
      });
    }
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-4xl space-y-6 sm:space-y-8">

        {/* ページヘッダー */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
              グループ
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
              現場・プロジェクト単位でチームを作り、情報を共有します
            </p>
          </div>
          <Link
            href="/groups/new"
            className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 sm:w-auto sm:justify-start"
            style={{ background: "var(--color-primary)" }}
          >
            <Plus size={15} />
            グループを作成
          </Link>
        </div>

        {/* グループ一覧 or 空ステート */}
        {groups.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {groups.map((g: any) => (
              <GroupCard key={g.id} group={g} latestMsg={latestMsgMap.get(g.id) ?? null} myDisplayName={myDisplayName} memberCount={memberCountMap.get(g.id) ?? 1} pendingCount={pendingCountMap.get(g.id) ?? 0} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}

        {/* 招待コードで参加 */}
        <section
          className="rounded-2xl p-4 sm:p-6"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <h2 className="mb-1 text-base font-semibold" style={{ color: "var(--color-text)" }}>
            招待コードで参加
          </h2>
          <p className="mb-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
            グループオーナーから受け取ったコードを入力してください
          </p>
          <form
            action={async (fd: FormData) => {
              "use server";
              const code = (fd.get("code") as string)?.trim().toUpperCase();
              if (!code) return;
              redirect(`/groups/join?code=${code}`);
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div
              className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
            >
              <Hash size={15} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
              <input
                name="code"
                type="text"
                placeholder="例: TK7P2M"
                maxLength={6}
                autoComplete="off"
                className="flex-1 bg-transparent text-sm font-mono uppercase tracking-widest outline-none placeholder:normal-case placeholder:tracking-normal"
                style={{ color: "var(--color-text)" }}
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center rounded-xl px-6 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: "var(--color-primary)" }}
            >
              参加を申請する
            </button>
          </form>
        </section>

      </div>
    </div>
  );
}

/* ── 空ステート ─────────────────────────────────── */
function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl px-4 py-12 text-center sm:py-20"
      style={{ background: "var(--color-surface)", border: "2px dashed var(--color-border)" }}
    >
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: "var(--color-primary-soft)" }}
      >
        <Users size={28} style={{ color: "var(--color-primary)" }} />
      </div>
      <p className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
        まだグループがありません
      </p>
      <p className="mt-2 max-w-xs text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
        現場やプロジェクトごとにグループを作って、チームで情報を共有しましょう
      </p>
      <Link
        href="/groups/new"
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-semibold text-white transition hover:opacity-90"
        style={{ background: "var(--color-primary)" }}
      >
        <Plus size={15} />
        最初のグループを作成
      </Link>
    </div>
  );
}

/* ── グループカード ────────────────────────────── */
function GroupCard({ group, latestMsg, myDisplayName, memberCount, pendingCount }: {
  group: any;
  latestMsg: { body: string; created_at: string; isMe: boolean } | null;
  myDisplayName: string;
  memberCount: number;
  pendingCount: number;
}) {
  const isOwner = group.myRole === "owner";
  const initial = group.name[0]?.toUpperCase() ?? "G";

  const timeLabel = latestMsg
    ? (() => {
        const diff = Date.now() - new Date(latestMsg.created_at).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "たった今";
        if (mins < 60) return `${mins}分前`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}時間前`;
        return `${Math.floor(hrs / 24)}日前`;
      })()
    : null;

  const hasNew = !!(latestMsg && !latestMsg.isMe &&
    Date.now() - new Date(latestMsg.created_at).getTime() < 24 * 60 * 60 * 1000);

  const isMentioned = !!(hasNew && myDisplayName && latestMsg?.body.includes(`@${myDisplayName}`));

  return (
    <Link
      href={`/groups/${group.id}`}
      className="group flex flex-col gap-3 rounded-2xl p-5 transition hover:shadow-md"
      style={{
        background: "var(--color-surface)",
        border: `1px solid ${hasNew ? "var(--color-primary)" : "var(--color-border)"}`,
      }}
    >
      {/* 上段：アイコン + 名前 + ロール */}
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl text-base font-bold text-white"
            style={{ background: "var(--color-primary)" }}
          >
            {initial}
          </div>
          {hasNew && (
            <span
              className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2"
              style={{ background: "var(--color-primary)", borderColor: "var(--color-surface)" }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="truncate font-semibold" style={{ color: "var(--color-text)" }}>
              {group.name}
            </h3>
            {isOwner && (
              <span
                className="flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: "rgba(251,191,36,0.15)", color: "#D97706" }}
              >
                <Crown size={9} /> オーナー
              </span>
            )}
            {pendingCount > 0 && (
              <span
                className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: "rgba(249,115,22,0.12)", color: "#F97316", border: "1px solid rgba(249,115,22,0.3)" }}
              >
                <Bell size={9} />
                申請あり {pendingCount}件
              </span>
            )}
          </div>
          {latestMsg && !latestMsg.isMe ? (
            <p className="mt-0.5 text-xs font-semibold" style={{ color: "var(--color-primary)" }}>
              {isMentioned ? "あなたへのメンション" : "新規メッセージ"}
            </p>
          ) : latestMsg?.isMe ? (
            <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-subtle)" }}>
              自分が送信しました
            </p>
          ) : group.description ? (
            <p className="mt-0.5 truncate text-xs" style={{ color: "var(--color-text-muted)" }}>
              {group.description}
            </p>
          ) : null}
        </div>
        {timeLabel && (
          <span className="shrink-0 text-[10px] mt-0.5" style={{ color: hasNew ? "var(--color-primary)" : "var(--color-text-subtle)" }}>
            {timeLabel}
          </span>
        )}
      </div>

      {/* 下段：招待コード + メンバー数 + チャットボタン */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs tracking-widest shrink-0" style={{ color: "var(--color-text-subtle)" }}>
            {group.group_code}
          </span>
          <span
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >
            <Users size={10} />
            {memberCount}人
          </span>
        </div>
        <span
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition group-hover:opacity-90 shrink-0"
          style={{ background: "var(--color-primary-soft)", color: "var(--color-primary)" }}
        >
          <MessageSquare size={12} />
          チャットを開く
          <ChevronRight size={11} />
        </span>
      </div>
    </Link>
  );
}

/* ── 個人プランのアップグレード壁 ─────────────── */
function GroupUpgradeWall() {
  return (
    <div className="px-6 py-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>グループ</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            現場・プロジェクト単位でチームを作り、情報を共有します
          </p>
        </div>

        <div
          className="flex flex-col items-center rounded-2xl px-8 py-16 text-center"
          style={{ background: "var(--color-surface)", border: "2px dashed var(--color-border)" }}
        >
          <div
            className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "rgba(37,99,235,0.08)" }}
          >
            <Lock size={28} style={{ color: "var(--color-primary)" }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
            グループ機能は法人プランで利用できます
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            現在お使いの個人プランではグループ機能はご利用いただけません。
            法人プランにアップグレードすると、チームメンバーとの情報共有が可能になります。
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
            {["グループチャット", "招待コードでメンバー追加", "解析結果・見積書の共有", "@メンション通知"].map((f) => (
              <span
                key={f}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
              >
                <Lock size={11} style={{ color: "var(--color-text-subtle)" }} />
                {f}
              </span>
            ))}
          </div>

          <Link
            href="/settings/plan"
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl px-8 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "var(--color-primary)" }}
          >
            プランを確認する
          </Link>
          <p className="mt-3 text-xs" style={{ color: "var(--color-text-subtle)" }}>
            ベータ期間終了後に法人プランが利用可能になります
          </p>
        </div>
      </div>
    </div>
  );
}
