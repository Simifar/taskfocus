"use client";

import { useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Check,
  Circle,
  CircleCheck,
  Loader2,
  Plus,
  Timer,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useUpdateTask } from "@/features/tasks/hooks";
import type { UpdateTaskInput } from "@/features/tasks/api";
import { describeTaskError } from "@/features/tasks/errors";
import { parseTaskDay, toTaskDayInput } from "@/features/tasks/lib/task-row";
import type { Task } from "@/shared/types";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { EnergyPicker, PriorityPicker, SchedulePicker } from "./task-fields";

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: (task: Task) => Promise<boolean> | void;
  onArchive?: (taskId: string) => void;
  onRestore?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onStartFocus?: (task: Task) => void;
  onToggleSubtask?: (subtask: Task) => void;
  onAddSubtask?: (parentId: string, title: string) => Promise<void>;
  onDeleteSubtask?: (subtaskId: string) => void;
}

/**
 * Task detail sheet. Every field saves on its own (optimistically), so there is
 * no "Save" button to forget and no form state to lose when the sheet closes.
 */
export function EditTaskDialog({
  task,
  open,
  onOpenChange,
  onComplete,
  onArchive,
  onRestore,
  onDelete,
  onStartFocus,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
}: EditTaskDialogProps) {
  const updateTask = useUpdateTask();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [newSubtask, setNewSubtask] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const subtaskInputRef = useRef<HTMLInputElement>(null);
  // Blur and close can both commit the same edit; remember what was sent.
  const committed = useRef({ title: task.title, description: task.description ?? null });

  const isSubtask = Boolean(task.parentTaskId);
  const isArchived = task.status === "archived";
  const isCompleted = task.status === "completed";
  const subtasks = task.subtasks ?? [];
  const doneSubtasks = subtasks.filter((s) => s.status === "completed").length;

  const save = (input: UpdateTaskInput) => {
    updateTask.mutate(
      { id: task.id, input },
      { onError: (err) => toast.error(describeTaskError(err, "Изменение не сохранилось")) },
    );
  };

  const commitTitle = () => {
    const next = title.trim();
    if (!next) {
      setTitle(task.title);
      return;
    }
    if (next !== committed.current.title) {
      committed.current.title = next;
      save({ title: next });
    }
  };

  const commitDescription = () => {
    const next = description.trim() || null;
    if (next !== committed.current.description) {
      committed.current.description = next;
      save({ description: next });
    }
  };

  const submitSubtask = async () => {
    const value = newSubtask.trim();
    if (!value || !onAddSubtask) return;
    setAddingSubtask(true);
    try {
      await onAddSubtask(task.id, value);
      setNewSubtask("");
    } catch (err) {
      toast.error(describeTaskError(err, "Не удалось добавить шаг"));
    } finally {
      setAddingSubtask(false);
      subtaskInputRef.current?.focus();
    }
  };

  const close = () => onOpenChange(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          commitTitle();
          commitDescription();
        }
        onOpenChange(next);
      }}
    >
      <DialogContent sheet className="max-h-[min(92dvh,52rem)] gap-0 overflow-y-auto p-0 sm:max-w-xl">
        <DialogDescription className="sr-only">
          Изменения сохраняются автоматически.
        </DialogDescription>

        <div className="flex items-start gap-3 px-5 pt-5 pr-14 sm:px-6 sm:pt-6">
          <button
            type="button"
            onClick={() => void onComplete?.(task)}
            disabled={isArchived}
            className={cn(
              "mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full transition-colors -m-2.5 disabled:opacity-40",
              isCompleted ? "text-success" : "text-muted-foreground hover:text-foreground",
            )}
            aria-label={isCompleted ? "Вернуть в работу" : "Отметить выполненной"}
          >
            {isCompleted ? <CircleCheck className="size-6" /> : <Circle className="size-6" />}
          </button>
          <div className="min-w-0 flex-1">
            <DialogTitle className="sr-only">{task.title}</DialogTitle>
            <div>
                <Label htmlFor="edit-task-title" className="sr-only">Название</Label>
                <textarea
                  id="edit-task-title"
                  value={title}
                  rows={1}
                  maxLength={200}
                  onChange={(e) => setTitle(e.target.value.replace(/\n/g, ""))}
                  onBlur={commitTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      e.currentTarget.blur();
                    }
                  }}
                  className={cn(
                    "field-sizing-content w-full resize-none rounded-lg bg-transparent text-2xl font-semibold leading-snug tracking-tight outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
                    isCompleted && "text-muted-foreground line-through",
                  )}
                />
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
              {updateTask.isPending ? (
                <>
                  <Loader2 className="size-3 animate-spin" aria-hidden="true" /> Сохраняю…
                </>
              ) : isArchived ? (
                "В архиве"
              ) : (
                "Изменения сохраняются автоматически"
              )}
            </p>
          </div>
        </div>

        <div className="space-y-6 px-5 py-6 sm:px-6">
          <div>
            <Label htmlFor="edit-task-description" className="sr-only">Заметка</Label>
            <Textarea
              id="edit-task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={commitDescription}
              placeholder="Добавить заметку…"
              maxLength={2000}
              rows={2}
              className="field-sizing-content min-h-16 resize-none bg-muted/40 text-sm shadow-none dark:bg-muted/30"
            />
          </div>

          {!isSubtask && (
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-[auto_1fr]">
              <p className="pt-2.5 text-xs font-medium text-muted-foreground">Когда</p>
              <div>
                <SchedulePicker
                  value={{
                    start: parseTaskDay(task.dueDateStart) ?? undefined,
                    end: parseTaskDay(task.dueDateEnd) ?? undefined,
                  }}
                  onChange={({ start, end }) =>
                    save({ dueDateStart: toTaskDayInput(start), dueDateEnd: toTaskDayInput(end ?? start) })
                  }
                />
              </div>
              <p className="pt-2.5 text-xs font-medium text-muted-foreground">Приоритет</p>
              <PriorityPicker
                important={task.important}
                urgent={task.urgent}
                onChange={(value) => save(value)}
              />
              <p className="pt-2.5 text-xs font-medium text-muted-foreground">Энергия</p>
              <EnergyPicker value={task.energyLevel} onChange={(energyLevel) => save({ energyLevel })} />
            </div>
          )}

          {!isSubtask && (
            <section aria-labelledby="edit-task-steps">
              <div className="mb-1.5 flex items-center justify-between">
                <h3 id="edit-task-steps" className="text-xs font-medium text-muted-foreground">
                  Шаги {subtasks.length > 0 && `· ${doneSubtasks}/${subtasks.length}`}
                </h3>
              </div>
              {subtasks.length > 0 && (
                <div className="mb-1">
                  {subtasks.map((subtask) => {
                    const done = subtask.status === "completed";
                    return (
                      <div key={subtask.id} className="group flex min-h-11 items-center gap-1 rounded-lg hover:bg-muted/60">
                        <button
                          type="button"
                          onClick={() => onToggleSubtask?.(subtask)}
                          className="flex size-11 shrink-0 items-center justify-center rounded-lg"
                          aria-label={done ? `Вернуть шаг «${subtask.title}»` : `Выполнить шаг «${subtask.title}»`}
                        >
                          {done ? (
                            <Check className="size-4 text-success" />
                          ) : (
                            <Circle className="size-4 text-muted-foreground" />
                          )}
                        </button>
                        <span className={cn("min-w-0 flex-1 break-words text-sm", done && "text-muted-foreground line-through")}>
                          {subtask.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteSubtask?.(subtask.id)}
                          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground opacity-100 hover:text-destructive sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                          aria-label={`Удалить шаг «${subtask.title}»`}
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              <form
                className="flex min-h-11 items-center gap-1 rounded-lg border border-dashed px-1 focus-within:border-solid focus-within:border-ring"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submitSubtask();
                }}
              >
                <span className="flex size-9 shrink-0 items-center justify-center text-muted-foreground" aria-hidden="true">
                  {addingSubtask ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                </span>
                <label htmlFor="edit-task-new-step" className="sr-only">Новый шаг</label>
                <input
                  ref={subtaskInputRef}
                  id="edit-task-new-step"
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Добавить шаг и нажать Enter"
                  maxLength={200}
                  autoComplete="off"
                  enterKeyHint="enter"
                  className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-none"
                />
              </form>
            </section>
          )}
        </div>

        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t bg-card px-5 py-4 sm:px-6">
          {!isArchived && !isSubtask && !isCompleted && onStartFocus && (
            <Button
              className="min-h-11 gap-2 bg-brand text-brand-foreground hover:bg-brand/90 sm:min-h-9"
              onClick={() => {
                close();
                onStartFocus(task);
              }}
            >
              <Timer /> Фокус
            </Button>
          )}
          {!isArchived && (
            <Button variant="outline" className="min-h-11 gap-2 sm:min-h-9" onClick={() => void onComplete?.(task)}>
              {isCompleted ? <Circle /> : <CircleCheck />}
              {isCompleted ? "Вернуть" : "Выполнено"}
            </Button>
          )}
          <div className="ml-auto flex gap-1">
            {isArchived ? (
              <Button
                variant="ghost"
                className="min-h-11 gap-2 sm:min-h-9"
                onClick={() => {
                  onRestore?.(task.id);
                  close();
                }}
              >
                <ArchiveRestore /> Восстановить
              </Button>
            ) : (
              !isSubtask && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-11 sm:size-9"
                  aria-label="В архив"
                  title="В архив"
                  onClick={() => {
                    onArchive?.(task.id);
                    close();
                  }}
                >
                  <Archive />
                </Button>
              )
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-11 text-muted-foreground hover:text-destructive sm:size-9"
              aria-label="Удалить"
              title="Удалить (можно отменить)"
              onClick={() => {
                onDelete?.(task.id);
                close();
              }}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
