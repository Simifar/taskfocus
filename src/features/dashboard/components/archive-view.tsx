"use client";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Archive, RotateCcw, Trash2 } from "lucide-react";

import type { StatsResponse, Task } from "@/shared/types";
import { Button } from "@/shared/ui/button";

interface ArchiveViewProps {
  tasks: Task[];
  isLoading?: boolean;
  stats: StatsResponse | null;
  onRestore: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onEdit?: (task: Task) => void;
}

export function ArchiveView({ tasks, onRestore, onDelete, onEdit }: ArchiveViewProps) {
  // Restored tasks leave the list at once thanks to the optimistic status patch.
  const archived = tasks.filter((task) => !task.parentTaskId && task.status === "archived");

  return (
    <div className="mx-auto w-full max-w-4xl pb-6">
      <header>
        <h1 className="workspace-title">Архив</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {archived.length > 0
            ? `Задач в архиве: ${archived.length}. Верните нужное или удалите лишнее.`
            : "Отложенные задачи хранятся здесь, пока не понадобятся."}
        </p>
      </header>

      {archived.length === 0 ? (
        <div className="mt-6 rounded-2xl border bg-card shadow-[var(--shadow-panel)] px-5 py-12 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Archive className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-4 font-semibold">Архив пуст</p>
        </div>
      ) : (
        <ul className="mt-6 m-0 list-none space-y-1.5 p-0">
          {archived.map((task) => (
            <li key={task.id} className="group/row m-0 flex items-center gap-2 rounded-xl border border-border/70 bg-card py-1.5 pr-1.5 pl-4">
              <button
                type="button"
                className="min-w-0 flex-1 py-1.5 text-left"
                onClick={() => onEdit?.(task)}
              >
                <span className="block break-words text-[15px] text-muted-foreground">{task.title}</span>
                <span className="block text-xs text-muted-foreground">
                  Изменена {format(new Date(task.updatedAt), "d MMMM", { locale: ru })}
                </span>
              </button>
              <Button
                variant="ghost"
                className="min-h-11 shrink-0 gap-1.5 px-3 sm:min-h-9"
                aria-label={`Вернуть задачу «${task.title}» в работу`}
                onClick={() => onRestore(task.id)}
              >
                <RotateCcw /> <span className="hidden sm:inline">Вернуть</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 shrink-0 text-muted-foreground hover:text-destructive sm:size-9"
                title="Удалить (можно отменить)"
                aria-label={`Удалить задачу «${task.title}»`}
                onClick={() => onDelete(task.id)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
