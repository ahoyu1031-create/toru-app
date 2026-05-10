"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GroupError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex h-full flex-col items-center justify-center px-4 text-center"
      style={{ background: "var(--color-bg)" }}
    >
      <div
        className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white"
        style={{ background: "var(--color-danger, #DC2626)" }}
      >
        !
      </div>
      <h2
        className="mt-2 text-xl font-bold"
        style={{ color: "var(--color-text)" }}
      >
        グループの読み込みに失敗しました
      </h2>
      <p
        className="mt-2 text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        ネットワークの問題か、グループが削除された可能性があります。
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-xs" style={{ color: "var(--color-text-subtle)" }}>
          {error.digest}
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "var(--color-primary)" }}
        >
          再読み込み
        </button>
        <Link
          href="/groups"
          className="inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition hover:opacity-70"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          グループ一覧へ
        </Link>
      </div>
    </div>
  );
}
