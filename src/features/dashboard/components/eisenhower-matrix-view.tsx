"use client";

import { Archive, CalendarArrowUp, CalendarDays, Plus, Timer } from "lucide-react";

import type { EisenhowerQuadrant, Task } from "@/shared/types";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  SortableTasksBoard,
  type SortableTaskGroup,
  type TaskGroupMove,
} from "@/features/tasks/components/sortable-tasks-board";
import { TaskRow } from "@/features/tasks/components/task-row";
import {
  EISENHOWER_META,
  EISENHOWER_ORDER,
  getEisenhowerQuadrant,
} from "@/features/tasks/lib/eisenhower";
import { describeTaskSchedule } from "@/features/tasks/lib/task-row";

interface EisenhowerMatrixViewProps {
  tasks: Task[];
  onEdit?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onAddTask?: () => void;
  onAssignToToday?: (taskId: string) => void;
  onAssignToWeek?: (taskId: string) => void;
  onStartFocus?: (task: Task) => void;
  onReorder?: (tasks: Task[]) => void;
  onMoveToQuadrant?: (taskId: string, quadrant: EisenhowerQuadrant) => void;
}

/** What each quadrant asks the user to decide, and the one-tap action that does it. */
const GUIDANCE: Record<EisenhowerQuadrant, { hint: string; emptyHint: string }> = {
  do: {
    hint: "Поставьте на сегодня и начните с них.",
    emptyHint: "Горящих задач нет — хороший знак.",
  },
  schedule: {
    hint: "Главное для целей. Выберите день, пока не стало срочным.",
    emptyHint: "Отметьте задачи, которые двигают вас вперёд, как важные.",
  },
  delegate: {
    hint: "Сделайте быстро, передайте или сократите объём.",
    emptyHint: "Ничего не отвлекает.",
  },
  eliminate: {
    hint: "Сюда попадают и неразмеченные задачи. Отметьте важное или уберите лишнее.",
    emptyHint: "Пусто — всё разобрано.",
  },
};

function PriorityToggle({
  label,
  active,
  onClick,
  taskTitle,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  taskTitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`${label}: ${active ? "снять отметку" : "отметить"} для «${taskTitle}»`}
      className={cn(
        "min-h-8 rounded-md px-2 text-[11px] font-medium transition-colors",
        active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
    </button>
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
  onStartFocus,
  onReorder,
  onMoveToQuadrant,
}: EisenhowerMatrixViewProps) {
  const activeTasks = tasks.filter((task) => task.status === "active" && !task.parentTaskId);
  const byQuadrant = Object.fromEntries(
    EISENHOWER_ORDER.map((quadrant) => [
      quadrant,
      activeTasks.filter((task) => getEisenhowerQuadrant(task) === quadrant),
    ]),
  ) as Record<EisenhowerQuadrant, Task[]>;

  const setPriority = (task: Task, important: boolean, urgent: boolean) =>
    onMoveToQuadrant?.(task.id, getEisenhowerQuadrant({ important, urgent }));

  const quickActionFor = (task: Task, quadrant: EisenhowerQuadrant) => {
    const schedule = describeTaskSchedule(task);
    const plannedToday = schedule?.tone === "today";
    if (quadrant === "do") {
      return plannedToday && onStartFocus ? (
        <Button variant="ghost" size="icon" className="size-8" title="Начать фокус" aria-label={`Начать фокус: «${task.title}»`} onClick={() => onStartFocus(task)}>
          <Timer />
        </Button>
      ) : onAssignToToday ? (
        <Button variant="ghost" size="icon" className="size-8" title="На сегодня" aria-label={`Запланировать «${task.title}» на сегодня`} onClick={() => onAssignToToday(task.id)}>
          <CalendarArrowUp />
        </Button>
      ) : null;
    }
    if (quadrant === "schedule" && !schedule && onAssignToWeek) {
      return (
        <Button variant="ghost" size="icon" className="size-8" title="На эту неделю" aria-label={`Запланировать «${task.title}» на эту неделю`} onClick={() => onAssignToWeek(task.id)}>
          <CalendarDays />
        </Button>
      );
    }
    if (quadrant === "eliminate" && onArchive) {
      return (
        <Button variant="ghost" size="icon" className="size-8" title="В архив" aria-label={`Убрать «${task.title}» в архив`} onClick={() => onArchive(task.id)}>
          <Archive />
        </Button>
      );
    }
    return null;
  };

  const groups: SortableTaskGroup[] = EISENHOWER_ORDER.map((quadrant) => {
    const meta = EISENHOWER_META[quadrant];
    const items = byQuadrant[quadrant];

    return {
      id: quadrant,
      tasks: items,
      className: "flex flex-col rounded-xl border bg-card/60 p-2",
      contentClassName: "flex-1 space-y-1.5",
      header: (
        <div className="px-1.5 pt-1 pb-2.5">
          <div className="flex items-center gap-2">
            <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden="true" />
            <h2 className="text-sm font-semibold">{meta.action}</h2>
            <span className="text-sm tabular-nums text-muted-foreground">{items.length}</span>
            <span className="ml-auto text-xs text-muted-foreground">{meta.title}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{GUIDANCE[quadrant].hint}</p>
        </div>
      ),
      empty: (
        <p className="flex min-h-20 items-center justify-center rounded-lg border border-dashed px-4 text-center text-xs text-muted-foreground">
          {GUIDANCE[quadrant].emptyHint}
        </p>
      ),
    };
  });

  const handleBoardChange = (nextGroups: SortableTaskGroup[], move?: TaskGroupMove) => {
    if (move) onMoveToQuadrant?.(move.task.id, move.toGroupId as EisenhowerQuadrant);
    onReorder?.(nextGroups.flatMap((group) => group.tasks));
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Приоритеты</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Решите, что делать, что планировать, а что отпустить. Перетащите задачу или переключите «Важно» и «Срочно».
          </p>
        </div>
        {onAddTask && (
          <Button className="min-h-11 gap-2 sm:min-h-9" variant="outline" onClick={onAddTask}>
            <Plus /> Задача
          </Button>
        )}
      </header>

      {activeTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed px-5 py-12 text-center">
          <p className="font-semibold">Нет активных задач</p>
          <p className="mt-1 text-sm text-muted-foreground">Добавьте задачи — и здесь станет видно, за что браться первым.</p>
        </div>
      ) : (
        <SortableTasksBoard
          groups={groups}
          className="grid gap-3 lg:grid-cols-2"
          onChange={handleBoardChange}
          groupLabel={(id) => EISENHOWER_META[id as EisenhowerQuadrant].action}
          renderOverlay={(task) => <TaskRow task={task} compact isDragging />}
          renderTask={(task, dragHandle, groupId) => (
            <TaskRow
              task={task}
              compact
              dragHandle={dragHandle}
              onComplete={onComplete}
              onEdit={onEdit}
              onArchive={onArchive}
              onDelete={onDelete}
              onStartFocus={onStartFocus}
              onAssignToToday={onAssignToToday}
              onAssignToWeek={onAssignToWeek}
              quickActions={quickActionFor(task, groupId as EisenhowerQuadrant)}
            >
              <div className="flex items-center gap-1 pb-1.5 pl-[3.25rem]">
                <PriorityToggle
                  label="Важно"
                  active={task.important}
                  taskTitle={task.title}
                  onClick={() => setPriority(task, !task.important, task.urgent)}
                />
                <PriorityToggle
                  label="Срочно"
                  active={task.urgent}
                  taskTitle={task.title}
                  onClick={() => setPriority(task, task.important, !task.urgent)}
                />
              </div>
            </TaskRow>
          )}
        />
      )}
    </div>
  );
}
