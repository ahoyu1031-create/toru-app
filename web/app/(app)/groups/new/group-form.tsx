"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createGroup } from "../actions";
import { useToast } from "@/components/toast-context";

export function GroupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { error: toastError } = useToast();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await createGroup(fd);
    if ("error" in result && result.error) {
      toastError(result.error);
      setLoading(false);
      return;
    }
    router.push(`/groups/${result.groupId}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div
        className="rounded-2xl p-5 space-y-5"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        {/* グループ名 */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            グループ名 <span style={{ color: "var(--color-danger)" }}>*</span>
          </label>
          <input
            name="name"
            type="text"
            required
            placeholder="例: ○○マンション新築工事"
            maxLength={60}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition"
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          />
        </div>

        {/* 説明 */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            説明（任意）
          </label>
          <textarea
            name="description"
            placeholder="現場の概要や注意事項など"
            rows={3}
            maxLength={200}
            className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none"
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          />
        </div>

        {/* 信頼レベル */}
        <div>
          <label className="mb-2 block text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            メンバー構成
          </label>
          <div className="space-y-2">
            {[
              { value: "trusted", label: "自社・身内のみ", desc: "情報共有時の警告を簡略化" },
              { value: "mixed",   label: "他社混在の可能性あり", desc: "情報共有時に3段階の確認を表示（推奨）" },
            ].map(({ value, label, desc }) => (
              <label key={value} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="trust_level"
                  value={value}
                  defaultChecked={value === "mixed"}
                  className="mt-0.5 shrink-0 accent-[color:var(--color-primary)]"
                />
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>{label}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        style={{ background: "var(--color-primary)" }}
      >
        {loading ? "作成中..." : "グループを作成する"}
      </button>
    </form>
  );
}
