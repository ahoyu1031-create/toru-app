"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, display_name: displayName }),
    });
    const json = await res.json();

    if (!res.ok || json.error) {
      setError(json.error ?? "登録に失敗しました");
      setLoading(false);
      return;
    }

    if (json.session) {
      router.push("/onboarding");
      router.refresh();
    } else {
      // セッション取得できなかった場合はログインページへ
      setNotice("登録完了しました。ログインしてください。");
      setTimeout(() => router.push("/login"), 1500);
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-lg border bg-white px-4 py-3 text-base transition focus:outline-none";
  const focusHandlers = {
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = "var(--color-primary)";
      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      e.currentTarget.style.borderColor = "var(--color-border)";
      e.currentTarget.style.boxShadow = "none";
    },
  };

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
            <h1 className="mb-1 text-2xl font-bold text-[color:var(--color-text)]">アカウント登録</h1>
            <p className="mb-6 text-sm text-[color:var(--color-text-muted)]">
              無料ではじめられます
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="display-name" className="block text-sm font-semibold mb-1.5" style={{ color: "var(--color-text)" }}>
                  お名前（任意）
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="山田 太郎"
                  className={inputClass}
                  style={{ borderColor: "var(--color-border)" }}
                  {...focusHandlers}
                />
              </div>

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
                  className={inputClass}
                  style={{ borderColor: "var(--color-border)" }}
                  {...focusHandlers}
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
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className={inputClass}
                  style={{ borderColor: "var(--color-border)" }}
                  {...focusHandlers}
                />
                <p className="mt-1 text-xs" style={{ color: "var(--color-text-subtle)" }}>
                  8文字以上
                </p>
              </div>

              {error && (
                <div
                  className="rounded-lg border px-4 py-3 text-sm"
                  style={{ borderColor: "var(--color-danger)", background: "rgba(220,38,38,0.06)", color: "var(--color-danger)" }}
                >
                  {error}
                </div>
              )}

              {notice && (
                <div
                  className="rounded-lg border px-4 py-3 text-sm"
                  style={{ borderColor: "var(--color-success)", background: "rgba(5,150,105,0.06)", color: "var(--color-success)" }}
                >
                  {notice}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 w-full items-center justify-center rounded-lg text-base font-bold text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
                style={{ background: "var(--color-primary)" }}
              >
                {loading ? "登録中..." : "登録する"}
              </button>

              <p className="text-center text-xs leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
                登録することで{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-semibold underline"
                  style={{ color: "var(--color-primary)" }}
                >
                  プライバシーポリシー
                </Link>
                {" "}に同意したものとみなします。<br />
                図面PDFは解析時にAnthropic Claude APIに送信されます。
              </p>

              <p className="text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
                すでにアカウントをお持ちですか？{" "}
                <Link
                  href="/login"
                  className="font-semibold hover:underline"
                  style={{ color: "var(--color-primary)" }}
                >
                  ログイン
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
