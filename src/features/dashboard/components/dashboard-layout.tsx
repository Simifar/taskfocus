"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Menu, Brain } from "lucide-react";

import type { Task } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { useCurrentUser, useLogout } from "@/features/auth/hooks";
import { useStats } from "@/features/stats/hooks";
import { useTasks } from "@/features/tasks/hooks";
import { useDashboardStore, useSelectedDate } from "@/features/dashboard/store";
import { useDashboardActions } from "@/features/dashboard/hooks/use-dashboard-actions";

import { DashboardSidebar } from "./dashboard-sidebar";
import { TodayView } from "./today-view";
import { InboxView } from "./inbox-view";
import { WeekView } from "./week-view";
import { CalendarView } from "./calendar-view";
import { EisenhowerMatrixView } from "./eisenhower-matrix-view";
import { DayView } from "./day-view";
import { ArchiveView } from "./archive-view";
import { CreateTaskDialog } from "@/features/tasks/components/create-task-dialog";
import { EditTaskDialog } from "@/features/tasks/components/edit-task-dialog";

export function DashboardLayout() {
  const router = useRouter();
  const { data: user, isLoading: isAuthLoading, isError: isAuthError } = useCurrentUser();
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
  const {
    handleAddSubtask,
    handleArchiveTask,
    handleAssignToToday,
    handleAssignToWeek,
    handleBatchArchive,
    handleBatchAssignToToday,
    handleBatchAssignToWeek,
    handleBatchDelete,
    handleDeleteSubtask,
    handleDeleteTask,
    handleReorder,
    handleRestoreTask,
    handleToggleCompleteTask,
    handleToggleSubtask,
  } = useDashboardActions();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [preSelectedDate, setPreSelectedDate] = useState<Date | undefined>(undefined);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dayReturnView, setDayReturnView] = useState<"today" | "week" | "calendar">("today");

  // Wait for auth to finish loading before deciding to redirect
  useEffect(() => {
    if (!isAuthLoading && (isAuthError || !user)) router.push("/");
  }, [user, isAuthLoading, isAuthError, router]);

  useEffect(() => {
    if (tasksQuery.isError) {
      toast.error("Не удалось загрузить задачи. Обновите страницу.");
    }
  }, [tasksQuery.isError]);

  const tasks = tasksQuery.data?.items ?? [];
  const stats = statsQuery.data ?? null;
  const isLoading = isAuthLoading || tasksQuery.isLoading;

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      toast.success("Вы вышли из аккаунта");
      router.push("/");
    } catch {
      toast.error("Не удалось выйти из аккаунта");
    }
  };

  const handleCreateTaskWithDate = (date: Date) => {
    setPreSelectedDate(date);
    setCreateDialogOpen(true);
  };

  const handleSelectDay = (date: Date) => {
    if (currentView === "week" || currentView === "calendar") {
      setDayReturnView(currentView);
    } else {
      setDayReturnView("today");
    }
    setView("day", date);
  };

  const handleBackFromDay = () => {
    setView(dayReturnView);
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

  // Show spinner while auth or data is loading, and while redirecting on auth failure
  if (isLoading || isAuthError || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* backdrop — always in DOM, transitions opacity so it syncs with sidebar slide */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setSidebarOpen(false)}
      />

      <DashboardSidebar
        user={user ?? null}
        stats={stats}
        tasks={tasks}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="md:hidden flex items-center gap-3 p-4 border-b border-border shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand rounded-lg">
              <Brain className="h-4 w-4 text-brand-foreground" />
            </div>
            <span className="font-bold text-base">TaskFocus</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8">
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
              onReorder={handleReorder}
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
              onReorder={handleReorder}
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
              onReorder={handleReorder}
            />
          )}

          {currentView === "matrix" && (
            <EisenhowerMatrixView
              tasks={tasks}
              onEdit={setEditingTask}
              onArchive={handleArchiveTask}
              onComplete={handleToggleCompleteTask}
              onDelete={handleDeleteTask}
              onAddTask={handleAddTask}
              onAssignToToday={handleAssignToToday}
              onAssignToWeek={handleAssignToWeek}
              onReorder={handleReorder}
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
              onReorder={handleReorder}
            />
          )}

          {currentView === "archive" && (
            <ArchiveView
              stats={stats}
              onRestore={handleRestoreTask}
              onDelete={handleDeleteTask}
              onReorder={handleReorder}
            />
          )}
        </div>
      </div>

      <CreateTaskDialog
        key={
          createDialogOpen
            ? `${preSelectedDate?.toISOString() ?? "no-date"}:${currentEnergy ?? "no-energy"}`
            : "closed"
        }
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
