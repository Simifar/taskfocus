"use client";

import { addDays, endOfDay, format, isPast, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Plus } from "lucide-react";

import type { Task } from "@/shared/types";
import { MAX_ACTIVE_TASKS_PER_DAY } from "@/shared/lib/task-limits";
import { Button } from "@/shared/ui/button";
import { SortableTasksList } from "@/features/tasks/components/sortable-tasks-list";
import { TaskRow } from "@/features/tasks/components/task-row";
import { mergeReorderedTasks } from "@/features/tasks/lib/reorder";
import { isTaskScheduledForDay } from "@/features/dashboard/lib/task-date-filters";
import { getPlannedRootTasks } from "@/features/dashboard/lib/plan";

interface DayViewProps {
  tasks: Task[];
  selectedDate: Date;
  backLabel?: string;
  onBack: () => void;
  onChangeDay?: (date: Date) => void;
  onEdit: (task: Task) => void;
  onComplete: (task: Task) => void;
  onArchive?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onStartFocus?: (task: Task) => void;
  onAddTask?: () => void;
  onReorder?: (tasks: Task[]) => void;
  onToggleSubtask?: (subtask: Task) => void;
  onAddSubtask?: (parentId: string, title: string) => Promise<void> | void;
  onEditSubtask?: (subtask: Task) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
}

export function DayView({
  tasks,
  selectedDate,
  backLabel = "Назад",
  onBack,
  onChangeDay,
  onEdit,
  onComplete,
  onArchive,
  onDelete,
  onStartFocus,
  onAddTask,
  onReorder,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
}: DayViewProps) {
  const dayTasks = getPlannedRootTasks(tasks, (task) => isTaskScheduledForDay(task, selectedDate));
  const activeTasks = dayTasks.filter((task) => task.status === "active");
  const completedTasks = dayTasks.filter((task) => task.status === "completed");
  const isToday = isSameDay(selectedDate, new Date());
  const isDayPast = isPast(endOfDay(selectedDate)) && !isToday;
  const full = activeTasks.length >= MAX_ACTIVE_TASKS_PER_DAY;

  return (
    <div className="mx-auto w-full max-w-3xl pb-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" className="-ml-3 min-h-11 gap-1.5 text-muted-foreground sm:min-h-9" onClick={onBack}>
          <ArrowLeft /> {backLabel}
        </Button>
        {onChangeDay && (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-11 sm:size-9" aria-label="Предыдущий день" onClick={() => onChangeDay(addDays(selectedDate, -1))}>
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon" className="size-11 sm:size-9" aria-label="Следующий день" onClick={() => onChangeDay(addDays(selectedDate, 1))}>
              <ChevronRight />
            </Button>
          </div>
        )}
      </div>

      <header className="mt-2 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {format(selectedDate, "d MMMM yyyy", { locale: ru })}
            {isToday && " · сегодня"}
          </p>
          <h1 className="mt-1 text-3xl font-semibold capitalize tracking-tight">
            {format(selectedDate, "EEEE", { locale: ru })}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground tabular-nums">
            Активных {activeTasks.length} из {MAX_ACTIVE_TASKS_PER_DAY}
            {completedTasks.length > 0 && ` · готово ${completedTasks.length}`}
          </p>
        </div>
        {!isDayPast && onAddTask && (
          <Button className="min-h-11 gap-2 sm:min-h-9" variant="outline" onClick={onAddTask} disabled={full} title={full ? "День заполнен" : undefined}>
            <Plus /> Задача
          </Button>
        )}
      </header>

      <section aria-label="Активные задачи" className="mt-6">
        <SortableTasksList
          tasks={activeTasks}
          hideSchedule
          onEdit={onEdit}
          onComplete={onComplete}
          onArchive={onArchive}
          onDelete={onDelete}
          onStartFocus={onStartFocus}
          onReorder={(reordered) => onReorder?.(mergeReorderedTasks(tasks, reordered))}
          onToggleSubtask={onToggleSubtask}
          onAddSubtask={onAddSubtask}
          onDeleteSubtask={onDeleteSubtask}
          empty={
            <div className="rounded-2xl border border-dashed px-5 py-10 text-center">
              <p className="font-semibold">
                {completedTasks.length > 0 ? "На этот день всё готово" : isDayPast ? "В этот день задач не было" : "День свободен"}
              </p>
              {!isDayPast && completedTasks.length === 0 && (
                <p className="mt-1 text-sm text-muted-foreground">Добавьте задачу или перетащите её сюда из недели.</p>
              )}
            </div>
          }
        />
      </section>

      {completedTasks.length > 0 && (
        <section aria-labelledby="day-done" className="mt-8">
          <h2 id="day-done" className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Check className="size-4 text-success" aria-hidden="true" /> Выполнено · {completedTasks.length}
          </h2>
          <div className="space-y-1.5">
            {completedTasks.map((task) => (
              <TaskRow key={task.id} task={task} compact onComplete={onComplete} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
