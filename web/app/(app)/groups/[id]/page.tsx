import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { GroupDetailClient } from "./group-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GroupDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("project_groups")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!group) notFound();

  const { data: myMembership } = await supabase
    .from("project_group_members")
    .select("role")
    .eq("group_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myMembership) redirect("/groups");

  const isOwner = myMembership.role === "owner";

  const { data: myProfile } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const myDisplayName = myProfile?.display_name ?? user.email?.split("@")[0] ?? "自分";

  const { createAdminClient } = await import("@/lib/supabase/server");
  const admin = createAdminClient();

  const [{ data: rawMembers }, { data: rawMessages }, { data: rawJoinRequests }, { data: rawFiles }] = await Promise.all([
    // user_id は auth.users 参照のため users join 不可 → user_id/role のみ取得
    supabase
      .from("project_group_members")
      .select("user_id, role")
      .eq("group_id", id),
    supabase
      .from("group_messages")
      .select("id, group_id, user_id, body, created_at")
      .eq("group_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(100),
    isOwner
      ? admin
          .from("group_join_requests")
          .select("id, user_id, status, created_at")
          .eq("group_id", id)
          .eq("status", "pending")
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    admin
      .from("group_files")
      .select("id, original_name, mime_type, file_size, created_at, user_id")
      .eq("group_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  // メンバー・申請者の表示名を public.users から一括取得
  const allUserIds = [
    ...new Set([
      ...(rawMembers ?? []).map((m: any) => m.user_id),
      ...(rawJoinRequests ?? []).map((r: any) => r.user_id),
    ]),
  ];
  const { data: profileRows } = allUserIds.length > 0
    ? await admin.from("users").select("id, display_name").in("id", allUserIds)
    : { data: [] };
  const profileMap = new Map((profileRows ?? []).map((u: any) => [u.id, u.display_name as string | null]));

  const members = (rawMembers ?? []).map((m: any) => ({
    user_id: m.user_id,
    role: m.role,
    users: { display_name: profileMap.get(m.user_id) ?? null },
  }));

  const joinRequests = (rawJoinRequests ?? []).map((r: any) => ({
    id: r.id,
    user_id: r.user_id,
    display_name: profileMap.get(r.user_id) ?? "名前未設定",
    created_at: r.created_at,
  }));

  return (
    <GroupDetailClient
      group={{
        id,
        name: group.name,
        group_code: group.group_code,
        trust_level: group.trust_level,
      }}
      currentUserId={user.id}
      myDisplayName={myDisplayName}
      isOwner={isOwner}
      members={members}
      initialMessages={rawMessages ?? []}
      joinRequests={joinRequests}
      initialFiles={rawFiles ?? []}
    />
  );
}
