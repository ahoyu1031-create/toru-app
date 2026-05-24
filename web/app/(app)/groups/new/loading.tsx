import { PageContainer, PageHeaderSkeleton, Skeleton } from "@/components/skeleton";

export default function GroupNewLoading() {
  return (
    <PageContainer maxWidth="max-w-2xl">
      <PageHeaderSkeleton />
      <div className="space-y-3">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </div>
    </PageContainer>
  );
}
