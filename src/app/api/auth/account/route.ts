import { getCurrentUser, clearAuthCookie } from "@/server/auth";
import { db } from "@/server/db";
import { ok, unauthorized } from "@/server/api";

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  await db.user.delete({ where: { id: user.id } });
  await clearAuthCookie();

  return ok(null);
}
