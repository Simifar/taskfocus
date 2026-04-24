"use client";

import { useCurrentUser } from "@/features/auth/hooks";
import { DashboardLayout as Dashboard } from "@/features/dashboard/components/dashboard-layout";
import { AuthPage } from "@/features/auth/components/auth-page";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-brand mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;
  return <Dashboard />;
}
