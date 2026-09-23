import type { Prisma } from "@prisma/client";

import {
  dateOnlyToDate,
  endOfWeekDateOnly,
  getTodayDateOnly,
  startOfWeekDateOnly,
  toDateOnly,
  type DateOnly,
  DEFAULT_TIME_ZONE,
} from "@/shared/lib/dates/date-only";
import {
  canAddToToday,
  classifyInboxTask,
  countScheduledActiveTasks,
  isScheduledForDate,
  normalisePlannedRange,
  normalizePlannedRange,
  TaskDatePolicyError,
  type PlannedRange,
  type PlannedTaskLike,
} from "@/shared/lib/dates/task-date-policy";

export {
  canAddToToday,
  classifyInboxTask,
  countScheduledActiveTasks,
  isScheduledForDate,
  normalisePlannedRange,
  normalizePlannedRange,
  TaskDatePolicyError,
};
export type { DateOnly, PlannedRange, PlannedTaskLike };

export const SERVER_TIME_ZONE = DEFAULT_TIME_ZONE;

export function getRequestTimeZone(request: Request): string {
  const candidate = request.headers.get("x-time-zone");
  if (!candidate) return SERVER_TIME_ZONE;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format();
    return candidate;
  } catch {
    return SERVER_TIME_ZONE;
  }
}

export function parseTaskDateInput(
  value: Date | string | null | undefined,
  timeZone = SERVER_TIME_ZONE,
): Date | null {
  if (value == null) return null;
  return dateOnlyToDate(toDateOnly(value, timeZone));
}

export function parseDateQuery(
  value: string | null,
  now = new Date(),
  timeZone = SERVER_TIME_ZONE,
): DateOnly {
  if (!value) return getTodayDateOnly(now, timeZone);

  try {
    return toDateOnly(value, timeZone);
  } catch {
    return getTodayDateOnly(now, timeZone);
  }
}

export function getDateBounds(date: DateOnly | string) {
  const start = dateOnlyToDate(date);
  const end = new Date(start);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

export function getTodayBounds(now = new Date(), timeZone = SERVER_TIME_ZONE) {
  return getDateBounds(getTodayDateOnly(now, timeZone));
}

export function getCurrentWeekDateRange(
  now = new Date(),
  timeZone = SERVER_TIME_ZONE,
) {
  const today = getTodayDateOnly(now, timeZone);
  return {
    start: startOfWeekDateOnly(today),
    end: endOfWeekDateOnly(today),
  };
}

export function scheduledBetweenWhere(
  start: DateOnly | string,
  end: DateOnly | string,
): Prisma.TaskWhereInput {
  const bounds = {
    start: getDateBounds(start).start,
    end: getDateBounds(end).end,
  };

  return {
    AND: [
      { dueDateStart: { not: null, lte: bounds.end } },
      {
        OR: [
          { dueDateEnd: { gte: bounds.start } },
          {
            dueDateEnd: null,
            dueDateStart: { gte: bounds.start, lte: bounds.end },
          },
        ],
      },
    ],
  };
}
