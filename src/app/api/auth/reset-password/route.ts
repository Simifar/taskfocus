import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import bcrypt from 'bcryptjs';

const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 минут
const RATE_LIMIT_MAX_ATTEMPTS = 5;

const rateLimit = new Map<string, { count: number; resetTime: number }>();

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Токен и пароль обязательны' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 8 символов' },
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

    // Найти токен сброса пароля
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 400 }
      );
    }

    // Проверить срок действия токена
    if (resetToken.expiresAt < new Date()) {
      // Удалить просроченный токен
      await db.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      
      return NextResponse.json(
        { error: 'Токен истёк. Запросите новый сброс пароля.' },
        { status: 400 }
      );
    }

    // Хешировать новый пароль
    const passwordHash = await bcrypt.hash(password, 12);

    // Обновить пароль пользователя
    await db.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // Удалить использованный токен
    await db.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    return NextResponse.json({
      message: 'Пароль успешно изменён',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
