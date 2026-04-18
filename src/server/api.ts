// src/server/api.ts
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getCurrentUser } from "@/server/auth";
import { checkRateLimit, getClientIp } from "@/server/rate-limit";

export type AuthedUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export type ApiEnvelope<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: { code: string; message: string } };

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiEnvelope<T>>({ success: true, data, error: null }, init);
}

export function err(code: string, message: string, status = 400) {
  return NextResponse.json<ApiEnvelope<never>>(
    { success: false, data: null, error: { code, message } },
    { status },
  );
}

export function unauthorized() {
  return err("UNAUTHORIZED", "Не авторизован", 401);
}

export function notFound(message = "Не найдено") {
  return err("NOT_FOUND", message, 404);
}

export function rateLimited(retryAfterSeconds: number) {
  return err(
    "RATE_LIMITED",
    `Слишком много попыток. Повторите через ${retryAfterSeconds} сек.`,
    429,
  );
}

export function handleUnknownError(label: string, error: unknown) {
  if (error instanceof ZodError) {
    return err("VALIDATION_ERROR", error.issues[0]?.message ?? "Ошибка валидации", 400);
  }
  console.error(`${label} error:`, error);
  return err("INTERNAL_ERROR", "Внутренняя ошибка сервера", 500);
}

// ✅ Обновлённые типы для совместимости с Next.js 16 App Router
type NextContext = {
  params: Promise<Record<string, string>>;
};

type AuthedHandler<Ctx extends NextContext> = (
  request: NextRequest,
  ctx: Ctx & { user: AuthedUser },
) => Promise<Response> | Response;

export function withAuth<Ctx extends NextContext = NextContext>(
  handler: AuthedHandler<Ctx>
) {
  return async (
    request: NextRequest,
    context: Ctx
  ): Promise<Response> => {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    
    // ✅ Пробрасываем оригинальный context (включая params) + добавляем user
    return handler(request, { ...context, user } as Ctx & { user: AuthedUser });
  };
}

export function withRateLimit(
  key: (req: NextRequest) => string,
  opts: { limit: number; windowMs: number },
  handler: (req: NextRequest) => Promise<Response> | Response,
) {
  return async (req: NextRequest): Promise<Response> => {
    const result = checkRateLimit({ key: key(req), ...opts });
    if (!result.ok) return rateLimited(result.retryAfterSeconds);
    return handler(req);
  };
}

export { getClientIp };