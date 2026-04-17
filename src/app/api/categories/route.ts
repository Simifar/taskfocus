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
});

export const GET = withAuth(async (_request, { user }) => {
  const categories = await db.category.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
  return ok(categories);
});

export const POST = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    const parsed = createCategorySchema.parse(body);
    const category = await db.category.create({
      data: { userId: user.id, ...parsed },
    });
    return ok(category, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return err("CATEGORY_EXISTS", "Категория с таким именем уже существует", 409);
    }
    return handleUnknownError("create category", error);
  }
});
