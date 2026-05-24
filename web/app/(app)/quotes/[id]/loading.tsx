import { PageContainer, PageHeaderSkeleton, Skeleton } from "@/components/skeleton";

export default function QuoteDetailLoading() {
  return (
    <PageContainer maxWidth="max-w-5xl">
      <PageHeaderSkeleton />
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </PageContainer>
  );
}
