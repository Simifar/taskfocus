import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_COOKIE = "auth-token";
const PROTECTED_PREFIXES = ["/profile"];

function getSecretKey(): Uint8Array | null {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) return null;
  return new TextEncoder().encode(secret);
}

async function isAuthenticated(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const key = getSecretKey();
  if (!key) return false;
  try {
    await jwtVerify(token, key);
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
