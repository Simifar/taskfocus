import { z } from "zod";
import { db } from "@/server/db";
import { verifyPassword, createToken, setAuthCookie } from "@/server/auth";
import { err, getClientIp, handleUnknownError, ok, withRateLimit } from "@/server/api";
import { logger } from "@/server/logger";

const loginSchema = z.object({
  email: z.string().email("Неверный формат email"),
  password: z.string().min(1, "Введите пароль"),
});

async function handler(request: Request) {
  try {
    const body = await request.json();
    const { email: rawEmail, password } = loginSchema.parse(body);
    const email = rawEmail.trim().toLowerCase();

    const user = await db.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
      logger.warn("auth:login", { event: "failed", email });
      return err("INVALID_CREDENTIALS", "Неверный email или пароль", 401);
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      username: user.username ?? "",
    });
    await setAuthCookie(token);

    logger.info("auth:login", { event: "success", userId: user.id });

    return ok({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
    });
  } catch (error) {
    return handleUnknownError("login", error);
  }
}

export const POST = withRateLimit(
  (req) => `auth:login:ip:${getClientIp(req)}`,
  { limit: 20, windowMs: 10 * 60 * 1000 },
  handler,
);
