"use client";

import { useMemo } from "react";
import type { Task, User, StatsResponse } from "@/shared/types";
import { useCategories, useCreateCategory } from "@/features/categories/hooks";
import { useDashboardStore, type DashboardView } from "@/features/dashboard/store";
import { ProjectSidebar } from "@/features/projects/components/project-sidebar";
import { useCreateProject, useToggleProjectFavorite, useArchiveProject, useUpdateProject, useDeleteProject } from "@/features/projects/hooks";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import {
  Inbox,
  Calendar,
  CalendarDays,
  Zap,
  Settings,
  LogOut,
  Plus,
  Brain,
  BarChart3,
  FolderOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";
import { ApiError } from "@/shared/lib/fetcher";

interface DashboardSidebarProps {
  user: User | null;
  stats: StatsResponse | null;
  tasks: Task[];
  onLogout: () => void;
}

export function DashboardSidebar({ user, stats, tasks, onLogout }: DashboardSidebarProps) {
  const router = useRouter();
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const createProject = useCreateProject();
  const toggleFavorite = useToggleProjectFavorite();
  const archiveProject = useArchiveProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const currentView = useDashboardStore((s) => s.currentView);
  const currentCategoryId = useDashboardStore((s) => s.currentCategoryId);
  const setView = useDashboardStore((s) => s.setView);
  const setCategory = useDashboardStore((s) => s.setCategory);

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

  const handleProjectsNavigation = () => {
    router.push("/projects");
  };

  const handleAddCategory = async () => {
    const name = window.prompt("Название нового листа / проекта:");
    if (!name || !name.trim()) return;
    try {
      const created = await createCategory.mutateAsync({ name: name.trim() });
      setCategory(created.id);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Не удалось создать категорию";
      toast.error(message);
    }
  };

  const handleCreateProject = () => {
    // This would open a more sophisticated project creation dialog
    handleAddCategory();
  };

  const handleProjectSelect = (projectId: string | null) => {
    setCategory(projectId);
    if (projectId) {
      setView("inbox");
    }
  };

  const handleProjectAction = async (action: string, projectId: string) => {
    try {
      switch (action) {
        case "toggleFavorite":
          await toggleFavorite.mutateAsync(projectId);
          break;
        case "archive":
          await archiveProject.mutateAsync(projectId);
          break;
        case "delete":
          if (window.confirm("Are you sure you want to delete this project?")) {
            await deleteProject.mutateAsync(projectId);
            if (currentCategoryId === projectId) {
              setCategory(null);
            }
          }
          break;
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Failed to perform action";
      toast.error(message);
    }
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div
          className="flex items-center gap-3 mb-4 cursor-pointer hover:opacity-80 transition"
          onClick={() => router.push("/profile")}
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
              onClick={() => setView(item.id)}
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
            onClick={() => setView("today")}
          >
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>Energy Focus</span>
          </Button>
        </div>

        <Separator className="my-4" />
        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-2">MANAGEMENT</p>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleProjectsNavigation}
          >
            <FolderOpen className="h-4 w-4 text-blue-500" />
            <span>Manage Projects</span>
          </Button>
        </div>

        <Separator className="my-4" />
        <ProjectSidebar
          projects={categories}
          selectedProjectId={currentCategoryId}
          onProjectSelect={handleProjectSelect}
          onCreateProject={handleCreateProject}
          onToggleFavorite={(id) => handleProjectAction("toggleFavorite", id)}
          onArchiveProject={(id) => handleProjectAction("archive", id)}
          onEditProject={(project) => {
            // TODO: Implement edit dialog
            const newName = window.prompt("Edit project name:", project.name);
            if (newName && newName.trim() && newName !== project.name) {
              updateProject.mutateAsync({ id: project.id, data: { name: newName.trim() } });
            }
          }}
          onDeleteProject={(id) => handleProjectAction("delete", id)}
        />
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
