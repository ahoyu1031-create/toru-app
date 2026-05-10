"use client";

import { useState } from "react";
import { Share2, X, Copy, Check, Link2 } from "lucide-react";
import { useToast } from "@/components/toast-context";

export function MobileShareDrawer({ code, groupName }: { code: string; groupName: string }) {
  const [open, setOpen] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const { success } = useToast();

  function copyCode() {
    navigator.clipboard.writeText(code).then(() => {
      setCodeCopied(true);
      success("招待コードをコピーしました");
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }

  function copyLink() {
    const url = `${window.location.origin}/groups/join?code=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      success("招待リンクをコピーしました");
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  function handleShare() {
    const url = `${window.location.origin}/groups/join?code=${code}`;
    const text = `「${groupName}」に招待されています。\n招待コード: ${code}\n参加リンク: ${url}`;
    if (navigator.share) {
      navigator.share({ title: `${groupName}への招待`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        success("招待テキストをコピーしました");
      });
    }
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition hover:opacity-80"
        style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
      >
        <Share2 size={13} />
        <span className="hidden sm:inline">招待</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
      )}

      {open && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl px-5 pb-6 pt-3"
          style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)" }}
        >
          <div className="mx-auto mb-3 h-1 w-8 rounded-full" style={{ background: "var(--color-border)" }} />

          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold" style={{ color: "var(--color-text)" }}>メンバーを招待</h3>
            <button type="button" onClick={() => setOpen(false)} className="opacity-60 hover:opacity-100 transition">
              <X size={16} style={{ color: "var(--color-text-muted)" }} />
            </button>
          </div>

          {/* 招待コード */}
          <div
            className="mb-3 flex items-center justify-between rounded-xl px-4 py-2.5"
            style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
          >
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>招待コード</span>
            <span className="font-mono text-base font-bold tracking-[0.25em]" style={{ color: "var(--color-text)" }}>
              {code}
            </span>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: "var(--color-primary)" }}
            >
              <Share2 size={14} />
              共有する
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={copyLink}
                className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition hover:opacity-80"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)", color: "var(--color-text)" }}
              >
                {linkCopied ? <Check size={13} /> : <Link2 size={13} />}
                {linkCopied ? "コピー済み" : "リンクをコピー"}
              </button>
              <button
                type="button"
                onClick={copyCode}
                className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-semibold transition hover:opacity-80"
                style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)" }}
              >
                {codeCopied ? <Check size={13} /> : <Copy size={13} />}
                {codeCopied ? "コピー済み" : "コードをコピー"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
