import { NextResponse, type NextRequest } from "next/server";
import { sessionCookieName } from "@/lib/auth";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublicRoute = pathname === "/login" || pathname === "/api/health";
  const hasSession = Boolean(request.cookies.get(sessionCookieName)?.value);
  if (!hasSession && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
