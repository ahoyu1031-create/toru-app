import { PageContainer, PageHeaderSkeleton, Skeleton } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <PageContainer maxWidth="max-w-5xl">
      <PageHeaderSkeleton withButton={false} />

      {/* プランステータスバー */}
      <Skeleton className="mb-6 h-16 w-full rounded-2xl" />

      {/* 統計カード */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>

      {/* 最近の見積書 */}
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div
        className="overflow-hidden rounded-xl border"
        style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-4"
            style={{ borderBottom: i < 4 ? "1px solid var(--color-border)" : "none" }}
          >
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
