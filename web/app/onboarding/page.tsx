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
    <div className="bp-page bp-grid relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bp-paper-fade" />
      <div className="relative w-full max-w-lg">

        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="bp-code mb-1 text-sm font-bold" style={{ color: "#FF6B35" }}>
            SETUP / 初期設定
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#0B3D91" }}>
            TORUへようこそ
          </h1>
          <p className="mt-1.5 text-sm" style={{ color: "rgba(11,61,145,0.7)" }}>
            まず会社情報を設定しましょう。見積書PDFに使用されます。
          </p>
        </div>

        {/* Steps */}
        <div className="mb-6 flex items-center justify-center gap-1.5 overflow-x-auto text-xs">
          {[
            { label: "01 会社情報", active: true },
            { label: "02 図面を解析", active: false },
            { label: "03 見積書を作成", active: false },
          ].map((step, i) => (
            <span key={step.label} className="flex shrink-0 items-center gap-1.5">
              {i > 0 && <span style={{ color: "rgba(11,61,145,0.4)" }}>—</span>}
              <span
                className="bp-code px-2.5 py-1 font-bold"
                style={step.active
                  ? { background: "#0B3D91", color: "#F4F1E8" }
                  : { border: "1px solid rgba(11,61,145,0.4)", color: "rgba(11,61,145,0.6)" }
                }
              >
                {step.label}
              </span>
            </span>
          ))}
        </div>

        {/* Form card */}
        <div className="border-2 bg-[rgba(255,255,255,0.6)] p-7 sm:p-9" style={{ borderColor: "#0B3D91" }}>
          <OnboardingForm defaultDisplayName={defaultDisplayName} action={completeOnboarding} />
        </div>

        <p className="mt-4 text-center text-xs" style={{ color: "rgba(11,61,145,0.55)" }}>
          後から設定でいつでも変更できます
        </p>

      </div>
    </div>
  );
}
