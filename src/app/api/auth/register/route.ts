import { z } from "zod";
import { db } from "@/server/db";
import { hashPassword, createToken, setAuthCookie } from "@/server/auth";
import { err, getClientIp, handleUnknownError, ok, withRateLimit } from "@/server/api";

const registerSchema = z.object({
  email: z.string().email("Неверный формат email"),
  username: z.string().min(3, "Имя пользователя должно быть не менее 3 символов"),
  password: z
    .string()
    .min(8, "Пароль должен быть не менее 8 символов")
    .max(256, "Пароль слишком длинный"),
  name: z.string().optional(),
});

async function handler(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.parse(body);
    const email = parsed.email.trim().toLowerCase();
    const username = parsed.username.trim();

    const existing = await db.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      return err("USER_EXISTS", "Пользователь с таким email или username уже существует", 400);
    }

    const passwordHash = await hashPassword(parsed.password);
    const user = await db.user.create({
      data: { email, username, passwordHash, name: parsed.name },
    });

    const token = await createToken({
      userId: user.id,
      email: user.email,
      username: username,
    });
    await setAuthCookie(token);

    return ok({
      id: user.id,
      email: user.email,
      username: username,
      name: user.name,
      avatar: user.avatar,
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
