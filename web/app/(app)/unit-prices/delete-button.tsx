"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { deleteUnitPrice } from "./actions";

export function DeleteButton({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteUnitPrice(id);
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
        onClick={() => setShowConfirm(true)}
        disabled={isPending}
        className="inline-flex h-9 items-center justify-center rounded-md border border-[color:var(--color-danger)] bg-white px-3 text-sm font-medium text-[color:var(--color-danger)] hover:bg-red-50 disabled:opacity-60"
      >
        {isPending ? "..." : "削除"}
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
              削除の確認
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
