import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { getCurrentUser } from '@/server/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Проверяем авторизацию
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Текущий и новый пароли обязательны' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Новый пароль должен содержать минимум 8 символов' },
        { status: 400 }
      );
    }

    // Получить пользователя с паролем
    const userWithPassword = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!userWithPassword || !userWithPassword.passwordHash) {
      return NextResponse.json(
        { error: 'У пользователя нет пароля' },
        { status: 400 }
      );
    }

    // Проверить текущий пароль
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userWithPassword.passwordHash);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: 'Неверный текущий пароль' },
        { status: 400 }
      );
    }

    // Хешировать новый пароль
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Обновить пароль
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return NextResponse.json({
      message: 'Пароль успешно изменён',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
