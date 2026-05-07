"use client";

import { useState } from "react";
import { addDays, format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Battery,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  Calendar as CalendarIcon,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { useCreateTask } from "@/features/tasks/hooks";
import { EISENHOWER_META, getEisenhowerQuadrant } from "@/features/tasks/lib/eisenhower";
import { ApiError } from "@/shared/lib/fetcher";
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
  const [important, setImportant] = useState(true);
  const [urgent, setUrgent] = useState(false);
  const [energyLevel, setEnergyLevel] = useState(defaultEnergy ?? 3);
  const [dueDateStart, setDueDateStart] = useState<Date | undefined>(preSelectedDate);
  const [dueDateEnd, setDueDateEnd] = useState<Date | undefined>(preSelectedDate);

  const quadrant = getEisenhowerQuadrant({ important, urgent });
  const quadrantMeta = EISENHOWER_META[quadrant];

  const getEnergyIcon = (level: number) => {
    if (level <= 1) return <BatteryLow className="h-4 w-4" />;
    if (level <= 2) return <BatteryMedium className="h-4 w-4" />;
    if (level <= 3) return <Battery className="h-4 w-4" />;
    return <BatteryFull className="h-4 w-4" />;
  };

  const getEnergyColor = (level: number) => {
    if (level <= 2) {
      return "bg-green-100 hover:bg-green-200 text-green-900 dark:bg-green-900/40 dark:hover:bg-green-800/50 dark:text-green-200";
    }
    if (level === 3) {
      return "bg-yellow-100 hover:bg-yellow-200 text-yellow-900 dark:bg-yellow-900/40 dark:hover:bg-yellow-800/50 dark:text-yellow-200";
    }
    return "bg-red-100 hover:bg-red-200 text-red-900 dark:bg-red-900/40 dark:hover:bg-red-800/50 dark:text-red-200";
  };

  const setDateRange = (start?: Date, end = start) => {
    setDueDateStart(start);
    setDueDateEnd(end);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Введите название задачи");
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
      const message = err instanceof ApiError ? err.message : "Ошибка соединения";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Новая задача</DialogTitle>
            <DialogDescription>
              Зафиксируйте мысль быстро. Детали можно добавить сразу или уточнить позже.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Название <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Что нужно сделать?"
                maxLength={200}
                autoFocus
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Контекст, ссылка, критерий готовности..."
                maxLength={2000}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Энергия</Label>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setEnergyLevel(level)}
                    className={cn(
                      "flex min-h-10 items-center justify-center gap-1 rounded-md px-2 text-sm font-medium transition-colors",
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
              <p className="text-xs text-muted-foreground">
                {energyLevel <= 2 && "Лёгкое действие или рутина"}
                {energyLevel === 3 && "Средняя задача без тяжёлой подготовки"}
                {energyLevel >= 4 && "Задача, которой нужна концентрация"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Матрица Эйзенхауэра</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setImportant((value) => !value)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    important
                      ? "border-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-950/30 dark:text-sky-100"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  Важно
                </button>
                <button
                  type="button"
                  onClick={() => setUrgent((value) => !value)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                    urgent
                      ? "border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/30 dark:text-rose-100"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  Срочно
                </button>
              </div>
              <div className={cn("rounded-md border px-3 py-2 text-sm", quadrantMeta.panel)}>
                <div className="font-semibold">{quadrantMeta.action}</div>
                <p className="text-xs text-muted-foreground">{quadrantMeta.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-base font-semibold">Когда</Label>
                {(dueDateStart || dueDateEnd) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-muted-foreground"
                    onClick={() => setDateRange(undefined)}
                  >
                    <X className="h-3.5 w-3.5" />
                    Без даты
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Button
                  type="button"
                  variant={!dueDateStart && !dueDateEnd ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDateRange(undefined)}
                >
                  Без даты
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setDateRange(new Date())}>
                  Сегодня
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDateRange(addDays(new Date(), 1))}
                >
                  Завтра
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDateRange(new Date(), addDays(new Date(), 7))}
                >
                  Неделя
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="dateStart" className="text-sm text-muted-foreground">
                    От
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDateStart && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDateStart ? format(dueDateStart, "dd MMM", { locale: ru }) : "Выбрать"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDateStart}
                        onSelect={(date) => setDueDateStart(date)}
                        locale={ru}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateEnd" className="text-sm text-muted-foreground">
                    До
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDateEnd && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDateEnd ? format(dueDateEnd, "dd MMM", { locale: ru }) : "Выбрать"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Создать
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
