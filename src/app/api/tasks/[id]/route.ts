import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

// Схема обновления задачи
const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  energyLevel: z.number().int().min(1).max(5).optional(),
  status: z.enum(["active", "completed", "archived"]).optional(),
  dueDateStart: z.string().optional().nullable(),
  dueDateEnd: z.string().optional().nullable(),
});

// GET /api/tasks/[id] - получение одной задачи
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  const task = await db.task.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      subtasks: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!task) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: "TASK_NOT_FOUND", message: "Задача не найдена" },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: task,
    error: null,
  });
}

// PUT /api/tasks/[id] - обновление задачи
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  // Проверяем существование задачи
  const existingTask = await db.task.findFirst({
    where: { id, userId: user.id },
  });

  if (!existingTask) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: "TASK_NOT_FOUND", message: "Задача не найдена" },
      },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = updateTaskSchema.parse(body);

    // Если задача становится активной, проверяем лимит
    if (
      validatedData.status === "active" &&
      existingTask.status !== "active" &&
      !existingTask.parentTaskId
    ) {
      const activeCount = await db.task.count({
        where: {
          userId: user.id,
          status: "active",
          parentTaskId: null,
          id: { not: id },
        },
      });

      if (activeCount >= 3) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: {
              code: "TASK_LIMIT_EXCEEDED",
              message: "Максимум 3 активные задачи. Завершите или отложите существующую.",
            },
          },
          { status: 400 }
        );
      }
    }

    // Обновляем задачу
    const task = await db.task.update({
      where: { id },
      data: {
        ...validatedData,
        dueDateStart: validatedData.dueDateStart
          ? new Date(validatedData.dueDateStart)
          : validatedData.dueDateStart === null
          ? null
          : undefined,
        dueDateEnd: validatedData.dueDateEnd
          ? new Date(validatedData.dueDateEnd)
          : validatedData.dueDateEnd === null
          ? null
          : undefined,
        completedAt:
          validatedData.status === "completed"
            ? new Date()
            : validatedData.status === "active" || validatedData.status === "archived"
            ? null
            : undefined,
      },
      include: {
        subtasks: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: task,
      error: null,
    });
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

    console.error("Update task error:", error);
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

// DELETE /api/tasks/[id] - удаление задачи
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;

  // Проверяем существование задачи
  const task = await db.task.findFirst({
    where: { id, userId: user.id },
  });

  if (!task) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: { code: "TASK_NOT_FOUND", message: "Задача не найдена" },
      },
      { status: 404 }
    );
  }

  // Удаляем задачу (каскадно удалит подзадачи)
  await db.task.delete({
    where: { id },
  });

  return new NextResponse(null, { status: 204 });
}
