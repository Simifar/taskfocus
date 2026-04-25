"use client";

import { Task, StatsResponse } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  Edit2,
  Plus,
  Trash2,
} from "lucide-react";
import { addDays, endOfDay, format, isPast, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import {
  getCurrentWeekRange,
  isTaskScheduledForCurrentWeek,
  isTaskScheduledForDay,
} from "@/features/dashboard/lib/task-date-filters";
import { EISENHOWER_META, getEisenhowerQuadrant } from "@/features/tasks/lib/eisenhower";

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
}

export function WeekView({
  tasks,
  onEdit,
  onComplete,
  onArchive,
  onDelete,
  onCreateTask,
  onSelectDay,
}: WeekViewProps) {
  const { start: weekStart, end: weekEnd } = getCurrentWeekRange();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  const weekTasks = tasks.filter(
    (task) => task.status === "active" && isTaskScheduledForCurrentWeek(task),
  );

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
              <button
                type="button"
                className={cn(
                  "w-full px-4 py-4 text-left transition-colors",
                  isToday
                    ? "bg-brand text-brand-foreground"
                    : "bg-muted/45 hover:bg-muted",
                )}
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

              <CardContent className="space-y-3 p-3">
                <Button
                  variant="outline"
                  className="h-9 w-full justify-center gap-2 border-dashed text-muted-foreground hover:border-brand hover:text-brand"
                  onClick={() => onCreateTask?.(date)}
                >
                  <Plus className="h-4 w-4" />
                  Добавить задачу
                </Button>

                {dayTasks.length > 0 ? (
                  <div className="space-y-2">
                    {dayTasks.map((task) => {
                      const quadrant = EISENHOWER_META[getEisenhowerQuadrant(task)];

                      return (
                      <div
                        key={task.id}
                        className="group rounded-2xl border border-border bg-background p-3 shadow-sm transition-colors hover:border-brand/40"
                      >
                        <button
                          type="button"
                          className="block w-full text-left"
                          onClick={() => onEdit?.(task)}
                        >
                          <div className="flex items-start gap-2">
                            <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", quadrant.dot)} />
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 text-sm font-semibold leading-snug">
                                {task.title}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <Badge variant="secondary" className="h-5 rounded-full px-2 text-[11px]">
                                  {quadrant.shortTitle}
                                </Badge>
                                <Badge variant="outline" className="h-5 rounded-full px-2 text-[11px]">
                                  энергия {task.energyLevel}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </button>

                        <div className="mt-3 flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-brand"
                            title="Выполнить"
                            onClick={() => onComplete?.(task)}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-brand"
                            title="Редактировать"
                            onClick={() => onEdit?.(task)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-brand"
                            title="В архив"
                            onClick={() => onArchive?.(task.id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="Удалить"
                            onClick={() => onDelete?.(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )})}
                  </div>
                ) : (
                  <button
                    type="button"
                    className="flex min-h-[150px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-4 text-center transition-colors hover:border-brand/50 hover:bg-brand/5"
                    onClick={() => onCreateTask?.(date)}
                  >
                    <CheckCircle2 className="mb-2 h-6 w-6 text-muted-foreground/50" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {isDayPast ? "Нет задач" : "Свободный день"}
                    </span>
                    {!isDayPast && (
                      <span className="mt-1 text-xs text-muted-foreground/70">
                        Нажмите, чтобы запланировать дело
                      </span>
                    )}
                  </button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
