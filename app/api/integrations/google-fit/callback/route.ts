import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
      return NextResponse.redirect(
        new URL("/settings?error=Google authentication session expired. Please log in first.", req.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/settings?error=No authorization code provided by Google.", req.url)
      );
    }

    await GoogleFitService.handleCallback(targetUserId, code);

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
