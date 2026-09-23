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
import {
  normalisePlannedRange,
  parseDateQuery,
  parseTaskDateInput,
  scheduledBetweenWhere,
  TaskDatePolicyError,
  getRequestTimeZone,
} from "@/server/tasks/date-policy";
import {
  endOfMonthDateOnly,
  endOfWeekDateOnly,
  startOfMonthDateOnly,
  startOfWeekDateOnly,
  isValidDateInput,
  type DateOnly,
} from "@/shared/lib/dates/date-only";
import type { TaskStatus } from "@/shared/types";

type TasksView = "today" | "inbox" | "week" | "day" | "calendar" | "archive";

const VALID_STATUSES: TaskStatus[] = ["active", "completed", "archived"];
const VALID_VIEWS: TasksView[] = ["today", "inbox", "week", "day", "calendar", "archive"];
const taskDateSchema = z.string().refine(isValidDateInput, "Некорректная дата");

const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Название обязательно").max(200),
  description: z.string().max(2000).nullish(),
  important: z.boolean().default(false),
  urgent: z.boolean().default(false),
  energyLevel: z.number().int().min(MIN_ENERGY_LEVEL).max(MAX_ENERGY_LEVEL).default(DEFAULT_ENERGY_LEVEL),
  dueDateStart: taskDateSchema.nullish(),
  dueDateEnd: taskDateSchema.nullish(),
  parentTaskId: z.string().nullish(),
});

function addAnd(where: Prisma.TaskWhereInput, condition: Prisma.TaskWhereInput) {
  const current = where.AND;
  const items = Array.isArray(current) ? current : current ? [current] : [];
  where.AND = [...items, condition];
}

function applyViewFilter(where: Prisma.TaskWhereInput, view: TasksView | null, date: DateOnly) {
  if (!view) return;

  if (view === "archive") {
    where.status = "archived";
    return;
  }

  if (view === "inbox") {
    where.status = "active";
    addAnd(where, {
      dueDateStart: null,
      dueDateEnd: null,
    });
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

export const GET = withAuth(async (request, { user }) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const energy = searchParams.get("energy");
  const search = searchParams.get("search");
  const requestedView = searchParams.get("view");
  const view = VALID_VIEWS.includes(requestedView as TasksView)
    ? (requestedView as TasksView)
    : null;
  const timeZone = getRequestTimeZone(request);
  const date = parseDateQuery(searchParams.get("date"), new Date(), timeZone);

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

  const [tasks, activeCount, todayActiveCount] = await Promise.all([
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
    countActiveTasksForToday(user.id, undefined, db, timeZone),
  ]);

  return ok({
    items: tasks,
    totalCount: tasks.length,
    activeCount,
    todayActiveCount,
  });
});

export const POST = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    const parsed = createTaskSchema.parse(body);
    const timeZone = getRequestTimeZone(request);
    const plannedRange = normalisePlannedRange(parsed.dueDateStart, parsed.dueDateEnd, timeZone);
    const dueDateStart = parseTaskDateInput(plannedRange.start, timeZone);
    const dueDateEnd = parseTaskDateInput(plannedRange.end, timeZone);
    const parentTaskId = parsed.parentTaskId ?? null;

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
          }, new Date(), timeZone)
        ) {
          const todayActiveCount = await countActiveTasksForToday(user.id, undefined, tx, timeZone);
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
    if (error instanceof TaskDatePolicyError) {
      return err("VALIDATION_ERROR", error.message, 400);
    }
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
