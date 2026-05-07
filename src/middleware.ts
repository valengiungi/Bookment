import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const loggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  if (pathname.startsWith("/dashboard")) {
    if (!loggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (!req.auth?.user?.tenantId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if (pathname.startsWith("/onboarding")) {
    if (!loggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (role === "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!loggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding", "/onboarding/:path*", "/admin/:path*"],
};
