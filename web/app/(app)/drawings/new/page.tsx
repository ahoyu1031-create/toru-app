import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { ensureCompany } from "@/lib/ensure-company";
import { DrawingAnalyzeClient } from "../analyze-client";
import Link from "next/link";
import { ArrowLeft, Sparkles, TriangleAlert, ShieldCheck } from "lucide-react";

interface Props {
  searchParams: Promise<{ onboarding?: string }>;
}

export default async function NewDrawingPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  await ensureCompany();

  const { onboarding } = await searchParams;
  const isFirstTime = onboarding === "1";

  return (
    <div className="px-6 py-8">
      <div className="mx-auto w-full max-w-4xl">

        {/* Welcome banner for new users */}
        {isFirstTime && (
          <div
            className="mb-6 flex items-start gap-3 rounded-2xl px-5 py-4"
            style={{ background: "rgba(37,99,235,0.06)", border: "1px solid rgba(37,99,235,0.2)" }}
          >
            <Sparkles size={18} style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-primary)" }}>
                設定完了！さっそく最初の解析をしてみましょう
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                図面PDFをアップロードすると、AIが材料・数量・施工注意点を自動で抽出します。
                結果はそのまま見積書に変換できます。
              </p>
            </div>
          </div>
        )}

        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/drawings"
            className="flex items-center gap-1.5 text-sm font-medium"
            style={{ color: "var(--color-text-muted)" }}
          >
            <ArrowLeft size={15} />
            解析一覧
          </Link>
        </div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>新規図面解析</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            図面PDFをアップロードして、AIが現場に必要な情報を自動抽出します
          </p>
        </div>
        {/* AI免責・モデル説明 */}
        <div
          className="mb-6 rounded-2xl overflow-hidden"
          style={{ border: "1px solid var(--color-border)" }}
        >
          {/* 上段：AI精度について */}
          <div
            className="flex items-start gap-3 px-5 py-4"
            style={{ background: "rgba(37,99,235,0.04)", borderBottom: "1px solid var(--color-border)" }}
          >
            <ShieldCheck size={16} style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              <span className="font-semibold" style={{ color: "var(--color-text)" }}>
                材料拾い出しには高精度AIを使用しています。
              </span>
              {" "}材料・数量の抽出など費用に直結する解析には、最先端の大規模言語モデルを採用し、高い読み取り精度を実現しています。
            </p>
          </div>
          {/* 下段：免責 */}
          <div
            className="flex items-start gap-3 px-5 py-4"
            style={{ background: "rgba(251,191,36,0.04)" }}
          >
            <TriangleAlert size={16} style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }} />
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
              <span className="font-semibold" style={{ color: "#D97706" }}>
                AIによる解析結果は参考情報です。
              </span>
              {" "}図面の品質・複雑さによっては誤りや抜け漏れが生じる場合があります。
              材料数量・見積金額など重要な判断には、必ず担当者による確認・修正を行ってください。
            </p>
          </div>
        </div>

        <DrawingAnalyzeClient />
      </div>
    </div>
  );
}
