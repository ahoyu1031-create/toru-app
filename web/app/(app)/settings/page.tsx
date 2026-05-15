import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { ensureCompany } from "@/lib/ensure-company";
import { ProfileForm } from "./profile-form";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  await ensureCompany();

  const { data: profile } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-2xl space-y-5 sm:space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-[color:var(--color-text)]">プロフィール</h1>
          <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
            グループ内での表示名を管理します
          </p>
        </div>

        <section className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-[color:var(--color-border)] sm:px-6 sm:py-4">
            <h2 className="text-base font-semibold">プロフィール</h2>
            <p className="mt-0.5 text-sm text-[color:var(--color-text-muted)]">
              グループ内でのあなたの表示名
            </p>
          </div>
          <div className="p-4 sm:p-6">
            <ProfileForm
              displayName={profile?.display_name ?? null}
              email={user.email ?? ""}
              userId={user.id}
            />
          </div>
        </section>

      </div>
    </div>
  );
}
