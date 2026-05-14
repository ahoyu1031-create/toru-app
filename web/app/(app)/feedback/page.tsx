import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FeedbackForm } from "./feedback-form";
import { Sparkles } from "lucide-react";

export default async function FeedbackPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            フィードバック
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            TORUをより良くするためのご意見をお聞かせください。
          </p>
        </div>

        {/* ボーナスバナー */}
        <div
          className="mb-6 flex items-center gap-3 rounded-xl px-4 py-3"
          style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.25)" }}
        >
          <Sparkles size={16} style={{ color: "#7C3AED", flexShrink: 0 }} />
          <p className="text-sm" style={{ color: "#7C3AED" }}>
            フィードバックを送信すると、<span className="font-bold">図面解析クレジット +5回</span> が追加されます。<span className="opacity-70">（1回限り）</span>
          </p>
        </div>

        <FeedbackForm />
      </div>
    </div>
  );
}
