"use client";

import { Task, StatsResponse } from "@/shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { SortableTasksList } from "@/features/tasks/components/sortable-tasks-list";
import { cn } from "@/shared/lib/utils";
import { Calendar, Plus } from "lucide-react";
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
  // Получаем начало недели (понедельник)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfDay(addDays(weekStart, 6));

  // Получаем дни недели
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Фильтруем активные задачи на эту неделю
  const weekTasks = tasks.filter((task) => {
    if (task.status !== "active") return false;
    if (!task.dueDateStart) return false;

    const taskDate = parseISO(task.dueDateStart);
    return isWithinInterval(taskDate, {
      start: weekStart,
      end: weekEnd,
    });
  });

  // Группируем задачи по дням
  const tasksByDay = weekDays.map((day) => ({
    date: day,
    tasks: weekTasks.filter((task) => {
      const taskDate = parseISO(task.dueDateStart!);
      return isSameDay(taskDate, day);
    }),
  }));

  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
            Неделя
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(weekStart, "d MMM", { locale: ru })} — {format(weekEnd, "d MMM yyyy", { locale: ru })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className="text-sm font-medium">{weekTasks.length} задач</p>
            <p className="text-xs text-muted-foreground">на этой неделе</p>
          </div>
        </div>
      </div>

      {/* Week Timeline — horizontal scroll on mobile */}
      <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0">
        <div className="grid grid-cols-7 gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-2 min-w-[560px]">
          {tasksByDay.map((day) => {
            const isToday = isSameDay(day.date, today);
            const dayName = format(day.date, "EEE", { locale: ru });
            const dayNumber = format(day.date, "d");
            const hasOverflow = day.tasks.length > 3;

            return (
              <div
                key={day.date.toISOString()}
                className="flex flex-col h-full group/col"
              >
                {/* Day Header */}
                <div
                  className={cn(
                    "flex flex-col items-center p-2 rounded-t-lg cursor-pointer transition-colors",
                    isToday
                      ? "bg-brand text-brand-foreground"
                      : "bg-card hover:bg-muted"
                  )}
                  onClick={() => onSelectDay?.(day.date)}
                >
                  <p className="text-xs font-medium">{dayName}</p>
                  <p className="text-sm md:text-lg font-bold">{dayNumber}</p>
                  {day.tasks.length > 0 && (
                    <Badge
                      variant={isToday ? "secondary" : "outline"}
                      className={cn("text-xs mt-1", isToday && "bg-white/20 text-white border-white/30")}
                    >
                      {day.tasks.length}
                    </Badge>
                  )}
                </div>

                {/* Tasks Container */}
                <div
                  className={cn(
                    "flex-1 p-1.5 space-y-1 min-h-[140px] md:min-h-[200px] rounded-b-lg",
                    isToday
                      ? "bg-brand/5"
                      : "bg-card"
                  )}
                >
                  {day.tasks.length > 0 ? (
                    <>
                      {day.tasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            "p-1.5 rounded text-xs cursor-pointer transition-all border border-transparent",
                            "active:scale-95",
                            task.priority === "high"
                              ? "bg-red-50 dark:bg-red-900/20 border-l-2 border-l-red-500"
                              : "bg-gray-50 dark:bg-gray-800"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit?.(task);
                          }}
                        >
                          <p className="font-medium line-clamp-2 text-xs leading-tight">{task.title}</p>
                          {task.priority === "high" && (
                            <span className="text-red-500 text-xs">★</span>
                          )}
                        </div>
                      ))}
                      {hasOverflow && (
                        <div
                          className="text-xs text-muted-foreground text-center py-1 cursor-pointer hover:text-foreground"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectDay?.(day.date);
                          }}
                        >
                          +{day.tasks.length - 3}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <p className="text-xs">—</p>
                    </div>
                  )}

                  {/* Quick Add Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-1 h-6 text-xs opacity-0 group-hover/col:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateTask?.(day.date);
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Статистика недели</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Всего задач</p>
              <p className="text-2xl font-bold">{weekTasks.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Завтра + далее</p>
              <p className="text-2xl font-bold">
                {weekTasks.filter((t) => {
                  const taskDate = parseISO(t.dueDateStart!);
                  return taskDate > today;
                }).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Среднее энергии</p>
              <p className="text-2xl font-bold">
                {weekTasks.length > 0
                  ? Math.round(
                      weekTasks.reduce((sum, t) => sum + t.energyLevel, 0) / weekTasks.length
                    )
                  : 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Week Tasks List (optional detailed view) */}
      {weekTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Все задачи недели</h3>
          <SortableTasksList
            tasks={weekTasks}
            onEdit={onEdit || (() => {})}
            onComplete={onComplete || (() => {})}
            onArchive={onArchive || (() => {})}
            onDelete={onDelete || (() => {})}
            onReorder={() => {}}
            onAddSubtask={onAddSubtask}
            onToggleSubtask={onToggleSubtask}
            onEditSubtask={onEditSubtask}
            onDeleteSubtask={onDeleteSubtask}
          />
        </div>
      )}
    </div>
  );
}
