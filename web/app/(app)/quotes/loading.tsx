import { PageContainer, PageHeaderSkeleton, ListSkeleton, Skeleton } from "@/components/skeleton";

export default function QuotesLoading() {
  return (
    <PageContainer maxWidth="max-w-5xl">
      <PageHeaderSkeleton />

      {/* フィルタピル */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />
        ))}
      </div>

      <ListSkeleton rows={6} />
    </PageContainer>
  );
}
