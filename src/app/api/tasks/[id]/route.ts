import { z } from "zod";
import { db } from "@/server/db";
import { handleUnknownError, notFound, ok, withAuth } from "@/server/api";

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullish(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  energyLevel: z.number().int().min(1).max(5).optional(),
  categoryId: z.string().nullish(),
  status: z.enum(["active", "completed", "archived"]).optional(),
  dueDateStart: z.string().datetime().nullish(),
  dueDateEnd: z.string().datetime().nullish(),
});

type RouteCtx = { params: Promise<{ id: string }> };

async function ownedTask(id: string, userId: string) {
  return db.task.findFirst({ where: { id, userId }, select: { id: true, userId: true } });
}

export const GET = withAuth<RouteCtx>(async (_req, { params, user }) => {
  const { id } = await params;
  const task = await db.task.findFirst({
    where: { id, userId: user.id },
    include: {
      category: true,
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

    if (parsed.categoryId) {
      const owns = await db.category.findFirst({
        where: { id: parsed.categoryId, userId: user.id },
        select: { id: true },
      });
      if (!owns) return notFound("Категория не найдена");
    }

    const data: Record<string, unknown> = {};
    if (parsed.title !== undefined) data.title = parsed.title;
    if (parsed.description !== undefined) data.description = parsed.description;
    if (parsed.priority !== undefined) data.priority = parsed.priority;
    if (parsed.energyLevel !== undefined) data.energyLevel = parsed.energyLevel;
    if (parsed.categoryId !== undefined) data.categoryId = parsed.categoryId;
    if (parsed.status !== undefined) {
      data.status = parsed.status;
      data.completedAt = parsed.status === "completed" ? new Date() : null;
    }
    if (parsed.dueDateStart !== undefined) {
      data.dueDateStart = parsed.dueDateStart ? new Date(parsed.dueDateStart) : null;
    }
    if (parsed.dueDateEnd !== undefined) {
      data.dueDateEnd = parsed.dueDateEnd ? new Date(parsed.dueDateEnd) : null;
    }

    const task = await db.task.update({
      where: { id },
      data,
      include: { category: true, subtasks: true },
    });

    return ok(task);
  } catch (error) {
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
