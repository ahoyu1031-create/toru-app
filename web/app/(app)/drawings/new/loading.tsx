import { PageContainer, PageHeaderSkeleton, Skeleton } from "@/components/skeleton";

export default function DrawingsNewLoading() {
  return (
    <PageContainer maxWidth="max-w-3xl">
      <PageHeaderSkeleton withButton={false} />
      <Skeleton className="mb-4 h-48 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </PageContainer>
  );
}
