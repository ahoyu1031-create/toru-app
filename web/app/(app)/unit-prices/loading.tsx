import { PageContainer, PageHeaderSkeleton, Skeleton } from "@/components/skeleton";

export default function UnitPricesLoading() {
  return (
    <PageContainer maxWidth="max-w-5xl">
      <PageHeaderSkeleton />

      {/* 業種タブ */}
      <Skeleton className="mb-2 h-11 w-full rounded-xl" />

      {/* 検索 */}
      <Skeleton className="mb-4 h-10 w-full max-w-md rounded-lg" />

      {/* テーブル */}
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3"
            style={{ borderBottom: i < 7 ? "1px solid var(--color-border)" : "none" }}
          >
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-1/5" />
            </div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
