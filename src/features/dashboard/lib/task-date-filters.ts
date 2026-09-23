import type { Task } from "@/shared/types";
import {
  dateOnlyToLocalDate,
  endOfMonthDateOnly,
  endOfWeekDateOnly,
  getTodayDateOnly,
  startOfMonthDateOnly,
  startOfWeekDateOnly,
  toDateOnly,
  type DateOnly,
} from "@/shared/lib/dates/date-only";
import {
  isScheduledForDate,
  normalisePlannedRange,
} from "@/shared/lib/dates/task-date-policy";

function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function endOfLocalDay(date: Date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function localDateRange(start: DateOnly, end: DateOnly) {
  return {
    start: dateOnlyToLocalDate(start),
    end: endOfLocalDay(dateOnlyToLocalDate(end)),
  };
}

export function getCurrentWeekRange(now = new Date()) {
  const timeZone = getBrowserTimeZone();
  const today = getTodayDateOnly(now, timeZone);
  return localDateRange(startOfWeekDateOnly(today), endOfWeekDateOnly(today));
}

export function getMonthRange(date: Date) {
  const timeZone = getBrowserTimeZone();
  const dateOnly = toDateOnly(date, timeZone);
  return localDateRange(startOfMonthDateOnly(dateOnly), endOfMonthDateOnly(dateOnly));
}

function getTaskDateRange(task: Task, timeZone = getBrowserTimeZone()) {
  try {
    const range = normalisePlannedRange(task.dueDateStart, task.dueDateEnd, timeZone);
    if (!range.start) return null;

    const end = range.end ?? range.start;
    return localDateRange(range.start, end);
  } catch {
    return null;
  }
}

export function isTaskScheduledForDay(
  task: Pick<Task, "dueDateStart" | "dueDateEnd">,
  day: Date,
) {
  const timeZone = getBrowserTimeZone();
  try {
    return isScheduledForDate(task, day, timeZone);
  } catch {
    return false;
  }
}

export function isTaskScheduledForCurrentWeek(task: Task) {
  const taskRange = getTaskDateRange(task);
  if (!taskRange) return false;

  const weekRange = getCurrentWeekRange();
  return taskRange.start <= weekRange.end && taskRange.end >= weekRange.start;
}

export function isTaskScheduledForMonth(task: Task, month: Date) {
  const taskRange = getTaskDateRange(task);
  if (!taskRange) return false;

  const monthRange = getMonthRange(month);
  return taskRange.start <= monthRange.end && taskRange.end >= monthRange.start;
}
