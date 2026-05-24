import { PageContainer, PageHeaderSkeleton, Skeleton } from "@/components/skeleton";

export default function UnitPriceNewLoading() {
  return (
    <PageContainer maxWidth="max-w-3xl">
      <PageHeaderSkeleton />
      <div className="space-y-3">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
    </PageContainer>
  );
}
