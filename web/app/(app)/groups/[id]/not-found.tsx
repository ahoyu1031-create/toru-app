import Link from "next/link";

export default function GroupNotFound() {
  return (
    <div
      className="flex h-full flex-col items-center justify-center px-4 text-center"
      style={{ background: "var(--color-bg)" }}
    >
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white"
        style={{ background: "var(--color-primary)" }}
      >
        T
      </div>
      <h2
        className="mt-2 text-xl font-bold"
        style={{ color: "var(--color-text)" }}
      >
        グループが見つかりません
      </h2>
      <p
        className="mt-2 text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        URLが間違っているか、グループが削除された可能性があります。
      </p>
      <div className="mt-6">
        <Link
          href="/groups"
          className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "var(--color-primary)" }}
        >
          グループ一覧へ
        </Link>
      </div>
    </div>
  );
}
