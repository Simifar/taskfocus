"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays } from "date-fns";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import type { Task } from "@/shared/types";
import { ApiError } from "@/shared/lib/fetcher";
import { useCurrentUser, useLogout } from "@/features/auth/hooks";
import { useStats } from "@/features/stats/hooks";
import {
  useCreateSubtask,
  useDeleteTask,
  useReorderTasks,
  useTasks,
  useToggleComplete,
  useUpdateTask,
} from "@/features/tasks/hooks";
import { useDashboardStore, useSelectedDate } from "@/features/dashboard/store";

import { DashboardSidebar } from "./dashboard-sidebar";
import { TodayView } from "./today-view";
import { InboxView } from "./inbox-view";
import { WeekView } from "./week-view";
import { CalendarView } from "./calendar-view";
import { DayView } from "./day-view";
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog";
import { EditTaskDialog } from "@/features/tasks/components/edit-task-dialog";

function reportError(err: unknown, fallback: string) {
  const message = err instanceof ApiError ? err.message : fallback;
  toast.error(message);
}

export function DashboardLayout() {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  const currentView = useDashboardStore((s) => s.currentView);
  const currentEnergy = useDashboardStore((s) => s.currentEnergy);
  const showCompleted = useDashboardStore((s) => s.showCompleted);
  const setEnergy = useDashboardStore((s) => s.setEnergy);
  const setShowCompleted = useDashboardStore((s) => s.setShowCompleted);
  const setView = useDashboardStore((s) => s.setView);
  const selectedDate = useSelectedDate();

  const tasksQuery = useTasks({});
  const statsQuery = useStats();

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const toggleComplete = useToggleComplete();
  const createSubtask = useCreateSubtask();
  const reorderTasks = useReorderTasks();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [preSelectedDate, setPreSelectedDate] = useState<Date | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!user) router.push("/");
  }, [user, router]);

  const tasks = tasksQuery.data?.items ?? [];
  const stats = statsQuery.data ?? null;
  const isLoading = tasksQuery.isLoading;

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      toast.success("Logged out");
      router.push("/");
    } catch (err) {
      reportError(err, "Logout failed");
    }
  };

  const handleToggleCompleteTask = async (task: Task) => {
    try {
      await toggleComplete.mutateAsync({
        id: task.id,
        completed: task.status !== "completed",
      });
      toast.success(
        task.status === "completed" ? "Task moved back" : "Task completed! ✨",
      );
    } catch (err) {
      reportError(err, "Failed to update task");
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    try {
      await updateTask.mutateAsync({ id: taskId, input: { status: "archived" } });
      toast.success("Task archived");
    } catch (err) {
      reportError(err, "Failed to archive");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask.mutateAsync(taskId);
      toast.success("Task deleted");
    } catch (err) {
      reportError(err, "Failed to delete");
    }
  };

  const handleAssignToToday = async (taskId: string) => {
    try {
      const today = new Date();
      await updateTask.mutateAsync({
        id: taskId,
        input: {
          dueDateStart: today.toISOString(),
          dueDateEnd: today.toISOString(),
        },
      });
      toast.success("Задача назначена на сегодня");
    } catch (err) {
      reportError(err, "Ошибка назначения задачи");
    }
  };

  const handleAssignToWeek = async (taskId: string) => {
    try {
      const today = new Date();
      const weekEnd = addDays(today, 7);
      await updateTask.mutateAsync({
        id: taskId,
        input: {
          dueDateStart: today.toISOString(),
          dueDateEnd: weekEnd.toISOString(),
        },
      });
      toast.success("Задача назначена на неделю");
    } catch (err) {
      reportError(err, "Ошибка назначения задачи");
    }
  };

  const handleToggleSubtask = async (subtask: Task) => {
    try {
      await toggleComplete.mutateAsync({
        id: subtask.id,
        completed: subtask.status !== "completed",
      });
      toast.success(
        subtask.status === "completed" ? "Subtask moved back" : "Subtask completed! ✨",
      );
    } catch (err) {
      reportError(err, "Failed to update subtask");
    }
  };

  const handleAddSubtask = async (parentId: string, title: string) => {
    try {
      await createSubtask.mutateAsync({ parentId, title });
      toast.success("Subtask added!");
    } catch (err) {
      reportError(err, "Failed to add subtask");
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      await deleteTask.mutateAsync(subtaskId);
      toast.success("Subtask deleted");
    } catch (err) {
      reportError(err, "Failed to delete subtask");
    }
  };

  const handleBatchArchive = async (taskIds: string[]) => {
    try {
      await Promise.all(
        taskIds.map(id => updateTask.mutateAsync({ id, input: { status: "archived" } }))
      );
      toast.success(`${taskIds.length} задач отправлено в архив`);
    } catch (err) {
      reportError(err, "Ошибка архивации задач");
    }
  };

  const handleBatchDelete = async (taskIds: string[]) => {
    try {
      await Promise.all(
        taskIds.map(id => deleteTask.mutateAsync(id))
      );
      toast.success(`${taskIds.length} задач удалено`);
    } catch (err) {
      reportError(err, "Ошибка удаления задач");
    }
  };

  const handleBatchAssignToToday = async (taskIds: string[]) => {
    try {
      const today = new Date();
      await Promise.all(
        taskIds.map(id => updateTask.mutateAsync({
          id,
          input: {
            dueDateStart: today.toISOString(),
            dueDateEnd: today.toISOString(),
          },
        }))
      );
      toast.success(`${taskIds.length} задач назначено на сегодня`);
    } catch (err) {
      reportError(err, "Ошибка назначения задач");
    }
  };

  const handleBatchAssignToWeek = async (taskIds: string[]) => {
    try {
      const today = new Date();
      const weekEnd = addDays(today, 7);
      await Promise.all(
        taskIds.map(id => updateTask.mutateAsync({
          id,
          input: {
            dueDateStart: today.toISOString(),
            dueDateEnd: weekEnd.toISOString(),
          },
        }))
      );
      toast.success(`${taskIds.length} задач назначено на неделю`);
    } catch (err) {
      reportError(err, "Ошибка назначения задач");
    }
  };

  const handleCreateTaskWithDate = (date: Date) => {
    setPreSelectedDate(date);
    setCreateDialogOpen(true);
  };

  const handleSelectDay = (date: Date) => {
    setView("day", date);
  };

  const handleBackFromDay = () => {
    setView("today");
  };

  const handleReorder = async (reordered: Task[]) => {
    try {
      await reorderTasks.mutateAsync({
        items: reordered.map((task, index) => ({ id: task.id, position: index })),
      });
    } catch (err) {
      reportError(err, "Не удалось сохранить порядок");
    }
  };

  const handleAddTask = () => {
    if (currentView === "inbox") {
      setPreSelectedDate(undefined);
    } else if (currentView === "day" && selectedDate) {
      setPreSelectedDate(selectedDate);
    } else {
      setPreSelectedDate(new Date());
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
      <DashboardSidebar
        user={user ?? null}
        stats={stats}
        tasks={tasks}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto p-6 md:p-8">
          {currentView === "today" && (
            <TodayView
              tasks={tasks}
              stats={stats}
              currentEnergy={currentEnergy}
              onEnergyChange={setEnergy}
              onEdit={setEditingTask}
              onArchive={handleArchiveTask}
              onComplete={handleToggleCompleteTask}
              onDelete={handleDeleteTask}
              onAddTask={handleAddTask}
              onReorder={handleReorder}
              showCompleted={showCompleted}
              onShowCompletedChange={setShowCompleted}
              onToggleSubtask={handleToggleSubtask}
              onAddSubtask={handleAddSubtask}
              onEditSubtask={setEditingTask}
              onDeleteSubtask={handleDeleteSubtask}
              isLoading={isLoading}
            />
          )}

          {currentView === "inbox" && (
            <InboxView
              tasks={tasks}
              stats={stats}
              onEdit={setEditingTask}
              onArchive={handleArchiveTask}
              onComplete={handleToggleCompleteTask}
              onDelete={handleDeleteTask}
              onAddTask={handleAddTask}
              onAssignToToday={handleAssignToToday}
              onAssignToWeek={handleAssignToWeek}
              onToggleSubtask={handleToggleSubtask}
              onAddSubtask={handleAddSubtask}
              onEditSubtask={setEditingTask}
              onDeleteSubtask={handleDeleteSubtask}
              onBatchArchive={handleBatchArchive}
              onBatchDelete={handleBatchDelete}
              onBatchAssignToToday={handleBatchAssignToToday}
              onBatchAssignToWeek={handleBatchAssignToWeek}
            />
          )}

          {currentView === "week" && (
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
              onEditSubtask={setEditingTask}
              onDeleteSubtask={handleDeleteSubtask}
            />
          )}

          {currentView === "calendar" && (
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
              onEditSubtask={setEditingTask}
              onDeleteSubtask={handleDeleteSubtask}
            />
          )}

          {currentView === "day" && selectedDate && (
            <DayView
              tasks={tasks}
              stats={stats}
              selectedDate={selectedDate}
              onBack={handleBackFromDay}
              onEdit={setEditingTask}
              onArchive={handleArchiveTask}
              onComplete={handleToggleCompleteTask}
              onDelete={handleDeleteTask}
              onAddTask={handleAddTask}
              onToggleSubtask={handleToggleSubtask}
              onAddSubtask={handleAddSubtask}
              onEditSubtask={setEditingTask}
              onDeleteSubtask={handleDeleteSubtask}
            />
          )}
        </div>
      </div>

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          if (!open) setPreSelectedDate(undefined);
          setCreateDialogOpen(open);
        }}
        preSelectedDate={preSelectedDate}
        defaultEnergy={currentEnergy}
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
