import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

export default function middleware(request: NextRequest) {
  // Handle legacy routes without locale and redirect to default locale
  const pathname = request.nextUrl.pathname;
  
  // If the pathname doesn't start with a locale, add the default locale
  if (!routing.locales.some(locale => pathname.startsWith(`/${locale}`))) {
    // Skip API routes and static files
    if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
      return NextResponse.next();
    }
    
    // Redirect to default locale (Russian)
    const newPathname = `/ru${pathname}`;
    return NextResponse.redirect(new URL(newPathname, request.url));
  }
  
  // Use next-intl middleware for i18n routes
  return createMiddleware(routing)(request);
}

export const config = {
  // Match all pathnames except for static files and API routes
  matcher: ['/((?!_next|api|favicon.ico).*)']
};
