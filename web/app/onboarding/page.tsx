import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./onboarding-form";
import { completeOnboarding } from "./actions";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 会社名と表示名が両方設定済みならダッシュボードへ
  const [{ data: companies }, { data: profile }] = await Promise.all([
    supabase.from("companies").select("name").limit(1),
    supabase.from("users").select("display_name").eq("id", user.id).maybeSingle(),
  ]);
  if (companies?.[0]?.name && profile?.display_name) redirect("/dashboard");

  const defaultDisplayName = profile?.display_name ?? user.email?.split("@")[0] ?? "";

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-4 py-12"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white"
            style={{ background: "var(--color-primary)" }}
          >
            T
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            TORUへようこそ！
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
            まず会社情報を設定しましょう。見積書PDFに使用されます。
          </p>
        </div>

        {/* Steps */}
        <div className="mb-6 flex items-center justify-center gap-1 text-xs overflow-x-auto">
          {[
            { label: "会社情報を入力", active: true },
            { label: "図面を解析", active: false },
            { label: "見積書を作成", active: false },
          ].map((step, i) => (
            <span key={step.label} className="flex items-center gap-1 shrink-0">
              {i > 0 && <span style={{ color: "var(--color-border)" }}>→</span>}
              <span
                className="rounded-full px-2.5 py-0.5 font-semibold"
                style={step.active
                  ? { background: "var(--color-primary)", color: "#fff" }
                  : { background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }
                }
              >
                {step.label}
              </span>
            </span>
          ))}
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl p-8 shadow-sm"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <OnboardingForm defaultDisplayName={defaultDisplayName} action={completeOnboarding} />
        </div>

        <p className="mt-4 text-center text-xs" style={{ color: "var(--color-text-subtle)" }}>
          後から設定でいつでも変更できます
        </p>

      </div>
    </div>
  );
}
