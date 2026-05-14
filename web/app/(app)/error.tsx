"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, MessageCircleHeart } from "lucide-react";

export default function AppError({
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
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-md rounded-2xl p-6 text-center sm:p-8"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ background: "rgba(220,38,38,0.1)" }}
        >
          <AlertTriangle size={26} style={{ color: "var(--color-danger, #DC2626)" }} />
        </div>
        <h1 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>
          ページの読み込みに失敗しました
        </h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
          一時的な不具合の可能性があります。
          <br />
          もう一度お試しください。
        </p>
        {error.digest && (
          <p className="mt-3 inline-block rounded-md px-2 py-1 font-mono text-[10px]" style={{ background: "var(--color-bg)", color: "var(--color-text-subtle)" }}>
            ID: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ background: "var(--color-primary)" }}
          >
            <RefreshCw size={14} />
            もう一度試す
          </button>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition hover:opacity-70"
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            ダッシュボードへ
          </Link>
        </div>

        <Link
          href="/feedback"
          className="mt-5 inline-flex items-center gap-1.5 text-xs font-medium transition hover:opacity-70"
          style={{ color: "var(--color-text-subtle)" }}
        >
          <MessageCircleHeart size={12} />
          このエラーを報告する
        </Link>
      </div>
    </div>
  );
}
