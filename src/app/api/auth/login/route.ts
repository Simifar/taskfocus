import { z } from "zod";
import { db } from "@/server/db";
import { verifyPassword, createToken, setAuthCookie } from "@/server/auth";
import { err, getClientIp, handleUnknownError, ok, withRateLimit } from "@/server/api";

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
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return err("INVALID_CREDENTIALS", "Неверный email или пароль", 401);
    }

    const token = await createToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });
    await setAuthCookie(token);

    return ok({
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
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
