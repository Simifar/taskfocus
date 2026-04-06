import { db } from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Неверный формат email"),
  username: z.string().min(3, "Имя пользователя должно быть не менее 3 символов"),
  password: z
    .string()
    .min(8, "Пароль должен быть не менее 8 символов")
    .max(256, "Пароль слишком длинный"),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipLimit = checkRateLimit({
      key: `auth:register:ip:${ip}`,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (!ipLimit.ok) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: "RATE_LIMITED",
            message: `Слишком много попыток. Повторите через ${ipLimit.retryAfterSeconds} сек.`,
          },
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = registerSchema.parse(body);
    const email = validatedData.email.trim().toLowerCase();
    const username = validatedData.username.trim();

    // Проверяем, существует ли пользователь
    const existingUser = await db.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: "USER_EXISTS",
            message: "Пользователь с таким email или username уже существует",
          },
        },
        { status: 400 }
      );
    }

    // Хешируем пароль
    const passwordHash = await hashPassword(validatedData.password);

    // Создаем пользователя
    const user = await db.user.create({
      data: {
        email,
        username,
        passwordHash,
        name: validatedData.name,
      },
    });

    // Создаем токен
    const token = await createToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // Устанавливаем cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 дней
      path: "/",
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
      },
      error: null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: error.issues[0]?.message ?? "Ошибка валидации",
          },
        },
        { status: 400 }
      );
    }

    console.error("Register error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: "INTERNAL_ERROR",
          message: "Внутренняя ошибка сервера",
        },
      },
      { status: 500 }
    );
  }
}
