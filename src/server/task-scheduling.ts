import type { Prisma } from "@prisma/client";

import { db } from "@/server/db";
import {
  scheduledBetweenWhere,
  SERVER_TIME_ZONE,
} from "@/server/tasks/date-policy";
import { getTodayDateOnly, type DateOnly } from "@/shared/lib/dates/date-only";
import { isScheduledForDate } from "@/shared/lib/dates/task-date-policy";
import type { TaskStatus } from "@/shared/types";

export const MAX_ACTIVE_TASKS_PER_DAY = 5;

export const MIN_ENERGY_LEVEL = 1;
export const MAX_ENERGY_LEVEL = 5;
export const DEFAULT_ENERGY_LEVEL = 3;
export const DEFAULT_SUBTASK_ENERGY_LEVEL = 2;

type TaskScheduleInput = {
  dueDateStart: Date | string | null;
  dueDateEnd: Date | string | null;
  status: TaskStatus;
  parentTaskId: string | null;
};

export function isScheduledForToday(
  input: TaskScheduleInput,
  now = new Date(),
  timeZone = SERVER_TIME_ZONE,
): boolean {
  if (input.status !== "active") return false;
  if (input.parentTaskId) return false;

  return isScheduledForDate(
    { dueDateStart: input.dueDateStart, dueDateEnd: input.dueDateEnd },
    getTodayDateOnly(now, timeZone),
    timeZone,
  );
}

type TaskReader = Pick<typeof db, "task">;

export async function countActiveTasksForToday(
  userId: string,
  excludeTaskId?: string,
  client: TaskReader = db,
  timeZone = SERVER_TIME_ZONE,
) {
  const today = getTodayDateOnly(new Date(), timeZone);
  const where: Prisma.TaskWhereInput = {
    userId,
    status: "active",
    parentTaskId: null,
    ...scheduledBetweenWhere(today, today),
  };

  if (excludeTaskId) {
    where.id = { not: excludeTaskId };
  }

  return client.task.count({ where });
}

export type { DateOnly };
