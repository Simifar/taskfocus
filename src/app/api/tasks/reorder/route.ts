import { z } from "zod";
import { db } from "@/server/db";
import { handleUnknownError, ok, withAuth } from "@/server/api";

const reorderSchema = z.object({
  items: z
    .array(z.object({ id: z.string(), position: z.number().int().min(0) }))
    .min(1)
    .max(500),
});

export const PATCH = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    const { items } = reorderSchema.parse(body);
    const ids = items.map((it) => it.id);

    const owned = await db.task.findMany({
      where: { id: { in: ids }, userId: user.id },
      select: { id: true },
    });
    const ownedIds = new Set(owned.map((t) => t.id));
    const filtered = items.filter((it) => ownedIds.has(it.id));

    await db.$transaction(
      filtered.map((it) =>
        db.task.update({
          where: { id: it.id },
          data: { position: it.position },
        }),
      ),
    );

    return ok({ updated: filtered.length });
  } catch (error) {
    return handleUnknownError("reorder tasks", error);
  }
});
