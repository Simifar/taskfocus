"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, Search, X } from "lucide-react";

import type { Task } from "@/shared/types";
import { useTasks } from "@/features/tasks/hooks";
import { TaskRow } from "@/features/tasks/components/task-row";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";

interface TaskSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (task: Task) => void;
  onComplete: (task: Task) => unknown;
  onArchive: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

function getSubtaskMatch(task: Task, query: string) {
  const normalizedQuery = query.toLocaleLowerCase();
  if (`${task.title} ${task.description ?? ""}`.toLocaleLowerCase().includes(normalizedQuery)) return null;
  return task.subtasks.find((subtask) =>
    `${subtask.title} ${subtask.description ?? ""}`.toLocaleLowerCase().includes(normalizedQuery),
  );
}

export function TaskSearchDialog({
  open,
  onOpenChange,
  onEdit,
  onComplete,
  onArchive,
  onDelete,
}: TaskSearchDialogProps) {
  const [query, setQuery] = useState("");
  const [settledQuery, setSettledQuery] = useState("");
  const searchTerm = settledQuery.trim();

  useEffect(() => {
    const term = open && query.trim().length >= 2 ? query.trim() : "";
    const timeoutId = window.setTimeout(() => setSettledQuery(term), term ? 180 : 0);
    return () => window.clearTimeout(timeoutId);
  }, [open, query]);

  const tasksQuery = useTasks(
    { search: searchTerm },
    { enabled: open && searchTerm.length >= 2 && searchTerm === query.trim() },
  );
  const tasks = tasksQuery.data?.items ?? [];
  const emptyHint = query.trim().length < 2;

  const handleEdit = (task: Task) => {
    onOpenChange(false);
    onEdit(task);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="flex max-h-[80dvh] min-h-0 max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="relative border-b px-5 py-4 pr-14 text-left sm:px-6 sm:pr-14">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Search className="size-4 text-brand" aria-hidden="true" />
            Найти задачу
          </DialogTitle>
          <DialogDescription>Поиск по задачам, описаниям и подзадачам.</DialogDescription>
          <button
            type="button"
            aria-label="Закрыть поиск"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-brand"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </DialogHeader>

        <div className="border-b px-4 py-3 sm:px-6">
          <label className="sr-only" htmlFor="task-search-input">Поиск по задачам</label>
          <Input
            id="task-search-input"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Например, подготовить отчёт"
            className="h-11 border-0 bg-transparent px-2 text-base shadow-none focus-visible:ring-2 focus-visible:ring-brand/40"
          />
          <p className="mt-1 px-2 text-xs text-muted-foreground">Введите минимум 2 символа</p>
        </div>

        <div className="min-h-36 flex-1 overflow-y-auto p-3 sm:p-4" aria-live="polite">
          {emptyHint ? (
            <div className="flex min-h-28 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <Search className="size-5" aria-hidden="true" />
              Начните вводить название или часть описания
            </div>
          ) : tasksQuery.isLoading || (settledQuery !== query.trim() && query.trim().length >= 2) ? (
            <div className="flex min-h-28 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Ищем задачи…
            </div>
          ) : tasksQuery.isError ? (
            <div className="flex min-h-36 flex-col items-center justify-center gap-3 text-center">
              <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
              <p className="text-sm">Не удалось выполнить поиск. Проверьте соединение и попробуйте ещё раз.</p>
              <Button variant="outline" size="sm" onClick={() => void tasksQuery.refetch()}>Повторить</Button>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex min-h-28 flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm font-medium">Ничего не найдено</p>
              <p className="text-sm text-muted-foreground">Попробуйте другое слово или часть названия.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => {
                const matchedSubtask = getSubtaskMatch(task, query.trim());
                return (
                  <div key={task.id} className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <Badge variant={task.status === "active" ? "secondary" : "outline"} className="font-normal">
                        {task.status === "active" ? "Активна" : task.status === "completed" ? "Выполнена" : "В архиве"}
                      </Badge>
                      {matchedSubtask && (
                        <span className="min-w-0 truncate text-xs text-muted-foreground">
                          Совпадение в подзадаче: {matchedSubtask.title}
                        </span>
                      )}
                    </div>
                    <TaskRow
                      task={task}
                      onComplete={onComplete}
                      onEdit={handleEdit}
                      onArchive={onArchive}
                      onDelete={onDelete}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </DialogContent>
    </Dialog>
  );
}
