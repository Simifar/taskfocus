"use client";

import { User, Task } from "@/shared/types";
import { DashboardView } from "@/features/dashboard/hooks/use-dashboard-state";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Separator } from "@/shared/ui/separator";
import {
  Inbox,
  Calendar,
  CalendarDays,
  Zap,
  Settings,
  LogOut,
  Plus,
  Home,
  Brain,
  BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/utils";

interface DashboardSidebarProps {
  user: User | null;
  stats: any;
  tasks: Task[];
  currentView: DashboardView;
  currentCategory?: string;
  categories: string[];
  onViewChange: (view: DashboardView) => void;
  onCategorySelect: (category?: string) => void;
  onAddCategory: (category: string) => void;
  onLogout: () => void;
}

export function DashboardSidebar({
  user,
  stats,
  tasks,
  currentView,
  currentCategory,
  categories,
  onViewChange,
  onCategorySelect,
  onAddCategory,
  onLogout,
}: DashboardSidebarProps) {
  const router = useRouter();

  // Расчёт счётчиков
  const inboxCount = tasks.filter((t) => !t.dueDateStart && t.status === "active").length;
  const todayCount = tasks.filter((t) => {
    if (t.status !== "active") return false;
    if (!t.dueDateStart && !t.dueDateEnd) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const start = t.dueDateStart ? new Date(t.dueDateStart) : null;
    const end = t.dueDateEnd ? new Date(t.dueDateEnd) : null;
    
    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(0, 0, 0, 0);
    
    if (start && end) {
      return start <= today && today <= end;
    }
    if (start) {
      return start.getTime() === today.getTime();
    }
    return false;
  }).length;

  const weekCount = tasks.filter((t) => {
    if (t.status !== "active") return false;
    if (!t.dueDateStart && !t.dueDateEnd) return false;
    
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const start = t.dueDateStart ? new Date(t.dueDateStart) : null;
    const end = t.dueDateEnd ? new Date(t.dueDateEnd) : null;
    
    return start && start <= weekEnd;
  }).length;

  const navigationItems: Array<{
    id: DashboardView;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }> = [
    { id: "today", label: "Today", icon: <Calendar className="h-4 w-4" />, badge: todayCount },
    { id: "inbox", label: "Inbox", icon: <Inbox className="h-4 w-4" />, badge: inboxCount },
    { id: "week", label: "This Week", icon: <CalendarDays className="h-4 w-4" />, badge: weekCount },
    { id: "calendar", label: "Calendar", icon: <BarChart3 className="h-4 w-4" /> },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition" onClick={() => router.push("/profile")}>
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate">TaskFocus</h1>
            <p className="text-xs text-muted-foreground truncate">{user?.name || user?.username || "User"}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {/* Main Views */}
        <div className="space-y-2 mb-6">
          {navigationItems.map((item) => (
            <Button
              key={item.id}
              variant={currentView === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-between",
                currentView === item.id && "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
              onClick={() => onViewChange(item.id)}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="text-xs bg-white/20 px-2 py-1 rounded">
                  {item.badge}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Energy Focus */}
        <Separator className="my-4" />
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">QUICK FOCUS</p>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => onViewChange("today")}
          >
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>Energy Focus</span>
          </Button>
        </div>

        {/* Projects / Lists */}
        <Separator className="my-4" />
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">PROJECTS</p>
          <div className="space-y-1">
            <Button
              variant={!currentCategory ? "default" : "ghost"}
              className={cn(
                "w-full justify-start text-sm",
                !currentCategory && "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
              onClick={() => onCategorySelect(undefined)}
            >
              <span>All projects</span>
            </Button>
            {categories.length > 0 ? (
              categories.map((category) => (
                <Button
                  key={category}
                  variant={currentCategory === category ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-between text-sm",
                    currentCategory === category && "bg-emerald-600 hover:bg-emerald-700 text-white"
                  )}
                  onClick={() => onCategorySelect(category)}
                >
                  <span>{category}</span>
                  {currentCategory === category && <span className="text-xs bg-white/20 px-2 py-1 rounded">Selected</span>}
                </Button>
              ))
            ) : (
              <Button
                variant="ghost"
                className="w-full justify-start text-sm"
                disabled
              >
                <span className="text-muted-foreground">No projects yet</span>
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full justify-start text-sm gap-2"
              onClick={() => {
                const name = window.prompt("Название нового листа / проекта:");
                if (name && name.trim()) {
                  onAddCategory(name.trim());
                }
              }}
            >
              <Plus className="h-3 w-3" />
              <span className="text-xs">Add Project</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
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

      {/* Stats Footer */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-3">
        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Active:</span>
            <span className="font-semibold">{stats?.activeTasks || 0}/3</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Done:</span>
            <span className="font-semibold">{stats?.completedTasks || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Archived:</span>
            <span className="font-semibold">{stats?.archivedTasks || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
