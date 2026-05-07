"use client";

import { useEffect, useMemo, useState } from "react";
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

const FOCUS_DURATION_SECONDS = 25 * 60;

interface FocusModeDialogProps {
  open: boolean;
  task: Task | null;
  onOpenChange: (open: boolean) => void;
  onComplete: (task: Task) => void;
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function FocusModeDialog({
  open,
  task,
  onOpenChange,
  onComplete,
}: FocusModeDialogProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(FOCUS_DURATION_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  useEffect(() => {
    if (!open || !isRunning) return;

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(intervalId);
          setIsRunning(false);
          setCompletedSessions((count) => count + 1);
          toast.success("Фокус-сессия завершена");
          return 0;
        }

        return seconds - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isRunning, open]);

  const progress = useMemo(() => {
    return ((FOCUS_DURATION_SECONDS - remainingSeconds) / FOCUS_DURATION_SECONDS) * 100;
  }, [remainingSeconds]);

  const handleReset = () => {
    setRemainingSeconds(FOCUS_DURATION_SECONDS);
    setIsRunning(false);
  };

  const handleCompleteTask = () => {
    if (!task) return;

    onComplete(task);
    toast.success("Задача завершена");
    onOpenChange(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setIsRunning(false);
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
              <h2 className="text-2xl font-bold leading-tight">{task?.title ?? "Задача не выбрана"}</h2>
              {task?.description && (
                <p className="mx-auto max-w-md text-sm text-muted-foreground line-clamp-3">
                  {task.description}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="text-center text-6xl font-bold tabular-nums tracking-normal">
                {formatTime(remainingSeconds)}
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
                onClick={() => setIsRunning((value) => !value)}
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
