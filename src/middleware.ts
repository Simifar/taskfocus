import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecret } from "@/server/jwt-secret";

const AUTH_COOKIE = "auth-token";
const PROTECTED_PREFIXES = ["/profile"];

async function isAuthenticated(token: string | undefined): Promise<boolean> {
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

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (await isAuthenticated(token)) return NextResponse.next();

  const loginUrl = new URL("/", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/profile/:path*"],
};
