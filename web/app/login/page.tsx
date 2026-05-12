"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (loginError) {
      setError(
        loginError.message === "Invalid login credentials"
          ? "メールアドレスまたはパスワードが違います"
          : loginError.message === "Email not confirmed"
          ? "メールアドレスが未確認です。届いた確認メールのリンクをクリックしてください。"
          : loginError.message,
      );
      setLoading(false);
      return;
    }

    // オンボーディング判定はサーバー側 layout に任せる（重複クエリ削減）
    router.push(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
          メールアドレス
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="w-full rounded-lg border bg-white px-4 py-3 text-base transition focus:outline-none focus:ring-2"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--color-primary)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
          パスワード
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="w-full rounded-lg border bg-white px-4 py-3 text-base transition focus:outline-none"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--color-primary)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>

      {error && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{
            borderColor: "var(--color-danger)",
            background: "rgba(220,38,38,0.06)",
            color: "var(--color-danger)",
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-12 w-full items-center justify-center rounded-lg text-base font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
        style={{ background: "var(--color-primary)" }}
      >
        {loading ? "ログイン中..." : "ログイン"}
      </button>

      <p className="text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
        アカウントをお持ちでないですか？{" "}
        <Link
          href="/signup"
          className="font-semibold hover:underline"
          style={{ color: "var(--color-primary)" }}
        >
          新規登録
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh">
      {/* Left panel — dark brand */}
      <div
        className="hidden lg:flex lg:w-[420px] shrink-0 flex-col justify-between px-10 py-12"
        style={{ background: "var(--sidebar-bg)" }}
      >
        <div>
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg font-bold text-white text-base"
            style={{ background: "var(--color-primary)" }}
          >
            T
          </div>
          <p className="mt-2 font-bold text-white tracking-wide">TORU</p>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-snug text-white">
            図面から材料を拾い出して、
            <br />
            <span style={{ color: "#F97316" }}>そのまま見積書に。</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--sidebar-text)" }}>
            建設現場の事務作業を、1/10の時間に。
          </p>
        </div>
        <p className="text-xs" style={{ color: "var(--sidebar-text)" }}>
          © 2025 TORU
        </p>
      </div>

      {/* Right panel — form */}
      <div
        className="flex flex-1 items-center justify-center px-6 py-12"
        style={{ background: "var(--color-bg)" }}
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <div
              className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg font-bold text-white"
              style={{ background: "var(--color-primary)" }}
            >
              T
            </div>
            <p className="font-bold text-[color:var(--color-text)] tracking-wide">TORU</p>
          </div>

          <div className="rounded-2xl border border-[color:var(--color-border)] bg-white p-8 shadow-sm">
            <h1 className="mb-1 text-2xl font-bold text-[color:var(--color-text)]">ログイン</h1>
            <p className="mb-6 text-sm text-[color:var(--color-text-muted)]">
              アカウントにサインインします
            </p>
            <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-[color:var(--color-bg)]" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
