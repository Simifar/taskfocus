"use client";

import { useState } from "react";
import { addDays, format, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Battery,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Calendar as CalendarIcon,
  ChevronDown,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useCreateTask } from "@/features/tasks/hooks";
import { EISENHOWER_META, getEisenhowerQuadrant } from "@/features/tasks/lib/eisenhower";
import { describeTaskError } from "@/features/tasks/errors";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Textarea } from "@/shared/ui/textarea";

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
  const [important, setImportant] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(defaultEnergy ?? 3);
  const [dueDateStart, setDueDateStart] = useState<Date | undefined>(preSelectedDate);
  const [dueDateEnd, setDueDateEnd] = useState<Date | undefined>(preSelectedDate);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const quadrant = getEisenhowerQuadrant({ important, urgent });
  const quadrantMeta = EISENHOWER_META[quadrant];
  const hasNoDate = !dueDateStart && !dueDateEnd;

  const getEnergyIcon = (level: number) => {
    if (level <= 1) return <BatteryLow className="h-4 w-4" aria-hidden="true" />;
    if (level <= 2) return <BatteryMedium className="h-4 w-4" aria-hidden="true" />;
    if (level <= 3) return <Battery className="h-4 w-4" aria-hidden="true" />;
    return <BatteryFull className="h-4 w-4" aria-hidden="true" />;
  };

  const getEnergyColor = (level: number) => {
    if (level <= 2) {
      return "bg-green-100 text-green-900 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-200 dark:hover:bg-green-800/50";
    }
    if (level === 3) {
      return "bg-yellow-100 text-yellow-900 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 dark:hover:bg-yellow-800/50";
    }
    return "bg-red-100 text-red-900 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-800/50";
  };

  const setDateRange = (start?: Date, end = start) => {
    setDueDateStart(start);
    setDueDateEnd(end);
  };

  const isSingleDaySelected = (date: Date) =>
    Boolean(
      dueDateStart &&
        isSameDay(dueDateStart, date) &&
        (!dueDateEnd || isSameDay(dueDateEnd, date)),
    );

  const getDateSummary = () => {
    if (!dueDateStart) return "Без даты · попадёт во «Входящие»";

    const start = isSameDay(dueDateStart, new Date())
      ? "Сегодня"
      : format(dueDateStart, "d MMMM", { locale: ru });
    if (!dueDateEnd || isSameDay(dueDateStart, dueDateEnd)) return start;

    return `${start} — ${format(dueDateEnd, "d MMMM", { locale: ru })}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Введите название задачи");
      return;
    }

    if (!dueDateStart && dueDateEnd) {
      toast.error("Сначала выберите дату начала");
      return;
    }

    if (dueDateStart && dueDateEnd && dueDateStart > dueDateEnd) {
      toast.error("Дата окончания не может быть раньше даты начала");
      return;
    }

    try {
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        important,
        urgent,
        energyLevel,
        dueDateStart: dueDateStart ? dueDateStart.toISOString() : null,
        dueDateEnd: dueDateEnd ? dueDateEnd.toISOString() : null,
      });
      toast.success("Задача создана");
      onOpenChange(false);
    } catch (err) {
      toast.error(describeTaskError(err, "Ошибка соединения"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-[640px] flex-col overflow-hidden rounded-2xl p-0 sm:max-w-[640px]">
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
          <DialogHeader className="shrink-0 border-b border-border/70 px-5 pb-4 pt-6 pr-12 text-left sm:px-7 sm:pb-5 sm:pt-7">
            <DialogTitle className="text-xl tracking-tight sm:text-2xl">Новая задача</DialogTitle>
            <DialogDescription className="max-w-[48ch] leading-relaxed">
              Сначала зафиксируйте главное. Дату и остальные детали можно добавить позже.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 sm:space-y-6 sm:px-7 sm:py-6">
            <div className="space-y-2.5">
              <Label htmlFor="task-title" className="text-sm font-semibold">
                Что нужно сделать? <span className="text-destructive">*</span>
              </Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Например, подготовить план встречи"
                maxLength={200}
                autoFocus
                className="h-12 border-border/80 text-base shadow-none placeholder:text-muted-foreground/65 focus-visible:ring-2"
              />
              <div className="flex min-h-5 items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>Короткого названия достаточно, чтобы сохранить задачу.</span>
                {title.length > 160 && <span className="shrink-0">{title.length}/200</span>}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl border border-border/70 bg-muted/25 px-3.5 py-3 sm:px-4">
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                <span className="truncate font-medium">{getDateSummary()}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 shrink-0 gap-1.5 px-2 text-brand hover:text-brand"
                aria-expanded={detailsOpen}
                aria-controls="create-task-details"
                onClick={() => setDetailsOpen(true)}
              >
                {dueDateStart ? "Изменить" : "Запланировать"}
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", detailsOpen && "rotate-180")} />
              </Button>
            </div>

            <section className="overflow-hidden rounded-xl border border-border/80">
              <button
                type="button"
                className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                aria-expanded={detailsOpen}
                aria-controls="create-task-details"
                onClick={() => setDetailsOpen((value) => !value)}
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">Детали и планирование</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Описание, энергия и важность
                  </span>
                </span>
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", detailsOpen && "rotate-180")}
                  aria-hidden="true"
                />
              </button>

              {detailsOpen && (
                <div id="create-task-details" className="space-y-5 border-t border-border/70 bg-muted/15 p-4 sm:p-5">
                  <div className="space-y-2">
                    <Label htmlFor="task-description">Описание</Label>
                    <Textarea
                      id="task-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Контекст, ссылка или критерий готовности"
                      maxLength={2000}
                      rows={3}
                      className="resize-y"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
                    <div className="space-y-2.5">
                      <div>
                        <Label>Энергия</Label>
                        <p className="mt-1 text-xs text-muted-foreground">Сколько сил потребует задача</p>
                      </div>
                      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setEnergyLevel(level)}
                            aria-label={`Энергия ${level} из 5`}
                            aria-pressed={energyLevel === level}
                            className={cn(
                              "flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                              energyLevel === level
                                ? "bg-brand text-brand-foreground shadow-sm ring-2 ring-brand/30"
                                : getEnergyColor(level),
                            )}
                          >
                            {getEnergyIcon(level)}
                            <span>{level}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {energyLevel <= 2 && "Лёгкое действие или рутина"}
                        {energyLevel === 3 && "Средняя задача без тяжёлой подготовки"}
                        {energyLevel >= 4 && "Нужны концентрация и силы"}
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      <div>
                        <Label>Приоритет</Label>
                        <p className="mt-1 text-xs text-muted-foreground">Для матрицы Эйзенхауэра</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setImportant((value) => !value)}
                          aria-pressed={important}
                          className={cn(
                            "min-h-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                            important
                              ? "border-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-950/30 dark:text-sky-100"
                              : "border-border text-muted-foreground hover:bg-muted",
                          )}
                        >
                          Важно
                        </button>
                        <button
                          type="button"
                          onClick={() => setUrgent((value) => !value)}
                          aria-pressed={urgent}
                          className={cn(
                            "min-h-11 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                            urgent
                              ? "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/30 dark:text-rose-100"
                              : "border-border text-muted-foreground hover:bg-muted",
                          )}
                        >
                          Срочно
                        </button>
                      </div>
                      <div className={cn("min-h-[4.25rem] rounded-lg border px-3 py-2.5 text-sm", quadrantMeta.panel)}>
                        <div className="font-semibold">{quadrantMeta.action}</div>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                          {quadrantMeta.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-border/70 pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <Label>Когда</Label>
                        <p className="mt-1 text-xs text-muted-foreground">Можно запланировать на день или период</p>
                      </div>
                      {!hasNoDate && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 gap-1 px-2 text-muted-foreground"
                          onClick={() => setDateRange(undefined)}
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                          Очистить
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn("min-h-10", hasNoDate && "border-brand bg-brand/10 text-brand hover:bg-brand/15")}
                        onClick={() => setDateRange(undefined)}
                      >
                        Без даты
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn("min-h-10", isSingleDaySelected(new Date()) && "border-brand bg-brand/10 text-brand hover:bg-brand/15")}
                        onClick={() => setDateRange(new Date())}
                      >
                        Сегодня
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn("min-h-10", isSingleDaySelected(addDays(new Date(), 1)) && "border-brand bg-brand/10 text-brand hover:bg-brand/15")}
                        onClick={() => setDateRange(addDays(new Date(), 1))}
                      >
                        Завтра
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn(
                          "min-h-10",
                          dueDateStart &&
                            dueDateEnd &&
                            isSameDay(dueDateStart, new Date()) &&
                            isSameDay(dueDateEnd, addDays(new Date(), 7)) &&
                            "border-brand bg-brand/10 text-brand hover:bg-brand/15",
                        )}
                        onClick={() => setDateRange(new Date(), addDays(new Date(), 7))}
                      >
                        Неделя
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="task-date-start" className="text-sm text-muted-foreground">
                          Начало
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="task-date-start"
                              type="button"
                              variant="outline"
                              className={cn("min-h-11 w-full justify-start text-left font-normal", !dueDateStart && "text-muted-foreground")}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
                              {dueDateStart ? format(dueDateStart, "d MMMM yyyy", { locale: ru }) : "Выбрать дату"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dueDateStart}
                              onSelect={(date) => {
                                setDueDateStart(date);
                                if (!date || (dueDateEnd && date > dueDateEnd)) {
                                  setDueDateEnd(date);
                                }
                              }}
                              locale={ru}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="task-date-end" className="text-sm text-muted-foreground">
                          Окончание
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="task-date-end"
                              type="button"
                              variant="outline"
                              disabled={!dueDateStart}
                              className={cn("min-h-11 w-full justify-start text-left font-normal", !dueDateEnd && "text-muted-foreground")}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
                              {dueDateEnd ? format(dueDateEnd, "d MMMM yyyy", { locale: ru }) : "Выбрать дату"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dueDateEnd}
                              onSelect={(date) => setDueDateEnd(date)}
                              locale={ru}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          <DialogFooter className="grid shrink-0 grid-cols-2 gap-2 border-t border-border/70 bg-background/95 px-5 pt-4 [padding-bottom:calc(1.25rem_+_env(safe-area-inset-bottom))] sm:flex sm:gap-3 sm:px-7 sm:pb-5">
            <Button type="button" variant="outline" className="min-h-11 sm:min-h-10" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" className="min-h-11 sm:min-h-10" disabled={createTask.isPending}>
              {createTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              Создать задачу
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
