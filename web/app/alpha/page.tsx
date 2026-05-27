import Link from "next/link";
import { ALPHA_FORM_URL } from "@/lib/billing-mode";
import { TRIAL_DRAWING_LIMIT, TRIAL_DURATION_DAYS } from "@/lib/plan";

export const metadata = {
  title: "TORU アルファテスター募集 | 建設業向け図面解析",
  description:
    "建設業界向けAI図面解析アプリ TORU のアルファテスター（無料）を募集中。全機能解放、Live切替後永久半額特典あり。",
};

const RAW_DATE = new Date().toISOString().slice(0, 10).replace(/-/g, ".");

export default function AlphaPage() {
  return (
    <div className="bp-page min-h-screen bp-grid relative overflow-hidden">
      {/* 紙の四隅フェード（質感） */}
      <div className="pointer-events-none absolute inset-0 bp-paper-fade" />

      {/* ============ Title Block ヘッダー（製図用紙の題箋風） ============ */}
      <header className="relative border-b-2" style={{ borderColor: "#0B3D91" }}>
        <div
          className="mx-auto flex max-w-6xl items-stretch justify-between"
          style={{ minHeight: "64px" }}
        >
          <Link
            href="/"
            className="flex items-center gap-3 px-5 sm:px-8 border-r-2"
            style={{ borderColor: "#0B3D91" }}
          >
            <span
              className="font-mono font-bold text-2xl tracking-widest"
              style={{ color: "#0B3D91" }}
            >
              TORU
            </span>
          </Link>

          <div className="hidden sm:flex flex-1 items-center px-6 font-mono text-[11px] tracking-wider" style={{ color: "#0B3D91" }}>
            <span className="opacity-60 mr-3">DRAWING NO.</span>
            <span className="font-bold">TR-ALPHA-001</span>
            <span className="mx-6 opacity-30">|</span>
            <span className="opacity-60 mr-3">REV.</span>
            <span className="font-bold">0.1</span>
            <span className="mx-6 opacity-30">|</span>
            <span className="opacity-60 mr-3">DATE</span>
            <span className="font-bold">{RAW_DATE}</span>
          </div>

          <Link
            href="/login"
            className="flex items-center px-5 sm:px-8 border-l-2 font-mono text-xs tracking-widest hover:bg-[rgba(11,61,145,0.06)] transition"
            style={{ borderColor: "#0B3D91", color: "#0B3D91" }}
          >
            LOGIN →
          </Link>
        </div>
      </header>

      {/* ============ メイン領域（紙の本体） ============ */}
      <main className="relative mx-auto max-w-6xl px-5 sm:px-8 py-12 sm:py-20">
        {/* === ヒーロー === */}
        <section className="bp-rise relative">
          {/* セクション番号 + 寸法線 */}
          <div className="flex items-center gap-3 mb-6">
            <span className="bp-num">SEC 01</span>
            <div className="flex-1 max-w-[140px] bp-extend">
              <div className="bp-dim" />
            </div>
            <span className="font-mono text-[10px] tracking-widest opacity-60" style={{ color: "#0B3D91" }}>
              RECRUITMENT NOTICE
            </span>
          </div>

          {/* ALPHA スタンプ（右上） */}
          <div className="hidden md:block absolute -right-4 top-0 z-10">
            <div className="bp-stamp">ALPHA</div>
          </div>

          {/* 大見出し */}
          <h1
            className="font-bold leading-[1.15] tracking-tight"
            style={{
              color: "#0B3D91",
              fontSize: "clamp(2.25rem, 5.5vw, 3.75rem)",
            }}
          >
            建設現場の図面を、<br />
            <span style={{ color: "#FF6B35" }}>AI</span> に <span className="font-mono">→</span> 任せる。
          </h1>

          <p
            className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed font-light"
            style={{ color: "#0B3D91" }}
          >
            TORU は建設現場の図面PDFをAIで瞬時に解析する SaaS です。
            現在 MVP 開発中。<strong className="font-bold">無料で全機能</strong>を使っていただき、
            率直なご意見をお寄せください。
          </p>

          {/* メタ情報（製図的） */}
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] tracking-wider" style={{ color: "#0B3D91" }}>
            <span><span className="opacity-50">FEE:</span> <span className="font-bold bp-mark">FREE</span></span>
            <span><span className="opacity-50">DURATION:</span> <span className="font-bold">UNLIMITED</span></span>
            <span><span className="opacity-50">SLOTS:</span> <span className="font-bold">10 / FIRST-COME</span></span>
            <span><span className="opacity-50">APPROVAL:</span> <span className="font-bold">~2 BIZ DAYS</span></span>
          </div>

          {/* CTA */}
          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <a
              href={ALPHA_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bp-cta inline-flex items-center gap-3 px-8 py-4 text-sm cursor-pointer"
            >
              <span>申込フォームへ</span>
              <span className="font-mono">→</span>
            </a>
            <p className="font-mono text-[11px] tracking-wider opacity-70" style={{ color: "#0B3D91" }}>
              ⊕ 約2分で申込完了 / 1〜2営業日以内に承認連絡
            </p>
          </div>
        </section>

        {/* === 特典セクション === */}
        <section className="mt-24 sm:mt-32">
          <div className="flex items-center gap-3 mb-10">
            <span className="bp-num">SEC 02</span>
            <div className="flex-1 max-w-[160px]">
              <div className="bp-dim" />
            </div>
            <span className="font-mono text-[10px] tracking-widest opacity-60" style={{ color: "#0B3D91" }}>
              ALPHA TESTER BENEFITS
            </span>
          </div>

          <h2
            className="text-2xl sm:text-3xl font-bold mb-10"
            style={{ color: "#0B3D91" }}
          >
            アルファテスターの<br className="sm:hidden" />4つの特典
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <Spec
              num="[01]"
              title="全機能 無料・無制限"
              meta="UNLIMITED USAGE"
              desc={`通常は ${TRIAL_DRAWING_LIMIT}回 / ${TRIAL_DURATION_DAYS}日 の無料トライアルですが、アルファ枠は期間・回数の制限なし。図面解析・見積書作成・グループ作成すべて使い放題。`}
            />
            <Spec
              num="[02]"
              title="Live 切替後 永久半額"
              meta="FOREVER 50% OFF • FIRST 10 ONLY"
              desc="正式リリース後に有料プランへ移行する際、全プラン永久半額でご利用いただけます。早く始めた方が長く得する設計。"
            />
            <Spec
              num="[03]"
              title="開発者と直接やり取り"
              meta="DIRECT FEEDBACK CHANNEL"
              desc="使ってみての不満・要望・新機能提案を直接お送りいただけます。優先的に検討・実装します。"
            />
            <Spec
              num="[04]"
              title="1〜2営業日で承認"
              meta="QUICK APPROVAL"
              desc="フォーム送信後、内容を確認のうえ最短当日〜2営業日以内に承認メールをお送りします。承認後すぐ無制限利用開始。"
            />
          </div>
        </section>

        {/* === お願いセクション（注釈ボックス風） === */}
        <section className="mt-24 sm:mt-32">
          <div className="flex items-center gap-3 mb-10">
            <span className="bp-num">SEC 03</span>
            <div className="flex-1 max-w-[160px]">
              <div className="bp-dim" />
            </div>
            <span className="font-mono text-[10px] tracking-widest opacity-60" style={{ color: "#0B3D91" }}>
              REQUIREMENTS / NOTES
            </span>
          </div>

          <div
            className="relative bg-white/60 backdrop-blur-sm p-7 sm:p-9"
            style={{ border: "2px solid #0B3D91" }}
          >
            <div
              className="absolute -top-3 left-6 px-3 font-mono text-[10px] tracking-widest"
              style={{ background: "#F4F1E8", color: "#FF6B35" }}
            >
              ⚠ NOTES
            </div>

            <h3 className="text-lg font-bold mb-5" style={{ color: "#0B3D91" }}>
              テスター参加にあたって、お願いしたいこと
            </h3>

            <ul className="space-y-4">
              <Note num="N.1">最低 1 回は実際に図面解析または見積書作成を試してみてください。</Note>
              <Note num="N.2">
                使いにくい点・分かりづらい点・要望があればフィードバックください（メール / X DM / アプリ内フォーム、どれでも歓迎）。
              </Note>
              <Note num="N.3">
                建設業以外の方も歓迎します — 業界外視点のフィードバックも貴重です。
              </Note>
            </ul>
          </div>
        </section>

        {/* === 最下部 CTA === */}
        <section className="mt-24 sm:mt-32 text-center">
          <div className="flex items-center gap-3 mb-10">
            <span className="bp-num">END</span>
            <div className="flex-1">
              <div className="bp-dim" />
            </div>
          </div>

          <p className="font-mono text-[11px] tracking-widest mb-5 opacity-70" style={{ color: "#0B3D91" }}>
            APPLY NOW — JOIN THE EARLY 10
          </p>
          <h2 className="text-2xl sm:text-4xl font-bold mb-8 leading-tight" style={{ color: "#0B3D91" }}>
            一緒に、TORU を育ててください。
          </h2>

          <a
            href={ALPHA_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bp-cta inline-flex items-center gap-3 px-10 py-5 text-base cursor-pointer"
          >
            <span>申込フォームへ</span>
            <span className="font-mono">→</span>
          </a>
          <p className="mt-4 font-mono text-[11px] tracking-wider opacity-70" style={{ color: "#0B3D91" }}>
            既に申込済みの方は 1〜2 営業日お待ちください
          </p>
        </section>
      </main>

      {/* ============ フッター（題箋風 Title Block 下部） ============ */}
      <footer className="relative border-t-2 mt-16 sm:mt-24" style={{ borderColor: "#0B3D91" }}>
        <div className="mx-auto max-w-6xl px-5 sm:px-8 py-5">
          <div className="bp-titleblock">
            <div className="grid grid-cols-2 sm:grid-cols-4 text-[11px]">
              <Cell label="PROJECT" value="TORU" />
              <Cell label="SHEET" value="ALPHA-001" />
              <Cell label="SCALE" value="1 : 1" />
              <Cell label="REV." value="0.1" />
            </div>
            <div className="bp-titleblock-row px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <Link href="/" className="hover:underline" style={{ color: "#0B3D91" }}>
                ← TORU.HOME
              </Link>
              <span className="opacity-60" style={{ color: "#0B3D91" }}>
                © 2026 AOKI YU — BUILT FOR THE FIELD
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ============ Sub-components ============ */

function Spec({
  num,
  title,
  meta,
  desc,
}: {
  num: string;
  title: string;
  meta: string;
  desc: string;
}) {
  return (
    <div
      className="relative bg-white/55 backdrop-blur-sm p-6 sm:p-7 transition hover:bg-white/75"
      style={{ border: "1.5px solid #0B3D91" }}
    >
      <div className="flex items-baseline gap-3 mb-3">
        <span className="font-mono font-bold text-lg" style={{ color: "#FF6B35" }}>
          {num}
        </span>
        <span className="font-mono text-[10px] tracking-widest opacity-60" style={{ color: "#0B3D91" }}>
          {meta}
        </span>
      </div>
      <h3 className="text-lg sm:text-xl font-bold mb-3" style={{ color: "#0B3D91" }}>
        {title}
      </h3>
      <p className="text-sm leading-relaxed font-light" style={{ color: "#0B3D91" }}>
        {desc}
      </p>
    </div>
  );
}

function Note({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm leading-relaxed" style={{ color: "#0B3D91" }}>
      <span className="font-mono font-bold text-[11px] tracking-wider shrink-0 mt-1" style={{ color: "#FF6B35" }}>
        {num}
      </span>
      <span className="font-light">{children}</span>
    </li>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r last:border-r-0 px-4 py-2.5 font-mono" style={{ borderColor: "#0B3D91" }}>
      <div className="text-[9px] tracking-widest opacity-60" style={{ color: "#0B3D91" }}>
        {label}
      </div>
      <div className="font-bold mt-0.5" style={{ color: "#0B3D91" }}>
        {value}
      </div>
    </div>
  );
}
