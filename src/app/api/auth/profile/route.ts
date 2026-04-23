import { z } from "zod";
import { db } from "@/server/db";
import { handleUnknownError, ok, withAuth } from "@/server/api";
import { isValidImageUrl } from "@/shared/lib/avatar-utils";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().or(z.literal("")).optional(),
}).refine((data) => {
  if (data.avatar && data.avatar !== "") {
    return isValidImageUrl(data.avatar);
  }
  return true;
}, {
  message: "Неверный URL изображения. Разрешены только HTTP/HTTPS URL с изображениями.",
  path: ["avatar"],
});

export const PATCH = withAuth(async (request, { user }) => {
  try {
    const body = await request.json();
    const parsed = updateProfileSchema.parse(body);

    const updated = await db.user.update({
      where: { id: user.id },
      data: {
        name: parsed.name,
        avatar: parsed.avatar === "" ? null : parsed.avatar,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
      },
    });

    return ok(updated);
  } catch (error) {
    return handleUnknownError("profile update", error);
  }
});
