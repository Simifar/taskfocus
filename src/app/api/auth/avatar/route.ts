import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { db } from "@/server/db";
import { handleUnknownError, ok, withAuth } from "@/server/api";
import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json(
        { error: "Файл не найден" },
        { status: 400 }
      );
    }

    // Валидация файла
    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json(
        { error: "Разрешены только JPG, PNG, WebP, GIF файлы" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: "Максимальный размер файла - 5MB" },
        { status: 400 }
      );
    }

    // Создаем директорию для аватаров, если не существует
    const uploadsDir = join(process.cwd(), "public", "avatars");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Директория уже существует
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${user.id}_${timestamp}_${randomString}.${extension}`;

    // Сохраняем файл
    const filePath = join(uploadsDir, filename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Обновляем профиль пользователя
    const avatarUrl = `/avatars/${filename}`;
    const updated = await db.user.update({
      where: { id: user.id },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
      },
    });

    return ok(updated);
  } catch (error) {
    return handleUnknownError("avatar upload", error);
  }
});

export const DELETE = withAuth(async (request: NextRequest, { user }) => {
  try {
    // Удаляем аватар из профиля
    const updated = await db.user.update({
      where: { id: user.id },
      data: { avatar: null },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
      },
    });

    return ok(updated);
  } catch (error) {
    return handleUnknownError("avatar delete", error);
  }
});
