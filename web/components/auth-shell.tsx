import Link from "next/link";

const TRUST = ["クレジットカード不要", "登録は約1分で完了", "ベータ期間中は無料"];

/**
 * Blueprint デザインの認証画面シェル。
 * 左: 製図用紙モチーフのブランドパネル（desktop のみ）/ 右: フォーム枠。
 * LP（/）と同じ世界観で signup・login を地続きにする。
 */
export function AuthShell({
  badge,
  title,
  subtitle,
  children,
}: {
  badge: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bp-page bp-grid relative flex min-h-dvh overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bp-paper-fade" />

      {/* 左: ブランドパネル */}
      <aside
        className="relative hidden shrink-0 flex-col justify-between border-r-2 px-12 py-12 lg:flex lg:w-[460px]"
        style={{ borderColor: "#0B3D91" }}
      >
        <div>
          <Link
            href="/"
            className="bp-code text-3xl font-bold"
            style={{ color: "#0B3D91" }}
          >
            TORU
          </Link>
          <div
            className="bp-code mt-3 flex items-center gap-2 text-[10px]"
            style={{ color: "rgba(11,61,145,0.65)" }}
          >
            <span>DOC. AUTH</span>
            <span>|</span>
            <span>REV. 0.3 BETA</span>
          </div>
        </div>

        <div>
          <h2 className="text-4xl font-bold leading-tight" style={{ color: "#0B3D91" }}>
            図面を投げたら、
            <br />
            <span style={{ color: "#FF6B35" }}>見積書</span>が出てくる。
          </h2>
          <p
            className="mt-5 text-base leading-relaxed"
            style={{ color: "rgba(11,61,145,0.78)" }}
          >
            建設現場の図面PDFをAIが解析。材料の拾い出しから見積書作成まで、まるごと自動化します。
          </p>
          <ul className="mt-8 space-y-2.5">
            {TRUST.map((t) => (
              <li
                key={t}
                className="flex items-center gap-2.5 text-sm font-medium"
                style={{ color: "#0B3D91" }}
              >
                <span style={{ color: "#FF6B35" }}>▸</span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="bp-code text-[10px]" style={{ color: "rgba(11,61,145,0.5)" }}>
          © 2026 TORU — DRAWING ANALYSIS SAAS
        </p>
      </aside>

      {/* 右: フォーム */}
      <main className="relative flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-md">
          {/* モバイル用ロゴ */}
          <div className="mb-8 text-center lg:hidden">
            <Link
              href="/"
              className="bp-code text-2xl font-bold"
              style={{ color: "#0B3D91" }}
            >
              TORU
            </Link>
          </div>

          <div
            className="border-2 bg-[rgba(255,255,255,0.6)] p-7 sm:p-9"
            style={{ borderColor: "#0B3D91" }}
          >
            <div
              className="bp-code mb-1.5 text-[11px] font-bold"
              style={{ color: "#FF6B35" }}
            >
              {badge}
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#0B3D91" }}>
              {title}
            </h1>
            <p className="mb-6 mt-1 text-sm" style={{ color: "rgba(11,61,145,0.7)" }}>
              {subtitle}
            </p>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
