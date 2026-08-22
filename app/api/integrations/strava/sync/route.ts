import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { StravaService } from "@/lib/services/integrations/strava.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/integrations/strava/sync
 * Manually triggers a synchronization of Strava activities for the authenticated user.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const result = await StravaService.syncActivities(session.user.id, {
      simulatedActivities: body.simulatedActivities,
      limit: body.limit || 30,
    });

    return NextResponse.json({
      status: "success",
      data: result,
    });
  } catch (error: any) {
    console.error("POST /api/integrations/strava/sync error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to synchronize Strava activities" },
      { status: 500 }
    );
  }
}
