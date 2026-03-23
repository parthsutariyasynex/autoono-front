import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Keep <img src="/images/..."> stable while serving the real files you already have.
  if (pathname === "/images/btire-logo.png") {
    return NextResponse.rewrite(new URL("/logo/btire-logo-horizontal.svg", request.url));
  }

  if (pathname === "/images/bridgestone-altalayi.png") {
    return NextResponse.rewrite(new URL("/logo/atcl-bridgestone-logo-v1.jpg", request.url));
  }

  // Protect private routes
  const protectedRoutes = ["/products", "/customer", "/my-account", "/catalogue"];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || "yoursecret",
    });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - logo (logo directory)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login|logo).*)",
  ],
};

