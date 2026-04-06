import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: "UNAUTHORIZED",
            message: "Не авторизован",
          },
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = updateProfileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          error: {
            code: "VALIDATION_ERROR",
            message: "Неверные данные",
          },
        },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        ...(result.data.name && { name: result.data.name }),
        ...(result.data.avatar && { avatar: result.data.avatar }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
      },
      error: null,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: "INTERNAL_ERROR",
          message: "Ошибка сервера",
        },
      },
      { status: 500 }
    );
  }
}
