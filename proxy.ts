import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "@/auth.config";
import { canAccessPath, DEFAULT_LOGIN_REDIRECT, isAuthRoute, isPublicRoute } from "@/lib/rbac";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const pathname = req.nextUrl.pathname;
  const isLoggedIn = Boolean(req.auth?.user);
  const role = req.auth?.user?.role;

  if (isAuthRoute(pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, req.nextUrl));
  }

  if (!isLoggedIn && !isPublicRoute(pathname)) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && !canAccessPath(pathname, role)) {
    return NextResponse.redirect(new URL("/acces-refuse", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|api/health|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
