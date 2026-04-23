import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import type { TaskStatus } from "@/shared/types";
import { err, handleUnknownError, ok, withAuth } from "@/server/api";
import {
  countActiveTasksForToday,
  isScheduledForToday,
  MAX_ACTIVE_TASKS_PER_DAY,
  MIN_ENERGY_LEVEL,
  MAX_ENERGY_LEVEL,
  DEFAULT_ENERGY_LEVEL,
} from "@/server/task-scheduling";

const createTaskSchema = z.object({
  title: z.string().min(1, "Название обязательно").max(200),
  description: z.string().max(2000).nullish(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
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

    if (dueDateStart && dueDateEnd && dueDateStart > dueDateEnd) {
      return err("VALIDATION_ERROR", "Дата окончания не может быть раньше даты начала", 400);
    }

    if (
      isScheduledForToday({
        dueDateStart,
        dueDateEnd,
        status: "active",
        parentTaskId: parsed.parentTaskId ?? null,
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
      where: { userId: user.id, parentTaskId: parsed.parentTaskId ?? null },
      _max: { position: true },
    });

    const task = await db.task.create({
      data: {
        userId: user.id,
        title: parsed.title,
        description: parsed.description,
        priority: parsed.priority,
        energyLevel: parsed.energyLevel,
        dueDateStart,
        dueDateEnd,
        parentTaskId: parsed.parentTaskId ?? null,
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
