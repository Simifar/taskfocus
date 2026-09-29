"use client";

import type { Task } from "@/shared/types";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { SortableTasksList } from "@/features/tasks/components/sortable-tasks-list";
import { mergeReorderedTasks } from "@/features/tasks/lib/reorder";
import { ChevronLeft, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { isTaskScheduledForDay } from "@/features/dashboard/lib/task-date-filters";
import { getPlannedRootTasks } from "@/features/dashboard/lib/plan";
import { MAX_ACTIVE_TASKS_PER_DAY } from "@/shared/lib/task-limits";

interface DayViewProps {
  tasks: Task[];
  selectedDate: Date;
  onBack: () => void;
  onEdit?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onAddTask?: () => void;
  onReorder?: (tasks: Task[]) => void;
  // Subtasks
  onToggleSubtask?: (subtask: Task) => void;
  onAddSubtask?: (parentId: string, title: string) => void;
  onEditSubtask?: (subtask: Task) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
}

export function DayView({
  tasks,
  selectedDate,
  onBack,
  onEdit,
  onComplete,
  onArchive,
  onDelete,
  onAddTask,
  onReorder,
  onToggleSubtask,
  onAddSubtask,
  onEditSubtask,
  onDeleteSubtask,
}: DayViewProps) {
  // Filter tasks for selected date
  const dayTasks = getPlannedRootTasks(tasks, (task) => isTaskScheduledForDay(task, selectedDate));

  // Separate active and completed
  const activeTasks = dayTasks.filter((t) => t.status === "active");
  const completedTasks = dayTasks.filter((t) => t.status === "completed");

  const dayName = format(selectedDate, "EEEE", { locale: ru });
  const dateStr = format(selectedDate, "d MMMM yyyy", { locale: ru });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
          <Button variant="ghost" size="icon" aria-label="Вернуться к плану" onClick={onBack}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="flex items-center gap-2 text-2xl font-semibold capitalize tracking-tight">
            <Calendar className="h-6 w-6 text-brand" />
            {dayName}
          </h1>
          </div>
          <p className="pl-11 text-sm capitalize text-muted-foreground">{dateStr}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <div className="rounded-xl border border-border/70 bg-card/70 px-3 py-2">
            <p className="text-sm font-medium tabular-nums">{activeTasks.length}/{MAX_ACTIVE_TASKS_PER_DAY} активных</p>
            <p className="text-xs text-muted-foreground">{completedTasks.length} выполнено</p>
          </div>
          <Button type="button" onClick={onAddTask}>
            <Calendar className="mr-2 h-4 w-4" /> Добавить задачу
          </Button>
        </div>
      </header>

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
            onReorder={(reordered) => onReorder?.(mergeReorderedTasks(tasks, reordered))}
            onToggleSubtask={onToggleSubtask}
            onAddSubtask={onAddSubtask}
            onEditSubtask={onEditSubtask}
            onDeleteSubtask={onDeleteSubtask}
          />
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <p className="font-medium">{completedTasks.length > 0 ? "На этот день всё готово" : "В этот день пока нет задач"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {completedTasks.length > 0 ? `Выполнено: ${completedTasks.length}.` : "Добавьте задачу, чтобы запланировать её на этот день."}
            </p>
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
            onReorder={(reordered) => onReorder?.(mergeReorderedTasks(tasks, reordered))}
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
