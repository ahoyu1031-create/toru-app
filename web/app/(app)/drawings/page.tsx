import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureCompany } from "@/lib/ensure-company";
import Link from "next/link";
import { FileText, Plus, Clock } from "lucide-react";

const MODE_LABELS: Record<string, string> = {
  all: "全て解析",
  materials: "材料拾い出し",
  construction_notes: "施工注意事項",
  coordination: "他業者との緩衝",
  communication: "他業者への伝達事項",
};

function parseModeLabels(mode: string): string[] {
  if (mode === "all") return ["材料拾い出し", "施工注意事項", "他業者との緩衝", "他業者への伝達事項"];
  return mode.split(",").map((m) => MODE_LABELS[m.trim()] ?? m.trim()).filter(Boolean);
}

export default async function DrawingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  await ensureCompany();

  const { data: analyses } = await supabase
    .from("drawing_analyses")
    .select("id, file_name, trade, mode, created_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="px-6 py-8">
      <div className="mx-auto w-full max-w-4xl">

        {/* ヘッダー */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>図面解析</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
              AIが現場に必要な情報を自動抽出します
            </p>
          </div>
          <Link
            href="/drawings/new"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[color:var(--color-primary-hover)] sm:justify-start"
            style={{ background: "var(--color-primary)" }}
          >
            <Plus size={16} />
            新規解析
          </Link>
        </div>

        {/* 解析履歴 */}
        {analyses && analyses.length > 0 ? (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Clock size={15} style={{ color: "var(--color-text-muted)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>
                解析履歴 {analyses.length} 件
              </span>
            </div>
            <div
              className="rounded-xl border divide-y divide-[color:var(--color-border)]"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
              {analyses.map((a) => (
                <Link
                  key={a.id}
                  href={`/drawings/${a.id}`}
                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-[color:var(--color-bg)]"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: "var(--color-primary-soft)" }}
                  >
                    <FileText size={18} style={{ color: "var(--color-primary)" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                      {a.file_name}
                    </p>
                    <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {a.trade}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {parseModeLabels(a.mode).map((label) => (
                        <span
                          key={label}
                          className="rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{ background: "var(--color-primary-soft)", color: "var(--color-primary)" }}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {new Date(a.created_at).toLocaleDateString("ja-JP", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          /* 空ステート */
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-20 text-center"
            style={{ borderColor: "var(--color-border)" }}
          >
            <span className="text-5xl mb-4">📄</span>
            <p className="text-base font-semibold" style={{ color: "var(--color-text)" }}>
              まだ解析がありません
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
              図面PDFをアップロードして最初の解析を始めましょう
            </p>
            <Link
              href="/drawings/new"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white"
              style={{ background: "var(--color-primary)" }}
            >
              <Plus size={15} />
              最初の解析を始める
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
