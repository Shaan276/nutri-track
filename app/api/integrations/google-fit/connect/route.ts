import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleFitService } from "@/lib/services/integrations/google-fit.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/integrations/google-fit/connect
 * Generates Google OAuth 2.0 URL with fitness scopes.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const redirectUri = searchParams.get("redirect_uri") || undefined;

    const authUrl = await GoogleFitService.getAuthorizationUrl(session.user.id, redirectUri);

    return NextResponse.json({
      status: "success",
      url: authUrl,
    });
  } catch (error: any) {
    console.error("GET /api/integrations/google-fit/connect error:", error);
    return NextResponse.json(
      { error: "Failed to generate Google Fit authorization URL" },
      { status: 500 }
    );
  }
}
