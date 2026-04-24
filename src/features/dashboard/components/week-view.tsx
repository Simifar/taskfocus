"use client";

import { Task, StatsResponse } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { SortableTasksList } from "@/features/tasks/components/sortable-tasks-list";
import { cn } from "@/shared/lib/utils";
import { CalendarDays, Plus, CheckCircle2 } from "lucide-react";
import {
  format,
  startOfWeek,
  addDays,
  endOfDay,
  isWithinInterval,
  parseISO,
  isSameDay,
  isPast,
} from "date-fns";
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
    tasks: weekTasks.filter((task) => isSameDay(parseISO(task.dueDateStart!), day)),
  }));

  const totalTasks = weekTasks.length;

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between pb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <CalendarDays className="h-5 w-5 md:h-6 md:w-6 text-brand" />
            Эта неделя
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, "d MMM", { locale: ru })} — {format(weekEnd, "d MMM yyyy", { locale: ru })}
          </p>
        </div>
        {totalTasks > 0 && (
          <Badge variant="secondary" className="self-start sm:self-auto text-sm px-3 py-1">
            {totalTasks} задач
          </Badge>
        )}
      </div>

      {/* Day rows */}
      {tasksByDay.map(({ date, tasks: dayTasks }) => {
        const isToday = isSameDay(date, today);
        const isDayPast = isPast(endOfDay(date)) && !isToday;
        const isEmpty = dayTasks.length === 0;
        const dayLabel = format(date, "EEE", { locale: ru });
        const dayNum = format(date, "d");
        const monthLabel = format(date, "MMM", { locale: ru });

        return (
          <div
            key={date.toISOString()}
            className={cn(
              "relative rounded-xl overflow-hidden",
              isToday
                ? "ring-2 ring-brand shadow-sm shadow-brand/10"
                : "border border-border",
              isDayPast && isEmpty && "opacity-40",
            )}
          >
            {/* Day header strip */}
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 cursor-pointer select-none",
                isToday ? "bg-brand text-brand-foreground" : "bg-muted/40 hover:bg-muted/70 transition-colors",
              )}
              onClick={() => onSelectDay?.(date)}
            >
              {/* Date circle */}
              <div className={cn(
                "w-9 h-9 rounded-full flex flex-col items-center justify-center shrink-0 leading-none",
                isToday ? "bg-white/20" : "bg-background border border-border",
              )}>
                <span className={cn(
                  "text-sm font-bold",
                  isToday ? "text-brand-foreground" : "text-foreground",
                )}>
                  {dayNum}
                </span>
              </div>

              {/* Day name + month */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn(
                    "font-semibold capitalize text-sm",
                    isToday ? "text-brand-foreground" : "text-foreground",
                  )}>
                    {dayLabel}
                  </span>
                  <span className={cn(
                    "text-xs",
                    isToday ? "text-brand-foreground/70" : "text-muted-foreground",
                  )}>
                    {monthLabel}
                  </span>
                  {isToday && (
                    <span className="text-xs font-medium bg-white/20 px-1.5 py-0.5 rounded-full">
                      сегодня
                    </span>
                  )}
                </div>
              </div>

              {/* Task count + add button */}
              <div className="flex items-center gap-2 shrink-0">
                {dayTasks.length > 0 && (
                  <Badge
                    className={cn(
                      "text-xs font-semibold",
                      isToday
                        ? "bg-white/20 text-brand-foreground border-transparent"
                        : "bg-background text-foreground border-border",
                    )}
                    variant="outline"
                  >
                    {dayTasks.length}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7",
                    isToday
                      ? "text-brand-foreground/70 hover:bg-white/20 hover:text-brand-foreground"
                      : "text-muted-foreground hover:text-brand hover:bg-brand/10",
                  )}
                  onClick={(e) => { e.stopPropagation(); onCreateTask?.(date); }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Tasks area */}
            {dayTasks.length > 0 ? (
              <div className="p-3 bg-background space-y-0">
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
            ) : (
              <div
                className="px-4 py-3 bg-background flex items-center gap-2 cursor-pointer group"
                onClick={() => onCreateTask?.(date)}
              >
                <CheckCircle2 className="h-4 w-4 text-muted-foreground/40" />
                <span className="text-sm text-muted-foreground/60">
                  {isDayPast ? "Нет задач" : "Нет задач — нажмите, чтобы добавить"}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
