"use client";

import { addDays, endOfDay, format, isPast, isSameDay } from "date-fns";
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
import { TaskRow } from "@/features/tasks/components/task-row";
import { mergeReorderedTasks } from "@/features/tasks/lib/reorder";
import {
  getCurrentWeekRange,
  isTaskScheduledForDay,
  isTaskScheduledForWeek,
} from "@/features/dashboard/lib/task-date-filters";
import { getPlannedRootTasks } from "@/features/dashboard/lib/plan";
import { PlanHeader } from "./plan-header";

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
  onAddSubtask?: (parentId: string, title: string) => Promise<void> | void;
  onEditSubtask?: (subtask: Task) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
  onScheduleTask?: (taskId: string, date: Date) => Promise<boolean> | void;
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
  const isCurrentWeek = isSameDay(weekStart, getCurrentWeekRange().start);

  const weekTasks = getPlannedRootTasks(tasks, (task) => isTaskScheduledForWeek(task, weekDate));
  const tasksByDay = weekDays.map((date) => ({
    date,
    id: format(date, "yyyy-MM-dd"),
    tasks: weekTasks.filter((task) => isTaskScheduledForDay(task, date)),
  }));
  const activeTotal = weekTasks.filter((task) => task.status === "active").length;
  const doneTotal = weekTasks.length - activeTotal;

  const activeCountFor = (groupId: string) =>
    tasksByDay.find((day) => day.id === groupId)?.tasks.filter((task) => task.status === "active").length ?? 0;

  const getDropBlocker = (task: Task, groupId: string) => {
    const alreadyThere = tasksByDay.find((day) => day.id === groupId)?.tasks.some((t) => t.id === task.id);
    if (!alreadyThere && task.status === "active" && activeCountFor(groupId) >= MAX_ACTIVE_TASKS_PER_DAY) {
      return `День заполнен · ${MAX_ACTIVE_TASKS_PER_DAY}/${MAX_ACTIVE_TASKS_PER_DAY}`;
    }
    return null;
  };

  const groups: SortableTaskGroup[] = tasksByDay.map(({ date, id, tasks: dayTasks }) => {
    const isToday = isSameDay(date, today);
    const isDayPast = isPast(endOfDay(date)) && !isToday;
    const activeCount = dayTasks.filter((task) => task.status === "active").length;
    const full = activeCount >= MAX_ACTIVE_TASKS_PER_DAY;

    return {
      id,
      tasks: dayTasks,
      className: cn(
        "group/day flex min-w-0 flex-col rounded-2xl border bg-card shadow-[var(--shadow-panel)]",
        isToday ? "border-brand/50 bg-brand-soft/40" : "border-border/70",
        isDayPast && "bg-muted/25",
      ),
      contentClassName: "flex-1 space-y-2 px-2 pb-2",
      header: (
        <div className="flex items-center gap-1 py-1 pr-1 pl-1">
          <button
            type="button"
            onClick={() => onSelectDay?.(date)}
            className="flex min-h-14 min-w-0 flex-1 flex-wrap content-center items-baseline gap-x-2 gap-y-0 rounded-xl px-2 text-left hover:bg-muted"
            aria-label={`Открыть ${format(date, "EEEE, d MMMM", { locale: ru })}`}
          >
            <span className={cn("text-sm font-semibold capitalize", isToday && "text-brand")}>
              {format(date, "EEEEEE", { locale: ru })}
            </span>
            <span className={cn("text-sm tabular-nums", isToday ? "font-semibold text-brand" : "text-muted-foreground")}>
              {format(date, "d MMM", { locale: ru })}
            </span>
            {isToday && <span className="sr-only">сегодня</span>}
          </button>
          <span
            className={cn("px-1 text-xs tabular-nums", full ? "font-medium text-warning" : "text-muted-foreground")}
            aria-label={`${activeCount} активных из ${MAX_ACTIVE_TASKS_PER_DAY}`}
          >
            {activeCount}/{MAX_ACTIVE_TASKS_PER_DAY}
          </span>
          {!isDayPast && (
            <button
              type="button"
              className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40"
              aria-label={`Добавить задачу на ${format(date, "d MMMM", { locale: ru })}`}
              title={full ? "День заполнен" : `Добавить задачу на ${format(date, "d MMMM", { locale: ru })}`}
              disabled={full}
              onClick={() => onCreateTask?.(date)}
            >
              <Plus className="size-4" />
            </button>
          )}
        </div>
      ),
      empty: (
        <p className="flex min-h-20 items-center justify-center rounded-lg border border-dashed border-border/70 px-2 text-xs text-muted-foreground">
          {isDayPast ? "Не было задач" : "Свободно"}
        </p>
      ),
    };
  });

  const handleBoardChange = (nextGroups: SortableTaskGroup[], move?: TaskGroupMove) => {
    if (move) {
      const blocker = getDropBlocker(move.task, move.toGroupId);
      if (blocker) {
        toast.error("На этот день уже 5 активных задач", { description: "Освободите место или выберите другой день." });
        return;
      }
      void onScheduleTask?.(move.task.id, new Date(`${move.toGroupId}T12:00:00`));
    }

    const targetGroupId = move?.toGroupId ?? nextGroups.find((group) => {
      const before = tasksByDay.find((day) => day.id === group.id)?.tasks ?? [];
      return group.tasks.length !== before.length || group.tasks.some((task, index) => task.id !== before[index]?.id);
    })?.id;
    const reorderedGroup = nextGroups.find((group) => group.id === targetGroupId);
    if (reorderedGroup) onReorder?.(mergeReorderedTasks(tasks, reorderedGroup.tasks));
  };

  return (
    <div className="space-y-5">
      <PlanHeader
        title={isCurrentWeek ? "Эта неделя" : "Неделя"}
        subtitle={
          <>
            {format(weekStart, "d MMM", { locale: ru })} — {format(weekEnd, "d MMM yyyy", { locale: ru })}
            {weekTasks.length > 0 && ` · в плане ${activeTotal}, готово ${doneTotal}`}
          </>
        }
        prevLabel="Предыдущая неделя"
        nextLabel="Следующая неделя"
        isCurrent={isCurrentWeek}
        onPrev={() => onWeekChange?.(addDays(weekDate, -7))}
        onNext={() => onWeekChange?.(addDays(weekDate, 7))}
        onToday={() => onWeekChange?.(new Date())}
      />

      <p className="hidden text-xs text-muted-foreground md:block">
        Перетащите задачу за ручку на другой день, чтобы перенести её. В день — до {MAX_ACTIVE_TASKS_PER_DAY} активных задач.
      </p>

      <SortableTasksBoard
        groups={groups}
        className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-3 min-[1800px]:grid-cols-4"
        onChange={handleBoardChange}
        getDropBlocker={getDropBlocker}
        groupLabel={(id) => format(new Date(`${id}T12:00:00`), "EEEE, d MMMM", { locale: ru })}
        renderOverlay={(task) => <TaskRow task={task} compact hideSchedule isDragging />}
        renderTask={(task, dragHandle) => (
          <TaskRow
            task={task}
            dragHandle={dragHandle}
            onComplete={onComplete}
            onEdit={onEdit}
            onArchive={onArchive}
            onDelete={onDelete}
            hideSchedule
            compact
          />
        )}
      />
    </div>
  );
}
