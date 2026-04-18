"use client";

import { useCurrentUser } from "@/features/auth/hooks";
import { DashboardLayout as Dashboard } from "@/features/dashboard/components/dashboard-layout";
import { AuthPage } from "@/features/auth/components/auth-page";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;
  return <Dashboard />;
}
