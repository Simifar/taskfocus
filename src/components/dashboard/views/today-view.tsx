"use client";

import { Task, StatsResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SortableTasksList } from "@/components/tasks/sortable-tasks-list";
import { EnergyStatus } from "../shared/energy-status";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Zap,
  TrendingUp,
  Plus,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface TodayViewProps {
  tasks: Task[];
  stats: StatsResponse | null;
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
  // Subtasks
  onToggleSubtask?: (subtask: Task) => void;
  onAddSubtask?: (parentId: string, title: string) => void;
  onEditSubtask?: (subtask: Task) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
  isLoading?: boolean;
}

const MOTIVATIONAL_QUOTES = [
  "Every small step counts! 🎯",
  "You've got this! 💪",
  "One task at a time 🎯",
  "Progress over perfection 📈",
  "You're doing great! ✨",
  "Break it into smaller pieces 🧩",
  "Focus on what matters 🎯",
  "You're closer than you think 🚀",
];

function getToday() {
  const today = new Date();
  return format(today, "EEEE, MMMM d", { locale: ru });
}

function getMotivationalQuote() {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}

export function TodayView({
  tasks,
  stats,
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
  isLoading = false,
}: TodayViewProps) {
  // Filter tasks for today
  const todayTasks = tasks.filter((task) => {
    if (task.status !== "active" && task.status !== "completed") return false;
    if (!task.dueDateStart && !task.dueDateEnd) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = task.dueDateStart ? new Date(task.dueDateStart) : null;
    const end = task.dueDateEnd ? new Date(task.dueDateEnd) : null;

    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(0, 0, 0, 0);

    if (start && end) {
      return start <= today && today <= end;
    }
    if (start) {
      return start.getTime() === today.getTime();
    }
    return false;
  });

  // Apply energy filter
  const filteredTasks = currentEnergy
    ? todayTasks.filter((t) => t.energyLevel <= currentEnergy)
    : todayTasks;

  // Separate completed and active
  const activeTasks = filteredTasks.filter((t) => t.status === "active");
  const completedTasks = filteredTasks.filter((t) => t.status === "completed");

  const maxActive = 5;
  const canAddMore = activeTasks.length < maxActive;
  const progressPercent = todayTasks.length > 0 
    ? (completedTasks.length / todayTasks.length) * 100 
    : 0;
  const hasTasksButFiltered = currentEnergy !== null && activeTasks.length === 0 && filteredTasks.length > 0;

  // Handle task reordering - preserve the new order
  const handleReorder = (reorderedActiveTasks: Task[]) => {
    console.log("🔄 handleReorder called");
    console.log("  Reordered active tasks:", reorderedActiveTasks.map(t => ({ id: t.id, title: t.title })));
    console.log("  Total tasks before:", tasks.length);
    
    // Create a map of reordered task IDs in their new order
    const reorderedMap = new Map(reorderedActiveTasks.map((t, i) => [t.id, i]));
    
    // Create new tasks array with reordered active tasks
    // Find all task IDs that need to be reordered
      // Separate tasks: reordered ones, and non-reordered ones
    const sorted = tasks.slice().sort((a, b) => {
      const aIdx = reorderedMap.get(a.id);
      const bIdx = reorderedMap.get(b.id);
      
      // Both are in reordered set - sort by their new order
      if (aIdx !== undefined && bIdx !== undefined) {
        return aIdx - bIdx;
      }
      
      // Only a is in reordered set - keep it before others
      if (aIdx !== undefined) return -1;
      
      // Only b is in reordered set - keep it before others
      if (bIdx !== undefined) return 1;
      
      // Neither in reordered set - preserve their original relative order
      return 0;
    });
    
    console.log("  New tasks order:", sorted.map(t => ({ id: t.id, title: t.title })));
    console.log("  Calling onReorder...");
    onReorder?.(sorted);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        {/* Header with date and add button */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-7 w-7 text-emerald-600" />
              <h1 className="text-4xl font-bold">На сегодня</h1>
            </div>
            <p className="text-muted-foreground text-lg capitalize">{getToday()}</p>
          </div>
          <Button
            onClick={onAddTask}
            disabled={isLoading}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg h-12 px-6 text-base font-semibold"
          >
            <Plus className="h-5 w-5 mr-2" />
            Добавить задачу
          </Button>
        </div>

        {/* Energy Status */}
        <div>
          <EnergyStatus
            currentEnergy={currentEnergy}
            onEnergyChange={onEnergyChange}
            isLoading={isLoading}
          />
        </div>

        {/* Active Tasks Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                <Zap className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Фокус на сегодня</h2>
                <p className="text-sm text-muted-foreground">Активные задачи, требующие вашего внимания</p>
              </div>
            </div>
            <Badge className="h-8 px-3 text-sm font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              {activeTasks.length}/{maxActive} задач
            </Badge>
          </div>

          <Card className="border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4 bg-gradient-to-r from-yellow-50 to-transparent dark:from-yellow-900/10 dark:to-transparent border-b border-slate-200 dark:border-slate-700">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {activeTasks.length < maxActive
                    ? `Осталось ${maxActive - activeTasks.length} слотов`
                    : `Максимум достигнут! Завершите одну задачу для добавления нового`}
                </p>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all"
                    style={{ width: `${(activeTasks.length / maxActive) * 100}%` }}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {activeTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-base text-muted-foreground mb-1 font-medium">
                    {hasTasksButFiltered
                      ? "Нет задач для выбранного уровня энергии"
                      : "Нет активных задач на сегодня"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-6">
                    {hasTasksButFiltered
                      ? "Попробуйте увеличить уровень энергии или сбросить фильтр"
                      : "Нажмите кнопку выше, чтобы создать новую задачу"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <SortableTasksList
                    tasks={activeTasks}
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Completed Tasks Toggle */}
        {completedTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">Выполненные задачи</p>
                <p className="text-sm text-muted-foreground">{completedTasks.length} задача{completedTasks.length === 1 ? "" : "и"} на сегодня</p>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(event) => onShowCompletedChange(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Показать выполненные
              </label>
            </div>
          </div>
        )}

        {/* Completed Tasks Section */}
        {completedTasks.length > 0 && showCompleted && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Завершено</h2>
                <p className="text-sm text-muted-foreground">Отличная работа! Вы закончили {completedTasks.length} задач(и)</p>
              </div>
            </div>

            <Card className="border-2 border-emerald-200 dark:border-emerald-800/50 shadow-sm bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-900/10 dark:to-transparent">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors group"
                    >
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-500 flex-shrink-0" />
                      <span className="text-sm line-through text-muted-foreground flex-1 font-medium">
                        {task.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onComplete(task)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 hover:text-emerald-700"
                      >
                        Вернуть
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Progress Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Прогресс</h2>
              <p className="text-sm text-muted-foreground">Ваше достижение за сегодня</p>
            </div>
          </div>

          <Card className="border-2 border-blue-200 dark:border-blue-800/50 shadow-sm bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent">
            <CardContent className="pt-8">
              <div className="space-y-6">
                {/* Progress bar with stats */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold">Завершено задач</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {completedTasks.length}/{todayTasks.length}
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-3 rounded-full" />
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {todayTasks.length === 0
                      ? "Начните с добавления первой задачи"
                      : `${Math.round(progressPercent)}% завершено`}
                  </p>
                </div>

                {/* Motivational message */}
                <div className="bg-blue-100/50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-800/30">
                  <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Sparkles className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm font-medium italic">
                      {getMotivationalQuote()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
