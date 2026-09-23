"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Calendar, CheckCircle2, Plus, Timer } from "lucide-react";

import type { StatsResponse, Task } from "@/shared/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { isTaskScheduledForDay } from "@/features/dashboard/lib/task-date-filters";
import { getTodayTaskRecommendation } from "@/features/dashboard/lib/today";
import { SortableTasksList } from "@/features/tasks/components/sortable-tasks-list";
import { TaskRow } from "@/features/tasks/components/task-row";
import { mergeReorderedTasks } from "@/features/tasks/lib/reorder";

import { FocusModeDialog } from "./focus-mode-dialog";

interface TodayViewProps {
  tasks: Task[];
  stats?: StatsResponse | null;
  currentEnergy: number | null;
  onEnergyChange: (level: number | null) => void;
  onEdit: (task: Task) => void;
  onArchive: (taskId: string) => void;
  onComplete: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAddTask: () => void;
  onReorder?: (tasks: Task[]) => void;
  showCompleted: boolean;
  onShowCompletedChange: (show: boolean) => void;
  onToggleSubtask?: (subtask: Task) => void;
  onAddSubtask?: (parentId: string, title: string) => void;
  onEditSubtask?: (subtask: Task) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
  todayActiveCount?: number;
  isLoading?: boolean;
}

const MAX_ACTIVE_TASKS_PER_DAY = 5;

function getToday() {
  return format(new Date(), "EEEE, MMMM d", { locale: ru });
}

export function TodayView({
  tasks,
  currentEnergy,
  onEnergyChange,
  onEdit,
  onArchive,
  onComplete,
  onDelete,
  onAddTask,
  onReorder,
  showCompleted,
  onShowCompletedChange,
  onToggleSubtask,
  onAddSubtask,
  onEditSubtask,
  onDeleteSubtask,
  todayActiveCount,
  isLoading = false,
}: TodayViewProps) {
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  const [focusSessionKey, setFocusSessionKey] = useState(0);
  const today = new Date();

  const todayTasks = tasks.filter(
    (task) =>
      !task.parentTaskId &&
      (task.status === "active" || task.status === "completed") &&
      isTaskScheduledForDay(task, today),
  );
  const todayActiveTasks = todayTasks.filter((task) => task.status === "active");
  const completedTasks = todayTasks.filter((task) => task.status === "completed");
  const activeTasks = currentEnergy === null
    ? todayActiveTasks
    : todayActiveTasks.filter((task) => task.energyLevel <= currentEnergy);
  const recommendation = getTodayTaskRecommendation(activeTasks, today, currentEnergy);
  const remainingActiveTasks = recommendation
    ? activeTasks.filter((task) => task.id !== recommendation.id)
    : activeTasks;

  const activeTodayCount = todayActiveCount ?? todayActiveTasks.length;
  const canAddMore = activeTodayCount < MAX_ACTIVE_TASKS_PER_DAY;
  const hasTasksButFiltered = currentEnergy !== null && todayActiveTasks.length > 0 && activeTasks.length === 0;
  const selectedFocusTask = activeTasks.find((task) => task.id === focusTaskId) ?? recommendation ?? activeTasks[0] ?? null;

  const handleOpenFocusMode = () => {
    if (!selectedFocusTask) return;
    setFocusSessionKey((key) => key + 1);
    setFocusModeOpen(true);
  };

  const handleReorder = (reorderedActiveTasks: Task[]) => {
    onReorder?.(mergeReorderedTasks(tasks, reorderedActiveTasks));
  };

  return (
    <div className="min-h-full">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6 shrink-0 text-brand" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium capitalize text-muted-foreground">{getToday()}</p>
                <h1 className="text-headline">Сегодня</h1>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {activeTodayCount} активных задач из {MAX_ACTIVE_TASKS_PER_DAY} доступных слотов
            </p>
          </div>
          <Button
            onClick={onAddTask}
            disabled={isLoading || !canAddMore}
            className="w-full rounded-lg bg-brand px-4 text-brand-foreground hover:bg-brand/90 sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить задачу
          </Button>
        </header>

        <div className="flex flex-col gap-2 rounded-lg border border-border/80 bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Показать задачи по ёмкости</p>
            <p className="text-xs text-muted-foreground">Фильтр меняет только этот список, не лимит дня</p>
          </div>
          <Select
            value={currentEnergy === null ? "all" : String(currentEnergy)}
            onValueChange={(value) => onEnergyChange(value === "all" ? null : Number(value))}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full sm:w-48" aria-label="Фильтр по энергии">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все уровни</SelectItem>
              <SelectItem value="1">Энергия до 1</SelectItem>
              <SelectItem value="2">Энергия до 2</SelectItem>
              <SelectItem value="3">Энергия до 3</SelectItem>
              <SelectItem value="4">Энергия до 4</SelectItem>
              <SelectItem value="5">Энергия до 5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {recommendation && (
          <Card className="border-brand/30 bg-brand/5">
            <CardHeader className="gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-title">Следующая задача</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Выбрана по дате, ёмкости и порядку</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Рекомендовано</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenFocusMode}
                  className="gap-1.5"
                >
                  <Timer className="h-3.5 w-3.5" />
                  Фокус
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <TaskRow
                task={recommendation}
                onComplete={onComplete}
                onEdit={onEdit}
                onArchive={onArchive}
                onDelete={onDelete}
              />
            </CardContent>
          </Card>
        )}

        <section aria-labelledby="today-tasks-title" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="today-tasks-title" className="text-title">Остальные задачи</h2>
              <p className="text-sm text-muted-foreground">Активные задачи на сегодня</p>
            </div>
            <div className="flex items-center gap-2">
              {completedTasks.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onShowCompletedChange(!showCompleted)}
                  className="gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {showCompleted ? "Скрыть" : "Выполненные"} ({completedTasks.length})
                </Button>
              )}
              <Badge variant="outline">{activeTodayCount}/{MAX_ACTIVE_TASKS_PER_DAY}</Badge>
            </div>
          </div>

          {hasTasksButFiltered ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="font-medium">Нет задач для выбранной ёмкости</p>
                <p className="mt-1 text-sm text-muted-foreground">Выберите более высокий уровень или сбросьте фильтр.</p>
              </CardContent>
            </Card>
          ) : todayActiveTasks.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 font-medium">На сегодня активных задач нет</p>
                <p className="mt-1 text-sm text-muted-foreground">Добавьте задачу, чтобы начать день.</p>
              </CardContent>
            </Card>
          ) : remainingActiveTasks.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Все подходящие активные задачи показаны выше.
              </CardContent>
            </Card>
          ) : (
            <SortableTasksList
              tasks={remainingActiveTasks}
              onEdit={onEdit}
              onArchive={onArchive}
              onComplete={onComplete}
              onDelete={onDelete}
              onReorder={handleReorder}
              onToggleSubtask={onToggleSubtask}
              onAddSubtask={onAddSubtask}
              onEditSubtask={onEditSubtask}
              onDeleteSubtask={onDeleteSubtask}
            />
          )}
        </section>

        {completedTasks.length > 0 && showCompleted && (
          <section aria-labelledby="completed-tasks-title" className="space-y-3">
            <div>
              <h2 id="completed-tasks-title" className="text-title">Выполненные</h2>
              <p className="text-sm text-muted-foreground">Завершённые задачи остаются свернутыми по умолчанию.</p>
            </div>
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onComplete={onComplete}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <FocusModeDialog
        key={focusSessionKey}
        open={focusModeOpen}
        task={selectedFocusTask}
        onOpenChange={setFocusModeOpen}
        onComplete={onComplete}
      />
    </div>
  );
}
