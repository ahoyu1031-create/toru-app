import { PageContainer, PageHeaderSkeleton, Skeleton } from "@/components/skeleton";

export default function UnitPriceDetailLoading() {
  return (
    <PageContainer maxWidth="max-w-3xl">
      <PageHeaderSkeleton />
      <div className="space-y-3">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </PageContainer>
  );
}
