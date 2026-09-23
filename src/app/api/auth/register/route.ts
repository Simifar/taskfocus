import { z } from "zod";
import { db } from "@/server/db";
import { hashPassword } from "@/server/auth";
import {
  GENERIC_REGISTRATION_ERROR,
  isValidPassword,
  normaliseDisplayName,
  normaliseEmail,
  normaliseUsername,
} from "@/server/auth-policy";
import { err, getClientIp, handleUnknownError, ok, withRateLimit } from "@/server/api";
import { logger } from "@/server/logger";

const registerSchema = z.object({
  email: z.string().email("Неверный формат email"),
  username: z.string().min(3, "Имя пользователя должно быть не менее 3 символов"),
  password: z.string(),
  name: z.string().max(100).optional(),
});

async function handler(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.parse(body);
    const email = normaliseEmail(parsed.email);
    const username = normaliseUsername(parsed.username);

    if (!isValidPassword(parsed.password)) {
      return err("INVALID_PASSWORD", "Пароль должен содержать от 8 до 256 символов", 400);
    }

    const existing = await db.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return err("REGISTRATION_FAILED", GENERIC_REGISTRATION_ERROR, 400);
    }

    const passwordHash = await hashPassword(parsed.password);
    const user = await db.user.create({
      data: { email, username, passwordHash, name: normaliseDisplayName(parsed.name) },
    });

    logger.info("auth:register", { event: "success", userId: user.id });

    return ok({
      id: user.id,
      email: user.email,
      username: username,
      name: user.name,
    });
  } catch (error) {
    return handleUnknownError("register", error);
  }
}

export const POST = withRateLimit(
  (req) => `auth:register:ip:${getClientIp(req)}`,
  { limit: 10, windowMs: 10 * 60 * 1000 },
  handler,
);
