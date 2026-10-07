import { format, isValid } from "date-fns";
import { dateOnlyToLocalDate, toDateOnly } from "@/shared/lib/dates/date-only";
import { ru } from "date-fns/locale";

type TaskRowSchedule = {
  dueDateStart?: string | null;
  dueDateEnd?: string | null;
};

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return isValid(date) ? date : null;
}

export function formatTaskRowSchedule({
  dueDateStart,
  dueDateEnd,
}: TaskRowSchedule): string | null {
  const start = parseDate(dueDateStart);
  const end = parseDate(dueDateEnd);
  const first = start ?? end;

  if (!first) return null;

  const firstLabel = format(first, "d MMM", { locale: ru });
  if (!end || !start || format(start, "yyyy-MM-dd") === format(end, "yyyy-MM-dd")) {
    return firstLabel;
  }

  const endLabel = format(end, "d MMM", { locale: ru });
  if (format(start, "yyyy-MM") === format(end, "yyyy-MM")) {
    return `${format(start, "d")}–${endLabel}`;
  }
  return `${firstLabel}–${endLabel}`;
}

function localTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/** Reads a stored task date as the calendar day the user planned, in local time. */
export function parseTaskDay(value?: string | null, timeZone = localTimeZone()): Date | null {
  if (!value) return null;
  try {
    return dateOnlyToLocalDate(toDateOnly(value, timeZone));
  } catch {
    return null;
  }
}

/** Serialises a picked calendar day without a time component, so no UTC shift can move it. */
export function toTaskDayInput(day: Date | null | undefined): string | null {
  return day ? format(day, "yyyy-MM-dd") : null;
}

export type ScheduleTone = "overdue" | "today" | "soon" | "later";

export interface TaskScheduleLabel {
  label: string;
  tone: ScheduleTone;
  /** True when the task spans several days. */
  range: boolean;
}

/** Human, relative schedule label for task rows: «Сегодня», «Завтра», «Просрочено · 3 окт.». */
export function describeTaskSchedule(
  task: TaskRowSchedule,
  now = new Date(),
  timeZone = localTimeZone(),
): TaskScheduleLabel | null {
  const start = parseTaskDay(task.dueDateStart, timeZone);
  const end = parseTaskDay(task.dueDateEnd, timeZone) ?? start;
  if (!start || !end) return null;

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayDiff = (day: Date) => Math.round((day.getTime() - today.getTime()) / 86_400_000);
  const short = (day: Date) => format(day, "d MMM", { locale: ru });
  const startDiff = dayDiff(start);
  const endDiff = dayDiff(end);
  const isRange = startDiff !== endDiff;

  const range = isRange;
  if (endDiff < 0) return { label: `Просрочено · ${short(end)}`, tone: "overdue", range };
  if (isRange && startDiff <= 0) return { label: `до ${short(end)}`, tone: endDiff === 0 ? "today" : "soon", range };
  if (startDiff === 0) return { label: "Сегодня", tone: "today", range };
  if (startDiff === 1 && !isRange) return { label: "Завтра", tone: "soon", range };

  const label = formatTaskRowSchedule(task) ?? short(start);
  return { label, tone: startDiff <= 6 ? "soon" : "later", range };
}
