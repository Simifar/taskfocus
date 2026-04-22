"use client";

import { Archive, Trash2, RotateCcw, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Task, StatsResponse } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import { useTasks } from "@/features/tasks/hooks";
import { cn } from "@/shared/lib/utils";

interface ArchiveViewProps {
  stats: StatsResponse | null;
  onRestore: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

function getPriorityLabel(priority: Task["priority"]) {
  if (priority === "high") return { label: "⚡ Высокий", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" };
  if (priority === "medium") return { label: "→ Средний", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" };
  return { label: "✓ Низкий", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" };
}

export function ArchiveView({ stats, onRestore, onDelete }: ArchiveViewProps) {
  const { data, isLoading } = useTasks({ status: "archived" });
  const archivedTasks = data?.items ?? [];

  const rootTasks = archivedTasks.filter((t) => !t.parentTaskId);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
          <Archive className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Архив</h1>
          <p className="text-sm text-muted-foreground">
            {stats?.archivedTasks ?? rootTasks.length} задач в архиве
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rootTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full mb-4">
            <Archive className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">Архив пуст</p>
          <p className="text-sm text-muted-foreground mt-1">
            Заархивированные задачи появятся здесь
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rootTasks.map((task) => {
            const priority = getPriorityLabel(task.priority);
            const archivedDate = task.updatedAt
              ? format(new Date(task.updatedAt), "d MMM yyyy", { locale: ru })
              : null;

            return (
              <Card key={task.id} className="border-l-4 border-l-slate-300 dark:border-l-slate-600 opacity-80 hover:opacity-100 transition-opacity">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={cn("font-medium leading-tight", "line-through text-muted-foreground")}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="secondary" className={cn("text-xs font-semibold", priority.className)}>
                          {priority.label}
                        </Badge>
                        {archivedDate && (
                          <span className="text-xs text-muted-foreground">
                            Архивировано {archivedDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        title="Восстановить"
                        onClick={() => onRestore(task.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Удалить навсегда"
                        onClick={() => onDelete(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
