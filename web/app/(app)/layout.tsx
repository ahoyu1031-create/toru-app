import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: companies }, { data: memberships }] = await Promise.all([
    supabase.from("users").select("display_name").eq("id", user.id).maybeSingle(),
    supabase.from("companies").select("name, plan").limit(1),
    supabase.from("project_group_members").select("group_id, role").eq("user_id", user.id),
  ]);

  // 会社・表示名が未設定の新規ユーザーはオンボーディングへ
  if (!companies?.length || !profile?.display_name) redirect("/onboarding");

  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "ゲスト";
  const email = user.email ?? "";
  const plan = companies?.[0]?.plan ?? "individual";

  const allGroupIds = (memberships ?? []).map((m: any) => m.group_id as string);

  // グループ名を adminClient で取得（RLS 回避）
  let myGroups: { id: string; name: string }[] = [];
  if (allGroupIds.length > 0) {
    const admin = createAdminClient();
    const { data: groupRows } = await admin
      .from("project_groups")
      .select("id, name")
      .in("id", allGroupIds)
      .is("deleted_at", null);
    myGroups = (groupRows ?? []).map((g: any) => ({ id: g.id, name: g.name }));
  }

  // オーナーのグループへの承認待ち申請数を取得
  let pendingJoinCount = 0;
  const ownedGroupIds = (memberships ?? [])
    .filter((m: any) => m.role === "owner")
    .map((m: any) => m.group_id as string);
  if (ownedGroupIds.length > 0) {
    const admin = createAdminClient();
    const { count } = await admin
      .from("group_join_requests")
      .select("*", { count: "exact", head: true })
      .in("group_id", ownedGroupIds)
      .eq("status", "pending");
    pendingJoinCount = count ?? 0;
  }

  return (
    <AppShell
      displayName={displayName}
      email={email}
      plan={plan}
      userId={user.id}
      pendingJoinCount={pendingJoinCount}
      myGroups={myGroups}
    >
      {children}
    </AppShell>
  );
}
