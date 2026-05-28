import Link from "next/link";
import { ALPHA_FORM_URL } from "@/lib/billing-mode";
import {
  BlueprintParallaxBg,
  BetaStamp,
  HeroSpotlight,
  Reveal,
  SectionHeader,
  ScrollProgress,
  DimensionLine,
} from "@/components/blueprint-motion";

export const metadata = {
  title: "TORU — 図面を投げたら、見積書が出てくる。",
  description:
    "建設業界出身の個人開発者が作る、現場のためのAI図面解析SaaS。図面PDFから材料拾い出し、見積書PDFまでワンストップ。現在ベータ期間中、全機能無料。",
};

const RAW_DATE = new Date().toISOString().slice(0, 10).replace(/-/g, ".");

/* =========================================================
   /alpha — Blueprint LP (Beta公開版・正規メインLP)
   ========================================================= */
export default function AlphaPage() {
  return (
    <div className="bp-page min-h-screen bp-grid relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bp-paper-fade" />
      <ScrollProgress />

      <Header />
      <main className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Hero />
        <Section num="SEC 01" meta="PROBLEMS / 課題提起" anchor="problems">
          <Problems />
        </Section>
        <Section num="SEC 02" meta="FLOW / 解決フロー" anchor="flow">
          <Flow />
        </Section>
        <Section num="SEC 03" meta="FEATURES / 機能仕様" anchor="features">
          <Features />
        </Section>
        <Section num="SEC 04" meta="EDGE / TORU の強み" anchor="edge">
          <Edge />
        </Section>
        <Section num="SEC 05" meta="PRICING / 料金プラン" anchor="pricing">
          <Pricing />
        </Section>
        <Section num="SEC 06" meta="ALPHA / アルファテスター枠" anchor="alpha">
          <AlphaBlock />
        </Section>
        <Section num="SEC 07" meta="FAQ / よくある質問" anchor="faq">
          <FAQ />
        </Section>
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

/* ============ Header (sticky・題箋風) ============ */
function Header() {
  return (
    <header className="sticky top-0 z-30 border-b-2 backdrop-blur-sm bg-[rgba(244,241,232,0.85)]" style={{ borderColor: "#0B3D91" }}>
      <div className="mx-auto flex max-w-6xl items-stretch justify-between" style={{ minHeight: "60px" }}>
        <Link
          href="/"
          className="flex items-center gap-3 px-5 sm:px-7 border-r-2"
          style={{ borderColor: "#0B3D91" }}
        >
          <span className="font-mono font-bold text-2xl tracking-widest" style={{ color: "#0B3D91" }}>
            TORU
          </span>
        </Link>

        <div className="hidden md:flex flex-1 items-center px-6 font-mono text-[10px] tracking-wider" style={{ color: "#0B3D91" }}>
          <span className="opacity-50 mr-2">DOC.</span>
          <span className="font-bold">TR-LP-001</span>
          <span className="mx-5 opacity-25">|</span>
          <span className="opacity-50 mr-2">REV.</span>
          <span className="font-bold">0.3 BETA</span>
          <span className="mx-5 opacity-25">|</span>
          <span className="opacity-50 mr-2">DATE</span>
          <span className="font-bold">{RAW_DATE}</span>
        </div>

        <div className="flex items-stretch">
          <Link
            href="/login"
            className="hidden sm:flex items-center px-5 border-l-2 font-mono text-xs tracking-widest hover:bg-[rgba(11,61,145,0.06)] transition"
            style={{ borderColor: "#0B3D91", color: "#0B3D91" }}
          >
            LOGIN
          </Link>
          <Link
            href="/signup"
            className="flex items-center px-5 sm:px-7 border-l-2 font-mono text-xs tracking-widest font-bold hover:opacity-90 transition"
            style={{ borderColor: "#0B3D91", background: "#0B3D91", color: "#F4F1E8" }}
          >
            START FREE →
          </Link>
        </div>
      </div>
    </header>
  );
}

/* ============ Section ラッパー（アニメ付き） ============ */
function Section({
  num,
  meta,
  anchor,
  children,
}: {
  num: string;
  meta: string;
  anchor: string;
  children: React.ReactNode;
}) {
  return (
    <section id={anchor} className="mt-24 sm:mt-32 scroll-mt-20 relative">
      <SectionHeader num={num} meta={meta} />
      <Reveal>{children}</Reveal>
    </section>
  );
}

/* ============ Hero ============ */
function Hero() {
  return (
    <section className="relative pt-12 sm:pt-20 pb-12 min-h-[80vh]">
      {/* 動く製図道具背景 */}
      <BlueprintParallaxBg />
      {/* 静的スポットライト */}
      <HeroSpotlight />
      {/* BETA スタンプ（アニメ） */}
      <BetaStamp />

      <div className="relative">
        {/* セクションヘッダ */}
        <div className="flex items-center gap-3 mb-6">
          <span className="bp-num">SEC 00</span>
          <DimensionLine maxWidth={140} />
          <span className="font-mono text-[10px] tracking-widest opacity-60" style={{ color: "#0B3D91" }}>
            PROJECT TORU
          </span>
        </div>

        {/* 大見出し */}
        <h1
          className="font-bold leading-[1.12] tracking-tight bp-rise"
          style={{
            color: "#0B3D91",
            fontSize: "clamp(2.5rem, 6vw, 4.25rem)",
          }}
        >
          図面を投げたら、<br />
          <span style={{ color: "#FF6B35" }}>見積書</span> が出てくる。
        </h1>

        <p
          className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed font-light bp-rise"
          style={{ color: "#0B3D91", animationDelay: "0.15s" }}
        >
          TORU は建設現場の図面PDFを AI が解析し、材料の拾い出しから見積書作成まで自動化する SaaS です。
          職人の手間を、AI が丸ごと引き受けます。
        </p>

        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] tracking-wider bp-rise" style={{ color: "#0B3D91", animationDelay: "0.3s" }}>
          <span><span className="opacity-50">STATUS:</span> <span className="font-bold bp-mark">BETA OPEN</span></span>
          <span><span className="opacity-50">PRICE:</span> <span className="font-bold">FREE DURING BETA</span></span>
          <span><span className="opacity-50">CARD:</span> <span className="font-bold">NOT REQUIRED</span></span>
          <span><span className="opacity-50">SIGNUP:</span> <span className="font-bold">~1 MIN</span></span>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 bp-rise" style={{ animationDelay: "0.45s" }}>
          <Link href="/signup" className="bp-cta inline-flex items-center gap-3 px-8 py-4 text-sm cursor-pointer">
            <span>無料ではじめる</span>
            <span className="font-mono">→</span>
          </Link>
          <Link href="/login" className="bp-cta-secondary inline-flex items-center gap-3 px-8 py-4 text-sm cursor-pointer">
            <span>ログイン</span>
          </Link>
        </div>

        <div
          className="mt-10 inline-flex items-center gap-3 px-4 py-2.5 font-mono text-[11px] tracking-wider bp-rise"
          style={{ border: "1.5px dashed #FF6B35", color: "#FF6B35", background: "rgba(255,107,53,0.04)", animationDelay: "0.6s" }}
        >
          <span className="font-bold">⚑ NOTICE</span>
          <span className="opacity-90" style={{ color: "#0B3D91" }}>
            現在ベータ期間中 — 全機能 無料 / クレカ不要
          </span>
        </div>
      </div>
    </section>
  );
}

/* ============ Problems ============ */
function Problems() {
  const items = [
    { num: "P.1", title: "材料拾い出しが毎日の重荷", desc: "図面を見ながら手で数えて、Excelに入力。ベテランでも半日〜丸一日かかる作業が毎回発生する。" },
    { num: "P.2", title: "帰宅後にExcelで見積作業", desc: "現場から帰って深夜に見積書を作る。フォーマットが担当者ごとにバラバラで、ミスが怖い。" },
    { num: "P.3", title: "図面・見積がLINEに散乱", desc: "グループLINEで図面を共有。どれが最新かわからず、重要なやりとりが流れて消える。" },
    { num: "P.4", title: "図面を読める職人がいない", desc: "拾い出しができるのは一部のベテランだけ。若手に引き継げず、属人化が進む一方。" },
  ];
  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: "#0B3D91" }}>
        職人の時間が、<br className="sm:hidden" />
        作業じゃないところで溶けていく。
      </h2>
      <p className="mb-10 text-sm font-light max-w-2xl" style={{ color: "#0B3D91" }}>
        建設現場で起きている、誰もが見て見ぬふりをしてきた4つの非効率。
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map(({ num, title, desc }, i) => (
          <Reveal key={num} delay={i * 0.08}>
            <div className="relative bg-white/55 p-6" style={{ border: "1.5px solid #0B3D91" }}>
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-mono font-bold text-base" style={{ color: "#FF6B35" }}>{num}</span>
                <span className="font-mono text-[9px] tracking-widest opacity-50" style={{ color: "#0B3D91" }}>PAIN POINT</span>
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: "#0B3D91" }}>{title}</h3>
              <p className="text-sm leading-relaxed font-light" style={{ color: "#0B3D91" }}>{desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </>
  );
}

/* ============ Flow ============ */
function Flow() {
  const steps = [
    { num: "01", label: "図面PDFをアップ", sub: "DRAG & DROP", desc: "図面PDFをアプリにドロップするだけ。スマホからもアップ可能。" },
    { num: "02", label: "AIが材料を拾い出す", sub: "AI ANALYSIS", desc: "業種を指定するだけで、AIが材料・数量・単位を自動抽出。" },
    { num: "03", label: "見積書PDFに変換", sub: "PDF EXPORT", desc: "単価マスタと連携して金額計算、A4印刷対応のPDFに即出力。" },
  ];
  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: "#0B3D91" }}>
        図面 → 拾い出し → 見積書。<br />
        <span style={{ color: "#FF6B35" }}>全部、ひとつのアプリで。</span>
      </h2>
      <p className="mb-10 text-sm font-light max-w-2xl" style={{ color: "#0B3D91" }}>
        これまで数時間かかっていた作業が、数分で終わる。
      </p>
      <div className="relative">
        <div className="hidden sm:block absolute left-[28px] top-12 bottom-12 w-px" style={{ background: "#0B3D91", opacity: 0.4 }} />
        <div className="space-y-6">
          {steps.map(({ num, label, sub, desc }, i) => (
            <Reveal key={num} delay={i * 0.12}>
              <div className="relative flex items-start gap-5 sm:gap-7">
                <div
                  className="relative z-10 flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center font-mono font-bold text-xl sm:text-2xl"
                  style={{ background: "#0B3D91", color: "#F4F1E8", border: "2px solid #0B3D91" }}
                >
                  {num}
                </div>
                <div className="flex-1 pt-2">
                  <div className="flex items-baseline gap-3">
                    <h3 className="text-base sm:text-lg font-bold" style={{ color: "#0B3D91" }}>{label}</h3>
                    <span className="font-mono text-[9px] tracking-widest opacity-60" style={{ color: "#FF6B35" }}>{sub}</span>
                  </div>
                  <p className="mt-1.5 text-sm font-light" style={{ color: "#0B3D91" }}>{desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </>
  );
}

/* ============ Features ============ */
function Features() {
  const features = [
    {
      num: "[01]", tag: "AI 図面解析",
      title: "AIが図面を読んで、材料を拾い出す",
      desc: "配管・電気・ダクト・建築など業種を指定するだけ。AIが必要な材料と数量を自動抽出。施工注意点や他業者との取り合い確認もまとめて。",
      bullets: ["材料・数量・単位の自動抽出", "施工上の注意事項をリスト化", "他業者との緩衝箇所を特定", "業種ごとに絞り込んで解析"],
    },
    {
      num: "[02]", tag: "単価マスタ",
      title: "会社の単価データを、クラウドで一元管理",
      desc: "自社の材料単価をクラウドに登録すれば、図面解析後に自動で金額計算。CSV で一括インポートもできるので既存データをそのまま移行。",
      bullets: ["CSV で既存データを一括インポート", "材料カテゴリで整理・検索", "解析結果と単価を自動連携", "チームで単価を共有・管理"],
    },
    {
      num: "[03]", tag: "見積書 PDF",
      title: "3タップで、プロ仕様の見積書 PDF",
      desc: "解析した材料一覧をそのまま見積書へ変換。単価マスタと連携して金額自動計算、A4印刷対応の PDF を即出力。お客様へその場で提出可能。",
      bullets: ["ワンクリックで見積書生成", "消費税込み・別途切替対応", "A4印刷対応の PDF 出力", "会社名・担当者・工事名を設定可能"],
    },
    {
      num: "[04]", tag: "チーム連携",
      title: "現場チームで、リアルタイムに共有",
      desc: "グループを作って招待コードを送るだけ。見積書・解析結果・メッセージを一カ所に集約。LINE の散らかりとお別れ。",
      bullets: ["招待コードで即参加", "グループチャットで一元化", "@メンションで確実に伝達", "見積・解析結果を全員で共有"],
    },
  ];
  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: "#0B3D91" }}>
        4つの機能仕様。
      </h2>
      <p className="mb-10 text-sm font-light max-w-2xl" style={{ color: "#0B3D91" }}>
        図面解析・単価管理・見積書出力・チーム連携の全工程をワンストップで。
      </p>
      <div className="space-y-8">
        {features.map(({ num, tag, title, desc, bullets }, i) => (
          <Reveal key={num} delay={i * 0.06}>
            <div className="relative bg-white/55 p-6 sm:p-8" style={{ border: "1.5px solid #0B3D91" }}>
              <div>
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="font-mono font-bold text-lg" style={{ color: "#FF6B35" }}>{num}</span>
                  <span className="font-mono text-[10px] tracking-widest opacity-60" style={{ color: "#0B3D91" }}>{tag}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold mb-3" style={{ color: "#0B3D91" }}>{title}</h3>
                <p className="text-sm leading-relaxed font-light mb-5" style={{ color: "#0B3D91" }}>{desc}</p>
                <ul className="space-y-1.5">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm font-light" style={{ color: "#0B3D91" }}>
                      <span className="font-mono text-xs mt-1 shrink-0" style={{ color: "#FF6B35" }}>✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </>
  );
}

/* ============ EDGE (TORU の強み / 競合差別化) ============ */
function Edge() {
  const edges = [
    {
      num: "[E.1]",
      tag: "BUILT BY THE FIELD",
      title: "建設業界出身者が、現場の言葉で作る",
      desc: "外から見た想像じゃなく、内から見た「本当に困ってる」を解く。仕様の細部に建設の現実が宿る。",
    },
    {
      num: "[E.2]",
      tag: "ALL-IN-ONE",
      title: "拾い出し → 単価 → 見積書まで、一気通貫",
      desc: "他社は「解析だけ」「見積だけ」が多い中、TORU は最初から最後まで1つのアプリで完結。アプリ間の往復ゼロ。",
    },
    {
      num: "[E.3]",
      tag: "FAST ITERATION",
      title: "個人開発のフットワーク、要望は翌週リリース",
      desc: "大手 SaaS の半年待ちではなく、「現場の声 → 翌週には機能」のサイクル。あなたの意見が即、製品になる。",
    },
    {
      num: "[E.4]",
      tag: "BUILD IN PUBLIC",
      title: "ソースコードも開発過程も、全部公開",
      desc: "GitHub で全コード閲覧可能。何が動いているか、どう作られているか、すべて透明。信頼の前提が違う。",
    },
  ];
  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: "#0B3D91" }}>
        TORU が選ばれる、<br className="sm:hidden" />
        4つの理由。
      </h2>
      <p className="mb-10 text-sm font-light max-w-2xl" style={{ color: "#0B3D91" }}>
        建設業界の SaaS は今、いくつか出てきています。その中で TORU が独自に持っている強みです。
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {edges.map(({ num, tag, title, desc }, i) => (
          <Reveal key={num} delay={i * 0.08}>
            <div
              className="relative bg-white/65 p-6 sm:p-7 h-full"
              style={{ border: "1.5px solid #0B3D91", boxShadow: "4px 4px 0 rgba(255,107,53,0.18)" }}
            >
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-mono font-bold text-base" style={{ color: "#FF6B35" }}>{num}</span>
                <span className="font-mono text-[10px] tracking-widest opacity-60" style={{ color: "#0B3D91" }}>{tag}</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold mb-3" style={{ color: "#0B3D91" }}>{title}</h3>
              <p className="text-sm leading-relaxed font-light" style={{ color: "#0B3D91" }}>{desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </>
  );
}

/* ============ Pricing ============ */
function Pricing() {
  const plans = [
    { name: "individual", price: "¥1,480", limit: "30回/月", users: "1名", group: "参加のみ", popular: false },
    { name: "team_5",     price: "¥9,800", limit: "100回/月", users: "5名まで", group: "作成・参加", popular: false },
    { name: "team_10",    price: "¥16,800", limit: "300回/月", users: "10名まで", group: "作成・参加", popular: true },
    { name: "unlimited",  price: "¥29,800", limit: "無制限", users: "無制限", group: "作成・参加", popular: false },
  ];
  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: "#0B3D91" }}>
        シンプルな料金プラン。
      </h2>
      <p className="mb-8 text-sm font-light max-w-2xl" style={{ color: "#0B3D91" }}>
        4プラン展開。1人親方から法人まで、規模に応じて選べる設計。
      </p>

      <div
        className="mb-8 p-4 font-mono text-xs tracking-wider"
        style={{ border: "1.5px dashed #FF6B35", color: "#FF6B35", background: "rgba(255,107,53,0.04)" }}
      >
        <div className="flex items-start gap-2">
          <span className="font-bold shrink-0">▼ BETA NOTICE</span>
          <span style={{ color: "#0B3D91" }} className="font-sans font-normal">
            現在ベータ期間中につき、<strong className="font-bold">全機能を無料でご利用いただけます</strong>。正式リリース後に下記の料金プランへ移行予定です。料金・プラン内容は変更の可能性があります。
          </span>
        </div>
      </div>

      <div className="overflow-x-auto" style={{ border: "2px solid #0B3D91" }}>
        <table className="w-full font-mono text-sm" style={{ background: "rgba(255,255,255,0.45)" }}>
          <thead>
            <tr className="border-b-2" style={{ borderColor: "#0B3D91" }}>
              <th className="text-left p-3 sm:p-4 font-bold text-[10px] tracking-widest" style={{ color: "#0B3D91" }}>PLAN</th>
              <th className="text-right p-3 sm:p-4 font-bold text-[10px] tracking-widest" style={{ color: "#0B3D91" }}>MONTHLY</th>
              <th className="text-right p-3 sm:p-4 font-bold text-[10px] tracking-widest hidden sm:table-cell" style={{ color: "#0B3D91" }}>ANALYSES</th>
              <th className="text-right p-3 sm:p-4 font-bold text-[10px] tracking-widest hidden md:table-cell" style={{ color: "#0B3D91" }}>USERS</th>
              <th className="text-right p-3 sm:p-4 font-bold text-[10px] tracking-widest hidden lg:table-cell" style={{ color: "#0B3D91" }}>GROUPS</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p, i) => (
              <tr key={p.name} className={i !== plans.length - 1 ? "border-b" : ""} style={{ borderColor: "rgba(11,61,145,0.25)" }}>
                <td className="p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: "#0B3D91" }}>{p.name}</span>
                    {p.popular && <span className="bp-num !text-[8px]">★ POPULAR</span>}
                  </div>
                </td>
                <td className="text-right p-3 sm:p-4 font-bold" style={{ color: "#0B3D91" }}>{p.price}<span className="opacity-50 text-[10px]"> / mo</span></td>
                <td className="text-right p-3 sm:p-4 hidden sm:table-cell" style={{ color: "#0B3D91" }}>{p.limit}</td>
                <td className="text-right p-3 sm:p-4 hidden md:table-cell" style={{ color: "#0B3D91" }}>{p.users}</td>
                <td className="text-right p-3 sm:p-4 hidden lg:table-cell" style={{ color: "#0B3D91" }}>{p.group}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs font-mono opacity-60 tracking-wider" style={{ color: "#0B3D91" }}>
        * ベータ期間中は全プランの機能を無料で利用可能。
      </p>
    </>
  );
}

/* ============ Alpha Block (再構築・先着10名と永久半額を削除) ============ */
function AlphaBlock() {
  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: "#0B3D91" }}>
        アルファテスター枠<br />
        <span className="text-base sm:text-lg font-light" style={{ color: "#FF6B35" }}>
          現場のリアルを、TORU の DNA に。
        </span>
      </h2>
      <p className="mb-10 text-sm font-light max-w-2xl" style={{ color: "#0B3D91" }}>
        ベータ利用に加えて、率直なフィードバックをくださる方を募集しています。
        あなたの意見が、TORU の進化の方向を決めます。
      </p>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Reveal delay={0}>
          <Spec
            num="[A.1]"
            title="全機能 無制限"
            meta="UNLIMITED ACCESS"
            desc="期間・回数の制限なし。図面解析・見積書作成・グループ作成すべて使い放題。"
          />
        </Reveal>
        <Reveal delay={0.08}>
          <Spec
            num="[A.2]"
            title="開発者と直接やりとり"
            meta="DIRECT LINE TO DEV"
            desc="不満・要望・新機能提案を直接連絡可能。一般ユーザーより1段深い距離で開発に関わる。"
          />
        </Reveal>
        <Reveal delay={0.16}>
          <Spec
            num="[A.3]"
            title="フィードバックが翌週リリース"
            meta="SHIPPED IN A WEEK"
            desc="個人開発の速度で、あなたの声が翌週には機能として実装。大手SaaSの半年待ちとはわけが違う。"
          />
        </Reveal>
        <Reveal delay={0.24}>
          <Spec
            num="[A.4]"
            title="新機能を一般公開前に試す"
            meta="EARLY ACCESS"
            desc="ロードマップにある新機能を、一般リリース前に先行体験。業界で誰よりも早く新しい武器を持てる。"
          />
        </Reveal>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <a href={ALPHA_FORM_URL} target="_blank" rel="noopener noreferrer" className="bp-cta-secondary inline-flex items-center gap-3 px-7 py-3 text-sm cursor-pointer">
          <span>アルファ枠に申込む</span>
          <span className="font-mono">→</span>
        </a>
        <p className="font-mono text-[11px] tracking-wider opacity-70" style={{ color: "#0B3D91" }}>
          ⊕ 約2分で申込完了 / 1〜2営業日以内に承認連絡
        </p>
      </div>
    </>
  );
}

/* ============ FAQ ============ */
function FAQ() {
  const items = [
    { q: "どんな図面に対応していますか？", a: "給排水・電気・空調・ダクト・建築・内装など、業種を問わず PDF 形式の図面に対応しています。スキャン PDF よりデジタル作成の PDF の方が精度が高くなります。" },
    { q: "AI の解析精度はどのくらいですか？", a: "高精度な大規模言語モデルを採用しており、多くの図面で高い精度を実現しています。ただし、図面の品質や複雑さによって精度は変わるため、重要な判断には担当者による確認をお願いしています。" },
    { q: "ベータ期間中は本当に無料ですか？", a: "はい、ベータ期間中は全機能を無料でご利用いただけます。正式版リリースの際には事前にご案内します。" },
    { q: "チームメンバーはどうやって追加しますか？", a: "グループを作成して招待コードを発行するだけ。メンバーはコードを入力するか、URL をクリックするだけで参加できます。" },
    { q: "既存の単価データを移行できますか？", a: "はい、CSV ファイルで一括インポートできます。現在 Excel で管理している単価データをそのまま取り込めます。" },
    { q: "スマートフォンでも使えますか？", a: "はい、iOS・Android のブラウザから全機能をご利用いただけます。" },
  ];
  return (
    <>
      <h2 className="text-2xl sm:text-3xl font-bold mb-10" style={{ color: "#0B3D91" }}>
        よくある質問
      </h2>
      <div className="space-y-3">
        {items.map(({ q, a }, i) => (
          <Reveal key={q} delay={i * 0.05}>
            <details
              className="group bg-white/55 p-5 cursor-pointer"
              style={{ border: "1.5px solid #0B3D91" }}
            >
              <summary className="list-none flex items-start gap-3">
                <span className="font-mono font-bold text-xs tracking-wider shrink-0 mt-0.5" style={{ color: "#FF6B35" }}>
                  Q.{String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-sm font-bold" style={{ color: "#0B3D91" }}>{q}</span>
                <span className="font-mono shrink-0 group-open:rotate-45 transition-transform" style={{ color: "#0B3D91" }}>+</span>
              </summary>
              <p className="mt-3 pl-12 text-sm font-light leading-relaxed" style={{ color: "#0B3D91" }}>{a}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </>
  );
}

/* ============ Final CTA ============ */
function FinalCta() {
  return (
    <section className="mt-24 sm:mt-32 mb-24 text-center">
      <div className="flex items-center gap-3 mb-10">
        <span className="bp-num">END</span>
        <DimensionLine maxWidth={9999} />
      </div>

      <Reveal>
        <p className="font-mono text-[11px] tracking-widest mb-5 opacity-70" style={{ color: "#0B3D91" }}>
          START NOW — IT'S FREE DURING BETA
        </p>
        <h2 className="text-2xl sm:text-4xl font-bold mb-10 leading-tight" style={{ color: "#0B3D91" }}>
          今すぐ始めて、<br className="sm:hidden" />
          現場の手間を減らそう。
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup" className="bp-cta inline-flex items-center gap-3 px-10 py-5 text-base cursor-pointer">
            <span>無料ではじめる</span>
            <span className="font-mono">→</span>
          </Link>
          <Link href="/login" className="bp-cta-secondary inline-flex items-center gap-3 px-10 py-5 text-base cursor-pointer">
            <span>ログイン</span>
          </Link>
        </div>
        <p className="mt-5 font-mono text-[11px] tracking-wider opacity-70" style={{ color: "#0B3D91" }}>
          クレカ不要 / 登録1分 / ベータ期間中は全機能無料
        </p>
      </Reveal>
    </section>
  );
}

/* ============ Footer ============ */
function Footer() {
  return (
    <footer className="relative border-t-2 mt-8" style={{ borderColor: "#0B3D91" }}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-5">
        <div className="bp-titleblock">
          <div className="grid grid-cols-2 sm:grid-cols-4 text-[11px]">
            <Cell label="PROJECT" value="TORU" />
            <Cell label="SHEET" value="LP-001" />
            <Cell label="SCALE" value="1 : 1" />
            <Cell label="REV." value="0.3 BETA" />
          </div>
          <div className="bp-titleblock-row px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex gap-4 flex-wrap" style={{ color: "#0B3D91" }}>
              <Link href="/" className="hover:underline">HOME</Link>
              <Link href="/signup" className="hover:underline">SIGNUP</Link>
              <Link href="/login" className="hover:underline">LOGIN</Link>
              <Link href="/privacy" className="hover:underline">PRIVACY</Link>
            </div>
            <span className="opacity-60" style={{ color: "#0B3D91" }}>
              © 2026 TORU — BUILT FOR THE FIELD
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============ Helpers ============ */
function Spec({ num, title, meta, desc }: { num: string; title: string; meta: string; desc: string; }) {
  return (
    <div className="relative bg-white/55 p-6 transition hover:bg-white/75 h-full" style={{ border: "1.5px solid #0B3D91" }}>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="font-mono font-bold text-base" style={{ color: "#FF6B35" }}>{num}</span>
        <span className="font-mono text-[9px] tracking-widest opacity-60" style={{ color: "#0B3D91" }}>{meta}</span>
      </div>
      <h3 className="text-base font-bold mb-2" style={{ color: "#0B3D91" }}>{title}</h3>
      <p className="text-sm leading-relaxed font-light" style={{ color: "#0B3D91" }}>{desc}</p>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r last:border-r-0 px-4 py-2.5 font-mono" style={{ borderColor: "#0B3D91" }}>
      <div className="text-[9px] tracking-widest opacity-60" style={{ color: "#0B3D91" }}>{label}</div>
      <div className="font-bold mt-0.5" style={{ color: "#0B3D91" }}>{value}</div>
    </div>
  );
}
