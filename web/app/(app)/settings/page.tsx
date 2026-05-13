import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureCompany } from "@/lib/ensure-company";
import { CompanyForm } from "./company-form";
import { ProfileForm } from "./profile-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await ensureCompany();

  const [{ data: companies }, { data: profile }] = await Promise.all([
    supabase.from("companies").select("name, postal_code, address, tel, fax, contact_name"),
    supabase.from("users").select("display_name").eq("id", user.id).single(),
  ]);

  const company = companies?.[0];
  if (!company) redirect("/dashboard");

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-2xl space-y-5 sm:space-y-6">

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--color-text)]">設定</h1>
          <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
            プロフィール・会社情報の管理
          </p>
        </div>

        {/* プロフィール */}
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

        {/* 会社情報 */}
        <section className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-sm overflow-hidden">
          <div className="flex flex-col gap-1 px-4 py-3 border-b border-[color:var(--color-border)] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
            <h2 className="text-base font-semibold">会社情報</h2>
            <span className="text-xs text-[color:var(--color-text-muted)]">※ 見積書PDF出力に使用</span>
          </div>
          <div className="p-4 sm:p-6">
            <CompanyForm company={company} />
          </div>
        </section>

      </div>
    </div>
  );
}
