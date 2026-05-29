"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";

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
      setNotice("登録完了しました。ログインしてください。");
      setTimeout(() => router.push("/login"), 1500);
      setLoading(false);
    }
  }

  return (
    <AuthShell
      badge="ACCOUNT / 新規登録"
      title="アカウント登録"
      subtitle="無料ではじめられます。クレカ不要。"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="display-name" className="bp-label">
            お名前（任意）
          </label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="山田 太郎"
            className="bp-input"
          />
        </div>

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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            className="bp-input"
          />
          <p className="mt-1.5 text-xs" style={{ color: "rgba(11,61,145,0.55)" }}>
            8文字以上
          </p>
        </div>

        {error && <div className="bp-alert">{error}</div>}
        {notice && <div className="bp-alert bp-alert-ok">{notice}</div>}

        <button
          type="submit"
          disabled={loading}
          className="bp-cta inline-flex h-12 w-full items-center justify-center gap-2 text-sm disabled:opacity-60"
        >
          {loading ? "登録中..." : "登録する"}
          {!loading && <ArrowRight size={18} />}
        </button>

        <p className="text-center text-xs leading-relaxed" style={{ color: "rgba(11,61,145,0.7)" }}>
          登録することで{" "}
          <Link href="/privacy" target="_blank" className="font-semibold underline" style={{ color: "#0B3D91" }}>
            プライバシーポリシー
          </Link>{" "}
          に同意したものとみなします。
          <br />
          図面PDFは解析時にAnthropic Claude APIに送信されます。
        </p>

        <p className="text-center text-sm" style={{ color: "rgba(11,61,145,0.75)" }}>
          すでにアカウントをお持ちですか？{" "}
          <Link href="/login" className="font-bold hover:underline" style={{ color: "#0B3D91" }}>
            ログイン
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
