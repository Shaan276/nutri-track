import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GoogleFitService } from "@/lib/services/integrations/google-fit.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/integrations/google-fit/callback
 * Handles OAuth callback from Google Accounts.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const stateStr = searchParams.get("state");

    let targetUserId = session?.user?.id;

    if (!targetUserId && stateStr) {
      try {
        const decoded = JSON.parse(Buffer.from(stateStr, "base64url").toString("utf-8"));
        targetUserId = decoded.userId;
      } catch {}
    }

    if (!targetUserId) {
      // Fallback: resolve admin user so connection is never orphaned
      const admin = await prisma.user.findFirst({
        where: { email: "piyushpilkhwal74@gmail.com" },
      });
      targetUserId = admin?.id;
    }

    if (!targetUserId) {
      return NextResponse.redirect(
        new URL("/settings?error=Google authentication session expired. Please log in first.", req.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/settings?error=No authorization code provided by Google.", req.url)
      );
    }

    const reqUrl = new URL(req.url);
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || reqUrl.host;
    const proto = req.headers.get("x-forwarded-proto") || reqUrl.protocol.replace(":", "");
    const origin = `${proto}://${host}`;
    const redirectUri = `${origin}/api/integrations/google-fit/callback`;

    await GoogleFitService.handleCallback(targetUserId, code, redirectUri);

    return NextResponse.redirect(
      new URL("/settings?google_connected=true", req.url)
    );
  } catch (error: any) {
    console.error("GET /api/integrations/google-fit/callback error:", error);
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(error.message || "Failed to link Google Fit")}`, req.url)
    );
  }
}
