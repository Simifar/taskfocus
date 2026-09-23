import type { TaskStatus } from "@/shared/types";
import {
  type DateOnly,
  DEFAULT_TIME_ZONE,
  compareDateOnly,
  getTodayDateOnly,
  toDateOnly,
} from "./date-only";

export interface PlannedRange {
  start: DateOnly | null;
  end: DateOnly | null;
}

export interface PlannedTaskLike {
  dueDateStart?: Date | string | null;
  dueDateEnd?: Date | string | null;
  status?: TaskStatus | string;
  parentTaskId?: string | null;
}

export class TaskDatePolicyError extends Error {
  constructor(
    public readonly code: "END_DATE_WITHOUT_START" | "INVALID_DATE_RANGE",
    message: string,
  ) {
    super(message);
    this.name = "TaskDatePolicyError";
  }
}

export function normalisePlannedRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
  timeZone = DEFAULT_TIME_ZONE,
): PlannedRange {
  let normalisedStart: DateOnly | null = null;
  let normalisedEnd: DateOnly | null = null;

  try {
    normalisedStart = start == null ? null : toDateOnly(start, timeZone);
    normalisedEnd = end == null ? null : toDateOnly(end, timeZone);
  } catch {
    throw new TaskDatePolicyError("INVALID_DATE_RANGE", "Некорректная дата");
  }

  if (!normalisedStart && normalisedEnd) {
    throw new TaskDatePolicyError(
      "END_DATE_WITHOUT_START",
      "Дата окончания требует даты начала",
    );
  }

  if (normalisedStart && normalisedEnd && compareDateOnly(normalisedStart, normalisedEnd) > 0) {
    throw new TaskDatePolicyError(
      "INVALID_DATE_RANGE",
      "Дата окончания не может быть раньше даты начала",
    );
  }

  return { start: normalisedStart, end: normalisedEnd };
}

export const normalizePlannedRange = normalisePlannedRange;

export function isScheduledForDate(
  taskOrRange: PlannedTaskLike | PlannedRange,
  date: Date | string,
  timeZone = DEFAULT_TIME_ZONE,
): boolean {
  const range =
    "start" in taskOrRange
      ? taskOrRange
      : normalisePlannedRange(taskOrRange.dueDateStart, taskOrRange.dueDateEnd, timeZone);
  if (!range.start) return false;

  const day = toDateOnly(date, timeZone);
  if (!range.end) return compareDateOnly(range.start, day) === 0;

  return (
    compareDateOnly(range.start, day) <= 0 &&
    compareDateOnly(day, range.end) <= 0
  );
}

export function classifyInboxTask(
  task: PlannedTaskLike,
  _today: Date | string = getTodayDateOnly(),
  _timeZone = DEFAULT_TIME_ZONE,
): boolean {
  return task.status === "active" && !task.parentTaskId && !task.dueDateStart && !task.dueDateEnd;
}

export function countScheduledActiveTasks(
  tasks: PlannedTaskLike[],
  date: Date | string,
  timeZone = DEFAULT_TIME_ZONE,
): number {
  return tasks.filter(
    (task) =>
      task.status === "active" &&
      !task.parentTaskId &&
      isScheduledForDate(task, date, timeZone),
  ).length;
}

export function canAddToToday(
  scheduledActiveCount: number,
  maxActiveTasksPerDay: number,
): boolean {
  return scheduledActiveCount < maxActiveTasksPerDay;
}
