import { PageContainer, PageHeaderSkeleton, Skeleton } from "@/components/skeleton";

export default function QuoteNewLoading() {
  return (
    <PageContainer maxWidth="max-w-5xl">
      <PageHeaderSkeleton withButton={false} />

      <div className="space-y-5">
        {/* 基本情報カード */}
        <Skeleton className="h-64 w-full rounded-2xl" />
        {/* 材料テーブル */}
        <Skeleton className="h-96 w-full rounded-2xl" />
        {/* 合計 */}
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    </PageContainer>
  );
}
