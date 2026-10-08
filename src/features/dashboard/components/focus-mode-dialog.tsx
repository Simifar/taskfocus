"use client";

import { useEffect, useState } from "react";
import { Check, CheckCircle2, Circle, Maximize2, Pause, Play, RotateCcw, Square, Timer } from "lucide-react";
import { toast } from "sonner";

import type { Task } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { cn } from "@/shared/lib/utils";
import { useFocusStore } from "@/features/dashboard/focus-store";
import {
  formatFocusTime,
  getFocusProgress,
  getSessionRemainingSeconds,
} from "@/features/dashboard/lib/focus";

/** Re-renders every half second while a session is running and settles it at zero. */
function useFocusClock() {
  const session = useFocusStore((s) => s.session);
  const settle = useFocusStore((s) => s.settle);
  const [now, setNow] = useState(() => Date.now());
  const running = session?.deadlineMs != null;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setNow(Date.now());
      if (settle()) {
        toast.success("Фокус-сессия завершена", { description: "Сделайте короткий перерыв." });
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [running, settle]);

  // `now` can be stale right after a (re)start; the paused remainder is the upper bound.
  const remaining = session ? Math.min(getSessionRemainingSeconds(session, now), session.remainingSeconds) : 0;
  return { session, remaining, running };
}

interface FocusModeProps {
  /** Freshest copy of the focused task from the cache, if it is loaded. */
  task: Task | null;
  onComplete: (task: Pick<Task, "id" | "title" | "status">) => Promise<boolean>;
  onToggleSubtask: (subtask: Task) => void;
}

export function FocusMode({ task, onComplete, onToggleSubtask }: FocusModeProps) {
  const { session, remaining, running } = useFocusClock();
  const expanded = useFocusStore((s) => s.expanded);
  const setExpanded = useFocusStore((s) => s.setExpanded);
  const toggle = useFocusStore((s) => s.toggle);
  const reset = useFocusStore((s) => s.reset);
  const stop = useFocusStore((s) => s.stop);

  useEffect(() => {
    if (!session) return;
    const previous = document.title;
    document.title = `${formatFocusTime(remaining)} · ${session.taskTitle}`;
    return () => {
      document.title = previous;
    };
  }, [remaining, session]);

  if (!session) return null;

  const title = task?.title ?? session.taskTitle;
  const progress = getFocusProgress(remaining);
  const subtasks = task?.subtasks ?? [];

  const handleComplete = async () => {
    const ok = await onComplete({ id: session.taskId, title, status: task?.status ?? "active" });
    if (ok) stop();
  };

  return (
    <>
      {/* Mini bar: always visible while a session exists, above the mobile tab bar. */}
      <div
        className={cn(
          "fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 md:inset-x-auto md:right-6 md:bottom-6 md:w-[360px]",
          expanded && "hidden",
        )}
      >
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-popover p-2 pl-3 shadow-lg">
          <div className="relative size-9 shrink-0" aria-hidden="true">
            <svg viewBox="0 0 36 36" className="size-9 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-muted" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                strokeWidth="3"
                strokeLinecap="round"
                pathLength={100}
                strokeDasharray={`${progress} 100`}
                className="stroke-brand transition-[stroke-dasharray] duration-500"
              />
            </svg>
            <Timer className="absolute inset-0 m-auto size-3.5 text-brand" />
          </div>
          <button
            type="button"
            className="min-w-0 flex-1 rounded-lg px-1 py-1 text-left"
            onClick={() => setExpanded(true)}
            aria-label={`Открыть фокус-режим: ${title}`}
          >
            <span className="block truncate text-sm font-medium">{title}</span>
            <span className="block text-xs tabular-nums text-muted-foreground">
              {formatFocusTime(remaining)} · {running ? "идёт фокус" : remaining === 0 ? "сессия завершена" : "на паузе"}
            </span>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 rounded-xl"
            onClick={toggle}
            aria-label={running ? "Пауза" : "Продолжить"}
          >
            {running ? <Pause /> : <Play />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-11 shrink-0 rounded-xl text-muted-foreground"
            onClick={() => setExpanded(true)}
            aria-label="Развернуть"
          >
            <Maximize2 />
          </Button>
        </div>
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent sheet className="gap-0 p-0 sm:max-w-md">
          <div className="px-6 pt-7 pb-2">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Timer className="size-3.5 text-brand" aria-hidden="true" />
              Фокус
            </p>
            <DialogTitle className="mt-2 break-words pr-8 text-xl font-semibold leading-snug">
              {title}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Таймер фокуса продолжает идти, даже если закрыть это окно.
            </DialogDescription>
            {task?.description && (
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{task.description}</p>
            )}
          </div>

          <div className="mx-4 my-3 rounded-3xl bg-brand-soft/60 px-4 py-8 sm:mx-6">
            <div
              role="timer"
              aria-live="off"
              aria-label={`Осталось ${formatFocusTime(remaining)}`}
              className="text-center text-6xl font-semibold tabular-nums tracking-tight"
            >
              {formatFocusTime(remaining)}
            </div>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {running ? "Таймер идёт, даже если закрыть окно" : remaining === 0 ? "Сессия завершена — сделайте перерыв" : "На паузе"}
              {session.completedSessions > 0 && ` · сессий: ${session.completedSessions}`}
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="size-12 rounded-full"
                onClick={reset}
                aria-label="Сбросить таймер"
              >
                <RotateCcw />
              </Button>
              <Button
                className="h-14 min-w-28 rounded-2xl sm:min-w-36 bg-brand text-base text-brand-foreground hover:bg-brand/90"
                onClick={toggle}
              >
                {running ? <Pause /> : <Play />}
                {running ? "Пауза" : remaining === 0 ? "Ещё сессия" : "Продолжить"}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-12 rounded-full"
                onClick={stop}
                aria-label="Завершить фокус без отметки задачи"
              >
                <Square />
              </Button>
            </div>
          </div>

          {subtasks.length > 0 && (
            <div className="border-t px-6 py-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Шаги · {subtasks.filter((s) => s.status === "completed").length}/{subtasks.length}
              </p>
              <div className="max-h-48 space-y-0.5 overflow-y-auto">
                {subtasks.map((subtask) => {
                  const done = subtask.status === "completed";
                  return (
                    <button
                      key={subtask.id}
                      type="button"
                      onClick={() => onToggleSubtask(subtask)}
                      className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left text-sm hover:bg-muted"
                      aria-pressed={done}
                    >
                      {done ? (
                        <Check className="size-4 shrink-0 text-success" aria-hidden="true" />
                      ) : (
                        <Circle className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      )}
                      <span className={cn("min-w-0 flex-1 break-words", done && "text-muted-foreground line-through")}>
                        {subtask.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t p-4">
            <Button
              variant="outline"
              className="h-11 w-full gap-2 rounded-xl"
              onClick={() => void handleComplete()}
            >
              <CheckCircle2 className="text-success" />
              Задача выполнена
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
