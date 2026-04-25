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

export const GET = withAuth(async (request, { user }) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const energy = searchParams.get("energy");
  const search = searchParams.get("search");

  const where: Prisma.TaskWhereInput = {
    userId: user.id,
    parentTaskId: null,
  };

  const VALID_STATUSES: TaskStatus[] = ["active", "completed", "archived"];
  if (status && VALID_STATUSES.includes(status as TaskStatus)) {
    where.status = status as TaskStatus;
  }

  if (energy) {
    const n = Number.parseInt(energy, 10);
    if (Number.isInteger(n) && n >= MIN_ENERGY_LEVEL && n <= MAX_ENERGY_LEVEL) where.energyLevel = n;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
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

    if (
      isScheduledForToday({
        dueDateStart,
        dueDateEnd,
        status: "active",
        parentTaskId,
      })
    ) {
      const todayActiveCount = await countActiveTasksForToday(user.id);
      if (todayActiveCount >= MAX_ACTIVE_TASKS_PER_DAY) {
        return err(
          "TODAY_LIMIT_REACHED",
          `На сегодня уже запланировано ${MAX_ACTIVE_TASKS_PER_DAY} активных задач`,
          400,
        );
      }
    }

    const maxPosition = await db.task.aggregate({
      where: { userId: user.id, parentTaskId },
      _max: { position: true },
    });

    const task = await db.task.create({
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

    return ok(task, { status: 201 });
  } catch (error) {
    return handleUnknownError("create task", error);
  }
});
