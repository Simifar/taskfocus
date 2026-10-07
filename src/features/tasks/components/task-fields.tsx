"use client";

import { useState } from "react";
import { addDays, endOfWeek, format, isSameDay, startOfDay } from "date-fns";
import { ru } from "date-fns/locale";
import { CalendarDays, ChevronDown } from "lucide-react";

import { EISENHOWER_META, getEisenhowerQuadrant } from "@/features/tasks/lib/eisenhower";
import { cn } from "@/shared/lib/utils";
import { Calendar } from "@/shared/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

export interface DayRange {
  start?: Date;
  end?: Date;
}

export function describeDayRange({ start, end }: DayRange, now = new Date()) {
  if (!start) return "Без даты";
  const label = (day: Date) => {
    if (isSameDay(day, now)) return "Сегодня";
    if (isSameDay(day, addDays(now, 1))) return "Завтра";
    return format(day, "d MMMM", { locale: ru });
  };
  if (!end || isSameDay(start, end)) return label(start);
  return `${label(start)} — ${label(end)}`;
}

const chipClass =
  "inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-9";

interface SchedulePickerProps {
  value: DayRange;
  onChange: (value: DayRange) => void;
  className?: string;
}

/** Date chip with quick presets; picking a day or preset closes it immediately. */
export function SchedulePicker({ value, onChange, className }: SchedulePickerProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"day" | "range">(
    value.start && value.end && !isSameDay(value.start, value.end) ? "range" : "day",
  );
  const today = startOfDay(new Date());
  const hasDate = Boolean(value.start);

  const pick = (start?: Date, end = start) => {
    onChange({ start, end });
    setOpen(false);
  };

  const isDay = (day: Date) =>
    Boolean(value.start && isSameDay(value.start, day) && (!value.end || isSameDay(value.end, day)));

  const presets: { label: string; active: boolean; apply: () => void }[] = [
    { label: "Сегодня", active: isDay(today), apply: () => pick(today) },
    { label: "Завтра", active: isDay(addDays(today, 1)), apply: () => pick(addDays(today, 1)) },
    {
      label: "Эта неделя",
      active: false,
      apply: () => {
        setMode("range");
        pick(today, endOfWeek(today, { weekStartsOn: 1 }));
      },
    },
    { label: "Без даты", active: !hasDate, apply: () => pick(undefined) },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            chipClass,
            hasDate
              ? "border-brand/30 bg-brand-soft text-foreground"
              : "border-dashed border-border text-muted-foreground hover:bg-muted hover:text-foreground",
            className,
          )}
          aria-label={`Дата: ${describeDayRange(value)}. Изменить`}
        >
          <CalendarDays className="size-4 text-brand" aria-hidden="true" />
          <span className="truncate">{describeDayRange(value)}</span>
          <ChevronDown className="size-3.5 opacity-60" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-[min(32rem,var(--radix-popover-content-available-height))] w-[min(21rem,calc(100vw-2rem))] overflow-y-auto p-3"
      >
        <div className="grid grid-cols-2 gap-1.5">
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={preset.apply}
              aria-pressed={preset.active}
              className={cn(
                "min-h-10 rounded-lg border px-2 text-sm font-medium transition-colors",
                preset.active
                  ? "border-brand bg-brand-soft text-foreground"
                  : "border-border hover:bg-muted",
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 rounded-lg bg-muted p-1" role="group" aria-label="Тип планирования">
          {(["day", "range"] as const).map((item) => (
            <button
              key={item}
              type="button"
              className={cn(
                "min-h-9 rounded-md px-3 text-sm font-medium transition-colors",
                mode === item ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={mode === item}
              onClick={() => setMode(item)}
            >
              {item === "day" ? "Один день" : "Период"}
            </button>
          ))}
        </div>

        {mode === "day" ? (
          <Calendar
            mode="single"
            selected={value.start}
            defaultMonth={value.start ?? today}
            onSelect={(day) => day && pick(day)}
            locale={ru}
          />
        ) : (
          <>
            <Calendar
              mode="range"
              selected={value.start ? { from: value.start, to: value.end } : undefined}
              defaultMonth={value.start ?? today}
              onDayClick={(day) => {
                if (!value.start || (value.end && !isSameDay(value.start, value.end))) {
                  onChange({ start: day, end: day });
                  return;
                }
                const [start, end] = day < value.start ? [day, value.start] : [value.start, day];
                pick(start, end);
              }}
              locale={ru}
            />
            <p className="border-t pt-2 text-xs text-muted-foreground">
              Выберите первый и последний день периода.
            </p>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

const ENERGY_HINTS: Record<number, string> = {
  1: "Почти без усилий",
  2: "Лёгкая рутина",
  3: "Обычная задача",
  4: "Нужна концентрация",
  5: "Глубокая работа",
};

export function energyHint(level: number) {
  return ENERGY_HINTS[level] ?? ENERGY_HINTS[3];
}

interface EnergyPickerProps {
  value: number;
  onChange: (value: number) => void;
  id?: string;
}

export function EnergyPicker({ value, onChange, id }: EnergyPickerProps) {
  return (
    <div>
      <div id={id} role="radiogroup" aria-label="Энергия" className="grid grid-cols-5 gap-1 rounded-lg bg-muted p-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={value === level}
            aria-label={`Энергия ${level} из 5: ${energyHint(level)}`}
            onClick={() => onChange(level)}
            className={cn(
              "flex min-h-10 items-end justify-center gap-0.5 rounded-md pb-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              value === level ? "bg-background shadow-sm" : "hover:bg-background/60",
            )}
          >
            {[1, 2, 3, 4, 5].map((bar) => (
              <span
                key={bar}
                aria-hidden="true"
                className={cn(
                  "w-1 rounded-full",
                  bar <= level
                    ? value === level ? "bg-brand" : "bg-muted-foreground/50"
                    : "bg-muted-foreground/15",
                )}
                style={{ height: `${4 + bar * 2.5}px` }}
              />
            ))}
          </button>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">
        {value} из 5 · {energyHint(value)}
      </p>
    </div>
  );
}

interface PriorityPickerProps {
  important: boolean;
  urgent: boolean;
  onChange: (value: { important: boolean; urgent: boolean }) => void;
}

export function PriorityPicker({ important, urgent, onChange }: PriorityPickerProps) {
  const meta = EISENHOWER_META[getEisenhowerQuadrant({ important, urgent })];
  const toggle = (label: string, active: boolean, next: () => void) => (
    <button
      type="button"
      aria-pressed={active}
      onClick={next}
      className={cn(
        chipClass,
        "flex-1 justify-center",
        active ? "border-foreground/20 bg-foreground text-background" : "border-border text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="flex gap-2">
        {toggle("Важно", important, () => onChange({ important: !important, urgent }))}
        {toggle("Срочно", urgent, () => onChange({ important, urgent: !urgent }))}
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden="true" />
        {meta.action}
      </p>
    </div>
  );
}
