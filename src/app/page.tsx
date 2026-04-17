"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { ApiResponse, User } from "@/types";
import { DashboardLayout as Dashboard } from "@/components/dashboard/dashboard-layout";
import { AuthPage } from "@/components/auth/auth-page";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, setUser, isAuthenticated } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Проверяем авторизацию при загрузке
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data: ApiResponse<User> = await response.json();

        if (data.success && data.data) {
          setUser(data.data);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setUser]);

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

  if (!isAuthenticated || !user) {
    return <AuthPage />;
  }

  return <Dashboard />;
}
