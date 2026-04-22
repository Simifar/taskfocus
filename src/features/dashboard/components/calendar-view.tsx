import { useState } from "react";
import { Task, StatsResponse } from "@/shared/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { cn } from "@/shared/lib/utils";
import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { ru } from "date-fns/locale";

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

export function CalendarView({
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
}: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Получаем все дни за месяц + доп дни из предыдущего месяца
  const daysInCalendar = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  });

  // Получаем нужное количество дней из предыдущего месяца для сетки 7х6
  const startDate = monthStart;
  let weekStart = startDate;
  while (weekStart.getDay() !== 1) {
    weekStart = new Date(weekStart);
    weekStart.setDate(weekStart.getDate() - 1);
  }

  // Всё дни в сетке
  const calendarDays = eachDayOfInterval({
    start: weekStart,
    end: new Date(monthEnd),
  });

  // Добавляем дни следующего месяца до конца недели
  const additionalDays: Date[] = [];
  let lastDay = calendarDays[calendarDays.length - 1];
  while (lastDay.getDay() !== 0) {
    lastDay = new Date(lastDay.getTime() + 24 * 60 * 60 * 1000);
    additionalDays.push(lastDay);
  }
  const finalCalendarDays = [...calendarDays, ...additionalDays];

  // Фильтруем активные задачи
  const activeTasks = tasks.filter((t) => t.status === "active" && t.dueDateStart);

  // Группируем задачи по дням
  const tasksByDay = new Map<string, Task[]>();
  activeTasks.forEach((task) => {
    const dateStr = format(parseISO(task.dueDateStart!), "yyyy-MM-dd");
    if (!tasksByDay.has(dateStr)) {
      tasksByDay.set(dateStr, []);
    }
    tasksByDay.get(dateStr)!.push(task);
  });

  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-5 w-5 md:h-6 md:w-6 text-indigo-500" />
          Календарь
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm md:text-lg font-semibold min-w-[120px] md:min-w-[200px] text-center capitalize">
            {format(currentMonth, "LLLL yyyy", { locale: ru })}
          </h3>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid — horizontal scroll on mobile */}
      <Card>
        <CardContent className="p-2 md:p-4">
          <div className="overflow-x-auto -mx-2 md:mx-0 px-2 md:px-0">
            <div className="min-w-[420px]">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
                  <div
                    key={day}
                    className="text-center font-semibold text-xs text-muted-foreground py-1.5"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {finalCalendarDays.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const dayTasks = tasksByDay.get(dateStr) || [];
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, today);

                  return (
                    <div
                      key={dateStr}
                      onClick={() => isCurrentMonth && onSelectDay?.(day)}
                      className={cn(
                        "min-h-[60px] md:min-h-[120px] p-1 md:p-2 rounded-lg border transition-all flex flex-col",
                        isCurrentMonth
                          ? "bg-background border-gray-200 dark:border-gray-800 cursor-pointer active:bg-gray-100 dark:active:bg-gray-800"
                          : "bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 opacity-40",
                        isToday && "ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                      )}
                    >
                      {/* Date number */}
                      <p
                        className={cn(
                          "text-xs font-bold leading-none",
                          isToday ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                        )}
                      >
                        {format(day, "d")}
                      </p>

                      {/* Task dots on mobile / task list on desktop */}
                      {dayTasks.length > 0 && (
                        <>
                          {/* Mobile: coloured dot + count */}
                          <div className="md:hidden mt-1 flex items-center gap-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-[10px] text-muted-foreground">{dayTasks.length}</span>
                          </div>
                          {/* Desktop: full task list */}
                          <div className="hidden md:block space-y-0.5 mt-1 flex-1">
                            {dayTasks.slice(0, 2).map((task) => (
                              <div
                                key={task.id}
                                className="text-xs p-1 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors line-clamp-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit?.(task);
                                }}
                                title={task.title}
                              >
                                {task.title}
                              </div>
                            ))}
                            {dayTasks.length > 2 && (
                              <p className="text-xs text-muted-foreground">+{dayTasks.length - 2} ещё</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Month Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Всего в месяце</p>
            <p className="text-2xl md:text-3xl font-bold">
              {activeTasks.filter((t) => isSameMonth(parseISO(t.dueDateStart!), currentMonth)).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Сегодня</p>
            <p className="text-2xl md:text-3xl font-bold">
              {activeTasks.filter((t) => isSameDay(parseISO(t.dueDateStart!), today)).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Высокий приоритет</p>
            <p className="text-2xl md:text-3xl font-bold">
              {activeTasks.filter(
                (t) =>
                  t.priority === "high" &&
                  isSameMonth(parseISO(t.dueDateStart!), currentMonth)
              ).length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Средняя энергия</p>
            <p className="text-2xl md:text-3xl font-bold">
              {activeTasks.filter((t) =>
                isSameMonth(parseISO(t.dueDateStart!), currentMonth)
              ).length > 0
                ? Math.round(
                    activeTasks
                      .filter((t) => isSameMonth(parseISO(t.dueDateStart!), currentMonth))
                      .reduce((sum, t) => sum + t.energyLevel, 0) /
                      activeTasks.filter((t) =>
                        isSameMonth(parseISO(t.dueDateStart!), currentMonth)
                      ).length
                  )
                : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {activeTasks.filter((t) => isSameMonth(parseISO(t.dueDateStart!), currentMonth)).length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              На этот месяц нет задач
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Добавьте задачи, чтобы они отображались в календаре
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
