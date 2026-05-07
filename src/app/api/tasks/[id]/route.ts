import { z } from "zod";
import { db } from "@/server/db";
import { err, handleUnknownError, notFound, ok, withAuth } from "@/server/api";
import {
  countActiveTasksForToday,
  isScheduledForToday,
  MAX_ACTIVE_TASKS_PER_DAY,
  MIN_ENERGY_LEVEL,
  MAX_ENERGY_LEVEL,
} from "@/server/task-scheduling";
import type { TaskStatus } from "@/shared/types";

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullish(),
  important: z.boolean().optional(),
  urgent: z.boolean().optional(),
  energyLevel: z.number().int().min(MIN_ENERGY_LEVEL).max(MAX_ENERGY_LEVEL).optional(),
  status: z.enum(["active", "completed", "archived"]).optional(),
  dueDateStart: z.string().datetime().nullish(),
  dueDateEnd: z.string().datetime().nullish(),
});

type RouteCtx = { params: Promise<{ id: string }> };

async function ownedTask(id: string, userId: string) {
  return db.task.findFirst({
    where: { id, userId },
    select: {
      id: true,
      userId: true,
      status: true,
      dueDateStart: true,
      dueDateEnd: true,
      parentTaskId: true,
    },
  });
}

export const GET = withAuth<RouteCtx>(async (_req, { params, user }) => {
  const { id } = await params;
  const task = await db.task.findFirst({
    where: { id, userId: user.id },
    include: {
      subtasks: { orderBy: { position: "asc" } },
    },
  });
  if (!task) return notFound("Задача не найдена");
  return ok(task);
});

export const PUT = withAuth<RouteCtx>(async (request, { params, user }) => {
  const { id } = await params;

  try {
    const existing = await ownedTask(id, user.id);
    if (!existing) return notFound("Задача не найдена");

    const body = await request.json();
    const parsed = updateTaskSchema.parse(body);

    const nextDueDateStart =
      parsed.dueDateStart !== undefined
        ? parsed.dueDateStart
          ? new Date(parsed.dueDateStart)
          : null
        : existing.dueDateStart;
    const nextDueDateEnd =
      parsed.dueDateEnd !== undefined
        ? parsed.dueDateEnd
          ? new Date(parsed.dueDateEnd)
          : null
        : existing.dueDateEnd;
    const nextStatus: TaskStatus = (parsed.status ?? existing.status) as TaskStatus;

    if (nextDueDateStart && nextDueDateEnd && nextDueDateStart > nextDueDateEnd) {
      return err("VALIDATION_ERROR", "Дата окончания не может быть раньше даты начала", 400);
    }

    const data: Record<string, unknown> = {};
    if (parsed.title !== undefined) data.title = parsed.title;
    if (parsed.description !== undefined) data.description = parsed.description;
    if (parsed.important !== undefined) data.important = parsed.important;
    if (parsed.urgent !== undefined) data.urgent = parsed.urgent;
    if (parsed.energyLevel !== undefined) data.energyLevel = parsed.energyLevel;
    if (parsed.status !== undefined) {
      data.status = parsed.status;
      data.completedAt = parsed.status === "completed" ? new Date() : null;
    }
    if (parsed.dueDateStart !== undefined) data.dueDateStart = nextDueDateStart;
    if (parsed.dueDateEnd !== undefined) data.dueDateEnd = nextDueDateEnd;

    const task = await db.$transaction(
      async (tx) => {
        if (
          isScheduledForToday({
            dueDateStart: nextDueDateStart,
            dueDateEnd: nextDueDateEnd,
            status: nextStatus,
            parentTaskId: existing.parentTaskId,
          })
        ) {
          const todayActiveCount = await countActiveTasksForToday(user.id, existing.id, tx);
          if (todayActiveCount >= MAX_ACTIVE_TASKS_PER_DAY) {
            throw new Error("TODAY_LIMIT_REACHED");
          }
        }

        return tx.task.update({
          where: { id },
          data,
          include: { subtasks: true },
        });
      },
      { isolationLevel: "Serializable" },
    );

    return ok(task);
  } catch (error) {
    if (error instanceof Error && error.message === "TODAY_LIMIT_REACHED") {
      return err(
        "TODAY_LIMIT_REACHED",
        `На сегодня уже запланировано ${MAX_ACTIVE_TASKS_PER_DAY} активных задач`,
        400,
      );
    }
    return handleUnknownError("update task", error);
  }
});

export const DELETE = withAuth<RouteCtx>(async (_req, { params, user }) => {
  const { id } = await params;
  const existing = await ownedTask(id, user.id);
  if (!existing) return notFound("Задача не найдена");

  await db.task.delete({ where: { id } });
  return new Response(null, { status: 204 });
});
