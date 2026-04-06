"use client";

import { Task, StatsResponse } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SortableTasksList } from "@/components/tasks/sortable-tasks-list";
import { cn } from "@/lib/utils";
import { Calendar, Plus } from "lucide-react";
import { format, startOfWeek, addDays, isWithinInterval, parseISO, isSameDay } from "date-fns";
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
}: WeekViewProps) {
  // Получаем начало недели (понедельник)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

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
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-purple-500" />
          На этой неделе
        </h2>
        <p className="text-sm text-muted-foreground">
          {format(weekStart, "d MMM", { locale: ru })} — {format(weekEnd, "d MMM yyyy", { locale: ru })}
        </p>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {tasksByDay.map((day) => {
          const isToday = isSameDay(day.date, today);
          const dayName = format(day.date, "EEE", { locale: ru }).toUpperCase();
          const dayNumber = format(day.date, "d");

          return (
            <Card
              key={day.date.toISOString()}
              className={cn(
                "transition-all hover:shadow-lg flex flex-col",
                isToday && "ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
              )}
            >
              <CardHeader 
                className="pb-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => onSelectDay?.(day.date)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">{dayName}</p>
                    <p className="text-lg font-bold">{dayNumber}</p>
                  </div>
                  <Badge variant={isToday ? "default" : "outline"} className="text-xs">
                    {day.tasks.length}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 flex-1 flex flex-col">
                {day.tasks.length > 0 ? (
                  <>
                    <div className="space-y-2 flex-1">
                      {day.tasks.map((task) => (
                        <div
                          key={task.id}
                          className="p-2 rounded bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-colors cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                          onClick={() => onEdit?.(task)}
                        >
                          <p className="text-xs font-medium line-clamp-2">{task.title}</p>
                          <div className="flex gap-1 mt-1">
                            <Badge variant="outline" className="text-xs h-5">
                              E{task.energyLevel}
                            </Badge>
                            {task.priority === "high" && (
                              <Badge variant="destructive" className="text-xs h-5">
                                ★
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => onCreateTask?.(day.date)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Добавить
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4 flex-1">
                    <p className="text-xs text-muted-foreground text-center mb-2">
                      Нет задач
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => onCreateTask?.(day.date)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Добавить
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
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
          />
        </div>
      )}
    </div>
  );
}
