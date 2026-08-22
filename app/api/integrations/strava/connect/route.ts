import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { StravaService } from "@/lib/services/integrations/strava.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/integrations/strava/connect
 * Returns the official Strava OAuth 2.0 authorization URL.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const redirectUri = searchParams.get("redirect_uri") || undefined;

    const authUrl = StravaService.getAuthorizationUrl(session.user.id, redirectUri);

    return NextResponse.json({
      status: "success",
      url: authUrl,
    });
  } catch (error: any) {
    console.error("GET /api/integrations/strava/connect error:", error);
    return NextResponse.json(
      { error: "Failed to generate Strava authorization URL" },
      { status: 500 }
    );
  }
}
