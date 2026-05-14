import { PageContainer, PageHeaderSkeleton, Skeleton } from "@/components/skeleton";

export default function FeedbackLoading() {
  return (
    <PageContainer maxWidth="max-w-2xl">
      <PageHeaderSkeleton withButton={false} />
      <Skeleton className="mb-6 h-14 w-full rounded-xl" />
      <div className="space-y-5">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </PageContainer>
  );
}
