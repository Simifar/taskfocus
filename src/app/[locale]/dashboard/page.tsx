import { DashboardLayout } from "@/features/dashboard/components/dashboard-layout";

export default function DashboardPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  return <DashboardLayout />;
}
