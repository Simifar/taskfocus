import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { err, handleUnknownError, notFound, ok, withAuth } from "@/server/api";

const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullish(),
  icon: z.string().max(50).nullish(),
  // Temporarily remove new fields until migration
  // description: z.string().max(200).nullish(),
  // isFavorite: z.boolean().optional(),
  // isArchived: z.boolean().optional(),
  // parentId: z.string().cuid().nullish(),
  // position: z.number().int().min(0).optional(),
});

type RouteCtx = { params: Promise<{ id: string }> };

export const GET = withAuth<RouteCtx>(async (_request, { params, user }) => {
  const { id } = await params;
  
  const category = await db.category.findFirst({
    where: { id, userId: user.id },
  });
  
  if (!category) return notFound("Категория не найдена");
  
  // Add computed stats
  const [totalCount, activeCount, completedCount] = await Promise.all([
    db.task.count({
      where: { categoryId: category.id },
    }),
    db.task.count({
      where: { categoryId: category.id, status: "active" },
    }),
    db.task.count({
      where: { categoryId: category.id, status: "completed" },
    }),
  ]);
  
  const categoryWithStats = {
    ...category,
    // Add new fields with default values
    description: null,
    isFavorite: false,
    isArchived: false,
    parentId: null,
    position: 0,
    _count: {
      tasks: totalCount,
      activeTasks: activeCount,
      completedTasks: completedCount,
    },
  };
  
  return ok(categoryWithStats);
});

export const PATCH = withAuth<RouteCtx>(async (request, { params, user }) => {
  const { id } = await params;
  try {
    const existing = await db.category.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!existing) return notFound("Категория не найдена");

    const body = await request.json();
    const parsed = updateCategorySchema.parse(body);

    const updated = await db.category.update({ where: { id }, data: parsed });
    return ok(updated);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return err("CATEGORY_EXISTS", "Категория с таким именем уже существует", 409);
    }
    return handleUnknownError("update category", error);
  }
});

export const DELETE = withAuth<RouteCtx>(async (_request, { params, user }) => {
  const { id } = await params;
  const existing = await db.category.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return notFound("Категория не найдена");

  await db.category.delete({ where: { id } });
  return new Response(null, { status: 204 });
});
