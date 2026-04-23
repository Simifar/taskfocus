import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { sendPasswordResetEmail } from '@/server/email';
import crypto from 'crypto';

const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 минут
const RATE_LIMIT_MAX_ATTEMPTS = 3;

const rateLimit = new Map<string, { count: number; resetTime: number }>();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email обязателен' },
        { status: 400 }
      );
    }

    // Rate limiting по IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const now = Date.now();
    const userLimit = rateLimit.get(ip);

    if (userLimit && now < userLimit.resetTime) {
      if (userLimit.count >= RATE_LIMIT_MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: 'Слишком много попыток. Попробуйте позже.' },
          { status: 429 }
        );
      }
      userLimit.count++;
    } else {
      rateLimit.set(ip, {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW,
      });
    }

    // Найти пользователя
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Если пользователь не найден, возвращаем 200 для безопасности
    if (!user) {
      return NextResponse.json({
        message: 'Если аккаунт с таким email существует, инструкции отправлены',
      });
    }

    // Удалить старые токены сброса пароля
    await db.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Создать новый токен
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 час

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Отправить email
    try {
      await sendPasswordResetEmail(user.email, token);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Не возвращаем ошибку пользователю для безопасности
    }

    return NextResponse.json({
      message: 'Если аккаунт с таким email существует, инструкции отправлены',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
