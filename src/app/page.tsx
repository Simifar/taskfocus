import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { DashboardLayout as Dashboard } from "@/features/dashboard/components/dashboard-layout";

export default async function Home() {
  if (!(await getCurrentUser())) redirect("/login");
  return <Dashboard />;
}
