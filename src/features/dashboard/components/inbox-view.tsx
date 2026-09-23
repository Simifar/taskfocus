"use client";

import { useState } from "react";
import type { Task, StatsResponse } from "@/shared/types";
import { useCreateTask } from "@/features/tasks/hooks";
import { ApiError } from "@/shared/lib/fetcher";
import { classifyInboxTask } from "@/shared/lib/dates/task-date-policy";
import { createInboxTaskInput } from "@/features/dashboard/lib/inbox";
import { mergeReorderedTasks } from "@/features/tasks/lib/reorder";
import { CreateSubtaskDialog } from "@/features/tasks/components/create-subtask-dialog";
import { SimpleSortableTasksList } from "@/features/tasks/components/simple-sortable-tasks-list";
import { TaskRow } from "@/features/tasks/components/task-row";
import { toast } from "sonner";
import { Inbox, Loader2, Plus } from "lucide-react";

import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";

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
  onAddSubtask?: (parentId: string, title: string) => Promise<void> | void;
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
  stats,
  onEdit,
  onComplete,
  onArchive,
  onDelete,
  onAssignToToday,
  onAssignToWeek,
  onAddTask,
  onAddSubtask,
  onReorder,
}: InboxViewProps) {
  void stats;
  const createTask = useCreateTask();
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [subtaskDialogOpen, setSubtaskDialogOpen] = useState(false);
  const [parentTaskForSubtask, setParentTaskForSubtask] = useState<Task | null>(null);

  const inboxTasks = tasks.filter((task) => classifyInboxTask(task));

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
      <div className="mx-auto max-w-3xl space-y-5">
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <Inbox className="h-5 w-5 text-brand" aria-hidden="true" />
            <h1 className="text-title">Входящие</h1>
            <Badge variant="secondary">{inboxTasks.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Быстро сохраните мысль. Дату и остальные детали можно добавить позже.
          </p>
        </header>

        <Card className="border-brand/30 shadow-sm">
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
            <p className="mt-2 text-xs text-muted-foreground">Нажмите Enter. Планирование доступно в меню задачи.</p>
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
            <div className="flex items-center justify-between gap-3">
              <h2 id="inbox-queue-heading" className="text-sm font-semibold text-muted-foreground">
                Очередь захвата
              </h2>
              <span className="text-xs text-muted-foreground">{inboxTasks.length} без даты</span>
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
    </>
  );
}
