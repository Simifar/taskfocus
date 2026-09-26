"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertCircle, Loader2, Brain, Search } from "lucide-react";

import type { Task } from "@/shared/types";
import { useCurrentUser, useLogout } from "@/features/auth/hooks";
import { useStats } from "@/features/stats/hooks";
import { useTasks } from "@/features/tasks/hooks";
import type { TasksQuery } from "@/features/tasks/api";
import { useDashboardStore, useSelectedDate } from "@/features/dashboard/store";
import { toDateOnly } from "@/shared/lib/dates/date-only";
import { MAX_ACTIVE_TASKS_PER_DAY } from "@/shared/lib/task-limits";
import { useDashboardActions } from "@/features/dashboard/hooks/use-dashboard-actions";

import { DashboardSidebar } from "./dashboard-sidebar";
import { MobileNavigation } from "./mobile-navigation";
import { TodayView } from "./today-view";
import { InboxView } from "./inbox-view";
import { WeekView } from "./week-view";
import { CalendarView } from "./calendar-view";
import { EisenhowerMatrixView } from "./eisenhower-matrix-view";
import { DayView } from "./day-view";
import { ArchiveView } from "./archive-view";
import { FocusModeDialog } from "./focus-mode-dialog";
import { TaskSearchDialog } from "./task-search-dialog";
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
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const tasksQueryInput = useMemo<TasksQuery>(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const selectedDateOnly = selectedDate ? toDateOnly(selectedDate, timeZone) : undefined;

    if (currentView === "today") return { view: "today" };
    if (currentView === "inbox") return { view: "inbox" };
    if (currentView === "week") return { view: "week" };
    if (currentView === "calendar") return { view: "calendar", date: toDateOnly(calendarMonth, timeZone) };
    if (currentView === "day") return { view: "day", date: selectedDateOnly };
    if (currentView === "archive") return { view: "archive" };
    if (currentView === "matrix") return { status: "active" };

    return {};
  }, [calendarMonth, currentView, selectedDate]);

  const tasksQuery = useTasks(tasksQueryInput);
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
  const [dayReturnView, setDayReturnView] = useState<"today" | "week" | "calendar">("today");
  const [searchOpen, setSearchOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [focusTask, setFocusTask] = useState<Task | null>(null);

  useEffect(() => {
    if (currentView === "day" && !selectedDate) setView("today");
  }, [currentView, selectedDate, setView]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Wait for auth to finish loading before deciding to redirect
  useEffect(() => {
    if (!isAuthLoading && (isAuthError || !user)) router.push("/login");
  }, [user, isAuthLoading, isAuthError, router]);

  const tasks = tasksQuery.data?.items ?? [];
  const stats = statsQuery.data ?? null;
  const isLoading = isAuthLoading || tasksQuery.isLoading;

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      toast.success("Вы вышли из аккаунта");
      router.push("/login");
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

  const handleAddTask = (target?: "today" | "inbox") => {
    const limitReached = (tasksQuery.data?.todayActiveCount ?? 0) >= MAX_ACTIVE_TASKS_PER_DAY;
    if (
      target === "inbox" ||
      (target === undefined && (currentView === "inbox" || (currentView === "today" && limitReached)))
    ) {
      setPreSelectedDate(undefined);
    } else if (target === "today") {
      setPreSelectedDate(new Date());
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
    <div className="flex h-dvh overflow-hidden bg-background">
      <DashboardSidebar
        user={user ?? null}
        stats={stats}
        onSearch={() => setSearchOpen(true)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 md:hidden">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand rounded-lg">
              <Brain className="h-4 w-4 text-brand-foreground" />
            </div>
            <span className="font-bold text-base">TaskFocus</span>
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-brand"
            aria-label="Найти задачу"
          >
            <Search className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto p-4 md:p-8">
          {tasksQuery.isError && tasksQuery.data && (
            <div role="status" className="mx-auto mb-4 flex max-w-5xl items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm">
              <span>Не удалось обновить список. Показаны сохранённые данные.</span>
              <button type="button" className="shrink-0 font-medium underline underline-offset-4" onClick={() => void tasksQuery.refetch()}>Повторить</button>
            </div>
          )}
          {tasksQuery.isError && !tasksQuery.data ? (
            <section role="alert" className="mx-auto mt-10 max-w-lg rounded-2xl border border-border bg-card px-5 py-8 text-center">
              <AlertCircle className="mx-auto size-8 text-destructive" aria-hidden="true" />
              <h1 className="mt-4 text-xl font-semibold">Не удалось загрузить задачи</h1>
              <p className="mt-2 text-sm text-muted-foreground">Проверьте соединение и попробуйте ещё раз. Список не был заменён пустым состоянием.</p>
              <button type="button" className="mt-5 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90" onClick={() => void tasksQuery.refetch()}>Повторить загрузку</button>
            </section>
          ) : <>
          {currentView === "today" && (
            <TodayView
              tasks={tasks}
              currentEnergy={currentEnergy}
              onEnergyChange={setEnergy}
              onEdit={setEditingTask}
              onArchive={handleArchiveTask}
              onComplete={handleToggleCompleteTask}
              onDelete={handleDeleteTask}
              todayActiveCount={tasksQuery.data?.todayActiveCount}
              onAddTask={handleAddTask}
              onReorder={handleReorder}
              showCompleted={showCompleted}
              onShowCompletedChange={setShowCompleted}
              onToggleSubtask={handleToggleSubtask}
              onAddSubtask={handleAddSubtask}
              onEditSubtask={setEditingTask}
              onDeleteSubtask={handleDeleteSubtask}
              isLoading={isLoading}
              onStartFocus={(task) => {
                setFocusTask(task);
                setFocusOpen(true);
              }}
            />
          )}

          {currentView === "inbox" && (
            <InboxView
              tasks={tasks}
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
              currentMonth={calendarMonth}
              onMonthChange={setCalendarMonth}
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
              tasks={tasks}
              isLoading={tasksQuery.isLoading}
              stats={stats}
              onRestore={handleRestoreTask}
              onDelete={handleDeleteTask}
            />
          )}
          </>}
        </div>
        <MobileNavigation
          currentView={currentView}
          dayReturnView={dayReturnView}
          stats={stats}
          onNavigate={setView}
          onAddTask={handleAddTask}
          onProfile={() => router.push("/profile")}
          onLogout={() => void handleLogout()}
        />
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
      <TaskSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onEdit={setEditingTask}
        onComplete={handleToggleCompleteTask}
        onArchive={handleArchiveTask}
        onDelete={handleDeleteTask}
      />
      <FocusModeDialog
        open={focusOpen}
        task={focusTask}
        onOpenChange={setFocusOpen}
        onComplete={handleToggleCompleteTask}
      />
    </div>
  );
}
