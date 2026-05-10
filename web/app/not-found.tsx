import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-4 text-center"
      style={{ background: "var(--color-bg)" }}
    >
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white"
        style={{ background: "var(--color-primary)" }}
      >
        T
      </div>
      <h1
        className="mt-2 text-6xl font-extrabold tracking-tight"
        style={{ color: "var(--color-text)" }}
      >
        404
      </h1>
      <p
        className="mt-3 text-base font-medium"
        style={{ color: "var(--color-text)" }}
      >
        ページが見つかりませんでした
      </p>
      <p
        className="mt-1.5 text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        URLが間違っているか、削除されたページです。
      </p>
      <div className="mt-8 flex gap-3">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "var(--color-primary)" }}
        >
          ダッシュボードへ
        </Link>
        <Link
          href="/"
          className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition hover:opacity-70"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          トップページへ
        </Link>
      </div>
    </div>
  );
}
