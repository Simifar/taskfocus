import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

// POST /api/tasks/[id]/complete - отметка задачи выполненной
export async function POST(
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

  // Отмечаем задачу выполненной
  const completedTask = await db.task.update({
    where: { id },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    data: completedTask,
    error: null,
  });
}
