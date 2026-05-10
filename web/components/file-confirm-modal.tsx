"use client";

import { X, FileText, ImageIcon, Loader2 } from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileConfirmModal({
  file,
  onConfirm,
  onCancel,
  uploading,
}: {
  file: File;
  onConfirm: () => void;
  onCancel: () => void;
  uploading: boolean;
}) {
  const isImage = file.type.startsWith("image/");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget && !uploading) onCancel(); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <h2 className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
            ファイルを送信しますか？
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition hover:opacity-70 disabled:opacity-30"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* File preview */}
        <div className="px-5 py-5">
          <div
            className="flex items-center gap-4 rounded-xl p-4"
            style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
          >
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
              style={{
                background: isImage
                  ? "rgba(37,99,235,0.08)"
                  : "rgba(220,38,38,0.08)",
              }}
            >
              {isImage ? (
                <ImageIcon size={22} style={{ color: "var(--color-primary)" }} />
              ) : (
                <FileText size={22} style={{ color: "var(--color-danger)" }} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {file.name}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
                {formatBytes(file.size)}
                {" · "}
                {file.type === "application/pdf"
                  ? "PDF"
                  : isImage
                  ? "画像"
                  : file.type}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="flex flex-1 items-center justify-center rounded-xl py-2.5 text-sm font-semibold transition hover:opacity-80 disabled:opacity-40"
            style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={uploading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--color-primary)" }}
          >
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                送信中…
              </>
            ) : (
              "送信する"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
