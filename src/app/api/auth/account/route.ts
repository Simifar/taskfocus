import { db } from "@/server/db";
import { ok, withAuth } from "@/server/api";

export const DELETE = withAuth(async (_request, { user }) => {
  await db.user.delete({ where: { id: user.id } });

  return ok(null);
});
