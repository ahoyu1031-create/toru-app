import { PageContainer, PageHeaderSkeleton, Skeleton } from "@/components/skeleton";

export default function SettingsCompanyLoading() {
  return (
    <PageContainer maxWidth="max-w-2xl">
      <PageHeaderSkeleton />
      <Skeleton className="h-80 rounded-2xl" />
    </PageContainer>
  );
}
