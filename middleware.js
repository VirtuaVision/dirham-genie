import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "dg_admin_session";

// Paths only a full admin (not an editor) should reach — team management
// and site-wide settings are the two areas where an editor account could
// otherwise escalate their own access or change things beyond
// "products & content".
const ADMIN_ONLY_PREFIXES = ["/admin/team", "/admin/settings", "/api/admin/site-settings", "/api/team"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow the login page itself, and the login API route, through.
  if (pathname === "/admin/login" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin") || pathname.startsWith("/api/team")) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    try {
      const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
      const { payload } = await jwtVerify(token, secret);

      const isAdminOnlyPath = ADMIN_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));
      if (isAdminOnlyPath && payload.role !== "admin") {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Admin access required." }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/admin", request.url));
      }

      return NextResponse.next();
    } catch {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/team/:path*"],
};