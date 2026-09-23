import { isTaskScheduledForDay } from "./task-date-filters";
import { normalisePlannedRange } from "@/shared/lib/dates/task-date-policy";

type TodayTask = {
  id: string;
  status: string;
  parentTaskId?: string | null;
  dueDateStart?: string | null;
  dueDateEnd?: string | null;
  energyLevel: number;
  position: number;
  createdAt: string;
};

function plannedRangeEnd(task: TodayTask) {
  try {
    const range = normalisePlannedRange(task.dueDateStart, task.dueDateEnd);
    return range.end ?? range.start ?? "9999-12-31";
  } catch {
    return "9999-12-31";
  }
}

function compareTodayTasks(a: TodayTask, b: TodayTask, useCapacity: boolean) {
  const endComparison = plannedRangeEnd(a).localeCompare(plannedRangeEnd(b));
  if (endComparison !== 0) return endComparison;

  if (useCapacity && a.energyLevel !== b.energyLevel) {
    return a.energyLevel - b.energyLevel;
  }

  if (a.position !== b.position) return a.position - b.position;

  const createdComparison = a.createdAt.localeCompare(b.createdAt);
  return createdComparison !== 0 ? createdComparison : a.id.localeCompare(b.id);
}

export function getTodayTaskRecommendation<T extends TodayTask>(
  tasks: readonly T[],
  day = new Date(),
  energyLimit: number | null = null,
): T | null {
  return (
    tasks
      .filter(
        (task) =>
          task.status === "active" &&
          !task.parentTaskId &&
          isTaskScheduledForDay(task, day) &&
          (energyLimit === null || task.energyLevel <= energyLimit),
      )
      .sort((a, b) => compareTodayTasks(a, b, energyLimit !== null))[0] ?? null
  );
}
