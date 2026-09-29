import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieName } from "@/lib/auth";
import { safeNextPath } from "@/lib/safe-next-path";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublicRoute = pathname === "/login" || pathname === "/api/health";
  const isApiRoute = pathname.startsWith("/api/");
  const hasSession = Boolean(request.cookies.get(sessionCookieName)?.value);
  if (!hasSession && isApiRoute && !isPublicRoute) {
    return Response.json({ code: "AUTHENTICATION_REQUIRED", error: "Authentication required" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  if (!hasSession && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(safeNextPath(`${pathname}${request.nextUrl.search}`))}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
