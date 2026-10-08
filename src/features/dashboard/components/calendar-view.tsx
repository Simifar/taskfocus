"use client";

import { useMemo } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfWeek,
  format,
  isPast,
  isSameDay,
  isSameMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ru } from "date-fns/locale";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import type { Task } from "@/shared/types";
import { cn } from "@/shared/lib/utils";
import { MAX_ACTIVE_TASKS_PER_DAY } from "@/shared/lib/task-limits";
import {
  SortableTasksBoard,
  type SortableTaskGroup,
  type TaskGroupMove,
} from "@/features/tasks/components/sortable-tasks-board";
import { mergeReorderedTasks } from "@/features/tasks/lib/reorder";
import {
  getMonthRange,
  isTaskScheduledForDay,
  isTaskScheduledForMonth,
} from "@/features/dashboard/lib/task-date-filters";
import { getPlannedRootTasks } from "@/features/dashboard/lib/plan";
import { EISENHOWER_META, getEisenhowerQuadrant } from "@/features/tasks/lib/eisenhower";
import { PlanHeader } from "./plan-header";

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
  onAddSubtask?: (parentId: string, title: string) => Promise<void> | void;
  onEditSubtask?: (subtask: Task) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
  onScheduleTask?: (taskId: string, date: Date) => Promise<boolean> | void;
  onReorder?: (tasks: Task[]) => void;
}

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const VISIBLE_PER_DAY = 3;

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
    () => getPlannedRootTasks(tasks, (task) => isTaskScheduledForMonth(task, currentMonth)),
    [tasks, currentMonth],
  );

  const tasksByDay = useMemo(() => {
    const byDay = new Map<string, Task[]>();
    for (const day of calendarDays) {
      byDay.set(format(day, "yyyy-MM-dd"), monthTasks.filter((task) => isTaskScheduledForDay(task, day)));
    }
    return byDay;
  }, [calendarDays, monthTasks]);

  const busyDays = calendarDays.filter(
    (day) => isSameMonth(day, currentMonth) && (tasksByDay.get(format(day, "yyyy-MM-dd")) ?? []).length > 0,
  ).length;

  // Counts every task of the day, not only the ones visible in the cell.
  const getDropBlocker = (task: Task, groupId: string) => {
    const dayTasks = tasksByDay.get(groupId) ?? [];
    const alreadyThere = dayTasks.some((candidate) => candidate.id === task.id);
    const activeCount = dayTasks.filter((candidate) => candidate.status === "active").length;
    return !alreadyThere && task.status === "active" && activeCount >= MAX_ACTIVE_TASKS_PER_DAY
      ? "День заполнен"
      : null;
  };

  const groups: SortableTaskGroup[] = calendarDays.map((day) => {
    const dateKey = format(day, "yyyy-MM-dd");
    const dayTasks = tasksByDay.get(dateKey) ?? [];
    const inMonth = isSameMonth(day, currentMonth);
    const isToday = isSameDay(day, today);
    const isDayPast = isPast(endOfDay(day)) && !isToday;
    const doneCount = dayTasks.filter((task) => task.status === "completed").length;

    return {
      id: dateKey,
      tasks: dayTasks.slice(0, VISIBLE_PER_DAY),
      className: cn(
        "group min-w-0 min-h-[64px] bg-card p-0.5 sm:min-h-[84px] sm:p-1 lg:min-h-[152px] lg:p-2",
        !inMonth && "bg-muted/40 text-muted-foreground",
      ),
      contentClassName: "hidden space-y-1.5 lg:block",
      header: (
        <div className="mb-1 flex items-center justify-center gap-1 lg:justify-between">
          <button
            type="button"
            className={cn(
              "relative flex h-11 w-full items-center justify-center rounded-lg text-xs font-semibold tabular-nums transition-colors sm:h-11 sm:rounded-xl lg:w-10 lg:text-sm",
              isToday ? "bg-brand text-brand-foreground" : "hover:bg-muted",
            )}
            aria-label={`${format(day, "d MMMM yyyy", { locale: ru })}: ${dayTasks.length} задач`}
            onClick={() => onSelectDay?.(day)}
          >
            {format(day, "d")}
            {dayTasks.length > 0 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full lg:hidden",
                  doneCount === dayTasks.length ? "bg-success" : isToday ? "bg-brand-foreground" : "bg-brand",
                )}
              />
            )}
          </button>
          {!isDayPast && (
            <button
              type="button"
              className="hidden size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:inline-flex"
              aria-label={`Добавить задачу на ${format(day, "d MMMM", { locale: ru })}`}
              title={`Добавить задачу на ${format(day, "d MMMM", { locale: ru })}`}
              onClick={() => onCreateTask?.(day)}
            >
              <Plus className="size-3.5" />
            </button>
          )}
        </div>
      ),
      empty: <div className="hidden h-10 lg:block" />,
    };
  });

  const handleBoardChange = (nextGroups: SortableTaskGroup[], move?: TaskGroupMove) => {
    if (move) {
      if (getDropBlocker(move.task, move.toGroupId)) {
        toast.error(`На этот день уже ${MAX_ACTIVE_TASKS_PER_DAY} активных задач`);
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
      <PlanHeader
        title={format(currentMonth, "LLLL yyyy", { locale: ru })}
        subtitle={
          monthTasks.length > 0
            ? `${monthTasks.length} задач · ${busyDays} дней с планом`
            : "В этом месяце пока ничего не запланировано — нажмите на день, чтобы начать"
        }
        prevLabel="Предыдущий месяц"
        nextLabel="Следующий месяц"
        isCurrent={isSameMonth(currentMonth, today)}
        onPrev={() => onMonthChange?.(subMonths(currentMonth, 1))}
        onNext={() => onMonthChange?.(addMonths(currentMonth, 1))}
        onToday={() => onMonthChange?.(new Date())}
      />

      <div className="workspace-panel overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-muted/40">
          {WEEKDAY_LABELS.map((day) => (
            <div key={day} className="py-3 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <SortableTasksBoard
          groups={groups}
          className="grid grid-cols-7 gap-px bg-border"
          onChange={handleBoardChange}
          getDropBlocker={getDropBlocker}
          groupLabel={(id) => format(new Date(`${id}T12:00:00`), "d MMMM", { locale: ru })}
          renderOverlay={(task) => (
            <div className="rounded-lg border bg-popover px-3 py-2 text-sm font-medium shadow-lg">{task.title}</div>
          )}
          itemId={(task, groupId) => `${groupId}::${task.id}`}
          renderTask={(task, dragHandle, groupId) => {
            const quadrant = EISENHOWER_META[getEisenhowerQuadrant(task)];
            const group = groups.find((item) => item.id === groupId);
            const overflowCount = (tasksByDay.get(groupId)?.length ?? 0) - (group?.tasks.length ?? 0);

            return (
              <>
                <div
                  className={cn(
                    "flex w-full items-center gap-0.5 rounded-md border border-border/70 bg-background pr-1.5 text-xs transition-colors hover:border-border",
                    task.status === "completed" && "text-muted-foreground line-through",
                  )}
                >
                  {dragHandle}
                  <button
                    type="button"
                    className="flex min-h-9 min-w-0 flex-1 items-center gap-1.5 text-left"
                    onClick={() => onEdit?.(task)}
                    title={task.title}
                  >
                    <span className={cn("size-1.5 shrink-0 rounded-full", quadrant.dot)} aria-hidden="true" />
                    <span className="block min-w-0 flex-1 truncate">{task.title}</span>
                  </button>
                </div>
                {overflowCount > 0 && task === group?.tasks.at(-1) ? (
                  <button
                    type="button"
                    className="mt-1 min-h-9 px-1 text-xs font-medium text-brand hover:underline"
                    onClick={() => onSelectDay?.(new Date(`${groupId}T12:00:00`))}
                  >
                    +{overflowCount} ещё
                  </button>
                ) : null}
              </>
            );
          }}
        />
      </div>
      <p className="text-sm text-muted-foreground lg:hidden">Нажмите на число, чтобы открыть день.</p>
    </div>
  );
}
