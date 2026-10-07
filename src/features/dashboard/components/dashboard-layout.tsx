"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { AlertCircle, Loader2, Brain, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import type { Task } from "@/shared/types";
import { useCurrentUser, useLogout } from "@/features/auth/hooks";
import { useStats } from "@/features/stats/hooks";
import { findCachedTask, useTasks } from "@/features/tasks/hooks";
import type { TasksQuery } from "@/features/tasks/api";
import { useDashboardStore, useSelectedDate } from "@/features/dashboard/store";
import { toDateOnly } from "@/shared/lib/dates/date-only";
import { MAX_ACTIVE_TASKS_PER_DAY } from "@/shared/lib/task-limits";
import { useDashboardActions } from "@/features/dashboard/hooks/use-dashboard-actions";
import { getTaskAddTarget } from "@/features/dashboard/lib/task-add-target";
import { describeTaskSchedule } from "@/features/tasks/lib/task-row";

import { DashboardSidebar } from "./dashboard-sidebar";
import { MobileNavigation } from "./mobile-navigation";
import { TodayView } from "./today-view";
import { InboxView } from "./inbox-view";
import { WeekView } from "./week-view";
import { CalendarView } from "./calendar-view";
import { EisenhowerMatrixView } from "./eisenhower-matrix-view";
import { DayView } from "./day-view";
import { ArchiveView } from "./archive-view";
import { FocusMode } from "./focus-mode-dialog";
import { useFocusStore } from "@/features/dashboard/focus-store";
import { ViewSkeleton } from "./view-skeleton";
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
  const [weekDate, setWeekDate] = useState(() => new Date());

  const tasksQueryInput = useMemo<TasksQuery>(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const selectedDateOnly = selectedDate ? toDateOnly(selectedDate, timeZone) : undefined;

    if (currentView === "today") return { view: "today" };
    if (currentView === "inbox") return { view: "inbox" };
    if (currentView === "week") return { view: "week", date: toDateOnly(weekDate) };
    if (currentView === "calendar") return { view: "calendar", date: toDateOnly(calendarMonth, timeZone) };
    if (currentView === "day") return { view: "day", date: selectedDateOnly };
    if (currentView === "archive") return { view: "archive" };
    if (currentView === "matrix") return { status: "active" };

    return {};
  }, [calendarMonth, currentView, selectedDate, weekDate]);

  const tasksQuery = useTasks(tasksQueryInput);
  // Overdue tasks fall out of every date view, so Today surfaces them explicitly.
  const activeTasksQuery = useTasks({ status: "active" }, { enabled: currentView === "today" });
  const overdueTasks = useMemo(
    () =>
      (activeTasksQuery.data?.items ?? []).filter(
        (task) => !task.parentTaskId && describeTaskSchedule(task)?.tone === "overdue",
      ),
    [activeTasksQuery.data],
  );
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
    handleMoveToQuadrant,
    handleReorder,
    handleRestoreTask,
    handleScheduleTask,
    handleToggleCompleteTask,
    handleToggleSubtask,
  } = useDashboardActions();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [preSelectedDate, setPreSelectedDate] = useState<Date | undefined>(undefined);
  const [editingSnapshot, setEditingTask] = useState<Task | null>(null);
  const [dayReturnView, setDayReturnView] = useState<"today" | "week" | "calendar">("today");
  const [searchOpen, setSearchOpen] = useState(false);
  const queryClient = useQueryClient();
  const focusSession = useFocusStore((s) => s.session);
  const startFocus = useFocusStore((s) => s.start);
  // Resolve open sheets against the cache so they reflect optimistic edits live.
  const editingTask = editingSnapshot
    ? findCachedTask(queryClient, editingSnapshot.id) ?? editingSnapshot
    : null;
  const focusTask = focusSession ? findCachedTask(queryClient, focusSession.taskId) : null;

  useEffect(() => {
    if (currentView === "day" && !selectedDate) setView("today");
  }, [currentView, selectedDate, setView]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        return;
      }
      // "N" opens quick capture unless the user is typing or a dialog is open.
      const target = event.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, [contenteditable=true]");
      const dialogOpen = document.querySelector("[role=dialog], [role=alertdialog]");
      if (
        event.key.toLowerCase() === "n" &&
        !event.metaKey && !event.ctrlKey && !event.altKey &&
        !typing && !dialogOpen
      ) {
        event.preventDefault();
        addTaskRef.current();
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
  const isContentLoading = tasksQuery.isPending && !tasksQuery.data;

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      window.location.replace("/login");
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

  const handleAddTask = (requestedTarget?: unknown) => {
    const limitReached = (tasksQuery.data?.todayActiveCount ?? 0) >= MAX_ACTIVE_TASKS_PER_DAY;
    const target = getTaskAddTarget(requestedTarget, currentView, limitReached);

    if (target === "inbox") {
      setPreSelectedDate(undefined);
    } else if (requestedTarget === "today") {
      setPreSelectedDate(new Date());
    } else if (currentView === "day" && selectedDate) {
      setPreSelectedDate(selectedDate);
    } else {
      setPreSelectedDate(new Date());
    }
    setCreateDialogOpen(true);
  };

  const addTaskRef = useRef(handleAddTask);
  useEffect(() => {
    addTaskRef.current = handleAddTask;
  });

  const handleStartFocus = (task: Task) => startFocus(task);

  // Only auth blocks the whole screen; switching sections keeps the shell in place.
  if (isAuthLoading || isAuthError || !user) {
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
        currentView={currentView}
        dayReturnView={dayReturnView}
        onSearch={() => setSearchOpen(true)}
        onAddTask={() => handleAddTask()}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border px-4 md:hidden">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand">
              <Brain className="size-4 text-brand-foreground" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold">TaskFocus</span>
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="-mr-2 flex size-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Найти задачу"
          >
            <Search className="size-5" aria-hidden="true" />
          </button>
        </header>

        <main
          id="main"
          className={cn(
            "min-h-0 flex-1 overflow-auto px-4 pt-5 md:px-8 md:pt-8",
            focusSession ? "pb-28" : "pb-8",
          )}
        >
          {tasksQuery.isError && tasksQuery.data && (
            <div role="status" className="mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning-soft px-4 py-3 text-sm">
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
          ) : isContentLoading ? (
            <ViewSkeleton view={currentView} />
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
              onStartFocus={handleStartFocus}
              focusTaskId={focusSession?.taskId ?? null}
              overdueTasks={overdueTasks}
              onAssignToToday={handleAssignToToday}
              onOpenInbox={() => setView("inbox")}
            />
          )}

          {currentView === "inbox" && (
            <InboxView
              tasks={tasks}
              onEdit={setEditingTask}
              onStartFocus={handleStartFocus}
              onArchive={handleArchiveTask}
              onComplete={handleToggleCompleteTask}
              onDelete={handleDeleteTask}
              onAddTask={() => handleAddTask()}
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
              weekDate={weekDate}
              onWeekChange={setWeekDate}
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
              onScheduleTask={handleScheduleTask}
              onReorder={handleReorder}
            />
          )}

          {currentView === "calendar" && (
            <CalendarView
              tasks={tasks}
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
              onScheduleTask={handleScheduleTask}
              onReorder={handleReorder}
            />
          )}

          {currentView === "matrix" && (
            <EisenhowerMatrixView
              tasks={tasks}
              onAddTask={() => handleAddTask()}
              onEdit={setEditingTask}
              onArchive={handleArchiveTask}
              onComplete={handleToggleCompleteTask}
              onDelete={handleDeleteTask}
              onAssignToToday={handleAssignToToday}
              onAssignToWeek={handleAssignToWeek}
              onMoveToQuadrant={handleMoveToQuadrant}
              onStartFocus={handleStartFocus}
              onReorder={handleReorder}
            />
          )}

          {currentView === "day" && selectedDate && (
            <DayView
              tasks={tasks}
              selectedDate={selectedDate}
              onBack={handleBackFromDay}
              backLabel={{ today: "Сегодня", week: "Неделя", calendar: "Календарь" }[dayReturnView]}
              onChangeDay={(date) => setView("day", date)}
              onStartFocus={handleStartFocus}
              onEdit={setEditingTask}
              onArchive={handleArchiveTask}
              onComplete={handleToggleCompleteTask}
              onDelete={handleDeleteTask}
              onAddTask={() => handleAddTask()}
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
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
            />
          )}
          </>}
        </main>
        <MobileNavigation
          currentView={currentView}
          dayReturnView={dayReturnView}
          stats={stats}
          onNavigate={setView}
          onAddTask={() => handleAddTask()}
          onProfile={() => router.push("/profile")}
          onSettings={() => router.push("/settings")}
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
          key={editingTask.id}
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          onComplete={handleToggleCompleteTask}
          onArchive={handleArchiveTask}
          onRestore={handleRestoreTask}
          onDelete={handleDeleteTask}
          onStartFocus={handleStartFocus}
          onToggleSubtask={handleToggleSubtask}
          onAddSubtask={handleAddSubtask}
          onDeleteSubtask={handleDeleteSubtask}
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
      <FocusMode
        task={focusTask}
        onComplete={handleToggleCompleteTask}
        onToggleSubtask={handleToggleSubtask}
      />
    </div>
  );
}
