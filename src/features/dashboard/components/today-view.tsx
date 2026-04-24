"use client";

import { Task, StatsResponse } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Progress } from "@/shared/ui/progress";
import { SortableTasksList } from "@/features/tasks/components/sortable-tasks-list";
import { EnergyStatus } from "./energy-status";
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
import { useLocale } from "next-intl";
import { 
  useDashboardTranslations, 
  useCommonTranslations,
  useMotivationQuotes 
} from "@/shared/lib/i18n";

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

function getToday(locale: string) {
  const today = new Date();
  let dateLocale;
  if (locale === 'ru') {
    dateLocale = require('date-fns/locale/ru');
  } else {
    dateLocale = require('date-fns/locale/en-US');
  }
  return format(today, "EEEE, MMMM d", { locale: dateLocale });
}

function getMotivationalQuote(quotes: string[]) {
  return quotes[Math.floor(Math.random() * quotes.length)];
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
  const locale = useLocale();
  const t = useDashboardTranslations();
  const tCommon = useCommonTranslations();
  const motivationalQuotes = useMotivationQuotes() as string[];
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

  const handleReorder = (reorderedActiveTasks: Task[]) => {
    const reorderedMap = new Map(reorderedActiveTasks.map((t, i) => [t.id, i]));
    const sorted = tasks.slice().sort((a, b) => {
      const aIdx = reorderedMap.get(a.id);
      const bIdx = reorderedMap.get(b.id);
      if (aIdx !== undefined && bIdx !== undefined) return aIdx - bIdx;
      if (aIdx !== undefined) return -1;
      if (bIdx !== undefined) return 1;
      return 0;
    });
    onReorder?.(sorted);
  };

  return (
    <div className="min-h-full -m-4 md:-m-8">
      <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-5 md:space-y-8">
        {/* Header with date and add button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="h-6 w-6 md:h-8 md:w-8 text-brand" />
              <h1 className="text-headline">{t('today.title')}</h1>
            </div>
            <p className="text-body-large text-muted-foreground capitalize">{getToday(locale)}</p>
          </div>
          <Button
            onClick={onAddTask}
            disabled={isLoading || !canAddMore}
            className="bg-brand hover:bg-brand/90 text-brand-foreground shadow-md hover:shadow-lg transition-all duration-200 rounded-lg h-10 px-4 text-sm font-semibold sm:h-12 sm:px-6 sm:text-base w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            {tCommon('add')} {t('today.title').toLowerCase()}
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 shrink-0">
                <Zap className="h-4 w-4 md:h-5 md:w-5 text-yellow-600 dark:text-yellow-500" />
              </div>
              <div>
                <h2 className="text-title">Фокус на сегодня</h2>
                <p className="text-caption">Активные задачи</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {completedTasks.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onShowCompletedChange(!showCompleted)}
                  className="h-8 px-2 md:px-3 text-xs font-medium gap-1 border-brand/30 text-brand hover:bg-brand/10"
                >
                  <CheckCircle2 className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  <span className="hidden sm:inline">{showCompleted ? "Скрыть" : "Выполненные"} </span>
                  ({completedTasks.length})
                </Button>
              )}
              <Badge className="h-8 px-2 md:px-3 text-xs md:text-sm font-semibold bg-muted text-muted-foreground border border-border">
                {activeTasks.length}/{maxActive}
              </Badge>
            </div>
          </div>

          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4 border-b border-border">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {activeTasks.length < maxActive
                    ? `Осталось ${maxActive - activeTasks.length} слотов`
                    : `Максимум достигнут! Завершите одну задачу для добавления нового`}
                </p>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
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
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
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

        {/* Completed Tasks Section */}
        {completedTasks.length > 0 && showCompleted && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-brand/10 shrink-0">
                <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-brand" />
              </div>
              <div>
                <h2 className="text-title">Завершено</h2>
                <p className="text-caption">Завершено {completedTasks.length} задач</p>
              </div>
            </div>

            <Card className="border border-brand/20 shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-brand/5 hover:bg-brand/10 transition-colors group"
                    >
                      <CheckCircle2 className="h-5 w-5 text-brand flex-shrink-0" />
                      <span className="text-sm line-through text-muted-foreground flex-1 font-medium">
                        {task.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onComplete(task)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-brand hover:text-brand/80"
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
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-muted shrink-0">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-title">Прогресс</h2>
              <p className="text-caption">Ваше достижение за сегодня</p>
            </div>
          </div>

          <Card className="border shadow-sm">
            <CardContent className="pt-8">
              <div className="space-y-6">
                {/* Progress bar with stats */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold">Завершено задач</span>
                    <span className="text-2xl font-bold text-brand">
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
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm font-medium italic">
                      {getMotivationalQuote(motivationalQuotes)}
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
