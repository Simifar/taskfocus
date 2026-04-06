import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSubtaskSchema = z.object({
  parentId: z.string().min(1, "ID родительской задачи обязателен"),
  title: z.string().min(1, "Название обязательно").max(200),
  energyLevel: z.number().int().min(1).max(5).optional().default(2),
});

// POST /api/subtasks - создание подзадачи
export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: "UNAUTHORIZED", message: "Не авторизован" },
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = createSubtaskSchema.parse(body);

    // Проверяем существование родительской задачи
    const parentTask = await db.task.findFirst({
      where: { id: validatedData.parentId, userId: user.id },
    });

    if (!parentTask) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: { code: "TASK_NOT_FOUND", message: "Родительская задача не найдена" },
        },
        { status: 404 }
      );
    }

    // Создаем подзадачу (подзадачи не учитываются в лимите 3)
    const subtask = await db.task.create({
      data: {
        userId: user.id,
        title: validatedData.title,
        energyLevel: validatedData.energyLevel,
        parentTaskId: validatedData.parentId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: subtask,
        error: null,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: error.issues[0]?.message ?? "Ошибка валидации",
          },
        },
        { status: 400 }
      );
    }

    console.error("Create subtask error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: "INTERNAL_ERROR",
          message: "Внутренняя ошибка сервера",
        },
      },
      { status: 500 }
    );
  }
}
