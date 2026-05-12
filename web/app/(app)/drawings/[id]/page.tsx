import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DrawingResultView } from "./result-view";

export default async function DrawingAnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("drawing_analyses")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[drawings/[id]] query error:", error);
    notFound();
  }
  if (!data) notFound();

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/drawings"
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "var(--color-text-muted)" }}
          >
            <ArrowLeft size={15} />
            図面解析一覧
          </Link>
        </div>

        <div className="mb-5">
          <h1 className="text-xl font-bold leading-tight sm:text-2xl" style={{ color: "var(--color-text)" }}>
            {data.file_name}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            {data.trade} ·{" "}
            {new Date(data.created_at).toLocaleDateString("ja-JP", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <DrawingResultView
          mode={data.mode}
          result={data.result}
          allResult={data.all_result}
        />
      </div>
    </div>
  );
}
