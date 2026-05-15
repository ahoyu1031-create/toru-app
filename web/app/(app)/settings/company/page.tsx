import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { ensureCompany } from "@/lib/ensure-company";
import { CompanyForm } from "../company-form";

export default async function CompanySettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const supabase = await createClient();
  await ensureCompany();

  const { data: companies } = await supabase
    .from("companies")
    .select("name, postal_code, address, tel, fax, contact_name")
    .limit(1);

  const company = companies?.[0];
  if (!company) redirect("/dashboard");

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-2xl space-y-5 sm:space-y-6">

        <div>
          <h1 className="text-2xl font-bold text-[color:var(--color-text)]">会社情報</h1>
          <p className="mt-1 text-sm text-[color:var(--color-text-muted)]">
            見積書PDF出力に使用する会社情報を設定します
          </p>
        </div>

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
