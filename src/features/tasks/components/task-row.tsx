"use client";

import { useState, type ReactNode } from "react";
import { Archive, CalendarDays, Check, Circle, Edit2, MoreVertical, Plus, Trash2 } from "lucide-react";

import { formatTaskRowSchedule } from "@/features/tasks/lib/task-row";
import type { Task } from "@/shared/types";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

interface TaskRowProps {
  task: Task;
  dragHandle?: ReactNode;
  onComplete?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onAddSubtask?: (task: Task) => void;
  onAssignToToday?: (taskId: string) => void;
  onAssignToWeek?: (taskId: string) => void;
  selection?: {
    checked: boolean;
    onChange: () => void;
  };
  isDragging?: boolean;
  children?: ReactNode;
}

function getCompletionLabel(task: Task) {
  return task.status === "completed"
    ? `Вернуть задачу «${task.title}» в активные`
    : `Отметить задачу «${task.title}» выполненной`;
}

export function TaskRow({
  task,
  dragHandle,
  onComplete,
  onEdit,
  onArchive,
  onDelete,
  onAddSubtask,
  onAssignToToday,
  onAssignToWeek,
  selection,
  isDragging = false,
  children,
}: TaskRowProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const scheduleLabel = formatTaskRowSchedule(task);
  const completedSubtasks = task.subtasks?.filter((subtask) => subtask.status === "completed").length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;
  const hasMenu = Boolean(
    onComplete || onEdit || onArchive || onDelete || onAddSubtask || onAssignToToday || onAssignToWeek,
  );

  return (
    <>
      <Card
      className={cn(
        "border-border/80 transition-colors hover:border-brand/40",
        task.status === "completed" && "bg-muted/30",
        isDragging && "shadow-lg ring-2 ring-brand/50",
      )}
      >
        <CardContent className="p-3 sm:p-4">
        <div className="flex items-start gap-2.5 sm:gap-3">
          {dragHandle}

          {selection && (
            <Checkbox
              checked={selection.checked}
              onCheckedChange={selection.onChange}
              aria-label={`Выбрать задачу «${task.title}»`}
              className="mt-1 shrink-0"
            />
          )}

          {onComplete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "mt-0.5 h-9 w-9 shrink-0",
                task.status === "completed"
                  ? "text-brand hover:text-brand/80"
                  : "text-muted-foreground hover:text-brand",
              )}
              aria-label={getCompletionLabel(task)}
              onClick={() => onComplete(task)}
            >
              {task.status === "completed" ? <Check className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
            </Button>
          )}

          <div className="min-w-0 flex-1">
            {onEdit ? (
              <button
                type="button"
                className={cn(
                  "block max-w-full text-left text-sm font-semibold leading-snug hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-base",
                  task.status === "completed" && "text-muted-foreground line-through",
                )}
                onClick={() => onEdit(task)}
              >
                {task.title}
              </button>
            ) : (
              <p
                className={cn(
                  "text-sm font-semibold leading-snug sm:text-base",
                  task.status === "completed" && "text-muted-foreground line-through",
                )}
              >
                {task.title}
              </p>
            )}

            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              {scheduleLabel && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {scheduleLabel}
                </span>
              )}
              <span>Энергия {task.energyLevel}</span>
              {totalSubtasks > 0 && (
                <Badge variant="secondary" className="h-5 rounded-full px-2 text-[11px]">
                  Подзадачи {completedSubtasks}/{totalSubtasks}
                </Badge>
              )}
            </div>

            {task.description && (
              <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground sm:text-sm">{task.description}</p>
            )}
          </div>

          {hasMenu && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  aria-label={`Действия для задачи «${task.title}»`}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {onComplete && (
                  <DropdownMenuItem onClick={() => onComplete(task)}>
                    {task.status === "completed" ? <Circle className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    {task.status === "completed" ? "Сделать активной" : "Выполнить"}
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    <Edit2 className="h-4 w-4" />
                    Редактировать
                  </DropdownMenuItem>
                )}
                {onAddSubtask && task.status === "active" && (
                  <DropdownMenuItem onClick={() => onAddSubtask(task)}>
                    <Plus className="h-4 w-4" />
                    Добавить подзадачу
                  </DropdownMenuItem>
                )}
                {(onAssignToToday || onAssignToWeek) && <DropdownMenuSeparator />}
                {onAssignToToday && (
                  <DropdownMenuItem onClick={() => onAssignToToday(task.id)}>
                    <CalendarDays className="h-4 w-4" />
                    На сегодня
                  </DropdownMenuItem>
                )}
                {onAssignToWeek && (
                  <DropdownMenuItem onClick={() => onAssignToWeek(task.id)}>
                    <CalendarDays className="h-4 w-4" />
                    На неделю
                  </DropdownMenuItem>
                )}
                {(onArchive || onDelete) && <DropdownMenuSeparator />}
                {onArchive && task.status === "active" && (
                  <DropdownMenuItem onClick={() => onArchive(task.id)}>
                    <Archive className="h-4 w-4" />
                    В архив
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {children}
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить задачу?</AlertDialogTitle>
            <AlertDialogDescription>
              Задача «{task.title}» и её подзадачи будут удалены без возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отменить</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete?.(task.id);
                setDeleteOpen(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
