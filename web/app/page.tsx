import Link from "next/link";
import {
  ArrowRight, Check, Clock, FileText, Users,
  Zap, Building2, ScanLine,
  Database, Sparkles, BarChart3
} from "lucide-react";
import { ScrollReveal } from "@/components/scroll-reveal";
import { HeroDemo } from "@/components/hero-demo";

/* ── ナビゲーション ─────────────────────────────────── */
function Nav() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
      style={{
        background: "rgba(10,16,28,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-white"
          style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
        >
          T
        </div>
        <span className="text-base font-bold tracking-wider text-white">TORU</span>
      </div>
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-sm font-medium transition-opacity hover:opacity-70"
          style={{ color: "#94A3B8" }}
        >
          ログイン
        </Link>
        <Link
          href="/signup"
          className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: "#F97316" }}
        >
          無料で始める
        </Link>
      </div>
    </header>
  );
}

/* ── ヒーロー ──────────────────────────────────────── */
function Hero() {
  return (
    <section
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-28 text-center"
      style={{ background: "#0A101C" }}
    >
      {/* Grid texture */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Blue glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.07] blur-[100px]"
        style={{ background: "#2563EB" }}
      />
      {/* Orange glow bottom */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full opacity-[0.06] blur-[80px]"
        style={{ background: "#F97316" }}
      />

      {/* ── コンテンツ：順番に登場 ── */}
      <div className="relative max-w-3xl">
        {/* 1: バッジ */}
        <span
          className="lp-hero mb-8 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
          style={{
            animationDelay: "0ms",
            background: "rgba(37,99,235,0.12)",
            border: "1px solid rgba(59,130,246,0.3)",
            color: "#60A5FA",
          }}
        >
          <Zap size={10} />
          建設現場向け AI 業務効率化ツール
        </span>

        {/* 2: 見出し */}
        <h1
          className="lp-hero text-5xl font-black leading-[1.12] tracking-tight text-white sm:text-6xl md:text-7xl"
          style={{ animationDelay: "130ms" }}
        >
          図面を投げたら、
          <br />
          <span style={{ color: "#F97316" }}>見積書が出てくる。</span>
        </h1>

        {/* 3: サブテキスト */}
        <p
          className="lp-hero mt-7 text-lg leading-relaxed sm:text-xl"
          style={{ animationDelay: "270ms", color: "#64748B" }}
        >
          材料の拾い出しから積算・見積書作成まで。
          <br className="hidden sm:block" />
          職人の手間を、AIが丸ごと引き受ける。
        </p>

        {/* 4: CTA */}
        <div
          className="lp-hero mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
          style={{ animationDelay: "400ms" }}
        >
          <Link
            href="/signup"
            className="lp-glow-btn inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl px-8 text-base font-bold text-white transition-opacity hover:opacity-90 sm:w-auto"
            style={{ background: "#F97316" }}
          >
            無料ではじめる
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-14 w-full items-center justify-center rounded-xl px-8 text-base font-semibold transition-opacity hover:opacity-80 sm:w-auto"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#94A3B8",
            }}
          >
            ログインして使う
          </Link>
        </div>

        {/* 5: 補足 */}
        <p
          className="lp-hero mt-5 text-xs"
          style={{ animationDelay: "520ms", color: "#334155" }}
        >
          ベータ期間中は無料 · クレジットカード不要 · 登録1分
        </p>
      </div>

      {/* 6: アニメーションデモ（一番最後） */}
      <div
        className="lp-hero relative mt-16 w-full max-w-2xl"
        style={{ animationDelay: "680ms" }}
      >
        <HeroDemo />
      </div>
    </section>
  );
}

/* ── 課題提起（スクロールでスタガード登場） ────────── */
function Problems() {
  const pains = [
    {
      icon: Clock,
      title: "材料の拾い出しが毎日の重荷",
      desc: "図面を見ながら手で数えて、Excelに入力。ベテランでも半日〜丸一日かかる作業が毎回発生する。",
    },
    {
      icon: FileText,
      title: "帰宅後にExcelで見積作業",
      desc: "現場から帰って深夜に見積書を作る。フォーマットが担当者ごとにバラバラで、ミスが怖い。",
    },
    {
      icon: Users,
      title: "見積・結果・情報がLINEに散乱",
      desc: "グループLINEで図面を共有。どれが最新かわからず、重要なやりとりが流れて消える。",
    },
    {
      icon: Building2,
      title: "図面を読める職人が現場にいない",
      desc: "拾い出しができるのは一部のベテランだけ。若手に引き継げず、属人化が進む一方。",
    },
  ];

  return (
    <section className="px-6 py-24" style={{ background: "#0F172A" }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#F97316" }}>PROBLEM</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
            職人の時間が、<br className="sm:hidden" />
            作業じゃないところで溶けていく。
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pains.map(({ icon: Icon, title, desc }, i) => (
            <ScrollReveal key={title} delay={i * 90}>
              <div
                className="h-full rounded-2xl p-6"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: "rgba(239,68,68,0.1)" }}
                >
                  <Icon size={20} style={{ color: "#EF4444" }} />
                </div>
                <h3 className="mb-2 text-sm font-bold leading-snug" style={{ color: "#E2E8F0" }}>{title}</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#475569" }}>{desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── ソリューション ─────────────────────────────────── */
function Solution() {
  const steps = [
    { num: "01", label: "図面PDFをアップ", sub: "ドラッグ＆ドロップで完了" },
    { num: "02", label: "AIが材料を拾い出す", sub: "品名・数量・単位を自動抽出" },
    { num: "03", label: "見積書PDFに変換", sub: "単価マスタと連携して即出力" },
  ];

  return (
    <section className="px-6 py-24" style={{ background: "#060D18" }}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-14 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#2563EB" }}>SOLUTION</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-white sm:text-4xl">
            図面 → 拾い出し → 見積書PDF。
            <br />
            <span style={{ color: "#60A5FA" }}>全部、ひとつのアプリで。</span>
          </h2>
          <p className="mt-4 text-base" style={{ color: "#475569" }}>
            これまで数時間かかっていた作業が、数分で終わる。
          </p>
        </div>

        <div className="relative">
          <div
            className="absolute left-8 top-10 hidden h-[calc(100%-5rem)] w-px sm:block"
            style={{ background: "linear-gradient(to bottom, #2563EB, #F97316)" }}
          />
          <div className="space-y-8">
            {steps.map(({ num, label, sub }) => (
              <div key={num} className="flex items-start gap-6">
                <div
                  className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-black text-white"
                  style={{
                    background: "linear-gradient(135deg, #1E3A8A, #2563EB)",
                    boxShadow: "0 4px 20px rgba(37,99,235,0.3)",
                  }}
                >
                  {num}
                </div>
                <div className="flex-1 pt-3">
                  <p className="text-lg font-bold text-white">{label}</p>
                  <p className="mt-0.5 text-sm" style={{ color: "#64748B" }}>{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── AI解析機能（統計カードがスクロールで登場） ────── */
function AiSection() {
  const stats = [
    { value: "42+", label: "対応材料カテゴリ" },
    { value: "数分", label: "平均解析時間" },
    { value: "4種", label: "解析モード" },
  ];

  return (
    <section className="px-6 py-24" style={{ background: "#0A101C" }}>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "rgba(37,99,235,0.15)" }}
              >
                <ScanLine size={18} style={{ color: "#60A5FA" }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#60A5FA" }}>
                AI 図面解析
              </span>
            </div>
            <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">
              AIが、図面を読んで
              <br />
              材料を拾い出す。
            </h2>
            <p className="mt-5 text-base leading-relaxed" style={{ color: "#64748B" }}>
              配管・電気・ダクト・建築など業種を指定するだけ。
              AIが必要な材料と数量を自動で抽出します。
              施工注意点や他業者との取り合い確認もまとめて。
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "材料・数量・単位の自動抽出",
                "施工上の注意事項をリスト化",
                "他業者との緩衝箇所を特定",
                "業種ごとに絞り込んで解析",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm" style={{ color: "#94A3B8" }}>
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(37,99,235,0.15)" }}
                  >
                    <Check size={11} style={{ color: "#60A5FA" }} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          {/* 統計カード：スクロールでスタガード */}
          <div className="flex flex-col gap-4 lg:w-72">
            {stats.map(({ value, label }, i) => (
              <ScrollReveal key={label} delay={i * 110}>
                <div
                  className="rounded-2xl p-6"
                  style={{
                    background: "rgba(37,99,235,0.05)",
                    border: "1px solid rgba(37,99,235,0.15)",
                  }}
                >
                  <p className="text-4xl font-black" style={{ color: "#60A5FA" }}>{value}</p>
                  <p className="mt-1 text-sm" style={{ color: "#475569" }}>{label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 単価マスタ ────────────────────────────────────── */
function UnitPriceSection() {
  return (
    <section className="px-6 py-24" style={{ background: "#0F172A" }}>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-12 lg:flex-row-reverse lg:items-center lg:gap-16">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "rgba(5,150,105,0.15)" }}
              >
                <Database size={18} style={{ color: "#34D399" }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#34D399" }}>
                単価マスタ
              </span>
            </div>
            <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">
              会社の資産。
              <br />
              クラウドで一元管理。
            </h2>
            <p className="mt-5 text-base leading-relaxed" style={{ color: "#64748B" }}>
              自社の材料単価をクラウドに登録すれば、
              図面解析後に自動で金額計算。CSVで一括インポートもできるので
              既存データをそのまま移行できます。
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "CSVで既存単価データを一括インポート",
                "材料カテゴリで整理・検索",
                "解析結果と単価を自動連携",
                "チームで単価を共有・管理",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm" style={{ color: "#94A3B8" }}>
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(5,150,105,0.15)" }}
                  >
                    <Check size={11} style={{ color: "#34D399" }} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="overflow-hidden rounded-2xl lg:w-80"
            style={{
              background: "#111827",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
            }}
          >
            <div
              className="px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0F172A" }}
            >
              <p className="text-xs font-semibold text-white">単価マスタ</p>
            </div>
            <div className="space-y-2 p-4">
              {[
                { name: "ガス管 25A", price: "¥200/m", cat: "給水" },
                { name: "塩ビ管 VP50", price: "¥450/m", cat: "排水" },
                { name: "エルボ 25A", price: "¥120/個", cat: "給水" },
                { name: "止水栓 20A", price: "¥1,800/個", cat: "給水" },
              ].map(({ name, price, cat }) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-lg px-3 py-2"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#E2E8F0" }}>{name}</p>
                    <p className="text-[10px]" style={{ color: "#475569" }}>{cat}</p>
                  </div>
                  <span className="text-xs font-bold" style={{ color: "#34D399" }}>{price}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 見積書PDF ──────────────────────────────────────── */
function QuoteSection() {
  return (
    <section className="px-6 py-24" style={{ background: "#060D18" }}>
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex-1">
            <div className="mb-3 flex items-center gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: "rgba(249,115,22,0.12)" }}
              >
                <FileText size={18} style={{ color: "#FB923C" }} />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#FB923C" }}>
                見積書作成
              </span>
            </div>
            <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">
              3タップで、
              <br />
              プロ仕様の見積書PDF。
            </h2>
            <p className="mt-5 text-base leading-relaxed" style={{ color: "#64748B" }}>
              解析した材料一覧をそのまま見積書へ変換。
              単価マスタと連携して金額を自動計算し、
              A4印刷対応のPDFを即出力。
              お客様へその場で提出できます。
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "解析結果から見積書をワンクリック生成",
                "消費税込み・別途 切り替え対応",
                "A4印刷対応のPDF出力",
                "会社名・担当者・工事名を設定可能",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm" style={{ color: "#94A3B8" }}>
                  <div
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                    style={{ background: "rgba(249,115,22,0.12)" }}
                  >
                    <Check size={11} style={{ color: "#FB923C" }} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div
            className="overflow-hidden rounded-2xl lg:w-80"
            style={{
              background: "#fff",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            }}
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid #E2E8F0" }}>
              <p className="text-xs font-black tracking-wider" style={{ color: "#0F172A" }}>TORU</p>
              <p className="text-[10px]" style={{ color: "#94A3B8" }}>御見積書</p>
            </div>
            <div className="p-5">
              <div className="mb-4">
                <p className="text-xs font-bold" style={{ color: "#0F172A" }}>○○建設株式会社 御中</p>
                <p className="text-[10px]" style={{ color: "#94A3B8" }}>工事名：1F給排水設備工事</p>
              </div>
              <div className="overflow-hidden rounded-lg" style={{ border: "1px solid #E2E8F0" }}>
                <div
                  className="grid grid-cols-3 px-3 py-1.5 text-[10px] font-semibold"
                  style={{ background: "#F8FAFC", color: "#64748B" }}
                >
                  <span>品目</span><span className="text-center">数量</span><span className="text-right">金額</span>
                </div>
                {[
                  ["ガス管 25A", "12m", "¥2,400"],
                  ["エルボ 25A", "8個", "¥960"],
                  ["バルブ 25A", "2個", "¥3,600"],
                ].map(([name, qty, price]) => (
                  <div
                    key={name}
                    className="grid grid-cols-3 px-3 py-2 text-[10px]"
                    style={{ borderTop: "1px solid #F1F5F9", color: "#334155" }}
                  >
                    <span>{name}</span><span className="text-center">{qty}</span><span className="text-right">{price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "#FFF7ED" }}>
                <span className="text-xs font-bold" style={{ color: "#0F172A" }}>合計（税込）</span>
                <span className="text-sm font-black" style={{ color: "#F97316" }}>¥47,200</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── チーム連携 ─────────────────────────────────────── */
function TeamSection() {
  return (
    <section className="px-6 py-24" style={{ background: "#0A101C" }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-14 text-center">
          <div className="mb-3 inline-flex items-center gap-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "rgba(139,92,246,0.12)" }}
            >
              <Users size={18} style={{ color: "#A78BFA" }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#A78BFA" }}>チーム連携</span>
          </div>
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            現場チームで、リアルタイムに共有。
          </h2>
          <p className="mt-4 text-base" style={{ color: "#64748B" }}>
            グループを作って招待コードを送るだけ。<br />
            見積書・解析結果・メッセージを一カ所に集める。
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Sparkles,
              color: "#A78BFA",
              bg: "rgba(139,92,246,0.08)",
              title: "招待コードで即参加",
              desc: "URLかコードを共有するだけ。アプリをインストール不要でブラウザから参加できる。",
            },
            {
              icon: BarChart3,
              color: "#34D399",
              bg: "rgba(5,150,105,0.08)",
              title: "グループチャット",
              desc: "現場のやりとりをグループチャットで一元化。@メンションで確実に伝達。",
            },
            {
              icon: FileText,
              color: "#FB923C",
              bg: "rgba(249,115,22,0.08)",
              title: "データを全員で共有",
              desc: "見積書・解析結果をグループ内で共有。最新版がいつでも確認できる。",
            },
          ].map(({ icon: Icon, color, bg, title, desc }) => (
            <div
              key={title}
              className="rounded-2xl p-6"
              style={{ background: bg, border: `1px solid ${color}22` }}
            >
              <div
                className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ background: `${color}18` }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <h3 className="mb-2 text-sm font-bold" style={{ color: "#E2E8F0" }}>{title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "#64748B" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── 料金（カードがスクロールでスタガード登場） ──── */
function Pricing() {
  const plans = [
    {
      name: "個人",
      price: "¥1,480",
      period: "/ 月",
      desc: "一人親方・個人事業主向け",
      features: ["図面解析 月30回", "見積書作成", "単価マスタ"],
      accent: "#60A5FA",
      accentBg: "rgba(37,99,235,0.08)",
    },
    {
      name: "法人 S",
      price: "¥9,800",
      period: "/ 月",
      desc: "3名まで利用可能",
      features: ["図面解析 月100回", "全機能利用可能", "グループ無制限", "優先サポート"],
      accent: "#34D399",
      accentBg: "rgba(5,150,105,0.08)",
    },
    {
      name: "法人 M",
      price: "¥16,800",
      period: "/ 月",
      desc: "10名まで利用可能",
      features: ["図面解析 月300回", "全機能利用可能", "グループ無制限", "CSV一括出力", "優先サポート"],
      accent: "#F97316",
      accentBg: "rgba(249,115,22,0.08)",
      recommended: true,
    },
    {
      name: "法人 L",
      price: "¥29,800",
      period: "/ 月",
      desc: "人数無制限・カスタム対応",
      features: ["図面解析 無制限", "全機能利用可能", "専用サポート", "カスタム連携", "請求書払い対応"],
      accent: "#A78BFA",
      accentBg: "rgba(139,92,246,0.08)",
    },
  ];

  return (
    <section className="px-6 py-24" style={{ background: "#0F172A" }}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#2563EB" }}>PRICING</p>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            シンプルな料金体系
          </h2>
        </div>

        <div
          className="mx-auto mb-10 max-w-2xl rounded-2xl px-6 py-4 text-center"
          style={{
            background: "rgba(249,115,22,0.08)",
            border: "1px solid rgba(249,115,22,0.25)",
          }}
        >
          <p className="text-sm font-bold" style={{ color: "#FB923C" }}>
            🎉 ベータ期間中は全機能を無料でご利用いただけます
          </p>
          <p className="mt-1 text-xs" style={{ color: "#64748B" }}>
            正式リリース後に上記の料金プランへ移行予定。※ 料金・プラン内容は変更の可能性があります。
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map(({ name, price, period, desc, features, accent, accentBg, recommended }, i) => (
            <ScrollReveal key={name} delay={i * 80}>
              <div
                className="relative flex h-full flex-col rounded-2xl p-5"
                style={{
                  background: accentBg,
                  border: recommended ? `2px solid ${accent}` : `1px solid ${accent}22`,
                }}
              >
                {recommended && (
                  <span
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[11px] font-black text-white"
                    style={{ background: accent }}
                  >
                    おすすめ
                  </span>
                )}
                <div className="mb-5">
                  <p className="text-xs font-bold" style={{ color: accent }}>{name}</p>
                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="text-2xl font-black" style={{ color: "#E2E8F0" }}>{price}</span>
                    <span className="text-xs" style={{ color: "#475569" }}>{period}</span>
                  </div>
                  <p className="mt-1 text-xs" style={{ color: "#64748B" }}>{desc}</p>
                </div>
                <ul className="mb-5 flex-1 space-y-2">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs" style={{ color: "#94A3B8" }}>
                      <Check size={12} className="mt-0.5 shrink-0" style={{ color: accent }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <div
                  className="rounded-xl py-2 text-center text-xs font-semibold"
                  style={{ background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}
                >
                  準備中
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ────────────────────────────────────────────── */
function CtaSection() {
  return (
    <section
      className="px-6 py-24 text-center"
      style={{ background: "linear-gradient(160deg, #060D18 0%, #0D1F3C 50%, #060D18 100%)" }}
    >
      <ScrollReveal>
        <div className="mx-auto max-w-xl">
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            今すぐ始めて、
            <br />
            <span style={{ color: "#F97316" }}>現場の手間を減らそう。</span>
          </h2>
          <p className="mt-5 text-base" style={{ color: "#64748B" }}>
            ベータ期間中は全機能を無料でご利用いただけます。
          </p>

          <div className="mt-10">
            <Link
              href="/signup"
              className="lp-glow-btn inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl px-8 text-base font-bold text-white transition-opacity hover:opacity-90 sm:w-auto sm:px-12"
              style={{ background: "#F97316" }}
            >
              無料でアカウントを作成
              <ArrowRight size={18} />
            </Link>
            <p className="mt-3 text-xs" style={{ color: "#334155" }}>
              クレジットカード不要 · 1分で完了
            </p>
          </div>

          <div
            className="mx-auto mt-10 inline-flex items-center gap-2 rounded-full px-5 py-2.5"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="h-2 w-2 animate-pulse rounded-full" style={{ background: "#10B981" }} />
            <span className="text-sm" style={{ color: "#94A3B8" }}>
              現在 <span className="font-bold text-white">ベータ版公開中</span>
            </span>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}

/* ── FAQ ───────────────────────────────────────────── */
function FAQ() {
  const items = [
    {
      q: "どんな図面に対応していますか？",
      a: "給排水・電気・空調・ダクト・建築・内装など、業種を問わずPDF形式の図面に対応しています。スキャンPDFより、デジタル作成のPDFの方が精度が高くなります。",
    },
    {
      q: "AIの解析精度はどのくらいですか？",
      a: "高精度な大規模言語モデルを採用しており、多くの図面で高い精度を実現しています。ただし、図面の品質や複雑さによって精度は変わるため、重要な判断には担当者による確認をお願いしています。",
    },
    {
      q: "ベータ期間中は本当に無料ですか？",
      a: "はい、ベータ期間中は全機能を無料でご利用いただけます。正式版リリースの際には事前にご案内します。",
    },
    {
      q: "チームメンバーはどうやって追加しますか？",
      a: "グループを作成して招待コードを発行するだけです。メンバーはコードを入力するか、URLをクリックするだけで参加できます。",
    },
    {
      q: "既存の単価データを移行できますか？",
      a: "はい、CSVファイルで一括インポートできます。現在Excelで管理している単価データをそのまま取り込めます。",
    },
    {
      q: "スマートフォンでも使えますか？",
      a: "はい、iOS・Androidのブラウザから全機能をご利用いただけます。現場でスマホから図面確認やチャットが可能です。",
    },
  ];

  return (
    <section className="px-6 py-24" style={{ background: "#0A101C" }}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: "#64748B" }}>FAQ</p>
          <h2 className="mt-3 text-3xl font-black text-white">よくある質問</h2>
        </div>

        <div className="space-y-3">
          {items.map(({ q, a }) => (
            <div
              key={q}
              className="rounded-2xl px-6 py-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-black"
                  style={{ background: "rgba(37,99,235,0.15)", color: "#60A5FA" }}
                >
                  Q
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{q}</p>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "#64748B" }}>{a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── フッター ────────────────────────────────────────── */
function Footer() {
  return (
    <footer
      className="px-6 py-10"
      style={{ background: "#060D18", borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-white"
              style={{ background: "linear-gradient(135deg, #2563EB, #1D4ED8)" }}
            >
              T
            </div>
            <div>
              <span className="text-base font-bold tracking-wider text-white">TORU</span>
              <p className="text-xs" style={{ color: "#334155" }}>建設現場向け AI 業務効率化ツール</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs" style={{ color: "#475569" }}>
            <Link href="/privacy" className="transition-colors hover:text-white">プライバシーポリシー</Link>
            <Link href="/login" className="transition-colors hover:text-white">ログイン</Link>
            <Link href="/signup" className="transition-colors hover:text-white">新規登録</Link>
          </div>
        </div>
        <div
          className="mt-8 flex flex-col items-center gap-2 border-t pt-6 text-center text-xs sm:flex-row sm:justify-between"
          style={{ borderColor: "rgba(255,255,255,0.05)", color: "#334155" }}
        >
          <p>© 2025 TORU. All rights reserved.</p>
          <p>Made with ❤️ for 建設現場の職人さんへ</p>
        </div>
      </div>
    </footer>
  );
}

/* ── ページ本体 ──────────────────────────────────────── */
export default function LandingPage() {
  return (
    <>
      <Nav />
      <Hero />
      <Problems />
      <Solution />
      <AiSection />
      <UnitPriceSection />
      <QuoteSection />
      <TeamSection />
      <Pricing />
      <CtaSection />
      <FAQ />
      <Footer />
    </>
  );
}
