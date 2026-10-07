"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  CalendarArrowUp,
  CalendarDays,
  CornerDownLeft,
  Inbox,
  ListChecks,
  Trash2,
  X,
} from "lucide-react";

import type { Task } from "@/shared/types";
import { useCreateTask } from "@/features/tasks/hooks";
import { describeTaskError } from "@/features/tasks/errors";
import { classifyInboxTask } from "@/shared/lib/dates/task-date-policy";
import { createInboxTaskInput } from "@/features/dashboard/lib/inbox";
import { mergeReorderedTasks } from "@/features/tasks/lib/reorder";
import { SortableTasksList } from "@/features/tasks/components/sortable-tasks-list";
import { Button } from "@/shared/ui/button";
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

type BatchAction = (taskIds: string[]) => Promise<boolean | void> | boolean | void;

interface InboxViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onComplete: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onAssignToToday?: (taskId: string) => void;
  onAssignToWeek?: (taskId: string) => void;
  onStartFocus?: (task: Task) => void;
  onAddTask?: () => void;
  onToggleSubtask?: (subtask: Task) => void;
  onAddSubtask?: (parentId: string, title: string) => Promise<void> | void;
  onEditSubtask?: (subtask: Task) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
  onBatchArchive?: BatchAction;
  onBatchDelete?: BatchAction;
  onBatchAssignToToday?: BatchAction;
  onBatchAssignToWeek?: BatchAction;
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
  onStartFocus,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onBatchArchive,
  onBatchDelete,
  onBatchAssignToToday,
  onBatchAssignToWeek,
  onReorder,
}: InboxViewProps) {
  const createTask = useCreateTask();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  const inboxTasks = tasks.filter((task) => task.status === "active" && classifyInboxTask(task));
  const selected = inboxTasks.filter((task) => selectedIds.has(task.id)).map((task) => task.id);

  // The field never locks: the title is cleared at once and the task appears
  // optimistically, so several thoughts can be captured in a row.
  const capture = (event: React.FormEvent) => {
    event.preventDefault();
    const input = createInboxTaskInput(draft);
    if (!input) return;
    setDraft("");
    inputRef.current?.focus();
    createTask.mutate(input, {
      onError: (err) => {
        toast.error(describeTaskError(err, "Не удалось сохранить задачу"));
        setDraft((current) => current || input.title);
      },
    });
  };

  const exitSelection = () => {
    setSelecting(false);
    setSelectedIds(new Set());
  };

  const runBatch = async (action?: BatchAction) => {
    if (!action || selected.length === 0) return;
    const ok = await action(selected);
    if (ok !== false) exitSelection();
  };

  return (
    <div className="mx-auto w-full max-w-3xl pb-24 md:pb-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Входящие</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Запишите сейчас — разберёте потом.
            {inboxTasks.length > 0 && ` Неразобранных: ${inboxTasks.length}.`}
          </p>
        </div>
        {inboxTasks.length > 1 && (
          <Button
            variant="ghost"
            className="min-h-11 gap-2 text-muted-foreground sm:min-h-9"
            onClick={() => (selecting ? exitSelection() : setSelecting(true))}
            aria-pressed={selecting}
          >
            {selecting ? <X /> : <ListChecks />}
            {selecting ? "Готово" : "Выбрать"}
          </Button>
        )}
      </header>

      <form
        onSubmit={capture}
        className="mt-5 flex items-center gap-2 rounded-xl border bg-card p-1.5 pl-4 shadow-sm transition-colors focus-within:border-ring"
      >
        <label htmlFor="inbox-capture" className="sr-only">Новая задача во Входящие</label>
        <input
          ref={inputRef}
          id="inbox-capture"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Что у вас на уме?"
          maxLength={200}
          autoComplete="off"
          enterKeyHint="done"
          className="min-h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground focus-visible:outline-none"
        />
        <Button
          type="submit"
          disabled={!draft.trim()}
          className="min-h-11 shrink-0 gap-2 bg-brand text-brand-foreground hover:bg-brand/90 sm:min-h-9"
        >
          <CornerDownLeft className="hidden sm:block" aria-hidden="true" />
          Записать
        </Button>
      </form>

      <section aria-label="Неразобранные задачи" className="mt-6">
        <SortableTasksList
          tasks={inboxTasks}
          onReorder={(reordered) => onReorder?.(mergeReorderedTasks(tasks, reordered))}
          onEdit={onEdit}
          onComplete={onComplete}
          onArchive={onArchive}
          onDelete={onDelete}
          onStartFocus={onStartFocus}
          onAssignToToday={onAssignToToday}
          onAssignToWeek={onAssignToWeek}
          onToggleSubtask={onToggleSubtask}
          onAddSubtask={onAddSubtask}
          onDeleteSubtask={onDeleteSubtask}
          selection={
            selecting
              ? {
                  selectedIds,
                  onToggle: (id) =>
                    setSelectedIds((current) => {
                      const next = new Set(current);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      return next;
                    }),
                }
              : undefined
          }
          renderQuickActions={
            selecting
              ? undefined
              : (task) => (
                  <>
                    {onAssignToToday && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-9 text-muted-foreground hover:text-foreground"
                        title="На сегодня"
                        aria-label={`Запланировать «${task.title}» на сегодня`}
                        onClick={() => onAssignToToday(task.id)}
                      >
                        <CalendarArrowUp />
                      </Button>
                    )}
                    {onAssignToWeek && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hidden size-9 text-muted-foreground hover:text-foreground sm:inline-flex"
                        title="На эту неделю"
                        aria-label={`Запланировать «${task.title}» на эту неделю`}
                        onClick={() => onAssignToWeek(task.id)}
                      >
                        <CalendarDays />
                      </Button>
                    )}
                  </>
                )
          }
          empty={
            <div className="rounded-2xl border border-dashed px-5 py-12 text-center">
              <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Inbox className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-4 font-semibold">Входящие разобраны</p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
                Всё распределено по дням. Новая мысль — в поле выше, Enter.
              </p>
            </div>
          }
        />
      </section>

      {selecting && (
        <div
          role="toolbar"
          aria-label="Действия с выбранными задачами"
          className="fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-xl items-center gap-1 rounded-2xl border bg-popover p-1.5 shadow-lg md:bottom-6"
        >
          <span className="px-2.5 text-sm font-medium tabular-nums" aria-live="polite">
            {selected.length}
          </span>
          <div className="flex flex-1 items-center justify-end gap-0.5 overflow-x-auto">
            <Button variant="ghost" className="min-h-11 gap-1.5 px-2.5 sm:min-h-9" disabled={!selected.length || !onBatchAssignToToday} onClick={() => void runBatch(onBatchAssignToToday)}>
              <CalendarArrowUp /> <span className="max-[380px]:sr-only">Сегодня</span>
            </Button>
            <Button variant="ghost" className="min-h-11 gap-1.5 px-2.5 sm:min-h-9" disabled={!selected.length || !onBatchAssignToWeek} onClick={() => void runBatch(onBatchAssignToWeek)}>
              <CalendarDays /> <span className="max-[380px]:sr-only">Неделя</span>
            </Button>
            <Button variant="ghost" size="icon" className="size-11 sm:size-9" aria-label="В архив" title="В архив" disabled={!selected.length || !onBatchArchive} onClick={() => void runBatch(onBatchArchive)}>
              <Archive />
            </Button>
            <Button variant="ghost" size="icon" className="size-11 text-destructive hover:text-destructive sm:size-9" aria-label="Удалить" title="Удалить" disabled={!selected.length || !onBatchDelete} onClick={() => setConfirmDelete(true)}>
              <Trash2 />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить {selected.length} задач?</AlertDialogTitle>
            <AlertDialogDescription>
              Задачи и их шаги будут удалены навсегда. Если они могут пригодиться — отправьте их в архив.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => void runBatch(onBatchDelete)}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
