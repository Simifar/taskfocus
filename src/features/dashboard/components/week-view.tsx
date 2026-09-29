"use client";

import type { Task } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import { SortableTasksBoard, type SortableTaskGroup, type TaskGroupMove } from "@/features/tasks/components/sortable-tasks-board";
import { TaskRow } from "@/features/tasks/components/task-row";
import { mergeReorderedTasks } from "@/features/tasks/lib/reorder";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { addDays, endOfDay, format, isPast, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import {
  getCurrentWeekRange,
  isTaskScheduledForWeek,
  isTaskScheduledForDay,
} from "@/features/dashboard/lib/task-date-filters";
import { getPlannedRootTasks } from "@/features/dashboard/lib/plan";
import { MAX_ACTIVE_TASKS_PER_DAY } from "@/shared/lib/task-limits";
import { toast } from "sonner";

interface WeekViewProps {
  tasks: Task[];
  weekDate: Date;
  onWeekChange?: (date: Date) => void;
  onEdit?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onCreateTask?: (date: Date) => void;
  onSelectDay?: (date: Date) => void;
  onToggleSubtask?: (subtask: Task) => void;
  onAddSubtask?: (parentId: string, title: string) => void;
  onEditSubtask?: (subtask: Task) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
  onScheduleTask?: (taskId: string, date: Date) => void;
  onReorder?: (tasks: Task[]) => void;
}

export function WeekView({
  tasks,
  weekDate,
  onWeekChange,
  onEdit,
  onComplete,
  onArchive,
  onDelete,
  onCreateTask,
  onSelectDay,
  onScheduleTask,
  onReorder,
}: WeekViewProps) {
  const { start: weekStart, end: weekEnd } = getCurrentWeekRange(weekDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  const weekTasks = getPlannedRootTasks(tasks, (task) => isTaskScheduledForWeek(task, weekDate));

  const tasksByDay = weekDays.map((day) => ({
    date: day,
    tasks: weekTasks.filter((task) => isTaskScheduledForDay(task, day)),
  }));

  const busyDays = tasksByDay.filter((day) => day.tasks.length > 0).length;
  const totalTasks = weekTasks.length;
  const groups: SortableTaskGroup[] = tasksByDay.map(({ date, tasks: dayTasks }) => {
    const isToday = isSameDay(date, today);
    const isDayPast = isPast(endOfDay(date)) && !isToday;
    const activeDayCount = dayTasks.filter((task) => task.status === "active").length;
    const dayLabel = format(date, "EEEE", { locale: ru });
    const dayNum = format(date, "d");
    const monthLabel = format(date, "MMM", { locale: ru });
    const dateId = format(date, "yyyy-MM-dd");

    return {
      id: dateId,
      tasks: dayTasks,
      className: cn(
        "min-h-[180px] overflow-hidden rounded-xl border bg-card transition-colors hover:border-brand/35",
        isToday && "border-brand/60 ring-2 ring-brand/20",
        isDayPast && dayTasks.length === 0 && "opacity-60",
      ),
      contentClassName: "space-y-2 p-2",
      header: (
        <div className={cn("flex", isToday ? "bg-brand text-brand-foreground" : "bg-muted/45")}>
          <button
            type="button"
            className="min-w-0 flex-1 px-3 py-3 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            onClick={() => onSelectDay?.(date)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold leading-none">{dayNum}</span>
                  <span className={cn("text-xs uppercase", isToday ? "text-brand-foreground/75" : "text-muted-foreground")}>
                    {monthLabel}
                  </span>
                </div>
                <p className="mt-1 text-sm font-semibold capitalize">{dayLabel}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {isToday && <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">сегодня</span>}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                    isToday ? "bg-white/20" : "bg-background text-foreground",
                    activeDayCount >= MAX_ACTIVE_TASKS_PER_DAY && "text-warning",
                  )}
                  aria-label={`${activeDayCount} активных из ${MAX_ACTIVE_TASKS_PER_DAY}`}
                >
                  {activeDayCount}/{MAX_ACTIVE_TASKS_PER_DAY}
                </span>
              </div>
            </div>
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-auto w-11 shrink-0 rounded-none border-l border-border/60",
              isToday ? "text-brand-foreground hover:bg-white/10 hover:text-brand-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            aria-label={`Добавить задачу на ${format(date, "d MMMM", { locale: ru })}`}
            title={`Добавить задачу на ${format(date, "d MMMM", { locale: ru })}`}
            onClick={() => onCreateTask?.(date)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      ),
      empty: (
        <div className="flex min-h-[76px] w-full flex-col items-center justify-center rounded-xl bg-muted/20 px-3 text-center">
          <CheckCircle2 className="mb-2 h-6 w-6 text-muted-foreground/50" aria-hidden="true" />
          <span className="text-sm font-medium text-muted-foreground">{isDayPast ? "Нет задач" : "Свободный день"}</span>
          {!isDayPast && <span className="mt-1 text-xs text-muted-foreground/70">Перетащите задачу сюда или добавьте через «+»</span>}
        </div>
      ),
    };
  });

  const handleBoardChange = (nextGroups: SortableTaskGroup[], move?: TaskGroupMove) => {
    if (move) {
      const destinationGroup = nextGroups.find((group) => group.id === move.toGroupId);
      const destinationAlreadyContainsTask = tasksByDay
        .find(({ date }) => format(date, "yyyy-MM-dd") === move.toGroupId)
        ?.tasks.some((task) => task.id === move.task.id) ?? false;
      const destinationActiveCount = destinationGroup?.tasks.filter((task) => task.status === "active").length ?? 0;

      if (destinationActiveCount > MAX_ACTIVE_TASKS_PER_DAY ||
          (destinationActiveCount >= MAX_ACTIVE_TASKS_PER_DAY && !destinationAlreadyContainsTask)) {
        toast.error(`На этот день уже выбраны ${MAX_ACTIVE_TASKS_PER_DAY} активных задач`);
        return;
      }

      void onScheduleTask?.(move.task.id, new Date(`${move.toGroupId}T12:00:00`));
    }

    const targetGroupId = move?.toGroupId ?? nextGroups.find((group) => {
      const dateGroup = tasksByDay.find(({ date }) => format(date, "yyyy-MM-dd") === group.id);
      const before = dateGroup?.tasks ?? [];
      return group.tasks.length !== before.length || group.tasks.some((task, index) => task.id !== before[index]?.id);
    })?.id;
    const reorderedGroup = nextGroups.find((group) => group.id === targetGroupId);
    if (reorderedGroup) onReorder?.(mergeReorderedTasks(tasks, reorderedGroup.tasks));
  };

  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand/12 via-background to-muted/50 p-5 md:p-6">
        <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 text-brand" />
              Недельный фокус
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                {isSameDay(weekStart, getCurrentWeekRange().start) ? "Эта неделя" : "Неделя"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {format(weekStart, "d MMM", { locale: ru })} — {format(weekEnd, "d MMM yyyy", { locale: ru })}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="justify-center rounded-full px-3 py-1.5">
              {totalTasks} задач · {busyDays} дней с планом
            </Badge>
            <Button variant="outline" size="icon" aria-label="Предыдущая неделя" onClick={() => onWeekChange?.(addDays(weekDate, -7))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => onWeekChange?.(new Date())}>Сегодня</Button>
            <Button variant="outline" size="icon" aria-label="Следующая неделя" onClick={() => onWeekChange?.(addDays(weekDate, 7))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <SortableTasksBoard
        groups={groups}
        className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 2xl:grid-cols-4"
        onChange={handleBoardChange}
        renderTask={(task, dragHandle) => (
          <TaskRow
            task={task}
            dragHandle={dragHandle}
            onComplete={onComplete}
            onEdit={onEdit}
            onArchive={onArchive}
            onDelete={onDelete}
            compact
          />
        )}
      />
    </div>
  );
}
