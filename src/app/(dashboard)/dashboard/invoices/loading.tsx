import { DashboardListPageSkeleton } from "@/components/common/dashboard-page-skeleton";

export default function InvoicesLoading() {
  return <DashboardListPageSkeleton hasAction={false} summaryItems={4} />;
}
