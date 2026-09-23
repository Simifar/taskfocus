import type { Prisma, PrismaClient } from "@prisma/client";

import { db } from "@/server/db";
import {
  countActiveTasksForToday,
  isScheduledForToday,
} from "@/server/task-scheduling";
import {
  endOfMonthDateOnly,
  endOfWeekDateOnly,
  startOfMonthDateOnly,
  startOfWeekDateOnly,
  type DateOnly,
} from "@/shared/lib/dates/date-only";
import {
  normalisePlannedRange,
  parseTaskDateInput,
  scheduledBetweenWhere,
} from "@/server/tasks/date-policy";
import type { TaskStatus } from "@/shared/types";
import {
  TaskDomainError,
  TASK_ERROR_MESSAGES,
} from "@/server/tasks/errors";
import {
  assertReorderOwnership,
  assertUniqueTaskIds,
  assertTodayCapacity,
  DEFAULT_ENERGY_LEVEL,
  DEFAULT_SUBTASK_ENERGY_LEVEL,
  MAX_ACTIVE_TASKS_PER_DAY,
  MAX_ENERGY_LEVEL,
  MIN_ENERGY_LEVEL,
  withTransactionRetry,
} from "@/server/tasks/policy";
import type {
  BatchTaskInput,
  CreateSubtaskInput,
  CreateTaskInput,
  ReorderInput,
  UpdateTaskInput,
} from "@/server/tasks/schemas";
import {
  countTasks,
  createTask as createTaskRecord,
  deleteTask as deleteTaskRecord,
  findMaxPosition,
  findOwnedTask,
  findOwnedTaskSnapshot,
  findOwnedTaskSnapshots,
  findTasks,
  type TaskDb,
  updateTask as updateTaskRecord,
} from "@/server/tasks/repository";

export type TaskServiceContext = {
  userId: string;
  timeZone: string;
  client?: PrismaClient;
  now?: Date;
};

type TasksView = "today" | "inbox" | "week" | "day" | "calendar" | "archive";

export type ListTasksInput = {
  status?: TaskStatus;
  energy?: number;
  search?: string;
  view?: TasksView;
  date: DateOnly;
};

function clientFor(ctx: TaskServiceContext): PrismaClient {
  return ctx.client ?? db;
}

function addAnd(where: Prisma.TaskWhereInput, condition: Prisma.TaskWhereInput) {
  const current = where.AND;
  const items = Array.isArray(current) ? current : current ? [current] : [];
  where.AND = [...items, condition];
}

function applyViewFilter(where: Prisma.TaskWhereInput, view: TasksView | undefined, date: DateOnly) {
  if (!view) return;

  if (view === "archive") {
    where.status = "archived";
    return;
  }

  if (view === "inbox") {
    where.status = "active";
    addAnd(where, { dueDateStart: null, dueDateEnd: null });
    return;
  }

  where.status = { in: ["active", "completed"] };

  if (view === "today" || view === "day") {
    addAnd(where, scheduledBetweenWhere(date, date));
    return;
  }

  if (view === "week") {
    addAnd(where, scheduledBetweenWhere(startOfWeekDateOnly(date), endOfWeekDateOnly(date)));
    return;
  }

  if (view === "calendar") {
    addAnd(where, scheduledBetweenWhere(startOfMonthDateOnly(date), endOfMonthDateOnly(date)));
  }
}

export async function listTasks(ctx: TaskServiceContext, query: ListTasksInput) {
  const client = clientFor(ctx);
  const where: Prisma.TaskWhereInput = {
    userId: ctx.userId,
    parentTaskId: null,
  };

  applyViewFilter(where, query.view, query.date);
  if (query.status) where.status = query.status;
  if (query.energy !== undefined && query.energy >= MIN_ENERGY_LEVEL && query.energy <= MAX_ENERGY_LEVEL) {
    where.energyLevel = query.energy;
  }
  if (query.search) {
    addAnd(where, {
      OR: [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ],
    });
  }

  const [tasks, activeCount, todayActiveCount] = await Promise.all([
    findTasks(client, where),
    countTasks(client, { userId: ctx.userId, status: "active", parentTaskId: null }),
    countActiveTasksForToday(ctx.userId, undefined, client, ctx.timeZone),
  ]);

  return { items: tasks, totalCount: tasks.length, activeCount, todayActiveCount };
}

export async function getTask(ctx: TaskServiceContext, id: string) {
  const task = await findOwnedTask(clientFor(ctx), ctx.userId, id);
  if (!task) throw new TaskDomainError("TASK_NOT_FOUND", TASK_ERROR_MESSAGES.TASK_NOT_FOUND, 404);
  return task;
}

async function assertParentCanReceiveSubtask(client: TaskDb, userId: string, parentId: string) {
  const parent = await findOwnedTaskSnapshot(client, userId, parentId);
  if (!parent) {
    throw new TaskDomainError("PARENT_NOT_FOUND", TASK_ERROR_MESSAGES.PARENT_NOT_FOUND, 404);
  }
  if (parent.parentTaskId) {
    throw new TaskDomainError(
      "SUBTASK_LEVEL_UNSUPPORTED",
      TASK_ERROR_MESSAGES.SUBTASK_LEVEL_UNSUPPORTED,
    );
  }
  if (parent.status === "archived") {
    throw new TaskDomainError("ARCHIVED_PARENT", TASK_ERROR_MESSAGES.ARCHIVED_PARENT);
  }
  return parent;
}

function assertTodayCapacityForTask(
  count: number,
  input: { dueDateStart: Date | null; dueDateEnd: Date | null; status: TaskStatus; parentTaskId: string | null },
  now: Date,
  timeZone: string,
) {
  if (isScheduledForToday(input, now, timeZone)) {
    assertTodayCapacity(count, MAX_ACTIVE_TASKS_PER_DAY);
  }
}

export async function createTask(ctx: TaskServiceContext, input: CreateTaskInput) {
  const client = clientFor(ctx);
  const now = ctx.now ?? new Date();

  return withTransactionRetry(() =>
    client.$transaction(
      async (tx) => {
        if (input.parentTaskId) {
          await assertParentCanReceiveSubtask(tx, ctx.userId, input.parentTaskId);
        }

        const plannedRange = normalisePlannedRange(
          input.dueDateStart,
          input.dueDateEnd,
          ctx.timeZone,
        );
        const dueDateStart = parseTaskDateInput(plannedRange.start, ctx.timeZone);
        const dueDateEnd = parseTaskDateInput(plannedRange.end, ctx.timeZone);

        const todayCount = await countActiveTasksForToday(
          ctx.userId,
          undefined,
          tx,
          ctx.timeZone,
        );
        assertTodayCapacityForTask(
          todayCount,
          {
            dueDateStart,
            dueDateEnd,
            status: "active",
            parentTaskId: input.parentTaskId ?? null,
          },
          now,
          ctx.timeZone,
        );

        const maxPosition = await findMaxPosition(tx, ctx.userId, input.parentTaskId ?? null);
        return createTaskRecord(tx, {
          userId: ctx.userId,
          title: input.title,
          description: input.description?.trim() || null,
          important: input.important ?? false,
          urgent: input.urgent ?? false,
          energyLevel: input.energyLevel ?? DEFAULT_ENERGY_LEVEL,
          dueDateStart,
          dueDateEnd,
          parentTaskId: input.parentTaskId ?? null,
          position: (maxPosition._max.position ?? -1) + 1,
        });
      },
      { isolationLevel: "Serializable" },
    ),
  );
}

export async function updateTask(ctx: TaskServiceContext, id: string, input: UpdateTaskInput) {
  const client = clientFor(ctx);
  const now = ctx.now ?? new Date();

  return withTransactionRetry(() =>
    client.$transaction(
      async (tx) => {
        const existing = await findOwnedTaskSnapshot(tx, ctx.userId, id);
        if (!existing) {
          throw new TaskDomainError("TASK_NOT_FOUND", TASK_ERROR_MESSAGES.TASK_NOT_FOUND, 404);
        }

        const plannedRange = normalisePlannedRange(
          input.dueDateStart !== undefined ? input.dueDateStart : existing.dueDateStart,
          input.dueDateEnd !== undefined ? input.dueDateEnd : existing.dueDateEnd,
          ctx.timeZone,
        );
        const nextDueDateStart = parseTaskDateInput(plannedRange.start, ctx.timeZone);
        const nextDueDateEnd = parseTaskDateInput(plannedRange.end, ctx.timeZone);
        const nextStatus = (input.status ?? existing.status) as TaskStatus;

        const data: Prisma.TaskUpdateInput = {};
        if (input.title !== undefined) data.title = input.title;
        if (input.description !== undefined) data.description = input.description?.trim() || null;
        if (input.important !== undefined) data.important = input.important;
        if (input.urgent !== undefined) data.urgent = input.urgent;
        if (input.energyLevel !== undefined) data.energyLevel = input.energyLevel;
        if (input.status !== undefined) {
          data.status = input.status;
          data.completedAt = input.status === "completed" ? now : null;
        }
        if (input.dueDateStart !== undefined) data.dueDateStart = nextDueDateStart;
        if (input.dueDateEnd !== undefined) data.dueDateEnd = nextDueDateEnd;

        const todayCount = await countActiveTasksForToday(ctx.userId, id, tx, ctx.timeZone);
        assertTodayCapacityForTask(
          todayCount,
          {
            dueDateStart: nextDueDateStart,
            dueDateEnd: nextDueDateEnd,
            status: nextStatus,
            parentTaskId: existing.parentTaskId,
          },
          now,
          ctx.timeZone,
        );

        return updateTaskRecord(tx, id, data);
      },
      { isolationLevel: "Serializable" },
    ),
  );
}

export function toggleTask(ctx: TaskServiceContext, id: string, completed: boolean) {
  return updateTask(ctx, id, { status: completed ? "completed" : "active" });
}

export function archiveTask(ctx: TaskServiceContext, id: string) {
  return updateTask(ctx, id, { status: "archived" });
}

export async function deleteTask(ctx: TaskServiceContext, id: string) {
  const client = clientFor(ctx);
  const existing = await findOwnedTaskSnapshot(client, ctx.userId, id);
  if (!existing) throw new TaskDomainError("TASK_NOT_FOUND", TASK_ERROR_MESSAGES.TASK_NOT_FOUND, 404);
  await deleteTaskRecord(client, id);
}

export async function reorderTasks(ctx: TaskServiceContext, input: ReorderInput) {
  const client = clientFor(ctx);
  assertUniqueTaskIds(input.items.map((item) => item.id));
  return withTransactionRetry(() =>
    client.$transaction(
      async (tx) => {
        const records = await findOwnedTaskSnapshots(
          tx,
          ctx.userId,
          input.items.map((item) => item.id),
        );
        assertReorderOwnership(
          input.items.map((item) => item.id),
          new Set(records.map((record) => record.id)),
        );

        const scopes = new Set(records.map((record) => record.parentTaskId ?? "root"));
        if (scopes.size > 1) {
          throw new TaskDomainError("INVALID_REORDER", "Нельзя менять порядок задач из разных списков");
        }

        await Promise.all(
          input.items.map((item) =>
            tx.task.update({ where: { id: item.id }, data: { position: item.position } }),
          ),
        );
        return { updated: input.items.length };
      },
      { isolationLevel: "Serializable" },
    ),
  );
}

export async function createSubtask(ctx: TaskServiceContext, input: CreateSubtaskInput) {
  const client = clientFor(ctx);
  return withTransactionRetry(() =>
    client.$transaction(
      async (tx) => {
        await assertParentCanReceiveSubtask(tx, ctx.userId, input.parentId);
        const maxPosition = await findMaxPosition(tx, ctx.userId, input.parentId);
        return createTaskRecord(tx, {
          userId: ctx.userId,
          title: input.title,
          energyLevel: input.energyLevel ?? DEFAULT_SUBTASK_ENERGY_LEVEL,
          parentTaskId: input.parentId,
          position: (maxPosition._max.position ?? -1) + 1,
        });
      },
      { isolationLevel: "Serializable" },
    ),
  );
}

export async function batchTasks(ctx: TaskServiceContext, input: BatchTaskInput) {
  const client = clientFor(ctx);
  return withTransactionRetry(() =>
    client.$transaction(
      async (tx) => {
        const records = await findOwnedTaskSnapshots(tx, ctx.userId, input.taskIds);
        assertReorderOwnership(input.taskIds, new Set(records.map((record) => record.id)));

        if (input.action === "delete") {
          await Promise.all(input.taskIds.map((id) => deleteTaskRecord(tx, id)));
          return { updated: input.taskIds.length };
        }

        if (input.action === "archive") {
          await Promise.all(
            input.taskIds.map((id) =>
              tx.task.update({
                where: { id },
                data: { status: "archived", completedAt: null },
              }),
            ),
          );
          return { updated: input.taskIds.length };
        }

        const plannedRange = normalisePlannedRange(
          input.dueDateStart,
          input.dueDateEnd,
          ctx.timeZone,
        );
        const dueDateStart = parseTaskDateInput(plannedRange.start, ctx.timeZone);
        const dueDateEnd = parseTaskDateInput(plannedRange.end, ctx.timeZone);
        const activeRootCount = records.filter(
          (record) => record.status === "active" && record.parentTaskId === null,
        ).length;
        const currentCount = await countActiveTasksForToday(
          ctx.userId,
          input.taskIds,
          tx,
          ctx.timeZone,
        );
        if (isScheduledForToday(
          {
            dueDateStart,
            dueDateEnd,
            status: "active",
            parentTaskId: null,
          },
          ctx.now ?? new Date(),
          ctx.timeZone,
        )) {
          assertTodayCapacity(currentCount + activeRootCount, MAX_ACTIVE_TASKS_PER_DAY);
        }

        await Promise.all(
          input.taskIds.map((id) =>
            tx.task.update({ where: { id }, data: { dueDateStart, dueDateEnd } }),
          ),
        );
        return { updated: input.taskIds.length };
      },
      { isolationLevel: "Serializable" },
    ),
  );
}
