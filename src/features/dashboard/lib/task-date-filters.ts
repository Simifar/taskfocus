import { addDays, endOfDay, isWithinInterval, startOfDay, startOfWeek } from "date-fns";

import type { Task } from "@/shared/types";

export function getCurrentWeekRange() {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfDay(addDays(start, 6));

  return { start, end };
}

function getTaskDateRange(task: Task) {
  const start = task.dueDateStart ? startOfDay(new Date(task.dueDateStart)) : null;
  const end = task.dueDateEnd ? endOfDay(new Date(task.dueDateEnd)) : start;

  if (!start && !end) return null;

  return {
    start: start ?? startOfDay(end!),
    end: end ?? endOfDay(start!),
  };
}

export function isTaskScheduledForDay(task: Task, day: Date) {
  const range = getTaskDateRange(task);
  if (!range) return false;

  return isWithinInterval(day, {
    start: range.start,
    end: range.end,
  });
}

export function isTaskScheduledForCurrentWeek(task: Task) {
  const taskRange = getTaskDateRange(task);
  if (!taskRange) return false;

  const weekRange = getCurrentWeekRange();

  return taskRange.start <= weekRange.end && taskRange.end >= weekRange.start;
}
