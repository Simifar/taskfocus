"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store";
import { ApiResponse, Task, TasksListResponse, StatsResponse } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Brain,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Zap,
  Target,
  TrendingUp,
  LogOut,
  Flame,
  Calendar,
  Archive,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Battery,
  BatteryMedium,
  BatteryLow,
  BatteryFull,
  AlertTriangle,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import { cn } from "@/lib/utils";

const MAX_ACTIVE_TASKS = 3;

export function Dashboard() {
  const router = useRouter();
  const {
    user,
    tasks,
    activeTasks,
    completedTasks,
    archivedTasks,
    setTasks,
    updateTask,
    removeTask,
    stats,
    setStats,
    currentEnergy,
    setCurrentEnergy,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    logout,
  } = useAppStore();

  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const refreshTasks = async () => {
    const tasksResponse = await fetch("/api/tasks");
    const tasksData: ApiResponse<TasksListResponse> = await tasksResponse.json();
    if (tasksData.success && tasksData.data) {
      setTasks(tasksData.data.items);
    }
  };

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Загружаем задачи
        await refreshTasks();

        // Загружаем статистику
        const statsResponse = await fetch("/api/stats");
        const statsData: ApiResponse<StatsResponse> = await statsResponse.json();
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Ошибка загрузки данных");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [setTasks, setStats]);

  // Обработчик выхода
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      logout();
      toast.success("Вы вышли из системы");
    } catch {
      toast.error("Ошибка выхода");
    }
  };

  // Переключение выполнения задачи (active <-> completed)
  const handleToggleCompleteTask = async (task: Task) => {
    try {
      const nextStatus = task.status === "completed" ? "active" : "completed";
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data: ApiResponse<Task> = await response.json();

      if (data.success && data.data) {
        updateTask(task.id, data.data);
        toast.success(
          nextStatus === "completed"
            ? "Задача выполнена!"
            : "Задача возвращена в активные"
        );

        // Обновляем статистику
        const statsResponse = await fetch("/api/stats");
        const statsData: ApiResponse<StatsResponse> = await statsResponse.json();
        if (statsData.success && statsData.data) {
          setStats(statsData.data);
        }
      } else {
        toast.error(data.error?.message || "Ошибка выполнения задачи");
      }
    } catch {
      toast.error("Ошибка соединения");
    }
  };

  // Удаление задачи
  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        removeTask(taskId);
        toast.success("Задача удалена");
      }
    } catch {
      toast.error("Ошибка удаления");
    }
  };

  // Архивация задачи
  const handleArchiveTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      const data: ApiResponse<Task> = await response.json();

      if (data.success && data.data) {
        updateTask(taskId, data.data);
        toast.success("Задача архивирована");
      }
    } catch {
      toast.error("Ошибка архивации");
    }
  };

  // Восстановление архивированной задачи
  const handleRestoreTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });
      const data: ApiResponse<Task> = await response.json();

      if (data.success && data.data) {
        updateTask(taskId, data.data);
        toast.success("Задача восстановлена");
      }
    } catch {
      toast.error("Ошибка восстановления");
    }
  };

  // Переключение развернутого состояния задачи
  const toggleExpanded = (taskId: string) => {
    setExpandedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Иконка энергии
  const getEnergyIcon = (level: number) => {
    if (level <= 1) return <BatteryLow className="h-4 w-4 text-green-500" />;
    if (level <= 2) return <BatteryMedium className="h-4 w-4 text-lime-500" />;
    if (level <= 3) return <Battery className="h-4 w-4 text-yellow-500" />;
    if (level <= 4) return <BatteryFull className="h-4 w-4 text-orange-500" />;
    return <BatteryFull className="h-4 w-4 text-red-500" />;
  };

  // Цвет энергии
  const getEnergyColor = (level: number) => {
    if (level <= 2) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    if (level <= 3) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
  };

  // Приоритет
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      case "low":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "";
    }
  };

  // Фильтрация задач по энергии
  const filteredTasks = tasks.filter((task) => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const haystack = `${task.title} ${task.description ?? ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    // Не применяем фильтр энергии к архивированным задачам
    if (task.status !== "archived" && currentEnergy !== null && task.energyLevel > currentEnergy) return false;
    return true;
  });

  // Сортировка: сначала подходящие по энергии
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1;
    if (a.status !== "active" && b.status === "active") return 1;
    return a.energyLevel - b.energyLevel;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">TaskFocus</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {user?.name || user?.username}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                onClick={() => setCreateDialogOpen(true)}
                disabled={activeTasks.length >= MAX_ACTIVE_TASKS}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Новая задача</span>
                <span className="sm:hidden">Добавить</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/profile")}
                title="Профиль"
              >
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">Активных</p>
                  <p className="text-3xl font-bold">{activeTasks.length}/{MAX_ACTIVE_TASKS}</p>
                </div>
                <Target className="h-8 w-8 opacity-80" />
              </div>
              <Progress
                value={(activeTasks.length / MAX_ACTIVE_TASKS) * 100}
                className="mt-2 bg-white/20"
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Сегодня</p>
                  <p className="text-2xl font-bold">{stats?.completedToday || 0}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">За неделю</p>
                  <p className="text-2xl font-bold">{stats?.completedThisWeek || 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Всего выполнено</p>
                  <p className="text-2xl font-bold">{stats?.completedTasks || 0}</p>
                </div>
                <Flame className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Energy Filter */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Ваш текущий уровень энергии
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <Button
                  key={level}
                  variant={currentEnergy === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentEnergy(level)}
                  className={cn(
                    "flex-1 min-w-[60px]",
                    currentEnergy === level && "bg-emerald-600 hover:bg-emerald-700"
                  )}
                >
                  {getEnergyIcon(level)}
                  <span className="ml-1">{level}</span>
                </Button>
              ))}
              <Button
                variant={currentEnergy === null ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentEnergy(null)}
                className="min-w-[80px]"
              >
                Сбросить
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {currentEnergy
                ? `Показаны задачи для уровня энергии ${currentEnergy} и ниже`
                : "Выберите уровень энергии для фильтрации задач"}
            </p>
          </CardContent>
        </Card>

        {/* Warning if limit reached */}
        {activeTasks.length >= MAX_ACTIVE_TASKS && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Лимит достигнут!</strong> У вас {MAX_ACTIVE_TASKS} активные задачи.
                Завершите или отложите одну из них, чтобы добавить новую.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Status Filter */}
        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по задачам..."
              className="bg-white/80 dark:bg-gray-900/60"
            />
          </div>

          <div className="flex flex-wrap gap-2">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            Все ({tasks.length})
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("active")}
          >
            <Circle className="h-4 w-4 mr-1" />
            Активные ({activeTasks.length})
          </Button>
          <Button
            variant={statusFilter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("completed")}
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Выполненные ({completedTasks.length})
          </Button>
          <Button
            variant={statusFilter === "archived" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("archived")}
          >
            <Archive className="h-4 w-4 mr-1" />
            Архив ({archivedTasks.length})
          </Button>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {sortedTasks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  {statusFilter === "active"
                    ? "Нет активных задач"
                    : statusFilter === "completed"
                    ? "Нет выполненных задач"
                    : statusFilter === "archived"
                    ? "Архив пустой"
                    : "Нет задач"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Нажмите "Новая задача" чтобы начать
                </p>
              </CardContent>
            </Card>
          ) : (
            sortedTasks.map((task) => {
              const isExpanded = expandedTasks.has(task.id);
              const subtasks = task.subtasks || [];
              const completedSubtasks = subtasks.filter((s) => s.status === "completed").length;
              const progress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

              return (
                <Card
                  key={task.id}
                  className={cn(
                    "transition-all duration-200 hover:shadow-md",
                    (task.status === "completed" || task.status === "archived") && "opacity-75",
                    currentEnergy !== null && task.energyLevel > currentEnergy && "opacity-50"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Complete button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "mt-0.5",
                          task.status === "completed" && "text-emerald-600"
                        )}
                        onClick={() => handleToggleCompleteTask(task)}
                      >
                        {task.status === "completed" ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <Circle className="h-6 w-6" />
                        )}
                      </Button>

                      {/* Task content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3
                              className={cn(
                                "font-medium text-lg",
                                task.status === "completed" && "line-through text-muted-foreground"
                              )}
                            >
                              {task.title}
                            </h3>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {task.status === "active" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingTask(task)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleArchiveTask(task.id)}
                                  title="В архив"
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            {task.status === "archived" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRestoreTask(task.id)}
                                className="text-emerald-600 hover:text-emerald-700"
                                title="Восстановить"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge variant="secondary" className={getEnergyColor(task.energyLevel)}>
                            {getEnergyIcon(task.energyLevel)}
                            <span className="ml-1">Энергия: {task.energyLevel}</span>
                          </Badge>
                          <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                            {task.priority === "high"
                              ? "Высокий"
                              : task.priority === "medium"
                              ? "Средний"
                              : "Низкий"}
                          </Badge>
                          {(task.dueDateStart || task.dueDateEnd) && (
                            <Badge variant="outline">
                              <Calendar className="h-3 w-3 mr-1" />
                              {task.dueDateStart && task.dueDateEnd
                                ? `${new Date(task.dueDateStart).toLocaleDateString("ru")} - ${new Date(task.dueDateEnd).toLocaleDateString("ru")}`
                                : task.dueDateStart
                                ? `с ${new Date(task.dueDateStart).toLocaleDateString("ru")}`
                                : `до ${new Date(task.dueDateEnd!).toLocaleDateString("ru")}`}
                            </Badge>
                          )}
                        </div>

                        {/* Subtasks */}
                        {subtasks.length > 0 && (
                          <div className="mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(task.id)}
                              className="text-muted-foreground"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 mr-1" />
                              ) : (
                                <ChevronDown className="h-4 w-4 mr-1" />
                              )}
                              Подзадачи ({completedSubtasks}/{subtasks.length})
                            </Button>

                            {isExpanded && (
                              <div className="mt-2 space-y-1 pl-4 border-l-2 border-muted">
                                {subtasks.map((subtask) => (
                                  <div
                                    key={subtask.id}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={async () => {
                                        const response = await fetch(
                                          `/api/tasks/${subtask.id}`,
                                          {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                              status:
                                                subtask.status === "completed"
                                                  ? "active"
                                                  : "completed",
                                            }),
                                          }
                                        );
                                        const data = await response.json();
                                        if (data.success) {
                                          await refreshTasks();
                                        }
                                      }}
                                    >
                                      {subtask.status === "completed" ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                      ) : (
                                        <Circle className="h-4 w-4" />
                                      )}
                                    </Button>
                                    <span
                                      className={cn(
                                        subtask.status === "completed" &&
                                          "line-through text-muted-foreground"
                                      )}
                                    >
                                      {subtask.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <Progress value={progress} className="mt-2 h-1" />
                          </div>
                        )}

                        {/* Add subtask button */}
                        {task.status === "active" && (
                          <form
                            className="mt-3 flex gap-2"
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const form = e.target as HTMLFormElement;
                              const input = form.elements.namedItem("subtask") as HTMLInputElement;
                              const title = input.value.trim();
                              if (!title) return;

                              try {
                                const response = await fetch(
                                  `/api/subtasks`,
                                  {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ parentId: task.id, title }),
                                  }
                                );
                                const data = await response.json();
                                if (data.success) {
                                  input.value = "";
                                  await refreshTasks();
                                  toast.success("Подзадача добавлена");
                                }
                              } catch {
                                toast.error("Ошибка добавления подзадачи");
                              }
                            }}
                          >
                            <Input
                              name="subtask"
                              placeholder="Добавить подзадачу..."
                              className="h-8 text-sm"
                            />
                            <Button type="submit" size="sm" variant="secondary">
                              <Plus className="h-4 w-4" />
                            </Button>
                          </form>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-sm text-muted-foreground border-t bg-white/50 dark:bg-gray-900/50">
        <p>TaskFocus — Менеджер задач для людей с СДВГ</p>
      </footer>

      {/* Dialogs */}
      <CreateTaskDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
        />
      )}
    </div>
  );
}
