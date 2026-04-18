import { db } from "@/server/db";
import { notFound, ok, withAuth } from "@/server/api";

type RouteCtx = { params: Promise<{ id: string }> };

export const POST = withAuth<RouteCtx>(async (_request, { params, user }) => {
  const { id } = await params;
  
  const category = await db.category.findFirst({
    where: { id, userId: user.id },
  });
  
  if (!category) return notFound("Project not found");
  
  // Use raw SQL until Prisma schema is updated
  const updated = await db.$executeRaw`UPDATE categories SET is_archived = true WHERE id = ${id}`;
  
  // Return the updated category
  const result = await db.category.findFirst({
    where: { id, userId: user.id },
  });
  
  return ok(result);
});
