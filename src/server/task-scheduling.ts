import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import type { TaskStatus } from "@/shared/types";

export const MAX_ACTIVE_TASKS_PER_DAY = 5;

export const MIN_ENERGY_LEVEL = 1;
export const MAX_ENERGY_LEVEL = 5;
export const DEFAULT_ENERGY_LEVEL = 3;
export const DEFAULT_SUBTASK_ENERGY_LEVEL = 2;

type TaskScheduleInput = {
  dueDateStart: Date | null;
  dueDateEnd: Date | null;
  status: TaskStatus;
  parentTaskId: string | null;
};

function getTodayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function isScheduledForToday(input: TaskScheduleInput): boolean {
  if (input.status !== "active") return false;
  if (input.parentTaskId) return false;
  if (!input.dueDateStart) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(input.dueDateStart);
  start.setHours(0, 0, 0, 0);

  const end = input.dueDateEnd ? new Date(input.dueDateEnd) : null;
  if (end) end.setHours(0, 0, 0, 0);

  if (end) return start <= today && today <= end;
  return start.getTime() === today.getTime();
}

type TaskReader = Pick<typeof db, "task">;

export async function countActiveTasksForToday(
  userId: string,
  excludeTaskId?: string,
  client: TaskReader = db,
) {
  const { start, end } = getTodayBounds();

  const where: Prisma.TaskWhereInput = {
    userId,
    status: "active",
    parentTaskId: null,
    dueDateStart: { not: null },
    OR: [
      {
        dueDateStart: { lte: end },
        dueDateEnd: { gte: start },
      },
      {
        dueDateStart: { gte: start, lte: end },
        dueDateEnd: null,
      },
    ],
  };

  if (excludeTaskId) {
    where.id = { not: excludeTaskId };
  }

  return client.task.count({ where });
}
