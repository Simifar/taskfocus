"use client";

import { useState } from "react";
import type { Task, StatsResponse } from "@/shared/types";
import { useCreateTask } from "@/features/tasks/hooks";
import { useDashboardStore } from "@/features/dashboard/store";
import { ApiError } from "@/shared/lib/fetcher";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { CreateSubtaskDialog } from "@/features/tasks/components/create-subtask-dialog";
import { cn } from "@/shared/lib/utils";
import { Plus, Inbox, Calendar, Loader2, MoreHorizontal, Edit, Archive, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface InboxViewProps {
  tasks: Task[];
  stats: StatsResponse | null;
  onEdit?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onAssignToToday?: (taskId: string) => void;
  onAssignToWeek?: (taskId: string) => void;
  onAddTask?: () => void;
  onToggleSubtask?: (subtask: Task) => void;
  onAddSubtask?: (parentId: string, title: string) => void;
  onEditSubtask?: (subtask: Task) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
}

export function InboxView({
  tasks,
  onEdit,
  onComplete,
  onArchive,
  onDelete,
  onAssignToToday,
  onAssignToWeek,
  onAddTask,
  onAddSubtask,
}: InboxViewProps) {
  const currentCategoryId = useDashboardStore((s) => s.currentCategoryId);
  const createTask = useCreateTask();

  const [searchQuery, setSearchQuery] = useState("");
  const [subtaskDialogOpen, setSubtaskDialogOpen] = useState(false);
  const [parentTaskForSubtask, setParentTaskForSubtask] = useState<Task | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");

  const inboxTasks = tasks.filter((task) => {
    if (task.status !== "active") return false;
    if (!task.dueDateStart) return true;

    const startDate = new Date(task.dueDateStart);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    return startDate.getTime() > today.getTime();
  });

  const filteredTasks = inboxTasks.filter((task) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const haystack = `${task.title} ${task.description ?? ""}`.toLowerCase();
    return haystack.includes(q);
  });

  const handleQuickAdd = async () => {
    if (!quickAddTitle.trim()) return;
    try {
      await createTask.mutateAsync({
        title: quickAddTitle.trim(),
        priority: "medium",
        energyLevel: 3,
        categoryId: currentCategoryId ?? null,
      });
      toast.success("Задача добавлена!");
      setQuickAddTitle("");
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Ошибка соединения";
      toast.error(message);
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Inbox className="h-6 w-6 text-blue-500" />
              Входящие задачи
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {inboxTasks.length} задач без даты • Соберите фокус перед началом работы
            </p>
          </div>
        </div>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Что нужно сделать?"
                  className="border-0 shadow-none text-base placeholder:text-muted-foreground/60 focus-visible:ring-0"
                  value={quickAddTitle}
                  onChange={(e) => setQuickAddTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleQuickAdd();
                  }}
                  disabled={createTask.isPending}
                />
              </div>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 shrink-0"
                onClick={handleQuickAdd}
                disabled={createTask.isPending || !quickAddTitle.trim()}
              >
                {createTask.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Нажмите Enter или кнопку для быстрого добавления • Детали можно отредактировать позже
            </p>
          </CardContent>
        </Card>

        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск в входящих..."
            className="bg-white/80 dark:bg-gray-900/60"
          />
        </div>

        {filteredTasks.length > 0 ? (
          <div className="space-y-3">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={task.status === "completed"}
                          onChange={() => onComplete?.(task)}
                          className="h-5 w-5 rounded cursor-pointer"
                        />
                        <h3
                          className={cn(
                            "font-medium",
                            task.status === "completed" && "line-through text-muted-foreground",
                          )}
                        >
                          {task.title}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          Энергия: {task.energyLevel}
                        </Badge>
                        {task.priority && (
                          <Badge
                            variant={task.priority === "high" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {task.priority === "high"
                              ? "Высокий"
                              : task.priority === "medium"
                                ? "Средний"
                                : "Низкий"}
                          </Badge>
                        )}
                        {task.category && (
                          <Badge variant="secondary" className="text-xs">
                            {task.category.name}
                          </Badge>
                        )}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            П: {task.subtasks.length}
                          </Badge>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onEdit?.(task)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAssignToToday?.(task.id)}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Назначить на сегодня
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAssignToWeek?.(task.id)}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Назначить на неделю
                        </DropdownMenuItem>
                        {onAddSubtask && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setParentTaskForSubtask(task);
                                setSubtaskDialogOpen(true);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Добавить подзадачу
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onArchive?.(task.id)}
                          className="text-orange-600"
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          В архив
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete?.(task.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-blue-200 dark:border-blue-800">
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-24 h-24 bg-blue-50 dark:bg-blue-950/50 rounded-full flex items-center justify-center mb-6">
                <Inbox className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? "Ничего не найдено" : "Входящие пусты"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery
                  ? "Попробуйте другой поисковый запрос или проверьте написание"
                  : "Отлично! Все задачи распределены по времени. Теперь вы можете сосредоточиться на выполнении или добавить новые идеи для будущих задач."}
              </p>
              {!searchQuery && (
                <Button onClick={onAddTask} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить задачу
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {parentTaskForSubtask && (
        <CreateSubtaskDialog
          open={subtaskDialogOpen}
          onOpenChange={setSubtaskDialogOpen}
          parentTaskId={parentTaskForSubtask.id}
          parentTaskTitle={parentTaskForSubtask.title}
          onSubmit={(parentId, title) => {
            if (onAddSubtask) onAddSubtask(parentId, title);
          }}
        />
      )}
    </>
  );
}
