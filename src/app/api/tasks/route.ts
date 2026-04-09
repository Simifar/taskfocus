import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const MAX_ACTIVE_TASKS = 3;

// Схема создания задачи
const createTaskSchema = z.object({
  title: z.string().min(1, "Название обязательно").max(200),
  description: z.string().max(2000).optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  energyLevel: z.number().int().min(1).max(5).default(3),
  category: z.string().max(100).optional(),
  dueDateStart: z.string().optional(),
  dueDateEnd: z.string().optional(),
  parentTaskId: z.string().optional(),
});

// GET /api/tasks - получение списка задач
export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const energy = searchParams.get("energy");
  const search = searchParams.get("search");
  const category = searchParams.get("category");

  // Строим фильтры
  const where: {
    userId: string;
    status?: "active" | "completed" | "archived";
    energyLevel?: number;
    category?: string;
    OR?: Array<{ title: { contains: string } } | { description: { contains: string } }>;
    parentTaskId: string | null;
  } = {
    userId: user.id,
    parentTaskId: null, // Только корневые задачи
  };

  if (status && ["active", "completed", "archived"].includes(status)) {
    where.status = status as "active" | "completed" | "archived";
  }

  if (energy) {
    const energyNum = parseInt(energy);
    if (!isNaN(energyNum) && energyNum >= 1 && energyNum <= 5) {
      where.energyLevel = energyNum;
    }
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  if (category) {
    where.category = category;
  }

  // Получаем задачи с подзадачами
  const tasks = await db.task.findMany({
    where,
    include: {
      subtasks: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { id: "asc" },  // Stable order by ID only - preserves manual reordering
  });

  // Подсчитываем активные задачи
  const activeCount = await db.task.count({
    where: {
      userId: user.id,
      status: "active",
      parentTaskId: null,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      items: tasks,
      totalCount: tasks.length,
      activeCount,
    },
    error: null,
  });
}

// POST /api/tasks - создание задачи
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
    const validatedData = createTaskSchema.parse(body);

    // Проверяем лимит активных задач (только для корневых задач)
    if (!validatedData.parentTaskId) {
      const activeCount = await db.task.count({
        where: {
          userId: user.id,
          status: "active",
          parentTaskId: null,
        },
      });

      if (activeCount >= MAX_ACTIVE_TASKS) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: {
              code: "TASK_LIMIT_EXCEEDED",
              message: `Максимум ${MAX_ACTIVE_TASKS} активные задачи. Завершите или отложите существующую.`,
            },
          },
          { status: 400 }
        );
      }
    }

    // Создаем задачу
    const task = await db.task.create({
      data: {
        userId: user.id,
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        energyLevel: validatedData.energyLevel,
        category: validatedData.category ?? null,
        dueDateStart: validatedData.dueDateStart
          ? new Date(validatedData.dueDateStart)
          : null,
        dueDateEnd: validatedData.dueDateEnd
          ? new Date(validatedData.dueDateEnd)
          : null,
        parentTaskId: validatedData.parentTaskId || null,
      },
      include: {
        subtasks: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: task,
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

    console.error("Create task error:", error);
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
