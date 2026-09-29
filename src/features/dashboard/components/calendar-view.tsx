"use client";

import { useMemo } from "react";
import type { Task } from "@/shared/types";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { SortableTasksBoard, type SortableTaskGroup, type TaskGroupMove } from "@/features/tasks/components/sortable-tasks-board";
import { mergeReorderedTasks } from "@/features/tasks/lib/reorder";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ru } from "date-fns/locale";
import {
  getMonthRange,
  isTaskScheduledForDay,
  isTaskScheduledForMonth,
} from "@/features/dashboard/lib/task-date-filters";
import { getPlannedRootTasks } from "@/features/dashboard/lib/plan";
import { EISENHOWER_META, getEisenhowerQuadrant } from "@/features/tasks/lib/eisenhower";
import { MAX_ACTIVE_TASKS_PER_DAY } from "@/shared/lib/task-limits";
import { toast } from "sonner";

interface CalendarViewProps {
  tasks: Task[];
  currentMonth: Date;
  onEdit?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onCreateTask?: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  onSelectDay?: (date: Date) => void;
  onToggleSubtask?: (subtask: Task) => void;
  onAddSubtask?: (parentId: string, title: string) => void;
  onEditSubtask?: (subtask: Task) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
  onScheduleTask?: (taskId: string, date: Date) => void;
  onReorder?: (tasks: Task[]) => void;
}

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function CalendarView({
  tasks,
  currentMonth,
  onEdit,
  onCreateTask,
  onMonthChange,
  onSelectDay,
  onScheduleTask,
  onReorder,
}: CalendarViewProps) {
  const today = new Date();

  const { start: monthStart, end: monthEnd } = getMonthRange(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const monthTasks = useMemo(
    () =>
      getPlannedRootTasks(tasks, (task) => isTaskScheduledForMonth(task, currentMonth)),
    [tasks, currentMonth],
  );

  const tasksByDay = useMemo(() => {
    const byDay = new Map<string, Task[]>();

    for (const day of calendarDays) {
      const dateKey = format(day, "yyyy-MM-dd");
      byDay.set(
        dateKey,
        monthTasks.filter((task) => isTaskScheduledForDay(task, day)),
      );
    }

    return byDay;
  }, [calendarDays, monthTasks]);

  const busyDays = calendarDays.filter((day) => {
    if (!isSameMonth(day, currentMonth)) return false;
    return (tasksByDay.get(format(day, "yyyy-MM-dd")) ?? []).length > 0;
  }).length;

  const groups: SortableTaskGroup[] = calendarDays.map((day) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const dayTasks = tasksByDay.get(dateKey) ?? [];
    const visibleTasks = dayTasks.slice(0, 3);
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isToday = isSameDay(day, today);

    return {
      id: dateKey,
      tasks: visibleTasks,
      className: cn(
        "group min-h-[64px] bg-background p-1 transition-colors sm:min-h-[84px] sm:p-1.5 md:min-h-[136px] md:p-2.5",
        isCurrentMonth ? "hover:bg-muted/30" : "bg-muted/20 text-muted-foreground",
        isToday && "bg-brand/5 ring-2 ring-inset ring-brand/40",
      ),
      contentClassName: "hidden space-y-1.5 md:block",
      header: (
        <div className="mb-2 flex items-center justify-between gap-1">
          <button
            type="button"
            className={cn(
              "relative flex size-7 items-center justify-center rounded-full text-xs font-bold transition-colors md:text-sm",
              isToday ? "bg-brand text-brand-foreground" : "hover:bg-muted",
            )}
            aria-label={`${format(day, "d MMMM yyyy", { locale: ru })}: ${dayTasks.length} задач`}
            onClick={() => onSelectDay?.(day)}
          >
            {format(day, "d")}
            {dayTasks.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-brand ring-2 ring-background md:hidden" />
            )}
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden size-7 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 md:inline-flex"
            aria-label={`Добавить задачу на ${format(day, "d MMMM", { locale: ru })}`}
            title={`Добавить задачу на ${format(day, "d MMMM", { locale: ru })}`}
            onClick={() => onCreateTask?.(day)}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      ),
      empty: (
        <div className="hidden h-[72px] w-full items-center justify-center text-xs text-muted-foreground/60 md:flex">
          Нет задач
        </div>
      ),
    };
  });

  const handleBoardChange = (nextGroups: SortableTaskGroup[], move?: TaskGroupMove) => {
    if (move) {
      const previousTarget = groups.find((group) => group.id === move.toGroupId);
      const targetGroup = nextGroups.find((group) => group.id === move.toGroupId);
      const alreadyScheduledHere = previousTarget?.tasks.some((task) => task.id === move.task.id) ?? false;
      const activeCount = targetGroup?.tasks.filter((task) => task.status === "active").length ?? 0;

      if (activeCount > MAX_ACTIVE_TASKS_PER_DAY ||
          (activeCount >= MAX_ACTIVE_TASKS_PER_DAY && !alreadyScheduledHere)) {
        toast.error(`На этот день уже выбраны ${MAX_ACTIVE_TASKS_PER_DAY} активных задач`);
        return;
      }

      void onScheduleTask?.(move.task.id, new Date(`${move.toGroupId}T12:00:00`));
    }

    const changedGroupId = move?.toGroupId ?? nextGroups.find((group) => {
      const before = groups.find((candidate) => candidate.id === group.id)?.tasks ?? [];
      return group.tasks.some((task, index) => task.id !== before[index]?.id) || group.tasks.length !== before.length;
    })?.id;
    const reorderedGroup = nextGroups.find((group) => group.id === changedGroupId);
    if (reorderedGroup) onReorder?.(mergeReorderedTasks(tasks, reorderedGroup.tasks));
  };
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-sky-500/12 via-background to-brand/10 p-5 md:p-6">
        <div className="absolute -left-16 -top-20 h-48 w-48 rounded-full bg-sky-400/15 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-52 w-52 rounded-full bg-brand/15 blur-3xl" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-brand" />
              Месячный обзор
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight capitalize md:text-3xl">
                {format(currentMonth, "LLLL yyyy", { locale: ru })}
              </h2>
              <p className="text-sm text-muted-foreground">
                {monthTasks.length} задач · {busyDays} дней с планом. Диапазонные задачи видны во всех подходящих днях.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="bg-background/70"
              aria-label="Предыдущий месяц"
              onClick={() => onMonthChange?.(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="bg-background/70"
              onClick={() => onMonthChange?.(new Date())}
            >
              Сегодня
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-background/70"
              aria-label="Следующий месяц"
              onClick={() => onMonthChange?.(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="border-b bg-muted/30 px-3 py-2">
            <div className="grid grid-cols-7 gap-1">
              {WEEKDAY_LABELS.map((day) => (
                <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
          </div>

          <SortableTasksBoard
            groups={groups}
            className="grid grid-cols-7 gap-px bg-border"
            onChange={handleBoardChange}
            itemId={(task, groupId) => `${groupId}::${task.id}`}
            renderTask={(task, dragHandle, groupId) => {
              const quadrant = EISENHOWER_META[getEisenhowerQuadrant(task)];
              const group = groups.find((item) => item.id === groupId);
              const overflowCount = (tasksByDay.get(groupId)?.length ?? 0) - (group?.tasks.length ?? 0);

              return (
                <>
                  <div className="flex w-full items-start gap-1.5 rounded-lg border border-border bg-card/90 px-1 py-1.5 text-xs shadow-sm transition-colors hover:border-brand/50 hover:bg-background">
                    {dragHandle}
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-start gap-1.5 text-left"
                      onClick={() => onEdit?.(task)}
                      title={task.title}
                    >
                      <span className={cn("mt-1 size-1.5 shrink-0 rounded-full", quadrant.dot)} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{task.title}</span>
                        <span className="hidden text-[10px] text-muted-foreground md:block">
                          {quadrant.shortTitle} · энергия {task.energyLevel}
                        </span>
                      </span>
                    </button>
                  </div>
                  {overflowCount > 0 && task === group?.tasks.at(-1) ? (
                    <button
                      type="button"
                      className="text-xs font-medium text-brand hover:underline"
                      onClick={() => onSelectDay?.(new Date(`${groupId}T12:00:00`))}
                    >
                      +{overflowCount} ещё
                    </button>
                  ) : null}
                </>
              );
            }}
          />
        </CardContent>
      </Card>

      {monthTasks.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              На этот месяц нет задач
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Нажмите на любой день календаря, чтобы запланировать задачу.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
