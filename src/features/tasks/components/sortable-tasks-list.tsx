"use client";

import { useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

import type { Task } from "@/shared/types";
import { cn } from "@/shared/lib/utils";
import { describeTaskError } from "@/features/tasks/errors";
import { isOptimisticTask } from "@/features/tasks/hooks";
import { CompleteButton, TaskRow } from "./task-row";

export interface TaskListHandlers {
  onEdit: (task: Task) => void;
  onComplete: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onStartFocus?: (task: Task) => void;
  onAssignToToday?: (taskId: string) => void;
  onAssignToWeek?: (taskId: string) => void;
  onToggleSubtask?: (subtask: Task) => void;
  onAddSubtask?: (parentId: string, title: string) => Promise<void> | void;
  onDeleteSubtask?: (subtaskId: string) => void;
  /** @deprecated kept for call-site compatibility; subtasks open in the task sheet. */
  onEditTask?: (task: Task) => void;
  onEditSubtask?: (subtask: Task) => void;
}

interface SortableTasksListProps extends TaskListHandlers {
  tasks: Task[];
  onReorder?: (tasks: Task[]) => void;
  hideSchedule?: boolean;
  selection?: { selectedIds: Set<string>; onToggle: (taskId: string) => void };
  renderQuickActions?: (task: Task) => ReactNode;
  empty?: ReactNode;
  className?: string;
}

export function DragHandle({ label, ...props }: { label: string } & React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex h-8 w-5 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/70 transition-opacity hover:text-foreground active:cursor-grabbing [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/row:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
      {...props}
    >
      <GripVertical className="size-4" aria-hidden="true" />
    </button>
  );
}

/** Inline steps under a task row: toggle, delete and quick-add without leaving the list. */
export function SubtaskSteps({
  task,
  adding,
  onDoneAdding,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
}: {
  task: Task;
  adding: boolean;
  onDoneAdding: () => void;
  onToggleSubtask?: (subtask: Task) => void;
  onAddSubtask?: (parentId: string, title: string) => Promise<void> | void;
  onDeleteSubtask?: (subtaskId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const value = title.trim();
    if (!value || !onAddSubtask) return;
    setSaving(true);
    try {
      await onAddSubtask(task.id, value);
      setTitle("");
    } catch (err) {
      toast.error(describeTaskError(err, "Не удалось добавить шаг"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-border/60 py-1 pr-1.5 pl-9">
      {task.subtasks.map((subtask) => {
        const done = subtask.status === "completed";
        return (
          <div key={subtask.id} className="group/step flex min-h-10 items-center gap-2.5">
            {onToggleSubtask && (
              <span className="flex w-5 shrink-0 justify-center">
                <CompleteButton task={subtask} onComplete={() => onToggleSubtask(subtask)} className="scale-90" />
              </span>
            )}
            <span className={cn("min-w-0 flex-1 break-words text-sm", done && "text-muted-foreground line-through")}>
              {subtask.title}
            </span>
            {onDeleteSubtask && (
              <button
                type="button"
                onClick={() => onDeleteSubtask(subtask.id)}
                aria-label={`Удалить шаг «${subtask.title}»`}
                className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/step:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        );
      })}
      {adding && onAddSubtask && (
        <form
          className="flex min-h-10 items-center gap-2.5"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <span className="flex w-5 shrink-0 justify-center text-muted-foreground" aria-hidden="true">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          </span>
          <input
            autoFocus
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") onDoneAdding();
            }}
            onBlur={() => {
              if (!title.trim()) onDoneAdding();
            }}
            maxLength={200}
            placeholder="Новый шаг — Enter, чтобы добавить"
            aria-label={`Новый шаг для «${task.title}»`}
            className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-none"
          />
        </form>
      )}
    </div>
  );
}

function SortableTaskItem({
  task,
  handlers,
  hideSchedule,
  selection,
  quickActions,
}: {
  task: Task;
  handlers: TaskListHandlers;
  hideSchedule?: boolean;
  selection?: SortableTasksListProps["selection"];
  quickActions?: ReactNode;
}) {
  const [stepsOpen, setStepsOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const pending = isOptimisticTask(task);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: pending,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(isDragging && "opacity-40")}
    >
      <TaskRow
        task={task}
        pending={pending}
        quickActions={quickActions}
        hideSchedule={hideSchedule}
        dragHandle={<DragHandle label={`Перетащить задачу «${task.title}»`} {...attributes} {...listeners} />}
        onComplete={handlers.onComplete}
        onEdit={handlers.onEdit}
        onArchive={handlers.onArchive}
        onDelete={handlers.onDelete}
        onStartFocus={handlers.onStartFocus}
        onAssignToToday={handlers.onAssignToToday}
        onAssignToWeek={handlers.onAssignToWeek}
        onAddSubtask={
          handlers.onAddSubtask
            ? () => {
                setStepsOpen(true);
                setAdding(true);
              }
            : undefined
        }
        steps={
          task.subtasks.length > 0
            ? { expanded: stepsOpen, onToggle: () => setStepsOpen((open) => !open) }
            : undefined
        }
        selection={
          selection
            ? { checked: selection.selectedIds.has(task.id), onChange: () => selection.onToggle(task.id) }
            : undefined
        }
      >
        {(stepsOpen || adding) && task.status !== "archived" ? (
          <SubtaskSteps
            task={task}
            adding={adding}
            onDoneAdding={() => setAdding(false)}
            onToggleSubtask={handlers.onToggleSubtask}
            onAddSubtask={handlers.onAddSubtask}
            onDeleteSubtask={handlers.onDeleteSubtask}
          />
        ) : null}
      </TaskRow>
    </div>
  );
}

export function SortableTasksList({
  tasks,
  onReorder,
  hideSchedule,
  selection,
  renderQuickActions,
  empty,
  className,
  ...handlers
}: SortableTasksListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTask = activeId ? tasks.find((task) => task.id === activeId) : null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const titleOf = (id: string | number) => tasks.find((task) => task.id === id)?.title ?? "задача";
  const positionOf = (id: string | number) => tasks.findIndex((task) => task.id === id) + 1;
  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const from = tasks.findIndex((task) => task.id === active.id);
    const to = tasks.findIndex((task) => task.id === over.id);
    if (from !== -1 && to !== -1) onReorder?.(arrayMove(tasks, from, to));
  };

  if (tasks.length === 0) return <>{empty ?? null}</>;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        screenReaderInstructions: {
          draggable: "Нажмите пробел, чтобы взять задачу, стрелками переместите, пробелом отпустите, Escape — отмена.",
        },
        announcements: {
          onDragStart: ({ active }) => `Задача «${titleOf(active.id)}» взята.`,
          onDragOver: ({ active, over }) =>
            over ? `«${titleOf(active.id)}» на месте ${positionOf(over.id)} из ${tasks.length}.` : undefined,
          onDragEnd: ({ active, over }) =>
            over ? `«${titleOf(active.id)}» теперь на месте ${positionOf(over.id)}.` : "Перенос отменён.",
          onDragCancel: () => "Перенос отменён.",
        },
      }}
    >
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className={cn("space-y-1.5", className)}>
          {tasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              handlers={handlers}
              hideSchedule={hideSchedule}
              selection={selection}
              quickActions={renderQuickActions?.(task)}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay dropAnimation={{ duration: 160, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
        {activeTask ? (
          <div className="rotate-[0.6deg] cursor-grabbing">
            <TaskRow task={activeTask} hideSchedule={hideSchedule} isDragging compact />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
