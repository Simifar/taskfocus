"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { ApiResponse, Task, TasksListResponse, StatsResponse } from "@/types";
import { useDashboardState, DashboardView } from "@/hooks/useDashboardState";
import { DashboardSidebar } from "./sidebar/dashboard-sidebar";
import { TodayView } from "./views/today-view";
import { InboxView } from "./views/inbox-view";
import { WeekView } from "./views/week-view";
import { CalendarView } from "./views/calendar-view";
import { DayView } from "./views/day-view";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function DashboardLayout() {
  const router = useRouter();
  const {
    user,
    tasks,
    setTasks,
    updateTask,
    removeTask,
    stats,
    setStats,
    logout: logoutStore,
  } = useAppStore();

  const { state, actions } = useDashboardState();
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [preSelectedDate, setPreSelectedDate] = useState<Date | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Authentication check
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Load tasks
        const tasksResponse = await fetch("/api/tasks");
        const tasksData: ApiResponse<TasksListResponse> = await tasksResponse.json();
        if (tasksData.success && tasksData.data) {
          setTasks(tasksData.data.items);
        }

        // Load stats
        const statsResponse = await fetch("/api/stats");
        const statsData: ApiResponse<StatsResponse> = await statsResponse.json();
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [setTasks, setStats]);

  // Handlers
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      logoutStore();
      toast.success("Logged out");
      router.push("/");
    } catch {
      toast.error("Logout failed");
    }
  };

  const handleToggleCompleteTask = async (task: Task) => {
    try {
      const nextStatus = task.status === "completed" ? "active" : "completed";
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data: ApiResponse<Task> = await response.json();

      if (data.success && data.data) {
        updateTask(task.id, data.data);
        toast.success(
          nextStatus === "completed" ? "Task completed! ✨" : "Task moved back"
        );

        // Refresh stats
        const statsResponse = await fetch("/api/stats");
        const statsData: ApiResponse<StatsResponse> = await statsResponse.json();
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      } else {
        toast.error(data.error?.message || "Failed to update task");
      }
    } catch {
      toast.error("Connection error");
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      const data: ApiResponse<Task> = await response.json();

      if (data.success && data.data) {
        updateTask(taskId, data.data);
        toast.success("Task archived");
      }
    } catch {
      toast.error("Failed to archive");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        removeTask(taskId);
        toast.success("Task deleted");
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleCreateTaskWithDate = (date: Date) => {
    setPreSelectedDate(date);
    setCreateDialogOpen(true);
  };

  const handleSelectDay = (date: Date) => {
    actions.setView("day", undefined, date);
  };

  const handleBackFromDay = () => {
    actions.setView("today");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      {/* Sidebar */}
      <DashboardSidebar
        user={user}
        stats={stats}
        tasks={tasks}
        currentView={state.currentView}
        onViewChange={(view: DashboardView) => actions.setView(view)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area with Padding */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          {state.currentView === "today" && (
            <TodayView
              tasks={tasks}
              stats={stats}
              currentEnergy={state.currentEnergy}
              onEnergyChange={actions.setEnergy}
              onEdit={setEditingTask}
              onArchive={handleArchiveTask}
              onComplete={handleToggleCompleteTask}
              onDelete={handleDeleteTask}
              onAddTask={() => setCreateDialogOpen(true)}
              isLoading={isLoading}
            />
          )}

          {state.currentView === "inbox" && (
            <InboxView
              tasks={tasks}
              stats={stats}
              onEdit={setEditingTask}
              onArchive={handleArchiveTask}
              onComplete={handleToggleCompleteTask}
              onDelete={handleDeleteTask}
            />
          )}

          {state.currentView === "week" && (
            <WeekView
              tasks={tasks}
              stats={stats}
              onEdit={setEditingTask}
              onArchive={handleArchiveTask}
              onComplete={handleToggleCompleteTask}
              onDelete={handleDeleteTask}
              onCreateTask={handleCreateTaskWithDate}
              onSelectDay={handleSelectDay}
            />
          )}

          {state.currentView === "calendar" && (
            <CalendarView
              tasks={tasks}
              stats={stats}
              onEdit={setEditingTask}
              onArchive={handleArchiveTask}
              onComplete={handleToggleCompleteTask}
              onDelete={handleDeleteTask}
              onCreateTask={handleCreateTaskWithDate}
              onSelectDay={handleSelectDay}
            />
          )}

          {state.currentView === "day" && state.selectedDate && (
            <DayView
              tasks={tasks}
              stats={stats}
              selectedDate={state.selectedDate}
              onBack={handleBackFromDay}
              onEdit={setEditingTask}
              onArchive={handleArchiveTask}
              onComplete={handleToggleCompleteTask}
              onDelete={handleDeleteTask}
              onAddTask={() => setCreateDialogOpen(true)}
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateTaskDialog 
        open={createDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setPreSelectedDate(undefined);
          }
          setCreateDialogOpen(open);
        }}
        preSelectedDate={preSelectedDate}
      />
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
        />
      )}
    </div>
  );
}
