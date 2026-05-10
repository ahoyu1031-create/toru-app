import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { GroupForm } from "./group-form";

export default async function NewGroupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("plan_type").eq("id", user.id).maybeSingle();
  if ((profile?.plan_type ?? "beta") === "individual") redirect("/groups");

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/groups"
          className="flex h-8 w-8 items-center justify-center rounded-lg transition hover:opacity-80"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
        >
          <ChevronLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
            グループを作成
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            招待コードが自動生成されます
          </p>
        </div>
      </div>
      <GroupForm />
    </div>
  );
}
