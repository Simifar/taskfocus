"use client";

import { useState } from "react";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { Task } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import { Plus, ChevronDown, ChevronRight, CheckCircle2, Circle, Edit2, Trash2, Archive, GripVertical, BatteryLow, BatteryMedium, Battery, BatteryFull, MoreVertical } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

interface TaskWithSubtasksProps {
  task: Task;
  subtasks: Task[];
  onToggleSubtask: (subtask: Task) => void;
  onAddSubtask: (parentId: string, title: string) => void;
  onEditTask: (task: Task) => void;
  onEditSubtask: (subtask: Task) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onComplete: (task: Task) => void;
  onArchive: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  // Drag & Drop
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  isDragging?: boolean;
}

function getEnergyIcon(level: number) {
  if (level <= 1) return <BatteryLow className="h-4 w-4 text-green-500" />;
  if (level <= 2) return <BatteryMedium className="h-4 w-4 text-lime-500" />;
  if (level <= 3) return <Battery className="h-4 w-4 text-yellow-500" />;
  if (level <= 4) return <BatteryFull className="h-4 w-4 text-orange-500" />;
  return <BatteryFull className="h-4 w-4 text-red-500" />;
}

function getEnergyColor(level: number) {
  if (level <= 2) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
  if (level <= 3) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
  return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
}

function getPriorityColor(priority: string) {
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
}

export function TaskWithSubtasks({
  task,
  subtasks,
  onToggleSubtask,
  onAddSubtask,
  onEditTask,
  onEditSubtask,
  onDeleteSubtask,
  onComplete,
  onArchive,
  onDelete,
  attributes,
  listeners,
  isDragging = false,
}: TaskWithSubtasksProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  const completedSubtasks = subtasks.filter(st => st.status === "completed").length;
  const totalSubtasks = subtasks.length;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    try {
      onAddSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle("");
      setIsAddingSubtask(false);
      toast.success("Подзадача добавлена!");
    } catch (error) {
      toast.error("Ошибка при добавлении подзадачи");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddSubtask();
    } else if (e.key === "Escape") {
      setIsAddingSubtask(false);
      setNewSubtaskTitle("");
    }
  };

  return (
    <Card className={cn(
      "transition-all border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md",
      task.status === "completed" && "opacity-60 bg-slate-50 dark:bg-slate-900/50",
      isDragging && "shadow-lg ring-2 ring-blue-400"
    )}>
      <CardContent className="p-4 space-y-3">
        {/* Main Task Header */}
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <Button
            variant="ghost"
            size="icon"
            className="cursor-grab active:cursor-grabbing flex-shrink-0 mt-1"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </Button>

          {/* Complete Checkbox */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "flex-shrink-0 mt-0.5",
              task.status === "completed" ? "text-emerald-600 hover:text-emerald-700" : "text-muted-foreground hover:text-emerald-600"
            )}
            onClick={() => onComplete(task)}
          >
            {task.status === "completed" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </Button>

          {/* Expand/Collapse Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-shrink-0 mt-0.5 text-muted-foreground hover:text-slate-900 dark:hover:text-slate-100"
          >
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h4 className={cn(
                "font-semibold text-base leading-tight",
                task.status === "completed" && "line-through text-muted-foreground"
              )}>
                {task.title}
              </h4>
              {totalSubtasks > 0 && (
                <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-xs font-semibold">
                  {completedSubtasks}/{totalSubtasks} подзадач
                </Badge>
              )}
            </div>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{task.description}</p>
            )}
            {/* Badges */}
            <div className="flex flex-wrap gap-2.5 mt-3">
              <Badge variant="secondary" className={cn("gap-1", getEnergyColor(task.energyLevel))}>
                {getEnergyIcon(task.energyLevel)}
                <span className="text-xs font-semibold">{task.energyLevel}</span>
              </Badge>
              <Badge variant="secondary" className={cn("text-xs font-semibold", getPriorityColor(task.priority))}>
                {task.priority === "high"
                  ? "⚡ Высокий"
                  : task.priority === "medium"
                  ? "→ Средний"
                  : "✓ Низкий"}
              </Badge>
            </div>
          </div>

          {/* Action Buttons — desktop: inline */}
          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
            {task.status === "active" && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingSubtask(true)}
                  title="Добавить подзадачу"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditTask(task)}
                  className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onArchive(task.id)}
                  title="В архив"
                  className="text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Archive className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="text-destructive/70 hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons — mobile: dropdown */}
          <div className="sm:hidden flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {task.status === "active" && (
                  <>
                    <DropdownMenuItem onClick={() => setIsAddingSubtask(true)}>
                      <Plus className="h-4 w-4" />
                      Добавить подзадачу
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditTask(task)}>
                      <Edit2 className="h-4 w-4" />
                      Редактировать
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onArchive(task.id)}>
                      <Archive className="h-4 w-4" />
                      В архив
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(task.id)}>
                  <Trash2 className="h-4 w-4" />
                  Удалить
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Progress Bar */}
        {totalSubtasks > 0 && (
          <div className="space-y-1.5 pl-4 md:pl-8">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Прогресс подзадач</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2.5 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Subtasks List */}
        {isExpanded && subtasks.length > 0 && (
          <div className="space-y-2 pl-4 md:pl-8 border-l-2 border-indigo-200 dark:border-indigo-800/50">
            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className={cn(
                  "flex items-center gap-2 px-2 py-2 rounded-lg transition-colors",
                  subtask.status === "completed"
                    ? "bg-emerald-50 dark:bg-emerald-900/20"
                    : "bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50"
                )}
              >
                {/* Checkbox */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleSubtask(subtask)}
                  className={cn(
                    "flex-shrink-0 h-8 w-8",
                    subtask.status === "completed"
                      ? "text-emerald-600 hover:text-emerald-700"
                      : "text-muted-foreground hover:text-emerald-600"
                  )}
                >
                  {subtask.status === "completed" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </Button>

                {/* Subtask Title */}
                <span
                  className={cn(
                    "flex-1 text-sm font-medium min-w-0 truncate",
                    subtask.status === "completed" && "line-through text-muted-foreground"
                  )}
                >
                  {subtask.title}
                </span>

                {/* Energy Badge — hidden on mobile to save space */}
                <Badge variant="outline" className="hidden sm:inline-flex text-xs font-semibold bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 flex-shrink-0">
                  E{subtask.energyLevel}
                </Badge>

                {/* Actions — desktop: inline */}
                <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditSubtask(subtask)}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteSubtask(subtask.id)}
                    className="h-8 w-8 p-0 text-red-500/70 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Actions — mobile: dropdown */}
                <div className="sm:hidden flex-shrink-0">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditSubtask(subtask)}>
                        <Edit2 className="h-4 w-4" />
                        Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem variant="destructive" onClick={() => onDeleteSubtask(subtask.id)}>
                        <Trash2 className="h-4 w-4" />
                        Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state for subtasks */}
        {isExpanded && subtasks.length === 0 && (
          <div className="pl-4 md:pl-8 py-6 text-center text-muted-foreground text-sm">
            Нет подзадач. Нажмите кнопку выше, чтобы добавить первую.
          </div>
        )}

        {/* Add Subtask Input */}
        {isAddingSubtask && (
          <div className="pl-4 md:pl-8 space-y-2">
            <div className="flex gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50">
              <Input
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Название подзадачи..."
                className="flex-1 text-sm"
                autoFocus
              />
              <Button 
                size="sm" 
                onClick={handleAddSubtask}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIsAddingSubtask(false);
                  setNewSubtaskTitle("");
                }}
                className="text-slate-500"
              >
                ✕
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
