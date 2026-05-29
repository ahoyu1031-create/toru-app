"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth-shell";

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

    router.push(redirect);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="bp-label">
          メールアドレス
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="bp-input"
        />
      </div>

      <div>
        <label htmlFor="password" className="bp-label">
          パスワード
        </label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          className="bp-input"
        />
      </div>

      {error && <div className="bp-alert">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="bp-cta inline-flex h-12 w-full items-center justify-center text-sm disabled:opacity-60"
      >
        {loading ? "ログイン中..." : "ログイン"}
      </button>

      <p className="text-center text-sm" style={{ color: "rgba(11,61,145,0.75)" }}>
        アカウントをお持ちでないですか？{" "}
        <Link href="/signup" className="font-bold hover:underline" style={{ color: "#0B3D91" }}>
          新規登録
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      badge="ACCOUNT / ログイン"
      title="ログイン"
      subtitle="アカウントにサインインします。"
    >
      <Suspense fallback={<div className="h-64 animate-pulse rounded bg-[rgba(11,61,145,0.06)]" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
