"use client";

import { useState } from "react";
import type { Task } from "@/shared/types";
import { useCreateTask } from "@/features/tasks/hooks";
import { ApiError } from "@/shared/lib/fetcher";
import { classifyInboxTask } from "@/shared/lib/dates/task-date-policy";
import { createInboxTaskInput } from "@/features/dashboard/lib/inbox";
import { mergeReorderedTasks } from "@/features/tasks/lib/reorder";
import { CreateSubtaskDialog } from "@/features/tasks/components/create-subtask-dialog";
import { SimpleSortableTasksList } from "@/features/tasks/components/simple-sortable-tasks-list";
import { TaskRow } from "@/features/tasks/components/task-row";
import { toast } from "sonner";
import { Archive, CalendarDays, Inbox, Loader2, Plus, Trash2, X } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
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

interface InboxViewProps {
  tasks: Task[];
  onEdit?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onAssignToToday?: (taskId: string) => void;
  onAssignToWeek?: (taskId: string) => void;
  onAddTask?: () => void;
  onToggleSubtask?: (subtask: Task) => void;
  onAddSubtask?: (parentId: string, title: string) => Promise<void> | void;
  onEditSubtask?: (subtask: Task) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
  onBatchArchive?: (taskIds: string[]) => Promise<boolean | void> | boolean | void;
  onBatchDelete?: (taskIds: string[]) => Promise<boolean | void> | boolean | void;
  onBatchAssignToToday?: (taskIds: string[]) => Promise<boolean | void> | boolean | void;
  onBatchAssignToWeek?: (taskIds: string[]) => Promise<boolean | void> | boolean | void;
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
  onBatchArchive,
  onBatchDelete,
  onBatchAssignToToday,
  onBatchAssignToWeek,
  onAddTask,
  onAddSubtask,
  onReorder,
}: InboxViewProps) {
  const createTask = useCreateTask();
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [subtaskDialogOpen, setSubtaskDialogOpen] = useState(false);
  const [parentTaskForSubtask, setParentTaskForSubtask] = useState<Task | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteSelectedOpen, setDeleteSelectedOpen] = useState(false);

  const inboxTasks = tasks.filter((task) => classifyInboxTask(task));
  const selectedTaskIds = inboxTasks.filter((task) => selectedIds.includes(task.id)).map((task) => task.id);
  const allSelected = inboxTasks.length > 0 && selectedTaskIds.length === inboxTasks.length;

  const runBatch = async (action?: (taskIds: string[]) => Promise<boolean | void> | boolean | void) => {
    if (!action || selectedTaskIds.length === 0) return;
    const succeeded = await action(selectedTaskIds);
    if (succeeded !== false) setSelectedIds([]);
  };

  const handleQuickAdd = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const input = createInboxTaskInput(quickAddTitle);
    if (!input) return;

    try {
      await createTask.mutateAsync(input);
      setQuickAddTitle("");
      toast.success("Задача сохранена во входящие");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Не удалось сохранить задачу");
    }
  };

  const openSubtaskDialog = (task: Task) => {
    setParentTaskForSubtask(task);
    setSubtaskDialogOpen(true);
  };

  return (
    <>
      <div className="mx-auto max-w-4xl space-y-4">
        <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-brand" aria-hidden="true" />
            <h1 className="text-title">Входящие</h1>
            <Badge variant="secondary">{inboxTasks.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Быстро сохраните мысль. Дату и остальные детали можно добавить позже.
          </p>
          </div>
        </header>

        <Card className="border-brand/25 shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <form className="flex items-center gap-2" onSubmit={(event) => void handleQuickAdd(event)}>
              <Input
                value={quickAddTitle}
                onChange={(event) => setQuickAddTitle(event.target.value)}
                placeholder="Что нужно сохранить?"
                aria-label="Название новой задачи"
                maxLength={200}
                disabled={createTask.isPending}
                className="min-w-0 flex-1"
              />
              <Button
                type="submit"
                size="icon"
                className="shrink-0 bg-brand text-brand-foreground hover:bg-brand/90"
                aria-label="Сохранить задачу во входящие"
                disabled={createTask.isPending || !quickAddTitle.trim()}
              >
                {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">Enter сохраняет мысль. Планируйте её позже через меню задачи.</p>
          </CardContent>
        </Card>

        {inboxTasks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/60" aria-hidden="true" />
              <div>
                <h2 className="font-semibold">Входящие пусты</h2>
                <p className="mt-1 text-sm text-muted-foreground">Новые мысли появятся здесь после быстрого добавления.</p>
              </div>
              {onAddTask && (
                <Button type="button" variant="outline" onClick={onAddTask}>
                  <Plus className="mr-2 h-4 w-4" />
                  Открыть полную форму
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <section aria-labelledby="inbox-queue-heading" className="space-y-3">
            <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => setSelectedIds(checked ? inboxTasks.map((task) => task.id) : [])}
                  aria-label={allSelected ? "Снять выделение со всех задач" : "Выбрать все входящие задачи"}
                />
                <h2 id="inbox-queue-heading" className="text-sm font-semibold">
                  {selectedTaskIds.length > 0 ? `Выбрано: ${selectedTaskIds.length}` : "Разобрать входящие"}
                </h2>
              </div>
              {selectedTaskIds.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => void runBatch(onBatchAssignToToday)} disabled={!onBatchAssignToToday}>
                    <CalendarDays className="mr-1.5 h-4 w-4" /> Сегодня
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => void runBatch(onBatchAssignToWeek)} disabled={!onBatchAssignToWeek}>
                    <CalendarDays className="mr-1.5 h-4 w-4" /> На неделю
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => void runBatch(onBatchArchive)} disabled={!onBatchArchive}>
                    <Archive className="mr-1.5 h-4 w-4" /> В архив
                  </Button>
                  <Button type="button" size="sm" variant="destructive" onClick={() => setDeleteSelectedOpen(true)} disabled={!onBatchDelete}>
                    <Trash2 className="mr-1.5 h-4 w-4" /> Удалить
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="h-9 w-9" aria-label="Снять выделение" onClick={() => setSelectedIds([])}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">Выберите задачи, чтобы распределить их вместе</span>
              )}
            </div>
            <SimpleSortableTasksList
              tasks={inboxTasks}
              onReorder={(reordered) => onReorder?.(mergeReorderedTasks(tasks, reordered))}
              className="space-y-2"
            >
              {(task, dragHandle) => (
                <TaskRow
                  task={task}
                  dragHandle={dragHandle}
                  onComplete={onComplete}
                  onEdit={onEdit}
                  onArchive={onArchive}
                  onDelete={onDelete}
                  selection={{
                    checked: selectedTaskIds.includes(task.id),
                    onChange: () => setSelectedIds((current) => current.includes(task.id)
                      ? current.filter((id) => id !== task.id)
                      : [...current, task.id]),
                  }}
                  onAssignToToday={onAssignToToday}
                  onAssignToWeek={onAssignToWeek}
                  onAddSubtask={onAddSubtask ? openSubtaskDialog : undefined}
                />
              )}
            </SimpleSortableTasksList>
          </section>
        )}
      </div>

      {parentTaskForSubtask && (
        <CreateSubtaskDialog
          open={subtaskDialogOpen}
          onOpenChange={setSubtaskDialogOpen}
          parentTaskId={parentTaskForSubtask.id}
          parentTaskTitle={parentTaskForSubtask.title}
          onSubmit={(parentId, title) => onAddSubtask?.(parentId, title)}
        />
      )}

      <AlertDialog open={deleteSelectedOpen} onOpenChange={setDeleteSelectedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить выбранные задачи?</AlertDialogTitle>
            <AlertDialogDescription>
              Будет удалено задач: {selectedTaskIds.length}. Вместе с ними удалятся подзадачи; восстановить их нельзя.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отменить</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void runBatch(onBatchDelete)}
            >
              Удалить {selectedTaskIds.length}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
