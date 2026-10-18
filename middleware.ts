import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION = "pl_session";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const isSignout = searchParams.has("signout") || searchParams.has("logout") || searchParams.has("error");

  if (pathname === "/login" && isSignout) {
    const response = NextResponse.next();
    response.cookies.delete(SESSION);
    response.cookies.set(SESSION, "", { path: "/", maxAge: 0, sameSite: "none", secure: true });
    response.cookies.set(SESSION, "", { path: "/", maxAge: 0, sameSite: "lax" });
    return response;
  }

  const sessionCookie = request.cookies.get(SESSION)?.value;
  const signedIn = Boolean(sessionCookie && sessionCookie !== "deleted" && sessionCookie.length > 5);

  if (pathname.startsWith("/dashboard") && !signedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if ((pathname === "/login" || pathname === "/") && signedIn && !isSignout) {
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
