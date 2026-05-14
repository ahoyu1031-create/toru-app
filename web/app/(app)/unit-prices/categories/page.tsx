import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import Link from "next/link";

export default async function CategoriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="px-6 py-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
            カテゴリ管理
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            準備中です
          </p>
        </div>
        <Link
          href="/unit-prices"
          className="inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white"
          style={{ background: "var(--color-primary)" }}
        >
          単価一覧へ戻る
        </Link>
      </div>
    </div>
  );
}
