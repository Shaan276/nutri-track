import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { IntegrationService } from "@/lib/services/integrations/integration.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/integrations/strava/disconnect
 * Disconnects Strava and removes all stored tokens for the authenticated user.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const success = await IntegrationService.disconnectIntegration(session.user.id, "STRAVA");

    return NextResponse.json({
      status: "success",
      disconnected: success,
    });
  } catch (error: any) {
    console.error("POST /api/integrations/strava/disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect Strava integration" },
      { status: 500 }
    );
  }
}
