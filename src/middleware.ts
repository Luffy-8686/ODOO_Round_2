import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { ROLE_HOME_MAP, Role, isValidRole } from "./lib/roles";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static files, next internals, public assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/public") ||
    pathname === "/" ||
    pathname === "/403"
  ) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "champions-club-jwt-secret-key-prod-2026",
  });

  const isAuthenticated = !!token;
  const userRole = (token?.role as Role) || null;

  // 1. Allow public APIs for landing page
  const isPublicApi =
    (req.method === "GET" && (
      pathname === "/api/settings" ||
      pathname.startsWith("/api/courts") ||
      pathname.startsWith("/api/shop/products") ||
      pathname.startsWith("/api/notifications") ||
      pathname.startsWith("/api/demo/")
    )) ||
    (pathname === "/api/crm/leads");

  if (isPublicApi) {
    return NextResponse.next();
  }

  // 2. Unauthenticated handling
  if (!isAuthenticated) {
    if (pathname === "/login") {
      return NextResponse.next();
    }

    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized. Session required." }, { status: 401 });
    }

    // Redirect to login with callback
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated user visiting /login -> redirect to their role dashboard
  if (pathname === "/login") {
    const destination = userRole && isValidRole(userRole) ? ROLE_HOME_MAP[userRole] : "/portal";
    return NextResponse.redirect(new URL(destination, req.url));
  }

  // 3. Legacy /app route redirections to role-specific homes
  if (pathname === "/app" || pathname === "/app/dashboard") {
    const destination = userRole && isValidRole(userRole) ? ROLE_HOME_MAP[userRole] : "/portal";
    return NextResponse.redirect(new URL(destination, req.url));
  }

  // Legacy module redirection
  if (pathname === "/app/finance") {
    if (userRole === "OWNER") {
      return NextResponse.redirect(new URL("/app/owner/finance", req.url));
    }
    return NextResponse.redirect(new URL("/403", req.url));
  }

  if (pathname === "/app/hr") {
    if (userRole === "OWNER") {
      return NextResponse.redirect(new URL("/app/owner/hr", req.url));
    }
    if (userRole === "MANAGER") {
      return NextResponse.redirect(new URL("/app/manager/leaves", req.url));
    }
    return NextResponse.redirect(new URL("/403", req.url));
  }

  if (pathname === "/app/settings") {
    if (userRole === "OWNER") {
      return NextResponse.redirect(new URL("/app/owner/settings", req.url));
    }
    return NextResponse.redirect(new URL("/403", req.url));
  }

  if (pathname === "/app/courts") {
    if (userRole === "FRONT_DESK" || userRole === "MANAGER" || userRole === "OWNER") {
      return NextResponse.redirect(new URL("/app/desk/courts", req.url));
    }
    if (userRole === "COACH") {
      return NextResponse.redirect(new URL("/app/coach", req.url));
    }
    return NextResponse.redirect(new URL("/portal", req.url));
  }

  if (pathname === "/app/members") {
    if (userRole === "FRONT_DESK" || userRole === "MANAGER" || userRole === "OWNER") {
      return NextResponse.redirect(new URL("/app/desk/members", req.url));
    }
    return NextResponse.redirect(new URL("/403", req.url));
  }

  if (pathname === "/app/shop") {
    if (userRole === "SHOP_STAFF" || userRole === "MANAGER" || userRole === "OWNER") {
      return NextResponse.redirect(new URL("/app/shop-admin", req.url));
    }
    return NextResponse.redirect(new URL("/403", req.url));
  }

  if (pathname === "/app/crm") {
    if (userRole === "MANAGER" || userRole === "OWNER") {
      return NextResponse.redirect(new URL("/app/manager/crm", req.url));
    }
    return NextResponse.redirect(new URL("/403", req.url));
  }

  // 4. Role Portal Prefix Boundary Enforcement
  if (pathname.startsWith("/app/owner")) {
    if (userRole !== "OWNER") {
      return NextResponse.redirect(new URL("/403", req.url));
    }
  }

  if (pathname.startsWith("/app/manager")) {
    if (userRole !== "OWNER" && userRole !== "MANAGER") {
      return NextResponse.redirect(new URL("/403", req.url));
    }
  }

  if (pathname.startsWith("/app/desk")) {
    if (userRole !== "OWNER" && userRole !== "MANAGER" && userRole !== "FRONT_DESK") {
      return NextResponse.redirect(new URL("/403", req.url));
    }
  }

  if (pathname.startsWith("/app/bar")) {
    if (userRole !== "OWNER" && userRole !== "MANAGER" && userRole !== "BAR_STAFF") {
      return NextResponse.redirect(new URL("/403", req.url));
    }
  }

  if (pathname.startsWith("/app/shop-admin")) {
    if (userRole !== "OWNER" && userRole !== "MANAGER" && userRole !== "SHOP_STAFF") {
      return NextResponse.redirect(new URL("/403", req.url));
    }
  }

  if (pathname.startsWith("/app/coach")) {
    if (userRole !== "OWNER" && userRole !== "COACH") {
      return NextResponse.redirect(new URL("/403", req.url));
    }
  }

  if (pathname.startsWith("/portal")) {
    // If a non-member tries to view member portal without being authenticated
    if (!userRole) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/app/:path*",
    "/portal/:path*",
    "/api/bookings/:path*",
    "/api/members/:path*",
    "/api/courts/:path*",
    "/api/inventory/:path*",
    "/api/orders/:path*",
    "/api/tabs/:path*",
    "/api/hr/:path*",
    "/api/finance/:path*",
    "/api/settings/:path*",
    "/api/users/:path*",
  ],
};
