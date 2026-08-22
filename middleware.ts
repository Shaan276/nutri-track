import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/**
 * Next.js Route Protection Middleware
 * - Unauthenticated access to protected routes -> redirect to /login
 * - Authenticated access to /login or /register -> redirect to /app (or /awaiting-approval if not approved)
 * - Admin route protection -> only ADMIN role allowed
 * - Mandatory Account Approval -> PENDING_APPROVAL, REJECTED, SUSPENDED redirected to /awaiting-approval
 */
export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "development-secret-for-nutritrack-foundation-32chars",
  });

  const { pathname } = req.nextUrl;

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isAdminRoute = pathname.startsWith("/admin");
  const isAwaitingApprovalRoute = pathname === "/awaiting-approval";

  const isProtectedRoute =
    pathname.startsWith("/app") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/foods") ||
    pathname.startsWith("/nutrition") ||
    pathname.startsWith("/deep-nutrition") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/hydration") ||
    pathname.startsWith("/activities") ||
    pathname.startsWith("/running") ||
    pathname.startsWith("/activity") ||
    pathname.startsWith("/workouts") ||
    pathname.startsWith("/insights") ||
    pathname.startsWith("/community") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/ai-coach") ||
    pathname.startsWith("/goals") ||
    isAdminRoute;

  // 1. Unauthenticated users cannot access protected routes
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If authenticated user attempts auth routes (login/register)
  if (isAuthRoute && token) {
    if ((token.accountStatus as string) !== "APPROVED" && (token.role as string) !== "ADMIN") {
      return NextResponse.redirect(new URL("/awaiting-approval", req.url));
    }
    return NextResponse.redirect(new URL("/app", req.url));
  }

  // 3. Admin Route RBAC: only users with role 'ADMIN' can access /admin
  if (isAdminRoute && token) {
    if ((token.role as string) !== "ADMIN") {
      return NextResponse.redirect(new URL("/app", req.url));
    }
  }

  // 4. Mandatory User Approval Check for standard protected routes
  if (token && isProtectedRoute && !isAdminRoute) {
    const isApproved = (token.accountStatus as string) === "APPROVED" || (token.role as string) === "ADMIN";
    if (!isApproved && !isAwaitingApprovalRoute) {
      return NextResponse.redirect(new URL("/awaiting-approval", req.url));
    }
  }

  // 5. If user is already approved and goes to /awaiting-approval, redirect to /app
  if (token && isAwaitingApprovalRoute) {
    const isApproved = (token.accountStatus as string) === "APPROVED" || (token.role as string) === "ADMIN";
    if (isApproved) {
      return NextResponse.redirect(new URL("/app", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/app/:path*",
    "/onboarding/:path*",
    "/profile/:path*",
    "/foods/:path*",
    "/nutrition/:path*",
    "/deep-nutrition/:path*",
    "/reports/:path*",
    "/hydration/:path*",
    "/activities/:path*",
    "/running/:path*",
    "/activity/:path*",
    "/workouts/:path*",
    "/insights/:path*",
    "/community/:path*",
    "/settings/:path*",
    "/ai-coach/:path*",
    "/goals/:path*",
    "/admin/:path*",
    "/awaiting-approval",
    "/login",
    "/register",
  ],
};
