import { z } from "zod";
import type { Prisma } from "@prisma/client";

import { err, handleUnknownError, ok, withAuth } from "@/server/api";
import { db } from "@/server/db";
import {
  countActiveTasksForToday,
  DEFAULT_ENERGY_LEVEL,
  isScheduledForToday,
  MAX_ACTIVE_TASKS_PER_DAY,
  MAX_ENERGY_LEVEL,
  MIN_ENERGY_LEVEL,
} from "@/server/task-scheduling";
import type { TaskStatus } from "@/shared/types";

type TasksView = "today" | "inbox" | "week" | "day" | "calendar" | "archive";

const VALID_STATUSES: TaskStatus[] = ["active", "completed", "archived"];
const VALID_VIEWS: TasksView[] = ["today", "inbox", "week", "day", "calendar", "archive"];

const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Название обязательно").max(200),
  description: z.string().max(2000).nullish(),
  important: z.boolean().default(false),
  urgent: z.boolean().default(false),
  energyLevel: z.number().int().min(MIN_ENERGY_LEVEL).max(MAX_ENERGY_LEVEL).default(DEFAULT_ENERGY_LEVEL),
  dueDateStart: z.string().datetime().nullish(),
  dueDateEnd: z.string().datetime().nullish(),
  parentTaskId: z.string().nullish(),
});

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function startOfWeek(date: Date) {
  const next = startOfDay(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function endOfWeek(date: Date) {
  const next = startOfWeek(date);
  next.setDate(next.getDate() + 6);
  return endOfDay(next);
}

function startOfMonth(date: Date) {
  return startOfDay(new Date(date.getFullYear(), date.getMonth(), 1));
}

function endOfMonth(date: Date) {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function parseDateParam(value: string | null) {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function addAnd(where: Prisma.TaskWhereInput, condition: Prisma.TaskWhereInput) {
  const current = where.AND;
  const items = Array.isArray(current) ? current : current ? [current] : [];
  where.AND = [...items, condition];
}

function scheduledBetween(start: Date, end: Date): Prisma.TaskWhereInput {
  return {
    AND: [
      {
        OR: [
          { dueDateStart: { lte: end } },
          { dueDateStart: null, dueDateEnd: { lte: end } },
        ],
      },
      {
        OR: [
          { dueDateEnd: { gte: start } },
          { dueDateEnd: null, dueDateStart: { gte: start } },
        ],
      },
    ],
  };
}

function applyViewFilter(where: Prisma.TaskWhereInput, view: TasksView | null, date: Date) {
  if (!view) return;

  if (view === "archive") {
    where.status = "archived";
    return;
  }

  if (view === "inbox") {
    where.status = "active";
    addAnd(where, {
      OR: [
        { dueDateStart: null },
        { dueDateStart: { gt: endOfDay(date) } },
      ],
    });
    return;
  }

  where.status = { in: ["active", "completed"] };

  if (view === "today" || view === "day") {
    addAnd(where, scheduledBetween(startOfDay(date), endOfDay(date)));
    return;
  }

  if (view === "week") {
    addAnd(where, scheduledBetween(startOfWeek(date), endOfWeek(date)));
    return;
  }

  if (view === "calendar") {
    addAnd(where, scheduledBetween(startOfMonth(date), endOfMonth(date)));
  }
}

export const GET = withAuth(async (request, { user }) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const energy = searchParams.get("energy");
  const search = searchParams.get("search");
  const requestedView = searchParams.get("view");
  const view = VALID_VIEWS.includes(requestedView as TasksView)
    ? (requestedView as TasksView)
    : null;
  const date = parseDateParam(searchParams.get("date"));

  const where: Prisma.TaskWhereInput = {
    userId: user.id,
    parentTaskId: null,
  };

  applyViewFilter(where, view, date);

  if (status && VALID_STATUSES.includes(status as TaskStatus)) {
    where.status = status as TaskStatus;
  }

  if (energy) {
    const n = Number.parseInt(energy, 10);
    if (Number.isInteger(n) && n >= MIN_ENERGY_LEVEL && n <= MAX_ENERGY_LEVEL) where.energyLevel = n;
  }

  if (search) {
    addAnd(where, {
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const [tasks, activeCount] = await Promise.all([
    db.task.findMany({
      where,
      include: {
        subtasks: { orderBy: { position: "asc" } },
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    }),
    db.task.count({
      where: { userId: user.id, status: "active", parentTaskId: null },
    }),
  ]);

  return ok({
    items: tasks,
    totalCount: tasks.length,
    activeCount,
  });
});

export const POST = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    const parsed = createTaskSchema.parse(body);
    const dueDateStart = parsed.dueDateStart ? new Date(parsed.dueDateStart) : null;
    const dueDateEnd = parsed.dueDateEnd ? new Date(parsed.dueDateEnd) : null;
    const parentTaskId = parsed.parentTaskId ?? null;

    if (dueDateStart && dueDateEnd && dueDateStart > dueDateEnd) {
      return err("VALIDATION_ERROR", "Дата окончания не может быть раньше даты начала", 400);
    }

    if (parentTaskId) {
      const parent = await db.task.findFirst({
        where: { id: parentTaskId, userId: user.id },
        select: { id: true, parentTaskId: true, status: true },
      });

      if (!parent) return err("PARENT_NOT_FOUND", "Родительская задача не найдена", 404);
      if (parent.parentTaskId) return err("VALIDATION_ERROR", "Подзадачи второго уровня не поддерживаются", 400);
      if (parent.status === "archived") return err("VALIDATION_ERROR", "Нельзя добавить подзадачу в архивную задачу", 400);
    }

    const task = await db.$transaction(
      async (tx) => {
        if (
          isScheduledForToday({
            dueDateStart,
            dueDateEnd,
            status: "active",
            parentTaskId,
          })
        ) {
          const todayActiveCount = await countActiveTasksForToday(user.id, undefined, tx);
          if (todayActiveCount >= MAX_ACTIVE_TASKS_PER_DAY) {
            throw new Error("TODAY_LIMIT_REACHED");
          }
        }

        const maxPosition = await tx.task.aggregate({
          where: { userId: user.id, parentTaskId },
          _max: { position: true },
        });

        return tx.task.create({
          data: {
            userId: user.id,
            title: parsed.title,
            description: parsed.description?.trim() || null,
            important: parsed.important,
            urgent: parsed.urgent,
            energyLevel: parsed.energyLevel,
            dueDateStart,
            dueDateEnd,
            parentTaskId,
            position: (maxPosition._max.position ?? -1) + 1,
          },
          include: {
            subtasks: true,
          },
        });
      },
      { isolationLevel: "Serializable" },
    );

    return ok(task, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "TODAY_LIMIT_REACHED") {
      return err(
        "TODAY_LIMIT_REACHED",
        `На сегодня уже запланировано ${MAX_ACTIVE_TASKS_PER_DAY} активных задач`,
        400,
      );
    }
    return handleUnknownError("create task", error);
  }
});
