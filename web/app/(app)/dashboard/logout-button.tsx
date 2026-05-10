"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex h-11 items-center justify-center rounded-lg border-2 border-[color:var(--color-border-strong)] bg-[color:var(--color-surface)] px-5 text-sm font-medium transition hover:bg-[color:var(--color-primary-soft)] disabled:opacity-60"
    >
      {loading ? "..." : "ログアウト"}
    </button>
  );
}
