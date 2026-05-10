"use client";

import { Copy, Check, Link2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/toast-context";

export function CopyButton({ code, fullWidth }: { code: string; fullWidth?: boolean }) {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  function handleCopy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      success("招待コードをコピーしました");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (fullWidth) {
    return (
      <button
        type="button"
        onClick={handleCopy}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition hover:opacity-80"
        style={{ background: "var(--color-primary)", color: "#fff" }}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "コピー済み" : "コードをコピー"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:opacity-80"
      style={{ background: "var(--color-primary)", color: "#fff" }}
      aria-label="コードをコピー"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

export function ShareLinkButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  function handleShare() {
    const url = `${window.location.origin}/groups/join?code=${code}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      success("招待リンクをコピーしました");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition hover:opacity-80"
      style={{ border: "1px solid var(--color-border)", color: "var(--color-text-muted)", background: "var(--color-bg)" }}
    >
      {copied ? <Check size={12} /> : <Link2 size={12} />}
      {copied ? "コピー済み" : "招待リンクをコピー"}
    </button>
  );
}
