import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION = "pl_session";

export function middleware(request: NextRequest) {
  const signedIn = Boolean(request.cookies.get(SESSION)?.value);
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard") && !signedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if ((pathname === "/login" || pathname === "/") && signedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (pathname === "/" && !signedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/connecting" && !signedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/connecting", "/dashboard/:path*"],
};
