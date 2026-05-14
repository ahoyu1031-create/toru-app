import { PageContainer, PageHeaderSkeleton, ListSkeleton, Skeleton } from "@/components/skeleton";

export default function DrawingsLoading() {
  return (
    <PageContainer maxWidth="max-w-5xl">
      <PageHeaderSkeleton />

      {/* 業種フィルタピル */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full" />
        ))}
      </div>

      <ListSkeleton rows={5} />
    </PageContainer>
  );
}
