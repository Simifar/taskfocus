"use client";

import type { ReactNode } from "react";
import {
  Archive,
  CalendarArrowUp,
  CalendarDays,
  Check,
  ChevronDown,
  Edit2,
  ListChecks,
  MoreHorizontal,
  Plus,
  Timer,
  Trash2,
  Undo2,
} from "lucide-react";

import { describeTaskSchedule, type ScheduleTone } from "@/features/tasks/lib/task-row";
import { EISENHOWER_META, getEisenhowerQuadrant } from "@/features/tasks/lib/eisenhower";
import type { Task } from "@/shared/types";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
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
  onStartFocus?: (task: Task) => void;
  /** Hides a single-day label where the view already implies the day; ranges and overdue stay. */
  hideSchedule?: boolean;
  /** Makes the step counter a toggle for inline steps rendered as children. */
  steps?: { expanded: boolean; onToggle: () => void };
  /** Extra one-tap actions shown before the menu (revealed on hover with a mouse). */
  quickActions?: ReactNode;
  /** Renders a not-yet-saved row: visible but not interactive. */
  pending?: boolean;
  selection?: {
    checked: boolean;
    onChange: () => void;
  };
  compact?: boolean;
  isDragging?: boolean;
  children?: ReactNode;
}

const SCHEDULE_TONE: Record<ScheduleTone, string> = {
  overdue: "text-destructive",
  today: "text-brand",
  soon: "text-foreground/75",
  later: "",
};

export function EnergyMeter({ level, className }: { level: number; className?: string }) {
  return (
    <span className={cn("inline-flex items-end gap-px", className)} role="img" aria-label={`Энергия ${level} из 5`}>
      {[1, 2, 3, 4, 5].map((bar) => (
        <span
          key={bar}
          className={cn("w-[3px] rounded-full bg-current", bar > level && "opacity-20")}
          style={{ height: `${3 + bar * 1.6}px` }}
        />
      ))}
    </span>
  );
}

/** Round completion control: a 20px circle inside a 44px hit area. */
export function CompleteButton({
  task,
  onComplete,
  className,
}: {
  task: Pick<Task, "title" | "status">;
  onComplete: () => void;
  className?: string;
}) {
  const done = task.status === "completed";
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onComplete();
      }}
      aria-label={done ? `Вернуть задачу «${task.title}» в работу` : `Отметить задачу «${task.title}» выполненной`}
      aria-pressed={done}
      className={cn(
        "group/check relative z-10 -m-3 flex size-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:[&>span]:ring-2 focus-visible:[&>span]:ring-ring",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full border-[1.5px] transition-[background-color,border-color,color,transform] duration-200 active:scale-90",
          done
            ? "border-success bg-success text-background"
            : "border-muted-foreground/45 text-transparent group-hover/check:border-success group-hover/check:text-success/70",
        )}
      >
        <Check className="size-3" strokeWidth={3} aria-hidden="true" />
      </span>
    </button>
  );
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
  onStartFocus,
  hideSchedule = false,
  steps,
  quickActions,
  pending = false,
  selection,
  compact = false,
  isDragging = false,
  children,
}: TaskRowProps) {
  const done = task.status === "completed";
  const active = task.status === "active";
  const described = describeTaskSchedule(task);
  // In a single-day context the plain day label is redundant; ranges and overdue stay.
  const schedule = hideSchedule && described && !described.range && described.tone !== "overdue" ? null : described;
  const quadrant = getEisenhowerQuadrant(task);
  const hasPriority = task.important || task.urgent;
  const completedSubtasks = task.subtasks?.filter((subtask) => subtask.status === "completed").length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;
  const hasMenu = Boolean(
    onEdit || onArchive || onDelete || onAddSubtask || onAssignToToday || onAssignToWeek || onStartFocus,
  );

  return (
    <article
      className={cn(
        "group/row relative rounded-xl border border-border/70 bg-card transition-[border-color,box-shadow,background-color] duration-150 hover:border-border hover:shadow-sm",
        done && "bg-card/50",
        isDragging && "border-brand/50 shadow-lg ring-1 ring-brand/30",
        selection?.checked && "border-brand/40 bg-brand-soft/60",
        pending && "pointer-events-none opacity-60",
      )}
      aria-busy={pending || undefined}
    >
      <div className={cn("flex items-start gap-2.5 pr-1.5", compact ? "py-2 pl-2.5" : "py-2.5 pl-3 sm:py-3")}>
        {dragHandle && <div className="relative z-10 -my-1 shrink-0">{dragHandle}</div>}

        {selection && (
          <span className="relative z-10 flex h-6 shrink-0 items-center">
            <Checkbox
              checked={selection.checked}
              onCheckedChange={selection.onChange}
              aria-label={`Выбрать задачу «${task.title}»`}
            />
          </span>
        )}

        {onComplete && (
          <span className="flex h-6 w-5 shrink-0 items-center justify-center">
            <CompleteButton task={task} onComplete={() => onComplete(task)} />
          </span>
        )}

        <div className="min-w-0 flex-1">
          {onEdit ? (
            <button
              type="button"
              className={cn(
                "block w-full text-left leading-6 after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring",
                compact ? "text-sm" : "text-[15px]",
                done ? "text-muted-foreground line-through decoration-muted-foreground/50" : "font-medium",
              )}
              onClick={() => onEdit(task)}
            >
              <span className="break-words">{task.title}</span>
            </button>
          ) : (
            <p
              className={cn(
                "break-words leading-6",
                compact ? "text-sm" : "text-[15px]",
                done ? "text-muted-foreground line-through" : "font-medium",
              )}
            >
              {task.title}
            </p>
          )}

          {!compact && task.description && !done && (
            <p className="line-clamp-1 text-[13px] text-muted-foreground">{task.description}</p>
          )}

          {!done && (schedule || hasPriority || totalSubtasks > 0 || (!compact && task.energyLevel !== 3)) && (
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {schedule && (
                <span className={cn("inline-flex items-center gap-1", SCHEDULE_TONE[schedule.tone])}>
                  <CalendarDays className="size-3.5" aria-hidden="true" />
                  {schedule.label}
                </span>
              )}
              {hasPriority && (
                <span className="inline-flex items-center gap-1.5">
                  <span className={cn("size-1.5 rounded-full", EISENHOWER_META[quadrant].dot)} aria-hidden="true" />
                  {EISENHOWER_META[quadrant].shortTitle}
                </span>
              )}
              {totalSubtasks > 0 &&
                (steps ? (
                  <button
                    type="button"
                    onClick={steps.onToggle}
                    aria-expanded={steps.expanded}
                    className="relative z-10 -mx-1.5 -my-1.5 inline-flex min-h-8 items-center gap-1 rounded-md px-1.5 tabular-nums hover:bg-muted hover:text-foreground"
                  >
                    <ListChecks className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">{steps.expanded ? "Скрыть шаги" : "Показать шаги"}:</span>
                    {completedSubtasks}/{totalSubtasks}
                    <ChevronDown className={cn("size-3 transition-transform", steps.expanded && "rotate-180")} aria-hidden="true" />
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <ListChecks className="size-3.5" aria-hidden="true" />
                    <span className="sr-only">Шаги:</span>
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                ))}
              {/* Only non-default effort is a signal worth showing in a list. */}
              {!compact && task.energyLevel !== 3 && <EnergyMeter level={task.energyLevel} />}
            </div>
          )}
        </div>

        {quickActions && !pending && (
          <div className="relative z-10 -my-1 flex shrink-0 items-center transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/row:opacity-100 [@media(hover:hover)]:group-focus-within/row:opacity-100">
            {quickActions}
          </div>
        )}

        {hasMenu && !pending && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative z-10 -my-1 size-9 shrink-0 text-muted-foreground transition-opacity data-[state=open]:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/row:opacity-100 [@media(hover:hover)]:focus-visible:opacity-100"
                aria-label={`Действия для задачи «${task.title}»`}
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {onStartFocus && active && (
                <DropdownMenuItem onClick={() => onStartFocus(task)}>
                  <Timer /> Начать фокус
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit2 /> Открыть
                </DropdownMenuItem>
              )}
              {onAddSubtask && active && (
                <DropdownMenuItem onClick={() => onAddSubtask(task)}>
                  <Plus /> Добавить шаг
                </DropdownMenuItem>
              )}
              {onComplete && done && (
                <DropdownMenuItem onClick={() => onComplete(task)}>
                  <Undo2 /> Вернуть в работу
                </DropdownMenuItem>
              )}
              {(onAssignToToday || onAssignToWeek) && active && <DropdownMenuSeparator />}
              {onAssignToToday && active && (
                <DropdownMenuItem onClick={() => onAssignToToday(task.id)}>
                  <CalendarArrowUp /> На сегодня
                </DropdownMenuItem>
              )}
              {onAssignToWeek && active && (
                <DropdownMenuItem onClick={() => onAssignToWeek(task.id)}>
                  <CalendarDays /> На эту неделю
                </DropdownMenuItem>
              )}
              {(onArchive || onDelete) && <DropdownMenuSeparator />}
              {onArchive && task.status !== "archived" && (
                <DropdownMenuItem onClick={() => onArchive(task.id)}>
                  <Archive /> В архив
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(task.id)}>
                  <Trash2 /> Удалить
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {children && <div className="relative z-10">{children}</div>}
    </article>
  );
}
