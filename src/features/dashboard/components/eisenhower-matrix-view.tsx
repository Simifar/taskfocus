"use client";

import { useState, type ReactNode } from "react";
import type { Task } from "@/shared/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { cn } from "@/shared/lib/utils";
import { SortableTasksBoard, type SortableTaskGroup, type TaskGroupMove } from "@/features/tasks/components/sortable-tasks-board";
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
  Archive,
  CalendarCheck,
  CheckCircle2,
  Edit2,
  Grid2X2,
  Plus,
  Trash2,
} from "lucide-react";
import {
  EISENHOWER_META,
  EISENHOWER_ORDER,
  getEisenhowerQuadrant,
} from "@/features/tasks/lib/eisenhower";
import type { EisenhowerQuadrant } from "@/shared/types";

interface EisenhowerMatrixViewProps {
  tasks: Task[];
  onEdit?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onAddTask?: () => void;
  onAssignToToday?: (taskId: string) => void;
  onAssignToWeek?: (taskId: string) => void;
  onReorder?: (tasks: Task[]) => void;
  onMoveToQuadrant?: (taskId: string, quadrant: EisenhowerQuadrant) => void;
}

function MatrixTaskCard({
  task,
  dragHandle,
  onEdit,
  onComplete,
  onArchive,
  onDelete,
  onAssignToToday,
  onAssignToWeek,
  quadrant,
}: EisenhowerMatrixViewProps & { task: Task; dragHandle?: ReactNode; quadrant: EisenhowerQuadrant }) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
    <Card className={cn("border-l-4 bg-background/95 py-0 shadow-sm transition-colors hover:shadow-md", EISENHOWER_META[quadrant].border)}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          {dragHandle}
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={() => onEdit?.(task)}
          >
            <p className="line-clamp-2 text-sm font-semibold leading-snug">{task.title}</p>
            {task.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="outline" className="h-5 rounded-full px-2 text-[11px]">
                энергия {task.energyLevel}
              </Badge>
              {task.subtasks.length > 0 && (
                <Badge variant="secondary" className="h-5 rounded-full px-2 text-[11px]">
                  {task.subtasks.filter((subtask) => subtask.status === "completed").length}/{task.subtasks.length}
                </Badge>
              )}
            </div>
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-brand"
            title="Выполнить"
            aria-label={`Отметить задачу «${task.title}» выполненной`}
            onClick={() => onComplete?.(task)}
          >
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-brand"
            title="Сегодня"
            aria-label={`Назначить «${task.title}» на сегодня`}
            onClick={() => onAssignToToday?.(task.id)}
          >
            <CalendarCheck className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-brand"
            title="На неделю"
            aria-label={`Назначить «${task.title}» на эту неделю`}
            onClick={() => onAssignToWeek?.(task.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-brand"
            title="Редактировать"
            aria-label={`Редактировать «${task.title}»`}
            onClick={() => onEdit?.(task)}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-orange-600"
            title="В архив"
            aria-label={`Архивировать «${task.title}»`}
            onClick={() => onArchive?.(task.id)}
          >
            <Archive className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            title="Удалить"
            aria-label={`Удалить «${task.title}»`}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Удалить задачу?</AlertDialogTitle>
          <AlertDialogDescription>
            «{task.title}» и её подзадачи будут удалены без возможности восстановления.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Отменить</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => {
              onDelete?.(task.id);
              setDeleteOpen(false);
            }}
          >
            Удалить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

export function EisenhowerMatrixView({
  tasks,
  onEdit,
  onComplete,
  onArchive,
  onDelete,
  onAddTask,
  onAssignToToday,
  onAssignToWeek,
  onReorder,
  onMoveToQuadrant,
}: EisenhowerMatrixViewProps) {
  const activeTasks = tasks.filter((task) => task.status === "active" && !task.parentTaskId);
  const tasksByQuadrant = EISENHOWER_ORDER.reduce(
    (acc, quadrant) => {
      acc[quadrant] = activeTasks.filter((task) => getEisenhowerQuadrant(task) === quadrant);
      return acc;
    },
    {} as Record<EisenhowerQuadrant, Task[]>,
  );

  const importantCount = activeTasks.filter((task) => task.important).length;
  const urgentCount = activeTasks.filter((task) => task.urgent).length;
  const groups: SortableTaskGroup[] = EISENHOWER_ORDER.map((quadrant) => {
    const meta = EISENHOWER_META[quadrant];
    const quadrantTasks = tasksByQuadrant[quadrant];

    return {
      id: quadrant,
      tasks: quadrantTasks,
      className: cn("min-h-[300px] rounded-xl border p-3", meta.panel),
      contentClassName: "space-y-2",
      header: (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("size-2.5 rounded-full", meta.dot)} />
              <h3 className="font-semibold">{meta.title}</h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{meta.description}</p>
          </div>
          <Badge variant="secondary" className="shrink-0 tabular-nums">
            {quadrantTasks.length}
          </Badge>
        </div>
      ),
      empty: (
        <div className="flex min-h-[190px] items-center justify-center rounded-lg border border-dashed border-border/80 bg-background/50 px-4 text-center text-sm text-muted-foreground">
          Перетащите сюда задачу или добавьте новую
        </div>
      ),
    };
  });

  const handleBoardChange = (nextGroups: SortableTaskGroup[], move?: TaskGroupMove) => {
    if (move) onMoveToQuadrant?.(move.task.id, move.toGroupId as EisenhowerQuadrant);
    const reorderedTasks = nextGroups.flatMap((group) => group.tasks);
    onReorder?.(reorderedTasks);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Grid2X2 className="h-3.5 w-3.5 text-brand" />
            Матрица фокуса
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Матрица Эйзенхауэра</h2>
            <p className="text-sm text-muted-foreground">
              Перетаскивайте задачи между квадрантами, чтобы менять их важность и срочность.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="rounded-full px-3 py-1.5">
            {activeTasks.length} активных
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1.5">
            {importantCount} важных
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1.5">
            {urgentCount} срочных
          </Badge>
          <Button size="sm" className="gap-2" onClick={onAddTask}>
            <Plus className="h-4 w-4" />
            Добавить
          </Button>
        </div>
      </div>

      <SortableTasksBoard
        groups={groups}
        className="grid gap-3 lg:grid-cols-2"
        onChange={handleBoardChange}
        renderTask={(task, dragHandle, groupId) => (
          <MatrixTaskCard
            task={task}
            quadrant={groupId as EisenhowerQuadrant}
            dragHandle={dragHandle}
            tasks={tasks}
            onEdit={onEdit}
            onComplete={onComplete}
            onArchive={onArchive}
            onDelete={onDelete}
            onAssignToToday={onAssignToToday}
            onAssignToWeek={onAssignToWeek}
          />
        )}
      />
    </div>
  );
}
