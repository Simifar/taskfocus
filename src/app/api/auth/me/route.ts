import { getCurrentUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
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

  return NextResponse.json({
    success: true,
    data: user,
    error: null,
  });
}
