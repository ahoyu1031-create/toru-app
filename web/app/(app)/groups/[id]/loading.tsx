import { PageContainer, PageHeaderSkeleton, Skeleton } from "@/components/skeleton";

export default function GroupDetailLoading() {
  return (
    <PageContainer maxWidth="max-w-5xl">
      <PageHeaderSkeleton />
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Skeleton className="h-72 rounded-xl md:col-span-2" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    </PageContainer>
  );
}
