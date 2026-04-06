"use client";

import { Task, StatsResponse } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SortableTasksList } from "@/components/tasks/sortable-tasks-list";
import { ChevronLeft, Calendar, Loader2 } from "lucide-react";
import { format, parseISO, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";

interface DayViewProps {
  tasks: Task[];
  stats: StatsResponse | null;
  selectedDate: Date;
  onBack: () => void;
  onEdit?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onAddTask?: () => void;
  // Subtasks
  onToggleSubtask?: (subtask: Task) => void;
  onAddSubtask?: (parentId: string, title: string) => void;
  onEditSubtask?: (subtask: Task) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
}

export function DayView({
  tasks,
  stats,
  selectedDate,
  onBack,
  onEdit,
  onComplete,
  onArchive,
  onDelete,
  onAddTask,
  onToggleSubtask,
  onAddSubtask,
  onEditSubtask,
  onDeleteSubtask,
}: DayViewProps) {
  // Filter tasks for selected date
  const dayTasks = tasks.filter((task) => {
    if (!task.dueDateStart) return false;
    const taskDate = parseISO(task.dueDateStart);
    return isSameDay(taskDate, selectedDate) && task.status !== "archived";
  });

  // Separate active and completed
  const activeTasks = dayTasks.filter((t) => t.status === "active");
  const completedTasks = dayTasks.filter((t) => t.status === "completed");

  // Calculate completion rate
  const completionRate =
    dayTasks.length > 0
      ? Math.round((completedTasks.length / dayTasks.length) * 100)
      : 0;

  // Average energy
  const avgEnergy =
    activeTasks.length > 0
      ? Math.round(activeTasks.reduce((sum, t) => sum + t.energyLevel, 0) / activeTasks.length)
      : 0;

  const dayName = format(selectedDate, "EEEE", { locale: ru });
  const dateStr = format(selectedDate, "d MMMM yyyy", { locale: ru });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-500" />
            {dayName}
          </h2>
        </div>
        <p className="text-muted-foreground pl-11">{dateStr}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Всего задач</p>
            <p className="text-3xl font-bold">{dayTasks.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Активных</p>
            <p className="text-3xl font-bold">{activeTasks.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Выполнено</p>
            <p className="text-3xl font-bold">{completedTasks.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Средняя энергия</p>
            <p className="text-3xl font-bold">{avgEnergy}</p>
          </CardContent>
        </Card>
      </div>

      {/* Completion Progress */}
      {dayTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Прогресс дня</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Выполнено задач</span>
                <span className="font-semibold">
                  {completedTasks.length}/{dayTasks.length} ({completionRate}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Tasks Section */}
      {activeTasks.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Активные задачи
              <Badge variant="default">{activeTasks.length}</Badge>
            </h3>
          </div>
          <SortableTasksList
            tasks={activeTasks}
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
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Нет активных задач</p>
            <Button onClick={onAddTask} className="mt-4">
              + Добавить задачу
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Completed Tasks Section */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
            Выполненные задачи
            <Badge variant="secondary">{completedTasks.length}</Badge>
          </h3>
          <SortableTasksList
            tasks={completedTasks}
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
    </div>
  );
}
