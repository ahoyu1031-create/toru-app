"use client";

import { useState } from "react";
import { useActionState } from "react";
import { updateProfile } from "./actions";

type ActionResult = { ok: true } | { ok: false; error: string };

type Props = {
  displayName: string | null;
  email: string;
  userId: string;
};

export function ProfileForm({ displayName, email, userId }: Props) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    updateProfile,
    null,
  );
  const [copied, setCopied] = useState(false);

  const initials = displayName
    ? displayName.trim().charAt(0).toUpperCase()
    : email.charAt(0).toUpperCase();

  function copyUserId() {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputClass =
    "mt-1 w-full rounded-lg border-2 border-[color:var(--color-border)] bg-white px-4 py-2.5 text-base focus:border-[color:var(--color-primary)] focus:outline-none";
  const labelClass = "block text-sm font-medium text-[color:var(--color-text)]";

  return (
    <form action={action} className="space-y-6">
      {/* Avatar + 名前 */}
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-primary)] text-xl font-bold text-white shadow-sm">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate font-semibold text-[color:var(--color-text)]">
            {displayName || <span className="text-[color:var(--color-text-muted)]">表示名が未設定です</span>}
          </p>
          <p className="truncate text-sm text-[color:var(--color-text-muted)]">{email}</p>
        </div>
      </div>

      {/* 表示名 */}
      <div>
        <label className={labelClass}>
          表示名
          <span className="ml-1.5 text-xs font-normal text-[color:var(--color-text-muted)]">
            グループ内でのあなたの名前
          </span>
        </label>
        <input
          name="display_name"
          type="text"
          defaultValue={displayName ?? ""}
          placeholder="田中 太郎"
          maxLength={50}
          className={inputClass}
        />
      </div>

      {/* メール / ユーザーID */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <p className={labelClass}>メールアドレス</p>
          <p className="mt-1 truncate rounded-lg border-2 border-[color:var(--color-border)] bg-gray-50 px-4 py-2.5 text-sm text-[color:var(--color-text-muted)]">
            {email}
          </p>
        </div>

        <div className="min-w-0">
          <p className={labelClass}>
            ユーザーID
            <span className="ml-1.5 text-xs font-normal text-[color:var(--color-text-muted)]">
              グループ招待などに使用
            </span>
          </p>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <p className="flex-1 rounded-lg border-2 border-[color:var(--color-border)] bg-gray-50 px-4 py-2.5 font-mono text-xs text-[color:var(--color-text-muted)] truncate">
              {userId}
            </p>
            <button
              type="button"
              onClick={copyUserId}
              className={`shrink-0 rounded-lg border-2 px-3 py-2.5 text-xs font-medium transition-all ${
                copied
                  ? "border-[color:var(--color-success)] bg-green-50 text-[color:var(--color-success)]"
                  : "border-[color:var(--color-border)] bg-white text-[color:var(--color-text-muted)] hover:border-[color:var(--color-primary)] hover:text-[color:var(--color-primary)]"
              }`}
            >
              {copied ? "コピー完了" : "コピー"}
            </button>
          </div>
        </div>
      </div>

      {state && !state.ok && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-[color:var(--color-danger)]">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-[color:var(--color-success)]">
          保存しました
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-[color:var(--color-primary)] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[color:var(--color-primary-hover)] disabled:opacity-60"
        >
          {pending ? "保存中..." : "保存する"}
        </button>
      </div>
    </form>
  );
}
