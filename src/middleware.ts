import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getToken } from "next-auth/jwt";
import { getJwtSecret } from "@/server/jwt-secret";

const AUTH_COOKIE = "auth-token";
const PROTECTED_PREFIXES = ["/profile"];

async function isAuthenticated(req: NextRequest): Promise<boolean> {
  // NextAuth session (Google OAuth users)
  const nextAuthToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET! });
  if (nextAuthToken) return true;

  // Custom JWT cookie (email/password users)
  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, getJwtSecret());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!needsAuth) return NextResponse.next();

  if (await isAuthenticated(req)) return NextResponse.next();

  const loginUrl = new URL("/", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/profile/:path*"],
};
