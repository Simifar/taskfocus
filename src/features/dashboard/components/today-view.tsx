"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  CalendarArrowUp,
  Check,
  ChevronDown,
  Inbox,
  Maximize2,
  Plus,
  Sparkles,
  Timer,
} from "lucide-react";

import type { Task } from "@/shared/types";
import { MAX_ACTIVE_TASKS_PER_DAY } from "@/shared/lib/task-limits";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { isTaskScheduledForDay } from "@/features/dashboard/lib/task-date-filters";
import { getTodayTaskRecommendation } from "@/features/dashboard/lib/today";
import { useFocusStore } from "@/features/dashboard/focus-store";
import { SortableTasksList } from "@/features/tasks/components/sortable-tasks-list";
import { CompleteButton, EnergyMeter, TaskRow } from "@/features/tasks/components/task-row";
import { describeTaskSchedule } from "@/features/tasks/lib/task-row";
import { EISENHOWER_META, getEisenhowerQuadrant } from "@/features/tasks/lib/eisenhower";
import { mergeReorderedTasks } from "@/features/tasks/lib/reorder";

interface TodayViewProps {
  tasks: Task[];
  /** Active tasks whose planned range ended before today. */
  overdueTasks?: Task[];
  currentEnergy: number | null;
  onEnergyChange: (level: number | null) => void;
  onEdit: (task: Task) => void;
  onArchive: (taskId: string) => void;
  onComplete: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onAddTask: (target?: "today" | "inbox") => void;
  onStartFocus: (task: Task) => void;
  onAssignToToday?: (taskId: string) => void;
  onOpenInbox?: () => void;
  onReorder?: (tasks: Task[]) => void;
  showCompleted: boolean;
  onShowCompletedChange: (show: boolean) => void;
  onToggleSubtask?: (subtask: Task) => void;
  onAddSubtask?: (parentId: string, title: string) => Promise<void> | void;
  onEditSubtask?: (subtask: Task) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
  todayActiveCount?: number;
  focusTaskId?: string | null;
}

const ENERGY_FILTERS: { value: number | null; label: string }[] = [
  { value: null, label: "Любые" },
  { value: 2, label: "Мало сил" },
  { value: 3, label: "Средне" },
];

export function TodayView({
  tasks,
  overdueTasks = [],
  currentEnergy,
  onEnergyChange,
  onEdit,
  onArchive,
  onComplete,
  onDelete,
  onAddTask,
  onStartFocus,
  onAssignToToday,
  onOpenInbox,
  onReorder,
  showCompleted,
  onShowCompletedChange,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  todayActiveCount,
  focusTaskId = null,
}: TodayViewProps) {
  const today = new Date();
  const expandFocus = useFocusStore((s) => s.setExpanded);
  const [overdueOpen, setOverdueOpen] = useState(true);

  const todayTasks = tasks.filter(
    (task) =>
      !task.parentTaskId &&
      (task.status === "active" || task.status === "completed") &&
      isTaskScheduledForDay(task, today),
  );
  const todayActive = todayTasks.filter((task) => task.status === "active");
  const completed = todayTasks.filter((task) => task.status === "completed");
  const visibleActive = currentEnergy === null
    ? todayActive
    : todayActive.filter((task) => task.energyLevel <= currentEnergy);

  // "Now" is the task in focus if it belongs to today, otherwise the recommendation.
  const focused = focusTaskId ? todayActive.find((task) => task.id === focusTaskId) ?? null : null;
  const now = focused ?? getTodayTaskRecommendation(visibleActive, today, currentEnergy);
  const next = now ? visibleActive.filter((task) => task.id !== now.id) : visibleActive;

  const activeCount = todayActiveCount ?? todayActive.length;
  const slotsLeft = Math.max(0, MAX_ACTIVE_TASKS_PER_DAY - activeCount);
  const filteredOut = currentEnergy !== null && todayActive.length > 0 && visibleActive.length === 0;
  const total = todayActive.length + completed.length;

  const handlers = {
    onEdit,
    onComplete,
    onArchive,
    onDelete,
    onStartFocus,
    onToggleSubtask,
    onAddSubtask,
    onDeleteSubtask,
  };

  return (
    <div className="mx-auto w-full max-w-4xl pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground first-letter:uppercase">
            {format(today, "EEEE, d MMMM", { locale: ru })}
          </p>
          <h1 className="mt-2 workspace-title">Сегодня</h1>
        </div>
        <Button
          onClick={() => onAddTask(slotsLeft > 0 ? "today" : "inbox")}
          className="hidden h-10 gap-2 bg-brand text-brand-foreground hover:bg-brand/90 md:inline-flex"
        >
          <Plus /> {slotsLeft > 0 ? "Задача на сегодня" : "Во Входящие"}
        </Button>
      </header>

      {total > 0 && (
        <DayProgress done={completed.length} active={todayActive.length} slotsLeft={slotsLeft} />
      )}

      {now && (
        <NowCard
          task={now}
          inFocus={focused !== null}
          onComplete={onComplete}
          onEdit={onEdit}
          onStartFocus={onStartFocus}
          onOpenFocus={() => expandFocus(true)}
        />
      )}

      {overdueTasks.length > 0 && (
        <section aria-labelledby="today-overdue" className="mt-8">
          <button
            type="button"
            onClick={() => setOverdueOpen((open) => !open)}
            aria-expanded={overdueOpen}
            className="flex min-h-11 w-full flex-wrap items-center gap-2 text-left"
          >
            <h2 id="today-overdue" className="shrink-0 text-sm font-semibold text-destructive">
              Просрочено · {overdueTasks.length}
            </h2>
            <span className="text-xs text-muted-foreground">перенесите или закройте</span>
            <ChevronDown className={cn("ml-auto size-4 text-muted-foreground transition-transform", overdueOpen && "rotate-180")} aria-hidden="true" />
          </button>
          {overdueOpen && (
            <div className="mt-2 space-y-1.5">
              {overdueTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <TaskRow task={task} compact onComplete={onComplete} onEdit={onEdit} onArchive={onArchive} onDelete={onDelete} />
                  </div>
                  {onAssignToToday && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-11 shrink-0 sm:size-10"
                      disabled={slotsLeft === 0}
                      title={slotsLeft === 0 ? "На сегодня уже 5 задач" : "Перенести на сегодня"}
                      aria-label={`Перенести «${task.title}» на сегодня`}
                      onClick={() => onAssignToToday(task.id)}
                    >
                      <CalendarArrowUp />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {(next.length > 0 || filteredOut || todayActive.length > 1) && (
        <section aria-labelledby="today-next" className="mt-8">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 id="today-next" className="text-sm font-semibold">
              {now ? "Дальше" : "План"} {next.length > 0 && <span className="font-normal text-muted-foreground">· {next.length}</span>}
            </h2>
            <div role="group" aria-label="Фильтр по энергии" className="flex rounded-lg bg-muted p-0.5">
              {ENERGY_FILTERS.map((filter) => (
                <button
                  key={filter.label}
                  type="button"
                  aria-pressed={currentEnergy === filter.value}
                  onClick={() => onEnergyChange(filter.value)}
                  className={cn(
                    "min-h-11 rounded-lg px-3 text-xs font-medium transition-colors",
                    currentEnergy === filter.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {filteredOut ? (
            <div className="rounded-xl border border-dashed px-4 py-8 text-center">
              <p className="font-medium">Под этот уровень сил задач нет</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Все {todayActive.length} задачи на сегодня требуют больше энергии.
              </p>
              <Button variant="outline" size="sm" className="mt-4 min-h-10" onClick={() => onEnergyChange(null)}>
                Показать все
              </Button>
            </div>
          ) : (
            <SortableTasksList
              tasks={next}
              hideSchedule
              onReorder={(reordered) => onReorder?.(mergeReorderedTasks(tasks, reordered))}
              {...handlers}
            />
          )}
        </section>
      )}

      {todayActive.length === 0 && (
        <EmptyToday
          completedCount={completed.length}
          canAdd={slotsLeft > 0}
          onAddTask={() => onAddTask(slotsLeft > 0 ? "today" : "inbox")}
          onOpenInbox={onOpenInbox}
        />
      )}

      {completed.length > 0 && (
        <section aria-labelledby="today-done" className="mt-8">
          <button
            type="button"
            onClick={() => onShowCompletedChange(!showCompleted)}
            aria-expanded={showCompleted}
            className="flex min-h-10 w-full items-center gap-2 text-left text-sm text-muted-foreground hover:text-foreground"
          >
            <Check className="size-4 text-success" aria-hidden="true" />
            <h2 id="today-done" className="text-sm font-medium">Выполнено · {completed.length}</h2>
            <ChevronDown className={cn("ml-auto size-4 transition-transform", showCompleted && "rotate-180")} aria-hidden="true" />
          </button>
          {showCompleted && (
            <div className="mt-2 space-y-1.5">
              {completed.map((task) => (
                <TaskRow key={task.id} task={task} compact onComplete={onComplete} onEdit={onEdit} onDelete={onDelete} onArchive={onArchive} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/** Five slots: green = done, outlined brand = planned, muted = free capacity. */
function DayProgress({ done, active, slotsLeft }: { done: number; active: number; slotsLeft: number }) {
  const slots = Math.max(MAX_ACTIVE_TASKS_PER_DAY, done + active);
  return (
    <div className="workspace-panel mt-6 px-4 py-4 sm:px-5">
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: slots }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-2 flex-1 rounded-full transition-colors duration-300",
              index < done ? "bg-success" : index < done + active ? "bg-brand/70" : "bg-muted",
            )}
          />
        ))}
      </div>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          Осталось <span className="font-semibold text-foreground tabular-nums">{active}</span>
        </span>
        <span>
          Готово <span className="font-semibold text-foreground tabular-nums">{done}</span>
        </span>
        <span>{slotsLeft > 0 ? `Свободно мест: ${slotsLeft}` : "План на день заполнен"}</span>
      </p>
    </div>
  );
}

function NowCard({
  task,
  inFocus,
  onComplete,
  onEdit,
  onStartFocus,
  onOpenFocus,
}: {
  task: Task;
  inFocus: boolean;
  onComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onStartFocus: (task: Task) => void;
  onOpenFocus: () => void;
}) {
  const quadrant = getEisenhowerQuadrant(task);
  const schedule = describeTaskSchedule(task);
  const steps = task.subtasks ?? [];
  const doneSteps = steps.filter((step) => step.status === "completed").length;
  const nextStep = steps.find((step) => step.status !== "completed");

  return (
    <section
      aria-labelledby="today-now"
      className={cn(
        "focus-hero mt-5 rounded-3xl border p-5 sm:p-8",
        inFocus && "ring-2 ring-[#85A4FF]/40",
      )}
    >
      <p id="today-now" className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#85A4FF]">
        {inFocus ? <Timer className="size-3.5" aria-hidden="true" /> : <Sparkles className="size-3.5" aria-hidden="true" />}
        {inFocus ? "Сейчас в фокусе" : "Следующее действие"}
      </p>
      <div className="mt-3 flex items-start gap-3">
        <span className="flex h-7 w-5 shrink-0 items-center justify-center">
          <CompleteButton task={task} onComplete={() => onComplete(task)} />
        </span>
        <button
          type="button"
          onClick={() => onEdit(task)}
          className="min-w-0 flex-1 text-left text-2xl font-semibold leading-8 sm:text-3xl sm:leading-10 tracking-tight break-words hover:underline hover:decoration-muted-foreground/40 hover:underline-offset-4"
        >
          {task.title}
        </button>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 pl-8 text-xs text-[#CAD7FC]">
        {(task.important || task.urgent) && (
          <span className="inline-flex items-center gap-1.5">
            <span className={cn("size-1.5 rounded-full", EISENHOWER_META[quadrant].dot)} aria-hidden="true" />
            {EISENHOWER_META[quadrant].title}
          </span>
        )}
        {schedule?.range && <span>{schedule.label}</span>}
        <span className="inline-flex items-center gap-1.5">
          <EnergyMeter level={task.energyLevel} /> энергия {task.energyLevel}/5
        </span>
        {steps.length > 0 && <span className="tabular-nums">Шаги {doneSteps}/{steps.length}</span>}
      </div>
      {nextStep && (
        <p className="mt-5 ml-8 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm">
          <span className="text-[#CAD7FC]">Следующий шаг: </span>
          {nextStep.title}
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3 sm:pl-8">
        {inFocus ? (
          <Button className="min-h-11 gap-2 bg-[#85A4FF] text-[#172C62] hover:bg-[#A6BDFF]" onClick={onOpenFocus}>
            <Maximize2 /> Открыть таймер
          </Button>
        ) : (
          <Button className="min-h-11 gap-2 bg-[#85A4FF] text-[#172C62] hover:bg-[#A6BDFF]" onClick={() => onStartFocus(task)}>
            <Timer /> Фокус 25 мин
          </Button>
        )}
        <Button variant="outline" className="min-h-11 gap-2 border-white/25 bg-transparent text-[#F2F5FF] hover:bg-white/10 hover:text-white dark:bg-transparent dark:hover:bg-white/10" onClick={() => onComplete(task)}>
          <Check /> Готово
        </Button>
      </div>
    </section>
  );
}

function EmptyToday({
  completedCount,
  canAdd,
  onAddTask,
  onOpenInbox,
}: {
  completedCount: number;
  canAdd: boolean;
  onAddTask: () => void;
  onOpenInbox?: () => void;
}) {
  const allDone = completedCount > 0;
  return (
    <div className="workspace-panel mt-8 px-5 py-12 text-center">
      <span
        className={cn(
          "mx-auto flex size-11 items-center justify-center rounded-full",
          allDone ? "bg-success-soft text-success" : "bg-muted text-muted-foreground",
        )}
      >
        {allDone ? <Check className="size-5" /> : <Sparkles className="size-5" />}
      </span>
      <p className="mt-4 font-semibold">{allDone ? "План на сегодня выполнен" : "На сегодня пока ничего"}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {allDone
          ? `Закрыто задач: ${completedCount}. Можно отдохнуть или взять что-то из Входящих.`
          : "Выберите до пяти задач — меньше плана, больше сделанного."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {canAdd && (
          <Button className="min-h-11 gap-2 sm:min-h-10" onClick={onAddTask}>
            <Plus /> Добавить задачу
          </Button>
        )}
        {onOpenInbox && (
          <Button variant="outline" className="min-h-11 gap-2 sm:min-h-10" onClick={onOpenInbox}>
            <Inbox /> Выбрать из Входящих
          </Button>
        )}
      </div>
    </div>
  );
}
