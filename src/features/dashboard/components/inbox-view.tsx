"use client";

import { useState, useMemo, useCallback } from "react";
import type { Task, StatsResponse } from "@/shared/types";
import { useCreateTask } from "@/features/tasks/hooks";
import { ApiError } from "@/shared/lib/fetcher";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Checkbox } from "@/shared/ui/checkbox";
import { Progress } from "@/shared/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/shared/ui/dropdown-menu";
import { CreateSubtaskDialog } from "@/features/tasks/components/create-subtask-dialog";
import { SimpleSortableTasksList } from "@/features/tasks/components/simple-sortable-tasks-list";
import { mergeReorderedTasks } from "@/features/tasks/lib/reorder";
import { cn } from "@/shared/lib/utils";
import { 
  Plus, Inbox, Calendar, Loader2, MoreHorizontal, Edit, Archive, Trash2, 
  Filter, Star, Clock, Zap, ChevronDown, CheckCircle2, Circle, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  compareByEisenhower,
  EISENHOWER_META,
  EISENHOWER_ORDER,
  getEisenhowerQuadrant,
} from "@/features/tasks/lib/eisenhower";
import type { EisenhowerQuadrant } from "@/shared/types";

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
  onBatchArchive?: (taskIds: string[]) => void;
  onBatchDelete?: (taskIds: string[]) => void;
  onBatchAssignToToday?: (taskIds: string[]) => void;
  onBatchAssignToWeek?: (taskIds: string[]) => void;
  onReorder?: (tasks: Task[]) => void;
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
  onBatchArchive,
  onBatchDelete,
  onBatchAssignToToday,
  onBatchAssignToWeek,
  onReorder,
}: InboxViewProps) {
  const createTask = useCreateTask();

  const [searchQuery, setSearchQuery] = useState("");
  const [subtaskDialogOpen, setSubtaskDialogOpen] = useState(false);
  const [parentTaskForSubtask, setParentTaskForSubtask] = useState<Task | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [filterQuadrant, setFilterQuadrant] = useState<EisenhowerQuadrant | "all">("all");
  const [filterEnergy, setFilterEnergy] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created");
  const [viewMode, setViewMode] = useState<"compact" | "detailed">("detailed");

  const inboxTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (task.status !== "active") return false;
      if (!task.dueDateStart) return true;

      const startDate = new Date(task.dueDateStart);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);

      return startDate.getTime() > today.getTime();
    });
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let filtered = inboxTasks;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((task) => {
        const haystack = `${task.title} ${task.description ?? ""}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    // Eisenhower quadrant filter
    if (filterQuadrant !== "all") {
      filtered = filtered.filter((task) => getEisenhowerQuadrant(task) === filterQuadrant);
    }

    // Energy filter
    if (filterEnergy !== "all") {
      const energyLevel = parseInt(filterEnergy);
      filtered = filtered.filter((task) => task.energyLevel >= energyLevel);
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "eisenhower":
          return compareByEisenhower(a, b);
        case "energy":
          return b.energyLevel - a.energyLevel;
        case "created":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [inboxTasks, searchQuery, filterQuadrant, filterEnergy, sortBy]);

  const processingProgress = useMemo(() => {
    const total = inboxTasks.length;
    const processed = tasks.filter(t => t.status === "completed" || t.status === "archived").length;
    return total > 0 ? ((total - processed) / total) * 100 : 100;
  }, [inboxTasks, tasks]);

  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  const selectAllTasks = useCallback(() => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredTasks.map(t => t.id)));
    }
  }, [selectedTasks.size, filteredTasks]);

  const getEnergyIcon = (level: number) => {
    if (level >= 4) return <Zap className="h-3 w-3 text-orange-500" />;
    if (level >= 3) return <Clock className="h-3 w-3 text-muted-foreground" />;
    return <Circle className="h-3 w-3 text-gray-400" />;
  };

  const handleQuickAdd = async () => {
    if (!quickAddTitle.trim()) return;
    try {
      await createTask.mutateAsync({
        title: quickAddTitle.trim(),
        important: true,
        urgent: false,
        energyLevel: 3,
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 flex-wrap">
              <Inbox className="h-5 w-5 md:h-6 md:w-6 text-brand shrink-0" />
              Входящие
              <Badge variant="secondary">
                {filteredTasks.length}/{inboxTasks.length}
              </Badge>
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              {inboxTasks.length} задач без даты
            </p>
            {inboxTasks.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="shrink-0">Прогресс:</span>
                <div className="flex-1 max-w-xs">
                  <Progress value={processingProgress} className="h-2" />
                </div>
                <span className="shrink-0">{Math.round(processingProgress)}%</span>
              </div>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 self-start"
            onClick={() => setViewMode(viewMode === "compact" ? "detailed" : "compact")}
          >
            {viewMode === "compact" ? "Детально" : "Компактно"}
          </Button>
        </div>

        <Card className="border-brand/30">
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
                className="bg-brand hover:bg-brand/90 shrink-0"
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

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск в входящих..."
              className=""
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Фильтры
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm font-semibold">Матрица</div>
                <DropdownMenuCheckboxItem
                  checked={filterQuadrant === "all"}
                  onCheckedChange={() => setFilterQuadrant("all")}
                >
                  Все квадранты
                </DropdownMenuCheckboxItem>
                {EISENHOWER_ORDER.map((quadrant) => (
                  <DropdownMenuCheckboxItem
                    key={quadrant}
                    checked={filterQuadrant === quadrant}
                    onCheckedChange={() => setFilterQuadrant(quadrant)}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", EISENHOWER_META[quadrant].dot)} />
                      {EISENHOWER_META[quadrant].shortTitle}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-sm font-semibold">Энергия</div>
                <DropdownMenuCheckboxItem
                  checked={filterEnergy === "all"}
                  onCheckedChange={() => setFilterEnergy("all")}
                >
                  Все уровни
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filterEnergy === "4"}
                  onCheckedChange={() => setFilterEnergy("4")}
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-3 w-3 text-orange-500" />
                    Высокая (4+)
                  </div>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filterEnergy === "3"}
                  onCheckedChange={() => setFilterEnergy("3")}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    Средняя (3+)
                  </div>
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Сортировка
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuCheckboxItem
                  checked={sortBy === "created"}
                  onCheckedChange={() => setSortBy("created")}
                >
                  По дате создания
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={sortBy === "eisenhower"}
                  onCheckedChange={() => setSortBy("eisenhower")}
                >
                  По матрице
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={sortBy === "energy"}
                  onCheckedChange={() => setSortBy("energy")}
                >
                  По энергии
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>


        {filteredTasks.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                onCheckedChange={selectAllTasks}
              />
              <span className="text-sm text-muted-foreground">
                {selectedTasks.size > 0 
                  ? `Выбрано ${selectedTasks.size} из ${filteredTasks.length}`
                  : `${filteredTasks.length} задач`
                }
              </span>
            </div>
            {selectedTasks.size > 0 && (
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Массовые действия
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      onBatchAssignToToday?.(Array.from(selectedTasks));
                      setSelectedTasks(new Set());
                    }}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Назначить на сегодня
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      onBatchAssignToWeek?.(Array.from(selectedTasks));
                      setSelectedTasks(new Set());
                    }}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Назначить на неделю
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => {
                        onBatchArchive?.(Array.from(selectedTasks));
                        setSelectedTasks(new Set());
                      }}
                      className="text-orange-600"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      В архив
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => {
                        onBatchDelete?.(Array.from(selectedTasks));
                        setSelectedTasks(new Set());
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        )}

        {filteredTasks.length > 0 ? (
          <SimpleSortableTasksList
            tasks={filteredTasks}
            onReorder={(reordered) => onReorder?.(mergeReorderedTasks(tasks, reordered))}
            className="space-y-3"
          >
            {(task) => {
              const quadrant = EISENHOWER_META[getEisenhowerQuadrant(task)];

              return (
              <Card
                className={cn(
                  "hover:shadow-md transition-all duration-200",
                  selectedTasks.has(task.id) && "ring-2 ring-brand/60 bg-brand/5",
                  viewMode === "compact" && "p-3"
                )}
              >
                <CardContent className={cn(
                  "p-4",
                  viewMode === "compact" && "p-3"
                )}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <Checkbox
                        checked={selectedTasks.has(task.id)}
                        onCheckedChange={() => toggleTaskSelection(task.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {task.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4 text-gray-400" />
                          )}
                          <h3
                            className={cn(
                              "font-medium truncate",
                              task.status === "completed" && "line-through text-muted-foreground",
                            )}
                          >
                            {task.title}
                          </h3>
                          <Badge variant="outline" className={cn("text-xs", quadrant.badge)}>
                            {quadrant.shortTitle}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {getEnergyIcon(task.energyLevel)}
                            <span className="text-xs text-muted-foreground">{task.energyLevel}</span>
                          </div>
                          {task.subtasks && task.subtasks.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {task.subtasks.filter(st => st.status === "completed").length}/{task.subtasks.length}
                            </Badge>
                          )}
                        </div>
                        {viewMode === "detailed" && task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                        )}
                        {viewMode === "detailed" && (
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Создано: {format(new Date(task.createdAt), "d MMM yyyy", { locale: ru })}</span>
                            {task.updatedAt && task.updatedAt !== task.createdAt && (
                              <span>Обновлено: {format(new Date(task.updatedAt), "d MMM yyyy", { locale: ru })}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onComplete?.(task)}>
                          {task.status === "completed" ? (
                            <><Circle className="h-4 w-4 mr-2" />Отметить как активную</>
                          ) : (
                            <><CheckCircle2 className="h-4 w-4 mr-2" />Выполнить</>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit?.(task)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onAssignToToday?.(task.id)}>
                          <Calendar className="h-4 w-4 mr-2" />
                          На сегодня
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAssignToWeek?.(task.id)}>
                          <Calendar className="h-4 w-4 mr-2" />
                          На неделю
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
                              Подзадача
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
            )}}
          </SimpleSortableTasksList>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                <Inbox className="h-10 w-10 text-muted-foreground" />
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
                <Button onClick={onAddTask} className="bg-brand hover:bg-brand/90">
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
