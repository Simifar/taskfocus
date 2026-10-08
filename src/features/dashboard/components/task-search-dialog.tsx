"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertCircle, CornerDownLeft, Loader2, Search, X } from "lucide-react";

import type { Task } from "@/shared/types";
import { useTasks } from "@/features/tasks/hooks";
import { describeTaskSchedule } from "@/features/tasks/lib/task-row";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";

interface TaskSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (task: Task) => void;
  onComplete?: (task: Task) => unknown;
  onArchive?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
}

const STATUS_LABEL: Record<Task["status"], string> = {
  active: "",
  completed: "Выполнена",
  archived: "В архиве",
};

function getSubtaskMatch(task: Task, query: string) {
  const normalizedQuery = query.toLocaleLowerCase();
  if (`${task.title} ${task.description ?? ""}`.toLocaleLowerCase().includes(normalizedQuery)) return null;
  return task.subtasks.find((subtask) =>
    `${subtask.title} ${subtask.description ?? ""}`.toLocaleLowerCase().includes(normalizedQuery),
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const index = text.toLocaleLowerCase().indexOf(query.toLocaleLowerCase());
  if (!query || index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-brand-soft px-0.5 text-foreground">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
}

export function TaskSearchDialog({ open, onOpenChange, onEdit }: TaskSearchDialogProps) {
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [settledQuery, setSettledQuery] = useState("");
  // The highlighted row resets whenever the search term changes.
  const [active, setActive] = useState({ term: "", index: 0 });
  const trimmed = query.trim();
  const searchTerm = settledQuery.trim();

  useEffect(() => {
    const term = open && trimmed.length >= 2 ? trimmed : "";
    const timeoutId = window.setTimeout(() => setSettledQuery(term), term ? 160 : 0);
    return () => window.clearTimeout(timeoutId);
  }, [open, trimmed]);

  const tasksQuery = useTasks({ search: searchTerm }, { enabled: open && searchTerm.length >= 2 });
  const tasks = searchTerm.length >= 2 ? tasksQuery.data?.items ?? [] : [];
  const waiting = trimmed.length >= 2 && (settledQuery !== trimmed || tasksQuery.isFetching);

  const activeIndex = active.term === searchTerm ? Math.min(active.index, Math.max(0, tasks.length - 1)) : 0;
  const setActiveIndex = (update: number | ((index: number) => number)) =>
    setActive({ term: searchTerm, index: typeof update === "function" ? update(activeIndex) : update });

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const choose = (task: Task) => {
    onOpenChange(false);
    setQuery("");
    onEdit(task);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (tasks.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % tasks.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + tasks.length) % tasks.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const task = tasks[activeIndex];
      if (task) choose(task);
    }
  };

  let body: React.ReactNode;
  if (trimmed.length < 2) {
    body = (
      <p className="px-4 py-10 text-center text-sm text-muted-foreground">
        Ищите по названию, заметке или шагу задачи — включая выполненные и архив.
      </p>
    );
  } else if (tasksQuery.isError && tasks.length === 0) {
    body = (
      <div role="alert" className="flex flex-col items-center gap-3 px-4 py-10 text-center">
        <AlertCircle className="size-5 text-destructive" aria-hidden="true" />
        <p className="text-sm">Поиск не удался. Проверьте соединение.</p>
        <Button variant="outline" size="sm" className="min-h-10" onClick={() => void tasksQuery.refetch()}>
          Повторить
        </Button>
      </div>
    );
  } else if (tasks.length === 0 && waiting) {
    body = (
      <p className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Ищем…
      </p>
    );
  } else if (tasks.length === 0) {
    body = (
      <div className="px-4 py-10 text-center">
        <p className="text-sm font-medium">Ничего не нашлось по «{trimmed}»</p>
        <p className="mt-1 text-sm text-muted-foreground">Попробуйте часть слова или другое слово.</p>
      </div>
    );
  } else {
    body = (
      <div ref={listRef} id={listId} role="listbox" aria-label="Результаты поиска" className={cn("p-1.5", waiting && "opacity-70")}>
        {tasks.map((task, index) => {
          const subtaskMatch = getSubtaskMatch(task, searchTerm);
          const schedule = task.status === "active" ? describeTaskSchedule(task) : null;
          const status = STATUS_LABEL[task.status];
          return (
            <button
              key={task.id}
              type="button"
              role="option"
              id={`${listId}-${index}`}
              data-index={index}
              aria-selected={index === activeIndex}
              onMouseMove={() => setActiveIndex(index)}
              onClick={() => choose(task)}
              className={cn(
                "flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-left",
                index === activeIndex ? "bg-muted" : "hover:bg-muted/60",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-sm", task.status !== "active" ? "text-muted-foreground" : "font-medium")}>
                  <Highlight text={task.title} query={searchTerm} />
                </span>
                {(subtaskMatch || schedule || status) && (
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {[status, schedule?.label, subtaskMatch && `шаг: ${subtaskMatch.title}`].filter(Boolean).join(" · ")}
                  </span>
                )}
              </span>
              {index === activeIndex && (
                <CornerDownLeft className="hidden size-4 shrink-0 text-muted-foreground sm:block" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setQuery("");
        onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="top-[max(1rem,10vh)] flex max-h-[min(36rem,80dvh)] translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
      >
        <DialogTitle className="sr-only">Поиск задач</DialogTitle>
        <DialogDescription className="sr-only">
          Стрелки — выбор результата, Enter — открыть задачу, Escape — закрыть.
        </DialogDescription>
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Найти задачу…"
            aria-label="Поиск задач"
            role="combobox"
            aria-expanded={tasks.length > 0}
            aria-controls={listId}
            aria-activedescendant={tasks.length > 0 ? `${listId}-${activeIndex}` : undefined}
            autoComplete="off"
            className="min-h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground focus-visible:outline-none"
          />
          {waiting && tasks.length > 0 && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden="true" />}
          <button type="button" aria-label="Закрыть поиск" className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted" onClick={() => { setQuery(""); onOpenChange(false); }}><X className="size-4" aria-hidden="true" /></button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto" aria-live="polite">
          {body}
        </div>
      </DialogContent>
    </Dialog>
  );
}
