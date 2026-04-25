"use client";

import { useMemo, useState } from "react";
import type { Task, StatsResponse } from "@/shared/types";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import {
  addDays,
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
import { EISENHOWER_META, getEisenhowerQuadrant } from "@/features/tasks/lib/eisenhower";

interface CalendarViewProps {
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

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function CalendarView({
  tasks,
  onEdit,
  onCreateTask,
  onSelectDay,
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();

  const { start: monthStart, end: monthEnd } = getMonthRange(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const monthTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === "active" && isTaskScheduledForMonth(task, currentMonth),
      ),
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
  const urgentImportantCount = monthTasks.filter((task) => task.important && task.urgent).length;
  const averageEnergy =
    monthTasks.length > 0
      ? Math.round(monthTasks.reduce((sum, task) => sum + task.energyLevel, 0) / monthTasks.length)
      : 0;
  const todayTasks = monthTasks.filter((task) => isTaskScheduledForDay(task, today)).length;

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
                Планируйте мягко: задачи с диапазоном отображаются во всех подходящих днях.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="bg-background/70"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="bg-background/70"
              onClick={() => setCurrentMonth(new Date())}
            >
              Сегодня
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="bg-background/70"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Задач в месяце</p>
            <p className="mt-1 text-3xl font-bold">{monthTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Занятых дней</p>
            <p className="mt-1 text-3xl font-bold">{busyDays}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Сделать сейчас</p>
            <p className="mt-1 text-3xl font-bold">{urgentImportantCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Средняя энергия</p>
            <p className="mt-1 text-3xl font-bold">{averageEnergy}</p>
          </CardContent>
        </Card>
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

          <div className="grid grid-cols-7 gap-px bg-border">
            {calendarDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayTasks = tasksByDay.get(dateKey) ?? [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, today);

              return (
                <div
                  key={dateKey}
                  className={cn(
                    "group min-h-[112px] bg-background p-2 transition-colors md:min-h-[154px] md:p-3",
                    isCurrentMonth ? "hover:bg-muted/30" : "bg-muted/20 text-muted-foreground",
                    isToday && "bg-brand/5 ring-2 ring-inset ring-brand/40",
                  )}
                >
                  <div className="mb-2 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold transition-colors",
                        isToday
                          ? "bg-brand text-brand-foreground"
                          : "hover:bg-muted",
                      )}
                      onClick={() => onSelectDay?.(day)}
                    >
                      {format(day, "d")}
                    </button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 max-md:opacity-100"
                      onClick={() => onCreateTask?.(day)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {dayTasks.length > 0 ? (
                    <div className="space-y-1.5">
                      {dayTasks.slice(0, 3).map((task) => {
                        const quadrant = EISENHOWER_META[getEisenhowerQuadrant(task)];

                        return (
                        <button
                          type="button"
                          key={task.id}
                          className="flex w-full items-start gap-1.5 rounded-lg border border-border bg-card/80 px-2 py-1.5 text-left text-xs shadow-sm transition-colors hover:border-brand/50 hover:bg-background"
                          onClick={() => onEdit?.(task)}
                          title={task.title}
                        >
                          <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", quadrant.dot)} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{task.title}</span>
                            <span className="hidden text-[10px] text-muted-foreground md:block">
                              {quadrant.shortTitle} · энергия {task.energyLevel}
                            </span>
                          </span>
                        </button>
                      )})}

                      {dayTasks.length > 3 && (
                        <button
                          type="button"
                          className="text-xs font-medium text-brand hover:underline"
                          onClick={() => onSelectDay?.(day)}
                        >
                          +{dayTasks.length - 3} еще
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="hidden h-[72px] w-full rounded-xl border border-dashed border-transparent text-xs text-muted-foreground/70 transition-colors hover:border-brand/40 hover:bg-brand/5 hover:text-brand md:block"
                      onClick={() => onCreateTask?.(day)}
                    >
                      Добавить
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {todayTasks > 0 && (
        <Card className="border-brand/20 bg-brand/5">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">На сегодня в календаре: {todayTasks}</p>
              <p className="text-sm text-muted-foreground">
                Можно перейти в день, чтобы посмотреть детали и подзадачи.
              </p>
            </div>
            <Button variant="outline" onClick={() => onSelectDay?.(today)}>
              Открыть сегодня
            </Button>
          </CardContent>
        </Card>
      )}

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
