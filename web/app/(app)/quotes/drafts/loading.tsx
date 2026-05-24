import { PageContainer, PageHeaderSkeleton, ListSkeleton } from "@/components/skeleton";

export default function QuoteDraftsLoading() {
  return (
    <PageContainer maxWidth="max-w-5xl">
      <PageHeaderSkeleton />
      <ListSkeleton rows={5} />
    </PageContainer>
  );
}
