"use client";

import { useMemo } from "react";
import type { Task, User, StatsResponse } from "@/shared/types";
import { useDashboardStore, type DashboardView } from "@/features/dashboard/store";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import {
  Inbox,
  Calendar,
  CalendarDays,
  Zap,
  Settings,
  LogOut,
  Brain,
  BarChart3,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/utils";

interface DashboardSidebarProps {
  user: User | null;
  stats: StatsResponse | null;
  tasks: Task[];
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ user, stats, tasks, onLogout, isOpen = false, onClose }: DashboardSidebarProps) {
  const router = useRouter();

  const currentView = useDashboardStore((s) => s.currentView);
  const setView = useDashboardStore((s) => s.setView);

  const counts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    let inboxCount = 0;
    let todayCount = 0;
    let weekCount = 0;

    for (const t of tasks) {
      if (t.status !== "active") continue;

      if (!t.dueDateStart) {
        inboxCount += 1;
        continue;
      }

      const start = new Date(t.dueDateStart);
      start.setHours(0, 0, 0, 0);
      const end = t.dueDateEnd ? new Date(t.dueDateEnd) : null;
      if (end) end.setHours(0, 0, 0, 0);

      if (end ? start <= today && today <= end : start.getTime() === today.getTime()) {
        todayCount += 1;
      }

      if (start <= weekEnd) weekCount += 1;
    }

    return { inboxCount, todayCount, weekCount };
  }, [tasks]);

  const navigationItems: Array<{
    id: DashboardView;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    { id: "today", label: "Today", icon: <Calendar className="h-4 w-4" />, badge: counts.todayCount },
    { id: "inbox", label: "Inbox", icon: <Inbox className="h-4 w-4" />, badge: counts.inboxCount },
    { id: "week", label: "This Week", icon: <CalendarDays className="h-4 w-4" />, badge: counts.weekCount },
    { id: "calendar", label: "Calendar", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  const handleNavClick = (view: DashboardView) => {
    setView(view);
    onClose?.();
  };

  return (
    <div
      className={cn(
        "w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen",
        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out",
        "md:relative md:z-auto md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
      )}
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
        <div
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
          onClick={() => { router.push("/profile"); onClose?.(); }}
        >
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate">TaskFocus</h1>
            <p className="text-xs text-muted-foreground truncate">
              {user?.name || user?.username || "User"}
            </p>
          </div>
        </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-8 w-8 shrink-0"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-2 mb-6">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant={currentView === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-between",
                currentView === item.id && "bg-emerald-600 hover:bg-emerald-700 text-white",
              )}
              onClick={() => handleNavClick(item.id)}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="text-xs bg-white/20 px-2 py-1 rounded">{item.badge}</span>
              )}
            </Button>
          ))}
        </div>

        <Separator className="my-4" />
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">QUICK FOCUS</p>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => handleNavClick("today")}
          >
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>Energy Focus</span>
          </Button>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 p-3 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-sm gap-2"
          onClick={() => router.push("/profile")}
        >
          <Settings className="h-4 w-4" />
          <span>Profile</span>
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-sm gap-2"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-800 p-3">
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Active:</span>
            <span className="font-semibold">{stats?.activeTasks ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Done:</span>
            <span className="font-semibold">{stats?.completedTasks ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Archived:</span>
            <span className="font-semibold">{stats?.archivedTasks ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
