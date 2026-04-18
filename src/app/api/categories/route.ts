import { z } from "zod";
import { db } from "@/server/db";
import { err, handleUnknownError, ok, withAuth } from "@/server/api";
import { Prisma } from "@prisma/client";

const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Цвет должен быть в формате #rrggbb")
    .optional(),
  icon: z.string().max(50).optional(),
  description: z.string().max(200).optional(),
  parentId: z.string().cuid().optional(),
  position: z.number().int().min(0).optional(),
});

export const GET = withAuth(async (request, { user }) => {
  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("includeArchived") === "true";
  
  const categories = await db.category.findMany({
    where: { 
      userId: user.id,
      ...(includeArchived ? {} : { isArchived: false })
    },
    orderBy: [
      { position: "asc" },
      { name: "asc" }
    ],
    include: {
      _count: {
        select: {
          tasks: true,
        },
      },
    },
  });
  
  // Add computed stats for each category
  const categoriesWithStats = await Promise.all(
    categories.map(async (category) => {
      const [activeCount, completedCount] = await Promise.all([
        db.task.count({
          where: { categoryId: category.id, status: "active" },
        }),
        db.task.count({
          where: { categoryId: category.id, status: "completed" },
        }),
      ]);
      
      return {
        ...category,
        _count: {
          tasks: category._count.tasks,
          activeTasks: activeCount,
          completedTasks: completedCount,
        },
      };
    })
  );
  
  return ok(categoriesWithStats);
});

export const POST = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    const parsed = createCategorySchema.parse(body);
    
    // If position is not provided, put it at the end
    let position = parsed.position;
    if (position === undefined) {
      const maxPosition = await db.category.findFirst({
        where: { 
          userId: user.id,
          parentId: parsed.parentId || null,
        },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      position = (maxPosition?.position ?? -1) + 1;
    }
    
    const category = await db.category.create({
      data: { 
        userId: user.id, 
        ...parsed,
        position,
      },
    });
    return ok(category, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return err("CATEGORY_EXISTS", "Категория с таким именем уже существует", 409);
    }
    return handleUnknownError("create category", error);
  }
});
