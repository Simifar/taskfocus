"use client";

import { Task, StatsResponse } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { SortableTasksList } from "@/features/tasks/components/sortable-tasks-list";
import { cn } from "@/shared/lib/utils";
import { CalendarDays, Plus, CheckCircle2 } from "lucide-react";
import { format, startOfWeek, addDays, endOfDay, isWithinInterval, parseISO, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";

interface WeekViewProps {
  tasks: Task[];
  stats: StatsResponse | null;
  onEdit?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onCreateTask?: (date: Date) => void;
  onSelectDay?: (date: Date) => void;
  // Subtasks
  onToggleSubtask?: (subtask: Task) => void;
  onAddSubtask?: (parentId: string, title: string) => void;
  onEditSubtask?: (subtask: Task) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
}

export function WeekView({
  tasks,
  stats,
  onEdit,
  onComplete,
  onArchive,
  onDelete,
  onCreateTask,
  onSelectDay,
  onToggleSubtask,
  onAddSubtask,
  onEditSubtask,
  onDeleteSubtask,
}: WeekViewProps) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfDay(addDays(weekStart, 6));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  const weekTasks = tasks.filter((task) => {
    if (task.status !== "active") return false;
    if (!task.dueDateStart) return false;
    const taskDate = parseISO(task.dueDateStart);
    return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
  });

  const tasksByDay = weekDays.map((day) => ({
    date: day,
    tasks: weekTasks.filter((task) => {
      const taskDate = parseISO(task.dueDateStart!);
      return isSameDay(taskDate, day);
    }),
  }));

  const totalTasks = weekTasks.length;
  const completedThisWeek = tasks.filter((t) => {
    if (t.status !== "completed" || !t.dueDateStart) return false;
    const d = parseISO(t.dueDateStart);
    return isWithinInterval(d, { start: weekStart, end: weekEnd });
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 md:h-6 md:w-6 text-brand" />
            Эта неделя
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, "d MMM", { locale: ru })} — {format(weekEnd, "d MMM yyyy", { locale: ru })}
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand inline-block" />
            <span className="text-muted-foreground">Активных: <span className="font-semibold text-foreground">{totalTasks}</span></span>
          </div>
          {completedThisWeek > 0 && (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
              <span className="text-muted-foreground">Выполнено: <span className="font-semibold text-foreground">{completedThisWeek}</span></span>
            </div>
          )}
        </div>
      </div>

      {/* Day-by-day list */}
      <div className="space-y-4">
        {tasksByDay.map(({ date, tasks: dayTasks }) => {
          const isToday = isSameDay(date, today);
          const isPast = date < today && !isToday;
          const dayName = format(date, "EEEE", { locale: ru });
          const dayDate = format(date, "d MMMM", { locale: ru });

          return (
            <div key={date.toISOString()} className={cn(
              "rounded-xl border transition-colors",
              isToday ? "border-brand/40 bg-brand/3" : "border-border bg-card",
              isPast && dayTasks.length === 0 && "opacity-50"
            )}>
              {/* Day header */}
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer",
                  isToday ? "border-b border-brand/20" : dayTasks.length > 0 ? "border-b border-border" : ""
                )}
                onClick={() => onSelectDay?.(date)}
              >
                <div className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                  isToday
                    ? "bg-brand text-brand-foreground"
                    : isPast
                    ? "bg-muted text-muted-foreground"
                    : "bg-muted/60 text-foreground"
                )}>
                  {format(date, "d")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-semibold capitalize text-sm",
                    isToday && "text-brand"
                  )}>
                    {dayName}
                    {isToday && <span className="ml-2 text-xs font-normal text-brand/70">— сегодня</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{dayDate}</p>
                </div>
                {dayTasks.length > 0 && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs font-semibold shrink-0",
                      isToday && "bg-brand/15 text-brand"
                    )}
                  >
                    {dayTasks.length}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-brand"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateTask?.(date);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Tasks */}
              {dayTasks.length > 0 && (
                <div className="p-3">
                  <SortableTasksList
                    tasks={dayTasks}
                    onEdit={onEdit || (() => {})}
                    onComplete={onComplete || (() => {})}
                    onArchive={onArchive || (() => {})}
                    onDelete={onDelete || (() => {})}
                    onReorder={() => {}}
                    onToggleSubtask={onToggleSubtask}
                    onAddSubtask={onAddSubtask}
                    onEditSubtask={onEditSubtask}
                    onDeleteSubtask={onDeleteSubtask}
                  />
                </div>
              )}

              {/* Empty day */}
              {dayTasks.length === 0 && (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  Нет задач
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
