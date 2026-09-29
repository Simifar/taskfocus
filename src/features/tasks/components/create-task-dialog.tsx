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
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"day" | "range">("day");

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
    if (!dueDateStart) return "Без даты";

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
                <span>
                  {hasNoDate
                    ? "Сохранится во «Входящих» без даты."
                    : "Короткого названия достаточно, чтобы сохранить задачу."}
                </span>
                {title.length > 160 && <span className="shrink-0">{title.length}/200</span>}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/25 px-3.5 py-3 sm:px-4">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-brand shadow-sm">
                  <CalendarIcon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-muted-foreground">Планирование</span>
                  <span className="block truncate text-sm font-semibold">{getDateSummary()}</span>
                </span>
              </div>
              <Popover open={scheduleOpen} onOpenChange={setScheduleOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 shrink-0 gap-1.5 px-3"
                    aria-expanded={scheduleOpen}
                  >
                    {hasNoDate ? "Выбрать дату" : "Изменить"}
                    <ChevronDown className={cn("size-3.5 transition-transform", scheduleOpen && "rotate-180")} aria-hidden="true" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="max-h-[min(30rem,var(--radix-popover-content-available-height))] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto p-3"
                >
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold">Когда выполнить</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Выберите один день или период</p>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn("min-h-9 px-2 text-xs", hasNoDate && "border-brand bg-brand/10 text-brand hover:bg-brand/15")}
                        aria-pressed={hasNoDate}
                        onClick={() => {
                          setDateRange(undefined);
                          setScheduleMode("day");
                          setScheduleOpen(false);
                        }}
                      >
                        Без даты
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn("min-h-9 px-2 text-xs", isSingleDaySelected(new Date()) && "border-brand bg-brand/10 text-brand hover:bg-brand/15")}
                        aria-pressed={isSingleDaySelected(new Date())}
                        onClick={() => {
                          setDateRange(new Date());
                          setScheduleMode("day");
                          setScheduleOpen(false);
                        }}
                      >
                        Сегодня
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={cn("min-h-9 px-2 text-xs", isSingleDaySelected(addDays(new Date(), 1)) && "border-brand bg-brand/10 text-brand hover:bg-brand/15")}
                        aria-pressed={isSingleDaySelected(addDays(new Date(), 1))}
                        onClick={() => {
                          setDateRange(addDays(new Date(), 1));
                          setScheduleMode("day");
                          setScheduleOpen(false);
                        }}
                      >
                        Завтра
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 rounded-lg bg-muted p-1" role="group" aria-label="Тип планирования">
                      <button
                        type="button"
                        className={cn(
                          "min-h-9 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                          scheduleMode === "day" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                        )}
                        aria-pressed={scheduleMode === "day"}
                        onClick={() => setScheduleMode("day")}
                      >
                        На день
                      </button>
                      <button
                        type="button"
                        className={cn(
                          "min-h-9 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                          scheduleMode === "range" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                        )}
                        aria-pressed={scheduleMode === "range"}
                        onClick={() => setScheduleMode("range")}
                      >
                        Период
                      </button>
                    </div>

                    {scheduleMode === "day" ? (
                      <Calendar
                        mode="single"
                        selected={dueDateStart}
                        defaultMonth={dueDateStart ?? new Date()}
                        onSelect={(date) => {
                          setDateRange(date);
                          if (date) setScheduleOpen(false);
                        }}
                        locale={ru}
                      />
                    ) : (
                      <Calendar
                        mode="range"
                        min={1}
                        selected={dueDateStart ? { from: dueDateStart, to: dueDateEnd } : undefined}
                        defaultMonth={dueDateStart ?? new Date()}
                        onDayClick={(date) => {
                          if (!dueDateStart || dueDateEnd) {
                            setDueDateStart(date);
                            setDueDateEnd(undefined);
                            return;
                          }

                          const [start, end] = date < dueDateStart
                            ? [date, dueDateStart]
                            : [dueDateStart, date];
                          setDateRange(start, end);
                          setScheduleOpen(false);
                        }}
                        locale={ru}
                      />
                    )}
                    {scheduleMode === "range" && (
                      <p className="border-t border-border/70 pt-2 text-xs leading-relaxed text-muted-foreground">
                        Период включает и выбранный день начала, и день окончания.
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
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
                  <span className="block text-sm font-semibold">Дополнительно</span>
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
