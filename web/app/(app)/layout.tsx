import { redirect } from "next/navigation";
import { createClient, createAdminClient, getCurrentUser } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createClient();

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
  const ownedGroupIds = (memberships ?? [])
    .filter((m: any) => m.role === "owner")
    .map((m: any) => m.group_id as string);

  // グループ名と参加申請数を並列取得（adminClientは一度だけ生成）
  let myGroups: { id: string; name: string }[] = [];
  let pendingJoinCount = 0;

  if (allGroupIds.length > 0 || ownedGroupIds.length > 0) {
    const admin = createAdminClient();
    const [groupNamesResult, joinCountResult] = await Promise.all([
      allGroupIds.length > 0
        ? admin
            .from("project_groups")
            .select("id, name")
            .in("id", allGroupIds)
            .is("deleted_at", null)
        : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      ownedGroupIds.length > 0
        ? admin
            .from("group_join_requests")
            .select("*", { count: "exact", head: true })
            .in("group_id", ownedGroupIds)
            .eq("status", "pending")
        : Promise.resolve({ count: 0 }),
    ]);
    myGroups = ((groupNamesResult.data ?? []) as any[]).map((g) => ({ id: g.id, name: g.name }));
    pendingJoinCount = (joinCountResult as { count: number | null }).count ?? 0;
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
