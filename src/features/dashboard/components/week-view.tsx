"use client";

import { Task, StatsResponse } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import { SimpleSortableTasksList } from "@/features/tasks/components/simple-sortable-tasks-list";
import { TaskRow } from "@/features/tasks/components/task-row";
import { mergeReorderedTasks } from "@/features/tasks/lib/reorder";
import {
  CalendarDays,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { addDays, endOfDay, format, isPast, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import {
  getCurrentWeekRange,
  isTaskScheduledForCurrentWeek,
  isTaskScheduledForDay,
} from "@/features/dashboard/lib/task-date-filters";
import { getPlannedRootTasks } from "@/features/dashboard/lib/plan";

interface WeekViewProps {
  tasks: Task[];
  stats: StatsResponse | null;
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
  onReorder?: (tasks: Task[]) => void;
}

export function WeekView({
  tasks,
  onEdit,
  onComplete,
  onArchive,
  onDelete,
  onCreateTask,
  onSelectDay,
  onReorder,
}: WeekViewProps) {
  const { start: weekStart, end: weekEnd } = getCurrentWeekRange();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  const weekTasks = getPlannedRootTasks(tasks, isTaskScheduledForCurrentWeek);

  const tasksByDay = weekDays.map((day) => ({
    date: day,
    tasks: weekTasks.filter((task) => isTaskScheduledForDay(task, day)),
  }));

  const busyDays = tasksByDay.filter((day) => day.tasks.length > 0).length;
  const totalTasks = weekTasks.length;

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
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Эта неделя</h2>
              <p className="text-sm text-muted-foreground">
                {format(weekStart, "d MMM", { locale: ru })} — {format(weekEnd, "d MMM yyyy", { locale: ru })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Badge variant="secondary" className="justify-center rounded-full px-3 py-1.5">
              {totalTasks} задач на неделе
            </Badge>
            <Badge variant="outline" className="justify-center rounded-full bg-background/70 px-3 py-1.5">
              {busyDays} из 7 дней занято
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex snap-x gap-3 overflow-x-auto pb-3">
        {tasksByDay.map(({ date, tasks: dayTasks }) => {
          const isToday = isSameDay(date, today);
          const isDayPast = isPast(endOfDay(date)) && !isToday;
          const dayLabel = format(date, "EEEE", { locale: ru });
          const dayNum = format(date, "d");
          const monthLabel = format(date, "MMM", { locale: ru });

          return (
            <Card
              key={date.toISOString()}
              className={cn(
                "min-h-[330px] w-[286px] shrink-0 snap-start overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg",
                isToday && "border-brand/60 ring-2 ring-brand/20",
                isDayPast && dayTasks.length === 0 && "opacity-60",
              )}
            >
              <div className={cn("flex", isToday ? "bg-brand text-brand-foreground" : "bg-muted/45")}>
                <button
                  type="button"
                  className="min-w-0 flex-1 px-4 py-4 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  onClick={() => onSelectDay?.(date)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold leading-none">{dayNum}</span>
                        <span className={cn("text-xs uppercase", isToday ? "text-brand-foreground/75" : "text-muted-foreground")}>
                          {monthLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold capitalize">{dayLabel}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {isToday && (
                        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                          сегодня
                        </span>
                      )}
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-semibold",
                          isToday ? "bg-white/20" : "bg-background text-foreground",
                        )}
                      >
                        {dayTasks.length}
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
                    isToday
                      ? "text-brand-foreground hover:bg-white/10 hover:text-brand-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  aria-label={`Добавить задачу на ${format(date, "d MMMM", { locale: ru })}`}
                  title={`Добавить задачу на ${format(date, "d MMMM", { locale: ru })}`}
                  onClick={() => onCreateTask?.(date)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <CardContent className="space-y-3 p-3">
                {dayTasks.length > 0 ? (
                  <SimpleSortableTasksList
                    tasks={dayTasks}
                    onReorder={(reordered) => onReorder?.(mergeReorderedTasks(tasks, reordered))}
                    className="space-y-2"
                  >
                    {(task, dragHandle) => (
                      <TaskRow
                        task={task}
                        dragHandle={dragHandle}
                        onComplete={onComplete}
                        onEdit={onEdit}
                        onArchive={onArchive}
                        onDelete={onDelete}
                      />
                    )}
                  </SimpleSortableTasksList>
                ) : (
                  <div className="flex min-h-[150px] w-full flex-col items-center justify-center rounded-2xl bg-muted/20 px-4 text-center">
                    <CheckCircle2 className="mb-2 h-6 w-6 text-muted-foreground/50" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {isDayPast ? "Нет задач" : "Свободный день"}
                    </span>
                    {!isDayPast && (
                      <span className="mt-1 text-xs text-muted-foreground/70">
                        Добавьте задачу через кнопку «+» в заголовке дня
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
