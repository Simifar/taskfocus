"use client";

import { useState } from "react";
import { Task, StatsResponse } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SortableTasksList } from "@/components/tasks/sortable-tasks-list";
import { cn } from "@/lib/utils";
import { Plus, Inbox, CheckCircle2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { ru } from "date-fns/locale";

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
  // Subtasks
  onToggleSubtask?: (subtask: Task) => void;
  onAddSubtask?: (parentId: string, title: string) => void;
  onEditSubtask?: (subtask: Task) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
}

export function InboxView({
  tasks,
  stats,
  onEdit,
  onComplete,
  onArchive,
  onDelete,
  onAssignToToday,
  onAssignToWeek,
  onAddTask,
  onToggleSubtask,
  onAddSubtask,
  onEditSubtask,
  onDeleteSubtask,
}: InboxViewProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Inbox задачи: это задачи без установленной даты или с priority=null
  const inboxTasks = tasks.filter((task) => {
    if (task.status !== "active") return false;
    const hasDate = task.dueDateStart || task.dueDateEnd;
    return !hasDate;
  });

  // Поиск
  const filteredTasks = inboxTasks.filter((task) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const haystack = `${task.title} ${task.description ?? ""}`.toLowerCase();
    return haystack.includes(q);
  });

  // Обработчик назначения на сегодня
  const handleAssignToToday = async (taskId: string) => {
    try {
      const today = new Date();
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueDateStart: today.toISOString(),
          dueDateEnd: today.toISOString(),
        }),
      });

      if (response.ok) {
        toast.success("Задача назначена на сегодня");
        onAssignToToday?.(taskId);
      }
    } catch {
      toast.error("Ошибка назначения задачи");
    }
  };

  // Обработчик назначения на эту неделю
  const handleAssignToWeek = async (taskId: string) => {
    try {
      const today = new Date();
      const weekEnd = addDays(today, 7);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueDateStart: today.toISOString(),
          dueDateEnd: weekEnd.toISOString(),
        }),
      });

      if (response.ok) {
        toast.success("Задача назначена на неделю");
        onAssignToWeek?.(taskId);
      }
    } catch {
      toast.error("Ошибка назначения задачи");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="h-6 w-6 text-blue-500" />
            Входящие
          </h2>
          <p className="text-sm text-muted-foreground">
            {inboxTasks.length} задач без даты
          </p>
        </div>
        <Button
          onClick={onAddTask}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Добавить
        </Button>
      </div>

      {/* Quick Add Form */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input placeholder="Быстрое добавление задачи..." className="flex-1" />
            <Button size="sm" className="bg-blue-600">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Нажмите Enter или кнопку для добавления. Вы сможете отредактировать детали позже.
          </p>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск в входящих..."
          className="bg-white/80 dark:bg-gray-900/60"
        />
      </div>

      {/* Tasks */}
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
                      <h3 className={cn(
                        "font-medium",
                        task.status === "completed" && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        Энергия: {task.energyLevel}
                      </Badge>
                      {task.priority && (
                        <Badge variant={task.priority === "high" ? "destructive" : "secondary"} className="text-xs">
                          {task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий"}
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

                  {/* Quick Actions */}
                  <div className="flex flex-col gap-2 min-w-max">
                    {onAddSubtask && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => {
                          const title = window.prompt("Название подзадачи:");
                          if (title && title.trim()) {
                            onAddSubtask(task.id, title.trim());
                          }
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Подзадача
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleAssignToToday(task.id)}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Сегодня
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleAssignToWeek(task.id)}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Неделя
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              {searchQuery ? "Ничего не найдено" : "Входящие пусты"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery
                ? "Попробуйте другой поисковый запрос"
                : "Все задачи уже распределены по датам. Молодец!"}
            </p>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
