import { z } from "zod";
import { db } from "@/server/db";
import { err, ok, withAuth } from "@/server/api";

const reorderSchema = z.object({
  items: z.array(z.object({
    id: z.string().cuid(),
    position: z.number().int().min(0),
    parentId: z.string().cuid().nullable(),
  })),
});

export const PATCH = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    const { items } = reorderSchema.parse(body);
    
    // Verify all items belong to the user
    const categoryIds = items.map(item => item.id);
    const existingCategories = await db.category.findMany({
      where: {
        id: { in: categoryIds },
        userId: user.id,
      },
      select: { id: true },
    });
    
    if (existingCategories.length !== categoryIds.length) {
      return err("INVALID_CATEGORIES", "Some categories not found or don't belong to user", 400);
    }
    
    // Update positions in a transaction
    const updates = items.map(item => 
      db.category.update({
        where: { id: item.id },
        data: { 
          position: item.position,
          parentId: item.parentId,
        },
      })
    );
    
    await db.$transaction(updates);
    
    return ok({ updated: items.length });
  } catch (error) {
    return err("REORDER_FAILED", "Failed to reorder categories", 500);
  }
});
