"use client";

import { useActionState, useState } from "react";
import { Star, Send, CheckCircle2 } from "lucide-react";
import { submitFeedback } from "./actions";
import { useToast } from "@/components/toast-context";

const CATEGORIES = [
  { value: "ux", label: "使いやすさ" },
  { value: "bug", label: "不具合・バグ" },
  { value: "feature", label: "追加してほしい機能" },
  { value: "other", label: "その他" },
];

const COMPANY_SIZES = ["1〜5名", "6〜20名", "21〜50名", "51名以上"];

export function FeedbackForm() {
  const { success, error: toastError } = useToast();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [done, setDone] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  const [state, action, pending] = useActionState(async (prev: any, fd: FormData) => {
    fd.set("rating", rating > 0 ? String(rating) : "");
    const res = await submitFeedback(prev, fd);
    if (res.ok) {
      setDone(true);
      success("フィードバックを送信しました。ありがとうございます！");
    } else {
      toastError(res.error);
    }
    return res;
  }, null);

  if (done) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <div
          className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "rgba(34,197,94,0.1)" }}
        >
          <CheckCircle2 size={32} style={{ color: "#16A34A" }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: "var(--color-text)" }}>
          ありがとうございます！
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
          いただいたご意見を参考にTORUをより良くしていきます。
        </p>
        <button
          type="button"
          onClick={() => { setDone(false); setRating(0); }}
          className="mt-8 inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium transition hover:opacity-80"
          style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
        >
          続けて送る
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {/* 評価（星） */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <p className="mb-3 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
          全体的な満足度
        </p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={32}
                fill={(hover || rating) >= n ? "#F59E0B" : "transparent"}
                style={{ color: (hover || rating) >= n ? "#F59E0B" : "var(--color-border)" }}
              />
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 self-center text-sm" style={{ color: "var(--color-text-muted)" }}>
              {["", "残念でした", "もう少し", "まあまあ", "良かった", "最高！"][rating]}
            </span>
          )}
        </div>
      </div>

      {/* カテゴリ */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <p className="mb-3 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
          フィードバックの種類
        </p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = selectedCategory === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => setSelectedCategory(active ? "" : c.value)}
                className="inline-flex h-9 items-center rounded-xl px-4 text-sm font-medium transition"
                style={{
                  border: "1px solid var(--color-border)",
                  background: active ? "var(--color-primary)" : "var(--color-bg)",
                  color: active ? "#fff" : "var(--color-text-muted)",
                }}
              >
                {c.label}
              </button>
            );
          })}
          <input type="hidden" name="category" value={selectedCategory} />
        </div>
      </div>

      {/* 本文 */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <label className="mb-2 block text-sm font-semibold" style={{ color: "var(--color-text)" }}>
          ご意見・ご要望 <span style={{ color: "var(--color-danger, #DC2626)" }}>*</span>
        </label>
        <textarea
          name="body"
          rows={5}
          required
          placeholder="使ってみての感想、困ったこと、こうなったら嬉しいという機能など、なんでもお気軽にどうぞ。"
          className="w-full resize-none rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
          style={{
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        />
      </div>

      {/* 任意情報 */}
      <div
        className="rounded-2xl p-5"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        <p className="mb-3 text-sm font-semibold" style={{ color: "var(--color-text)" }}>
          任意情報
          <span className="ml-2 text-xs font-normal" style={{ color: "var(--color-text-muted)" }}>
            機能改善の参考にします
          </span>
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              職種・役職
            </label>
            <input
              type="text"
              name="job_title"
              placeholder="例：現場監督、施工管理"
              className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
              会社規模
            </label>
            <select
              name="company_size"
              className="w-full rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)",
              }}
            >
              <option value="">選択してください</option>
              {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--color-primary)" }}
        >
          <Send size={15} />
          {pending ? "送信中..." : "フィードバックを送る"}
        </button>
      </div>
    </form>
  );
}
