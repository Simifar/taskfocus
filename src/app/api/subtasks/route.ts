import { z } from "zod";

import { err, handleUnknownError, notFound, ok, withAuth } from "@/server/api";
import { db } from "@/server/db";
import {
  DEFAULT_SUBTASK_ENERGY_LEVEL,
  MAX_ENERGY_LEVEL,
  MIN_ENERGY_LEVEL,
} from "@/server/task-scheduling";

const createSubtaskSchema = z.object({
  parentId: z.string().min(1, "ID родительской задачи обязателен"),
  title: z.string().trim().min(1, "Название обязательно").max(200),
  energyLevel: z
    .number()
    .int()
    .min(MIN_ENERGY_LEVEL)
    .max(MAX_ENERGY_LEVEL)
    .optional()
    .default(DEFAULT_SUBTASK_ENERGY_LEVEL),
});

export const POST = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    const parsed = createSubtaskSchema.parse(body);

    const parent = await db.task.findFirst({
      where: { id: parsed.parentId, userId: user.id },
      select: { id: true, parentTaskId: true, status: true },
    });
    if (!parent) return notFound("Родительская задача не найдена");
    if (parent.parentTaskId) return err("VALIDATION_ERROR", "Подзадачи второго уровня не поддерживаются", 400);
    if (parent.status === "archived") return err("VALIDATION_ERROR", "Нельзя добавить подзадачу в архивную задачу", 400);

    const maxPosition = await db.task.aggregate({
      where: { userId: user.id, parentTaskId: parent.id },
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
