"use client";

import { useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useCreateTask } from "@/features/tasks/hooks";
import { describeTaskError } from "@/features/tasks/errors";
import { toTaskDayInput } from "@/features/tasks/lib/task-row";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  EnergyPicker,
  PriorityPicker,
  SchedulePicker,
  describeDayRange,
  energyHint,
  type DayRange,
} from "./task-fields";
import { EISENHOWER_META, getEisenhowerQuadrant } from "@/features/tasks/lib/eisenhower";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preSelectedDate?: Date;
  defaultEnergy?: number | null;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  preSelectedDate,
  defaultEnergy,
}: CreateTaskDialogProps) {
  const createTask = useCreateTask();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState({ important: false, urgent: false });
  const [energyLevel, setEnergyLevel] = useState(defaultEnergy ?? 3);
  const [range, setRange] = useState<DayRange>({ start: preSelectedDate, end: preSelectedDate });
  const [detailsOpen, setDetailsOpen] = useState(false);

  const quadrantMeta = EISENHOWER_META[getEisenhowerQuadrant(priority)];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Введите название задачи");
      return;
    }

    try {
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        ...priority,
        energyLevel,
        dueDateStart: toTaskDayInput(range.start),
        dueDateEnd: toTaskDayInput(range.end ?? range.start),
      });
      toast.success("Задача создана", {
        description: range.start ? describeDayRange(range) : "Во «Входящих»",
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(describeTaskError(err, "Не удалось создать задачу"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent sheet className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <form onSubmit={handleSubmit} className="flex max-h-[86dvh] min-h-0 flex-col">
          <div className="px-5 pt-5 pr-14 sm:px-6 sm:pt-6">
            <DialogTitle className="text-xs font-semibold uppercase tracking-wider text-brand">Новая задача</DialogTitle>
            <DialogDescription className="sr-only">
              Введите название и нажмите Enter. Дата, энергия и приоритет необязательны.
            </DialogDescription>
          </div>

          <div className="min-h-0 space-y-5 overflow-y-auto px-5 pt-5 pb-6 sm:px-6">
            <Label htmlFor="task-title" className="sr-only">Название</Label>
            <input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Что нужно сделать?"
              maxLength={200}
              autoFocus
              autoComplete="off"
              enterKeyHint="done"
              className="min-h-12 w-full rounded-lg bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            />
            <Label htmlFor="task-description" className="sr-only">Заметка</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Заметка, ссылка или критерий готовности"
              maxLength={2000}
              rows={2}
              className="min-h-0 resize-none border-0 bg-transparent px-0 py-0 text-sm shadow-none focus-visible:ring-0 dark:bg-transparent"
            />

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <SchedulePicker value={range} onChange={setRange} />
              <button
                type="button"
                onClick={() => setDetailsOpen((value) => !value)}
                aria-expanded={detailsOpen}
                aria-controls="create-task-details"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:min-h-9"
              >
                <span className={cn("size-1.5 rounded-full", quadrantMeta.dot)} aria-hidden="true" />
                {energyHint(energyLevel)}
                <ChevronDown className={cn("size-3.5 transition-transform", detailsOpen && "rotate-180")} aria-hidden="true" />
              </button>
            </div>

            {detailsOpen && (
              <div id="create-task-details" className="grid gap-4 rounded-xl border bg-muted/30 p-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Энергия</p>
                  <EnergyPicker value={energyLevel} onChange={setEnergyLevel} />
                </div>
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Приоритет</p>
                  <PriorityPicker {...priority} onChange={setPriority} />
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-muted/40 px-5 py-3 sm:px-6">
            <p className="hidden text-xs text-muted-foreground sm:block">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-sans text-[11px]">Enter</kbd> — создать
            </p>
            <div className="flex flex-1 justify-end gap-2">
              <Button type="button" variant="ghost" className="min-h-11 sm:min-h-9" onClick={() => onOpenChange(false)}>
                Отмена
              </Button>
              <Button type="submit" className="min-h-11 min-w-28 sm:min-h-9" disabled={createTask.isPending || !title.trim()}>
                {createTask.isPending && <Loader2 className="animate-spin" aria-hidden="true" />}
                Создать
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
