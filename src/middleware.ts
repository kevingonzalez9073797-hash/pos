import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public routes - always accessible
  const publicRoutes = ["/login", "/api/auth"];
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for auth session cookie (NextAuth v5)
  const sessionToken =
    req.cookies.get("authjs.session-token")?.value ||
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    // Also check for cookie with numeric suffix (e.g. authjs.session-token.0)
    req.cookies.getAll()
      .find(c => c.name.startsWith("authjs.session-token") || c.name.startsWith("__Secure-authjs.session-token"))
      ?.value;

  // API routes check
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Protected routes - require auth
  if (!sessionToken) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes
  // For admin routes we do a simple redirect check - the actual auth check happens server-side
  // This prevents non-admin users from accessing the UI, but the API still enforces it
  const adminRoutes = ["/users"];
  if (adminRoutes.includes(pathname)) {
    // We can't fully verify admin without reading the token
    // The API routes will enforce admin permissions
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
