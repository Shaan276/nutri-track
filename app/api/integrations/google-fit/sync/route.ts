import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleFitService } from "@/lib/services/integrations/google-fit.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/integrations/google-fit/sync
 * Syncs latest steps, active calories, and health metrics from Google Fit.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await GoogleFitService.syncGoogleFit(session.user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("POST /api/integrations/google-fit/sync error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to sync Google Fit telemetry" },
      { status: 500 }
    );
  }
}
