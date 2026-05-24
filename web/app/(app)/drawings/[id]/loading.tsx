import { PageContainer, PageHeaderSkeleton, Skeleton } from "@/components/skeleton";

export default function DrawingDetailLoading() {
  return (
    <PageContainer maxWidth="max-w-4xl">
      <PageHeaderSkeleton />
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    </PageContainer>
  );
}
