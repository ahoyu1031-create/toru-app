"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
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
      className="flex min-h-dvh flex-col items-center justify-center px-4 text-center"
      style={{ background: "var(--color-bg)" }}
    >
      <div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white"
        style={{ background: "var(--color-danger, #DC2626)" }}
      >
        !
      </div>
      <h1
        className="mt-2 text-2xl font-bold"
        style={{ color: "var(--color-text)" }}
      >
        エラーが発生しました
      </h1>
      <p
        className="mt-2 text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        申し訳ありません。予期しないエラーが発生しました。
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-xs" style={{ color: "var(--color-text-subtle)" }}>
          {error.digest}
        </p>
      )}
      <div className="mt-8 flex gap-3">
        <button
          onClick={reset}
          className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ background: "var(--color-primary)" }}
        >
          もう一度試す
        </button>
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition hover:opacity-70"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          ダッシュボードへ
        </Link>
      </div>
    </div>
  );
}
