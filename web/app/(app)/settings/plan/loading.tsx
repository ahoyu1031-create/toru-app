import { PageContainer, PageHeaderSkeleton, Skeleton } from "@/components/skeleton";

export default function PlanLoading() {
  return (
    <PageContainer maxWidth="max-w-4xl">
      <PageHeaderSkeleton withButton={false} />
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    </PageContainer>
  );
}
