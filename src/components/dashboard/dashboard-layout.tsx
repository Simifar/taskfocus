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
        // Load tasks
        const tasksResponse = await fetch("/api/tasks");
        const tasksData: ApiResponse<TasksListResponse> = await tasksResponse.json();
        if (tasksData.success && tasksData.data) {
          let tasks = tasksData.data.items;
          
          // Если нет задач, добавляем тестовую задачу с подзадачей
          if (tasks.length === 0) {
            const userId = user.id;
            const testTask = {
              id: "test-task-1",
              userId,
              title: "Тестовая задача с подзадачами",
              description: "Это тестовая задача для проверки функциональности подзадач",
              status: "active" as const,
              priority: "medium" as const,
              energyLevel: 3,
              dueDateStart: new Date().toISOString(),
              dueDateEnd: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              parentTaskId: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              completedAt: null,
              subtasks: [
                {
                  id: "test-subtask-1",
                  userId,
                  title: "Подзадача 1",
                  description: "Первая подзадача",
                  status: "active" as const,
                  priority: "low" as const,
                  energyLevel: 2,
                  dueDateStart: null,
                  dueDateEnd: null,
                  parentTaskId: "test-task-1",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  completedAt: null,
                  subtasks: []
                },
                {
                  id: "test-subtask-2", 
                  userId,
                  title: "Подзадача 2",
                  description: "Вторая подзадача",
                  status: "completed" as const,
                  priority: "low" as const,
                  energyLevel: 2,
                  dueDateStart: null,
                  dueDateEnd: null,
                  parentTaskId: "test-task-1",
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  completedAt: new Date().toISOString(),
                  subtasks: []
                }
              ]
            };
            tasks = [testTask];
          }
          
          setTasks(tasks);
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

  // Handle task reordering
  const handleReorderTasks = (reorderedTasks: Task[]) => {
    console.log("📋 handleReorderTasks called in dashboard-layout");
    console.log("  Reordered tasks:", reorderedTasks.map(t => ({ id: t.id, title: t.title })));
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
              tasks={tasks}
              stats={stats}
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
              onToggleSubtask={handleToggleSubtask}
              onAddSubtask={handleAddSubtask}
              onEditSubtask={handleEditSubtask}
              onDeleteSubtask={handleDeleteSubtask}
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
              onToggleSubtask={handleToggleSubtask}
              onAddSubtask={handleAddSubtask}
              onEditSubtask={handleEditSubtask}
              onDeleteSubtask={handleDeleteSubtask}
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
