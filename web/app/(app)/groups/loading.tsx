import { PageContainer, PageHeaderSkeleton, CardGridSkeleton, Skeleton } from "@/components/skeleton";

export default function GroupsLoading() {
  return (
    <PageContainer maxWidth="max-w-4xl">
      <PageHeaderSkeleton />

      <div className="mb-6">
        <CardGridSkeleton cards={4} />
      </div>

      {/* 招待コード入力フォーム */}
      <Skeleton className="h-32 w-full rounded-2xl" />
    </PageContainer>
  );
}
