import { createClient, createAdminClient, getCurrentUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Hash, AlertCircle, Clock } from "lucide-react";
import { joinGroupByCode } from "../actions";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ code?: string; error?: string; pending?: string }>;
}

export default async function GroupJoinPage({ searchParams }: Props) {
  const { code, error: paramError, pending: pendingParam } = await searchParams;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();


  if (!code) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <div className="text-center">
          <AlertCircle size={40} className="mx-auto mb-4" style={{ color: "var(--color-text-muted)" }} />
          <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>招待コードがありません</p>
          <Link href="/groups" className="mt-4 inline-block text-sm" style={{ color: "var(--color-primary)" }}>
            グループ一覧へ
          </Link>
        </div>
      </div>
    );
  }

  const normalized = code.toUpperCase().trim();

  const admin = createAdminClient();
  const { data: group } = await admin
    .from("project_groups")
    .select("id, name, description, trust_level")
    .eq("group_code", normalized)
    .is("deleted_at", null)
    .maybeSingle();

  if (!group) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <div
          className="w-full max-w-sm rounded-2xl p-8 text-center"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <AlertCircle size={40} className="mx-auto mb-4" style={{ color: "var(--color-danger)" }} />
          <h1 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>グループが見つかりません</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
            コード <span className="font-mono font-bold">{normalized}</span> に一致するグループはありません。
          </p>
          <Link
            href="/groups"
            className="mt-6 inline-flex h-10 items-center rounded-xl px-6 text-sm font-semibold text-white"
            style={{ background: "var(--color-primary)" }}
          >
            グループ一覧へ
          </Link>
        </div>
      </div>
    );
  }

  // 既にメンバーなら即リダイレクト
  const { data: existing } = await supabase
    .from("project_group_members")
    .select("role")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) redirect(`/groups/${group.id}`);

  // ① URLに pending=1 が付いている → アクションが「既に申請済み or 申請成功」と判断してリダイレクトしてきた
  // ② DBを直接確認（adminで確実に取得）
  const { data: pendingReq } = await admin
    .from("group_join_requests")
    .select("status")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const isPending = pendingParam === "1" || pendingReq?.status === "pending";
  const isRejected = false; // 拒否後も再申請可能なのでエラー表示しない

  // 承認待ち画面
  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-20">
        <div
          className="w-full max-w-sm rounded-2xl overflow-hidden text-center"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <div style={{ height: "4px", background: "var(--color-warning)" }} />
          <div className="p-8">
            <Clock size={40} className="mx-auto mb-4" style={{ color: "var(--color-warning)" }} />
            <h1 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>承認待ちです</h1>
            <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
              <span className="font-semibold">{group.name}</span> への参加申請を送信しました。
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
              グループオーナーが承認するとチャットに参加できます。
            </p>
            <Link
              href="/groups"
              className="mt-6 inline-flex h-10 items-center rounded-xl px-6 text-sm font-semibold"
              style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
            >
              グループ一覧へ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { count: memberCount } = await supabase
    .from("project_group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", group.id);

  const initial = group.name[0]?.toUpperCase() ?? "G";

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-20">
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div style={{ height: "4px", background: "var(--color-primary)" }} />

        <div className="p-8">
          <div className="flex flex-col items-center text-center gap-3 mb-6">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-sm"
              style={{ background: "var(--color-primary)" }}
            >
              {initial}
            </div>
            <div>
              <h1 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>{group.name}</h1>
              {group.description && (
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>{group.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
              <span className="flex items-center gap-1"><Users size={12} />{memberCount ?? "?"}人のメンバー</span>
              <span className="flex items-center gap-1"><Hash size={12} />{normalized}</span>
            </div>
          </div>

          <p className="mb-4 rounded-xl px-4 py-3 text-center text-sm" style={{ background: "var(--color-bg)", color: "var(--color-text-muted)" }}>
            参加するにはオーナーの承認が必要です。
            申請を送ると、オーナーが承認次第チャットに参加できます。
          </p>

          {/* エラー表示 */}
          {(paramError || isRejected) && (
            <div className="mb-4 rounded-xl px-4 py-3 text-sm text-center" style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "var(--color-danger)" }}>
              {isRejected ? "この申請は拒否されました。オーナーにご連絡ください。" : paramError}
            </div>
          )}

          <form
            action={async () => {
              "use server";
              const result = await joinGroupByCode(normalized);
              if ("alreadyMember" in result) {
                redirect(`/groups/${group.id}`);
              } else if ("pending" in result) {
                redirect(`/groups/join?code=${normalized}&pending=1`);
              } else if ("error" in result) {
                redirect(`/groups/join?code=${normalized}&error=${encodeURIComponent(result.error)}`);
              }
            }}
          >
            <button
              type="submit"
              className="w-full cursor-pointer rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: "var(--color-primary)" }}
            >
              参加を申請する
            </button>
          </form>

          <Link
            href="/groups"
            className="mt-3 block text-center text-sm transition hover:opacity-80"
            style={{ color: "var(--color-text-muted)" }}
          >
            キャンセル
          </Link>
        </div>
      </div>
    </div>
  );
}
