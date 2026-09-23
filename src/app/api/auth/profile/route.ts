import { z } from "zod";
import { db } from "@/server/db";
import { handleUnknownError, ok, withAuth } from "@/server/api";
import { normaliseDisplayName } from "@/server/auth-policy";

const updateProfileSchema = z.object({
  name: z.string().max(100).nullable().optional(),
});

export const PATCH = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    const parsed = updateProfileSchema.parse(body);

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        name: normaliseDisplayName(parsed.name),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
      },
    });

    return ok(updated);
  } catch (error) {
    return handleUnknownError("profile update", error);
  }
});
