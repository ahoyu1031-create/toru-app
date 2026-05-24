import Link from "next/link";
import { Sparkles, Check, MessageCircle, Clock, Heart, ArrowRight } from "lucide-react";
import { ALPHA_FORM_URL } from "@/lib/billing-mode";
import { TRIAL_DRAWING_LIMIT, TRIAL_DURATION_DAYS } from "@/lib/plan";

export const metadata = {
  title: "TORU アルファテスター募集 | 建設業向け図面解析",
  description: "建設業界向けAI図面解析アプリ TORU のアルファテスター（無料）を募集中。全機能解放、Live切替後永久半額特典あり。",
};

export default function AlphaPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      {/* Top nav */}
      <header
        className="border-b"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight"
            style={{ color: "var(--color-text)" }}
          >
            TORU
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium underline-offset-4 hover:underline"
            style={{ color: "var(--color-text-muted)" }}
          >
            ログイン
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Hero */}
        <section className="text-center">
          <div
            className="mx-auto inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
            style={{ background: "rgba(245,158,11,0.12)", color: "#B45309" }}
          >
            <Sparkles size={14} />
            アルファテスター募集中
          </div>
          <h1
            className="mt-5 text-3xl font-bold leading-tight sm:text-4xl"
            style={{ color: "var(--color-text)" }}
          >
            TORU を一緒に育ててくださる方を<br className="hidden sm:block" />募集しています
          </h1>
          <p
            className="mx-auto mt-4 max-w-xl text-sm sm:text-base"
            style={{ color: "var(--color-text-muted)" }}
          >
            建設現場の図面PDFをAIで瞬時に解析する TORU は現在 MVP 開発中です。
            無料で全機能を使っていただき、ご意見・改善点を教えてください。
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <a
              href={ALPHA_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-sm transition hover:opacity-90 cursor-pointer"
              style={{ background: "var(--color-primary)", color: "#fff" }}
            >
              申込フォームへ
              <ArrowRight size={16} />
            </a>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              所要時間 約2分 / 1〜2営業日以内に承認のご連絡をいたします
            </p>
          </div>
        </section>

        {/* Benefits */}
        <section className="mt-16">
          <h2
            className="mb-6 text-center text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--color-text-muted)" }}
          >
            アルファテスター 特典
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <BenefitCard
              icon={<Check size={18} />}
              title="全機能 無料・無制限"
              desc={`通常は ${TRIAL_DRAWING_LIMIT}回 / ${TRIAL_DURATION_DAYS}日 の無料トライアルですが、アルファ枠は期間/回数の制限なし。図面解析・見積書作成・グループ作成すべて使い放題。`}
            />
            <BenefitCard
              icon={<Heart size={18} />}
              title="Live 切替後 永久半額（先着10名）"
              desc="正式リリース後に有料プランへ移行する際、全プラン永久半額でご利用いただけます。早く始めた方が長く得する設計。"
            />
            <BenefitCard
              icon={<MessageCircle size={18} />}
              title="開発者と直接やり取り"
              desc="使ってみての不満・要望・新機能提案を直接お送りいただけます。優先的に検討・実装します。"
            />
            <BenefitCard
              icon={<Clock size={18} />}
              title="1〜2営業日で承認"
              desc="フォーム送信後、内容を確認のうえ最短当日〜2営業日以内に承認メールをお送りします。承認後すぐ無制限利用開始。"
            />
          </div>
        </section>

        {/* Conditions */}
        <section
          className="mt-12 rounded-2xl p-6 sm:p-8"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <h2 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
            お願いしたいこと
          </h2>
          <ul className="mt-3 space-y-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
            <li className="flex items-start gap-2">
              <Check size={16} className="mt-0.5 shrink-0" style={{ color: "var(--color-primary)" }} />
              <span>最低1回は実際に図面解析または見積書作成を試してみてください</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={16} className="mt-0.5 shrink-0" style={{ color: "var(--color-primary)" }} />
              <span>使いにくい点・分かりづらい点・要望があればフィードバックください（メール/X DM/アプリ内フォームどれでもOK）</span>
            </li>
            <li className="flex items-start gap-2">
              <Check size={16} className="mt-0.5 shrink-0" style={{ color: "var(--color-primary)" }} />
              <span>建設業以外の方も歓迎します（業界外視点のフィードバックも貴重です）</span>
            </li>
          </ul>
        </section>

        {/* Bottom CTA */}
        <section className="mt-12 text-center">
          <a
            href={ALPHA_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-sm transition hover:opacity-90 cursor-pointer"
            style={{ background: "var(--color-primary)", color: "#fff" }}
          >
            申込フォームへ
            <ArrowRight size={16} />
          </a>
          <p
            className="mt-3 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            既に申込済みの方は1〜2営業日お待ちください
          </p>
        </section>

        {/* Footer */}
        <footer
          className="mt-16 border-t pt-6 text-center text-xs"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
        >
          <Link href="/" className="hover:underline">
            ← TORU ホームに戻る
          </Link>
        </footer>
      </main>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: "rgba(37,99,235,0.1)", color: "var(--color-primary)" }}
        >
          {icon}
        </span>
        <h3 className="text-sm font-bold" style={{ color: "var(--color-text)" }}>
          {title}
        </h3>
      </div>
      <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
        {desc}
      </p>
    </div>
  );
}
