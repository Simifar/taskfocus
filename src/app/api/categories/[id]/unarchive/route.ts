import { db } from "@/server/db";
import { notFound, ok, withAuth } from "@/server/api";

type RouteCtx = { params: Promise<{ id: string }> };

export const POST = withAuth<RouteCtx>(async (_request, { params, user }) => {
  const { id } = await params;
  
  const category = await db.category.findFirst({
    where: { id, userId: user.id },
  });
  
  if (!category) return notFound("Project not found");

  // raw SQL — поле is_archived пока не добавлено в Prisma-схему
  await db.$executeRaw`UPDATE categories SET is_archived = false WHERE id = ${id}`;
  
  const result = await db.category.findFirst({
    where: { id, userId: user.id },
  });
  
  return ok(result);
});
