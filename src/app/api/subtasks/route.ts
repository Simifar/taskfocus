import { z } from "zod";
import { db } from "@/server/db";
import { handleUnknownError, notFound, ok, withAuth } from "@/server/api";

const createSubtaskSchema = z.object({
  parentId: z.string().min(1, "ID родительской задачи обязателен"),
  title: z.string().min(1, "Название обязательно").max(200),
  energyLevel: z.number().int().min(1).max(5).optional().default(2),
});

export const POST = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    const parsed = createSubtaskSchema.parse(body);

    const parent = await db.task.findFirst({
      where: { id: parsed.parentId, userId: user.id },
      select: { id: true },
    });
    if (!parent) return notFound("Родительская задача не найдена");

    const maxPosition = await db.task.aggregate({
      where: { parentTaskId: parent.id },
      _max: { position: true },
    });

    const subtask = await db.task.create({
      data: {
        userId: user.id,
        title: parsed.title,
        energyLevel: parsed.energyLevel,
        parentTaskId: parent.id,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });

    return ok(subtask, { status: 201 });
  } catch (error) {
    return handleUnknownError("create subtask", error);
  }
});
