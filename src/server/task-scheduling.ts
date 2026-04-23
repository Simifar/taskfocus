import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import type { TaskStatus } from "@/shared/types";

export const MAX_ACTIVE_TASKS_PER_DAY = 5;

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

export async function countActiveTasksForToday(userId: string, excludeTaskId?: string) {
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

  return db.task.count({ where });
}
