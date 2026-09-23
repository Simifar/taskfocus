"use client";

import { useState } from "react";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";
import { ChevronDown, ChevronRight, Circle, Edit2, GripVertical, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import type { Task } from "@/shared/types";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { TaskRow } from "./task-row";

interface TaskWithSubtasksProps {
  task: Task;
  subtasks: Task[];
  onToggleSubtask: (subtask: Task) => void;
  onAddSubtask: (parentId: string, title: string) => Promise<void> | void;
  onEditTask: (task: Task) => void;
  onEditSubtask: (subtask: Task) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onComplete: (task: Task) => void;
  onArchive: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  attributes?: DraggableAttributes;
  listeners?: DraggableSyntheticListeners;
  isDragging?: boolean;
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
  const completedSubtasks = subtasks.filter((subtask) => subtask.status === "completed").length;
  const progress = subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0;

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    try {
      await onAddSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle("");
      setIsAddingSubtask(false);
      toast.success("Подзадача добавлена");
    } catch {
      toast.error("Ошибка при добавлении подзадачи");
    }
  };

  return (
    <TaskRow
      task={task}
      dragHandle={
        <button
          type="button"
          className="mt-0.5 flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-accent active:cursor-grabbing touch-manipulation"
          aria-label={`Перетащить задачу «${task.title}»`}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      }
      onComplete={onComplete}
      onEdit={onEditTask}
      onArchive={onArchive}
      onDelete={onDelete}
      onAddSubtask={() => setIsAddingSubtask(true)}
      isDragging={isDragging}
    >
      {subtasks.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-border/70 pt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Подзадачи</span>
            <span className="font-medium text-brand">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <button
        type="button"
        className="mt-3 flex min-h-9 items-center gap-2 text-sm font-medium text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((expanded) => !expanded)}
      >
        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {isExpanded ? "Скрыть подзадачи" : "Показать подзадачи"}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2 border-l-2 border-brand/25 pl-3 sm:pl-4">
          {subtasks.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">Подзадач пока нет.</p>
          ) : (
            subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5",
                  subtask.status === "completed" ? "bg-brand/5" : "bg-muted/30",
                )}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-brand"
                  aria-label={
                    subtask.status === "completed"
                      ? `Вернуть подзадачу «${subtask.title}» в активные`
                      : `Отметить подзадачу «${subtask.title}» выполненной`
                  }
                  onClick={() => onToggleSubtask(subtask)}
                >
                  {subtask.status === "completed" ? <span className="text-brand">✓</span> : <Circle className="h-4 w-4" />}
                </Button>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-sm",
                    subtask.status === "completed" && "text-muted-foreground line-through",
                  )}
                >
                  {subtask.title}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={`Действия для подзадачи «${subtask.title}»`}>
                      <span aria-hidden="true">⋯</span>
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
            ))
          )}
        </div>
      )}

      {isAddingSubtask && (
        <div className="mt-3 flex gap-2 border-t border-border/70 pt-3">
          <Input
            value={newSubtaskTitle}
            onChange={(event) => setNewSubtaskTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleAddSubtask();
              if (event.key === "Escape") {
                setIsAddingSubtask(false);
                setNewSubtaskTitle("");
              }
            }}
            placeholder="Название подзадачи"
            aria-label="Название новой подзадачи"
            autoFocus
            className="min-w-0 flex-1"
          />
          <Button type="button" size="icon" aria-label="Добавить подзадачу" onClick={() => void handleAddSubtask()}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Отменить добавление подзадачи"
            onClick={() => {
              setIsAddingSubtask(false);
              setNewSubtaskTitle("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </TaskRow>
  );
}
