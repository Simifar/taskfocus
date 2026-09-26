"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Pause, Play, RotateCcw, Timer, X } from "lucide-react";
import { toast } from "sonner";

import type { Task } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Progress } from "@/shared/ui/progress";
import { FOCUS_DURATION_SECONDS, formatFocusTime, getFocusProgress, getFocusRemainingSeconds } from "@/features/dashboard/lib/focus";

interface FocusModeDialogProps {
  open: boolean;
  task: Task | null;
  onOpenChange: (open: boolean) => void;
  onComplete: (task: Task) => Promise<boolean>;
}

export function FocusModeDialog({
  open,
  task,
  onOpenChange,
  onComplete,
}: FocusModeDialogProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(FOCUS_DURATION_SECONDS);
  const [deadlineMs, setDeadlineMs] = useState<number | null>(null);
  const [completedSessions, setCompletedSessions] = useState(0);
  const isRunning = deadlineMs !== null;

  useEffect(() => {
    if (!open || deadlineMs === null) return;

    const intervalId = window.setInterval(() => {
      const nextSeconds = getFocusRemainingSeconds(deadlineMs, Date.now());
      setRemainingSeconds(nextSeconds);
      if (nextSeconds === 0) {
        setDeadlineMs(null);
        setCompletedSessions((count) => count + 1);
        toast.success("Фокус-сессия завершена");
      }
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [deadlineMs, open]);

  const progress = getFocusProgress(remainingSeconds);

  const handleReset = () => {
    setRemainingSeconds(FOCUS_DURATION_SECONDS);
    setDeadlineMs(null);
  };

  const handleCompleteTask = async () => {
    if (!task) return;

    if (await onComplete(task)) handleOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && deadlineMs !== null) {
      setRemainingSeconds(getFocusRemainingSeconds(deadlineMs, Date.now()));
      setDeadlineMs(null);
    }

    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden" showCloseButton={false}>
        <div className="bg-background">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <DialogHeader className="gap-1 text-left">
              <DialogTitle className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-brand" />
                Фокус-режим
              </DialogTitle>
              <DialogDescription>
                Одна задача, один таймер, минимум отвлечений.
              </DialogDescription>
            </DialogHeader>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => handleOpenChange(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Закрыть</span>
            </Button>
          </div>

          <div className="space-y-7 px-5 py-7">
            <div className="space-y-2 text-center">
              <p className="text-sm font-medium text-muted-foreground">Текущая задача</p>
              <h2 className="break-words text-2xl font-bold leading-tight">{task?.title ?? "Задача не выбрана"}</h2>
              {task?.description && (
                <p className="mx-auto max-w-md text-sm text-muted-foreground line-clamp-3">
                  {task.description}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div role="timer" aria-label={`Осталось ${formatFocusTime(remainingSeconds)}`} className="text-center text-6xl font-bold tabular-nums tracking-normal">
                {formatFocusTime(remainingSeconds)}
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-brand" />
                Сессий завершено: {completedSessions}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:flex sm:justify-center">
              <Button
                className="h-11 gap-2 bg-brand text-brand-foreground hover:bg-brand/90"
                onClick={() => {
                  if (isRunning && deadlineMs !== null) {
                    setRemainingSeconds(getFocusRemainingSeconds(deadlineMs, Date.now()));
                    setDeadlineMs(null);
                  } else {
                    setDeadlineMs(Date.now() + remainingSeconds * 1000);
                  }
                }}
                disabled={!task || remainingSeconds === 0}
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isRunning ? "Пауза" : "Старт"}
              </Button>
              <Button variant="outline" className="h-11 gap-2" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
                Сброс
              </Button>
              <Button
                variant="outline"
                className="h-11 gap-2 border-brand/40 text-brand hover:bg-brand/10"
                onClick={handleCompleteTask}
                disabled={!task}
              >
                <CheckCircle2 className="h-4 w-4" />
                Готово
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
