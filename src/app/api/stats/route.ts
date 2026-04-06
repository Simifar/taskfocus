import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET /api/stats - получение статистики пользователя
export async function GET() {
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

  // Подсчитываем задачи по статусам
  const [activeTasks, completedTasks, archivedTasks] = await Promise.all([
    db.task.count({
      where: { userId: user.id, status: "active", parentTaskId: null },
    }),
    db.task.count({
      where: { userId: user.id, status: "completed", parentTaskId: null },
    }),
    db.task.count({
      where: { userId: user.id, status: "archived", parentTaskId: null },
    }),
  ]);

  // Задачи за последние 7 дней
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const completedThisWeek = await db.task.count({
    where: {
      userId: user.id,
      status: "completed",
      completedAt: { gte: weekAgo },
      parentTaskId: null,
    },
  });

  // Задачи за сегодня
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const completedToday = await db.task.count({
    where: {
      userId: user.id,
      status: "completed",
      completedAt: { gte: today },
      parentTaskId: null,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      activeTasks,
      completedTasks,
      archivedTasks,
      completedThisWeek,
      completedToday,
      totalTasks: activeTasks + completedTasks + archivedTasks,
    },
    error: null,
  });
}
