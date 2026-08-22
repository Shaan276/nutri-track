import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { StravaService } from "@/lib/services/integrations/strava.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/integrations/strava/callback?code=...&state=...
 * Handles Strava OAuth callback, token exchange, and redirects back to Connected Services settings.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL("/settings?tab=integrations&error=" + encodeURIComponent(error), req.url)
      );
    }

    if (!code) {
      return NextResponse.redirect(
        new URL("/settings?tab=integrations&error=Missing+authorization+code", req.url)
      );
    }

    let userId: string | null = null;

    // Check if user ID is encoded in state
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
        if (decoded.userId) userId = decoded.userId;
      } catch {}
    }

    // Fallback to active session
    if (!userId) {
      const session = await getServerSession(authOptions);
      if (session?.user?.id) userId = session.user.id;
    }

    if (!userId) {
      return NextResponse.redirect(
        new URL("/settings?tab=integrations&error=Unauthorized", req.url)
      );
    }

    await StravaService.exchangeCodeForTokens(userId, code);

    // Automatically trigger initial background sync
    try {
      await StravaService.syncActivities(userId, { limit: 10 });
    } catch (syncErr) {
      console.warn("Initial Strava sync warning:", syncErr);
    }

    return NextResponse.redirect(
      new URL("/settings?tab=integrations&strava_connected=true", req.url)
    );
  } catch (error: any) {
    console.error("GET /api/integrations/strava/callback error:", error);
    return NextResponse.redirect(
      new URL(
        "/settings?tab=integrations&error=" + encodeURIComponent(error.message || "OAuth exchange failed"),
        req.url
      )
    );
  }
}
