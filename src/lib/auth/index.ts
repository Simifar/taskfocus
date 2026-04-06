import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET is required");
}

const SECRET_KEY = new TextEncoder().encode(jwtSecret);

export interface JWTPayload extends Record<string, unknown> {
  userId: string;
  email: string;
  username: string;
}

// Создание JWT токена
export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

// Верификация JWT токена
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

// Получение текущего пользователя из cookies
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  
  if (!token) return null;
  
  const payload = await verifyToken(token);
  if (!payload) return null;
  
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      avatar: true,
    },
  });
  
  return user;
}

// Хеширование пароля
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Проверка пароля
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
