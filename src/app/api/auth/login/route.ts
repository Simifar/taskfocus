import { db } from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Неверный формат email"),
  password: z.string().min(1, "Введите пароль"),
});

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipLimit = checkRateLimit({
      key: `auth:login:ip:${ip}`,
      limit: 20,
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
    const validatedData = loginSchema.parse(body);
    const email = validatedData.email.trim().toLowerCase();

    // Находим пользователя
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Неверный email или пароль",
          },
        },
        { status: 401 }
      );
    }

    // Проверяем пароль
    const isValidPassword = await verifyPassword(
      validatedData.password,
      user.passwordHash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Неверный email или пароль",
          },
        },
        { status: 401 }
      );
    }

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

    console.error("Login error:", error);
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
