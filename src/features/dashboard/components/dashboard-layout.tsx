"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/features/dashboard/store";
import { ApiResponse, Task, TasksListResponse, StatsResponse } from "@/shared/types";
import { useDashboardState, DashboardView } from "@/features/dashboard/hooks/use-dashboard-state";
import { DashboardSidebar } from "./sidebar/dashboard-sidebar";
import { TodayView } from "./views/today-view";
import { InboxView } from "./views/inbox-view";
import { WeekView } from "./views/week-view";
import { CalendarView } from "./views/calendar-view";
import { DayView } from "./views/day-view";
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog";
import { EditTaskDialog } from "@/features/tasks/components/edit-task-dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { addDays } from "date-fns";

export function DashboardLayout() {
  const router = useRouter();
  const {
    user,
    tasks,
    setTasks,
    updateTask,
    removeTask,
    addSubtask,
    updateSubtask,
    removeSubtask,
    stats,
    setStats,
    logout: logoutStore,
  } = useAppStore();

  const { state, actions } = useDashboardState();
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [preSelectedDate, setPreSelectedDate] = useState<Date | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredTasks = state.currentCategory
    ? tasks.filter((task) => task.category === state.currentCategory)
    : tasks;

  // Authentication check
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
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

  const handleAssignToToday = async (taskId: string) => {
    try {
      const today = new Date();
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueDateStart: today.toISOString(),
          dueDateEnd: today.toISOString(),
        }),
      });
      const data: ApiResponse<Task> = await response.json();

      if (data.success && data.data) {
        updateTask(taskId, data.data);
        toast.success("Задача назначена на сегодня");

        // Refresh stats
        const statsResponse = await fetch("/api/stats");
        const statsData: ApiResponse<StatsResponse> = await statsResponse.json();
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      } else {
        toast.error(data.error?.message || "Ошибка назначения задачи");
      }
    } catch {
      toast.error("Ошибка соединения");
    }
  };

  const handleAssignToWeek = async (taskId: string) => {
    try {
      const today = new Date();
      const weekEnd = addDays(today, 7);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueDateStart: today.toISOString(),
          dueDateEnd: weekEnd.toISOString(),
        }),
      });
      const data: ApiResponse<Task> = await response.json();

      if (data.success && data.data) {
        updateTask(taskId, data.data);
        toast.success("Задача назначена на неделю");

        // Refresh stats
        const statsResponse = await fetch("/api/stats");
        const statsData: ApiResponse<StatsResponse> = await statsResponse.json();
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      } else {
        toast.error(data.error?.message || "Ошибка назначения задачи");
      }
    } catch {
      toast.error("Ошибка соединения");
    }
  };

  const handleReorderTasks = (reorderedTasks: Task[]) => {
    setTasks(reorderedTasks);
  };

  // Subtask handlers
  const handleToggleSubtask = async (subtask: Task) => {
    try {
      const nextStatus = subtask.status === "completed" ? "active" : "completed";
      const response = await fetch(`/api/tasks/${subtask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data: ApiResponse<Task> = await response.json();

      if (data.success && data.data) {
        updateSubtask(subtask.id, data.data);
        toast.success(
          nextStatus === "completed" ? "Subtask completed! ✨" : "Subtask moved back"
        );
      } else {
        toast.error(data.error?.message || "Failed to update subtask");
      }
    } catch {
      toast.error("Connection error");
    }
  };

  const handleAddSubtask = async (parentId: string, title: string) => {
    try {
      const response = await fetch("/api/subtasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId: parentId, title }),
      });
      const data: ApiResponse<Task> = await response.json();

      if (data.success && data.data) {
        addSubtask(parentId, data.data);
        toast.success("Subtask added!");
      } else {
        toast.error(data.error?.message || "Failed to add subtask");
      }
    } catch {
      toast.error("Connection error");
    }
  };

  const handleEditSubtask = async (subtask: Task) => {
    setEditingTask(subtask);
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${subtaskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        removeSubtask(subtaskId);
        toast.success("Subtask deleted");
      }
    } catch {
      toast.error("Failed to delete subtask");
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

  const handleAddTask = () => {
    // For inbox view, don't set a date so tasks are created without dates
    if (state.currentView === "inbox") {
      setPreSelectedDate(undefined);
    } else {
      // If we're in day view, use the selected date, otherwise use today
      const dateToUse = state.currentView === "day" && state.selectedDate 
        ? state.selectedDate 
        : new Date();
      setPreSelectedDate(dateToUse);
    }
    setCreateDialogOpen(true);
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
        tasks={filteredTasks}
        currentView={state.currentView}
        currentCategory={state.currentCategory}
        categories={state.categories}
        onViewChange={(view: DashboardView) => actions.setView(view)}
        onCategorySelect={(category) => actions.setCategory(category)}
        onAddCategory={(category) => actions.addCategory(category)}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area with Padding */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          {state.currentCategory && (
            <div className="mb-4 flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">
              <span className="font-semibold">Project:</span>
              <span>{state.currentCategory}</span>
            </div>
          )}
          {state.currentView === "today" && (
            <TodayView
              tasks={filteredTasks}
              stats={stats}
              currentEnergy={state.currentEnergy}
              onEnergyChange={actions.setEnergy}
              onEdit={setEditingTask}
              onArchive={handleArchiveTask}
              onComplete={handleToggleCompleteTask}
              onDelete={handleDeleteTask}
              onAddTask={handleAddTask}
              onReorder={handleReorderTasks}
              showCompleted={state.showCompleted}
              onShowCompletedChange={actions.setShowCompleted}
              onToggleSubtask={handleToggleSubtask}
              onAddSubtask={handleAddSubtask}
              onEditSubtask={handleEditSubtask}
              onDeleteSubtask={handleDeleteSubtask}
              isLoading={isLoading}
            />
          )}

          {state.currentView === "inbox" && (
            <InboxView
              tasks={filteredTasks}
              stats={stats}
              currentCategory={state.currentCategory}
              onEdit={setEditingTask}
              onArchive={handleArchiveTask}
              onComplete={handleToggleCompleteTask}
              onDelete={handleDeleteTask}
              onAddTask={handleAddTask}
              onAssignToToday={handleAssignToToday}
              onAssignToWeek={handleAssignToWeek}
              onToggleSubtask={handleToggleSubtask}
              onAddSubtask={handleAddSubtask}
              onEditSubtask={handleEditSubtask}
              onDeleteSubtask={handleDeleteSubtask}
            />
          )}

          {state.currentView === "week" && (
            <WeekView
              tasks={filteredTasks}
              stats={stats}
              onEdit={setEditingTask}
              onArchive={handleArchiveTask}
              onComplete={handleToggleCompleteTask}
              onDelete={handleDeleteTask}
              onCreateTask={handleCreateTaskWithDate}
              onSelectDay={handleSelectDay}
              onToggleSubtask={handleToggleSubtask}
              onAddSubtask={handleAddSubtask}
              onEditSubtask={handleEditSubtask}
              onDeleteSubtask={handleDeleteSubtask}
            />
          )}

          {state.currentView === "calendar" && (
            <CalendarView
              tasks={filteredTasks}
              stats={stats}
              onEdit={setEditingTask}
              onArchive={handleArchiveTask}
              onComplete={handleToggleCompleteTask}
              onDelete={handleDeleteTask}
              onCreateTask={handleCreateTaskWithDate}
              onSelectDay={handleSelectDay}
              onToggleSubtask={handleToggleSubtask}
              onAddSubtask={handleAddSubtask}
              onEditSubtask={handleEditSubtask}
              onDeleteSubtask={handleDeleteSubtask}
            />
          )}

          {state.currentView === "day" && state.selectedDate && (
            <DayView
              tasks={filteredTasks}
              stats={stats}
              selectedDate={state.selectedDate}
              onBack={handleBackFromDay}
              onEdit={setEditingTask}
              onArchive={handleArchiveTask}
              onComplete={handleToggleCompleteTask}
              onDelete={handleDeleteTask}
              onAddTask={handleAddTask}
              onToggleSubtask={handleToggleSubtask}
              onAddSubtask={handleAddSubtask}
              onEditSubtask={handleEditSubtask}
              onDeleteSubtask={handleDeleteSubtask}
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
        categories={state.categories}
        currentCategory={state.currentCategory}
      />
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          categories={state.categories}
          onOpenChange={(open) => !open && setEditingTask(null)}
        />
      )}
    </div>
  );
}
