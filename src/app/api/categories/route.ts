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
  // Temporarily remove new fields until migration
  // description: z.string().max(200).optional(),
  // parentId: z.string().cuid().optional(),
  // position: z.number().int().min(0).optional(),
});

export const GET = withAuth(async (request, { user }) => {
  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("includeArchived") === "true";
  
  const categories = await db.category.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
  
  // Add computed stats for each category
  const categoriesWithStats = await Promise.all(
    categories.map(async (category) => {
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
      
      return {
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
    })
  );
  
  return ok(categoriesWithStats);
});

export const POST = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    const parsed = createCategorySchema.parse(body);
    
    const category = await db.category.create({
      data: { 
        userId: user.id, 
        ...parsed,
      },
    });
    
    // Add new fields with default values
    const result = {
      ...category,
      description: null,
      isFavorite: false,
      isArchived: false,
      parentId: null,
      position: 0,
      _count: {
        tasks: 0,
        activeTasks: 0,
        completedTasks: 0,
      },
    };
    
    return ok(result, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return err("CATEGORY_EXISTS", "Категория с таким именем уже существует", 409);
    }
    return handleUnknownError("create category", error);
  }
});
