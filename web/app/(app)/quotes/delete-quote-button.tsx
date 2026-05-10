"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteQuoteById } from "./actions";

export function DeleteQuoteButton({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteQuoteById(id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setShowConfirm(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConfirm(true); }}
        className="flex h-8 w-8 items-center justify-center rounded-lg opacity-0 transition group-hover:opacity-100 hover:bg-red-50"
        style={{ color: "var(--color-danger)" }}
        aria-label="削除"
      >
        <Trash2 size={15} />
      </button>

      {showConfirm && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={() => !isPending && setShowConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
            style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
              見積書を削除しますか？
            </h3>
            <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
              「{label}」を削除します。この操作は元に戻せません。
            </p>
            {error && (
              <p className="mt-3 text-sm" style={{ color: "var(--color-danger)" }}>
                {error}
              </p>
            )}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="flex-1 rounded-xl py-2.5 text-sm font-medium transition hover:opacity-80 disabled:opacity-50"
                style={{
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-muted)",
                }}
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--color-danger)" }}
              >
                {isPending ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
