import { PageContainer, PageHeaderSkeleton, Skeleton } from "@/components/skeleton";

export default function SettingsLoading() {
  return (
    <PageContainer maxWidth="max-w-2xl">
      <PageHeaderSkeleton withButton={false} />

      <div className="space-y-5">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </PageContainer>
  );
}
