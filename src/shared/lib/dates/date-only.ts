export type DateOnly = string & { readonly __dateOnly: unique symbol };

export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const DEFAULT_TIME_ZONE = "UTC";

function createDateOnly(year: number, month: number, day: number): DateOnly {
  const value = new Date(Date.UTC(year, month - 1, day));
  if (
    value.getUTCFullYear() !== year ||
    value.getUTCMonth() !== month - 1 ||
    value.getUTCDate() !== day
  ) {
    throw new Error("Некорректная календарная дата");
  }

  return `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day
    .toString()
    .padStart(2, "0")}` as DateOnly;
}

export function isDateOnly(value: unknown): value is DateOnly {
  if (typeof value !== "string" || !DATE_ONLY_PATTERN.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  try {
    return createDateOnly(year, month, day) === value;
  } catch {
    return false;
  }
}

export function isValidDateInput(value: string): boolean {
  if (DATE_ONLY_PATTERN.test(value)) return isDateOnly(value);
  return !Number.isNaN(new Date(value).getTime());
}

export function toDateOnly(
  value: Date | string,
  timeZone = DEFAULT_TIME_ZONE,
): DateOnly {
  if (
    value instanceof Date &&
    value.getUTCHours() === 0 &&
    value.getUTCMinutes() === 0 &&
    value.getUTCSeconds() === 0 &&
    value.getUTCMilliseconds() === 0
  ) {
    return createDateOnly(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  }

  if (typeof value === "string") {
    const canonicalUtc = value.match(/^(\d{4}-\d{2}-\d{2})T00:00:00(?:\.000)?Z$/);
    if (canonicalUtc) {
      if (isDateOnly(canonicalUtc[1])) return canonicalUtc[1];
      throw new Error("Некорректная календарная дата");
    }
  }

  if (typeof value === "string" && DATE_ONLY_PATTERN.test(value)) {
    if (isDateOnly(value)) return value;
    throw new Error("Некорректная календарная дата");
  }
  if (isDateOnly(value)) return value;

  const instant = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(instant.getTime())) throw new Error("Некорректная дата");

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return createDateOnly(year, month, day);
}

export function dateOnlyToDate(value: DateOnly | string): Date {
  if (!isDateOnly(value)) throw new Error("Некорректная date-only дата");
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function dateOnlyToLocalDate(value: DateOnly | string): Date {
  if (!isDateOnly(value)) throw new Error("Некорректная date-only дата");
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDateOnly(value: DateOnly | string, days: number): DateOnly {
  const result = dateOnlyToDate(value);
  result.setUTCDate(result.getUTCDate() + days);
  return toDateOnly(result);
}

export function compareDateOnly(left: DateOnly | string, right: DateOnly | string): number {
  return dateOnlyToDate(left).getTime() - dateOnlyToDate(right).getTime();
}

export function getTodayDateOnly(
  now = new Date(),
  timeZone = DEFAULT_TIME_ZONE,
): DateOnly {
  return toDateOnly(now, timeZone);
}

export function startOfWeekDateOnly(value: DateOnly | string, weekStartsOn = 1): DateOnly {
  const day = dateOnlyToDate(value).getUTCDay();
  const offset = (day - weekStartsOn + 7) % 7;
  return addDateOnly(value, -offset);
}

export function endOfWeekDateOnly(value: DateOnly | string, weekStartsOn = 1): DateOnly {
  return addDateOnly(startOfWeekDateOnly(value, weekStartsOn), 6);
}

export function startOfMonthDateOnly(value: DateOnly | string): DateOnly {
  const date = dateOnlyToDate(value);
  return toDateOnly(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1)));
}

export function endOfMonthDateOnly(value: DateOnly | string): DateOnly {
  const date = dateOnlyToDate(value);
  return toDateOnly(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)));
}
