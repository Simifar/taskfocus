import { db } from "@/server/db";
import { notFound, ok, withAuth } from "@/server/api";

type RouteCtx = { params: Promise<{ id: string }> };

export const POST = withAuth<RouteCtx>(async (_request, { params, user }) => {
  const { id } = await params;
  
  const category = await db.category.findFirst({
    where: { id, userId: user.id },
  });
  
  if (!category) return notFound("Project not found");
  
  const updated = await db.category.update({
    where: { id },
    data: { isFavorite: !category.isFavorite },
  });
  
  return ok(updated);
});
