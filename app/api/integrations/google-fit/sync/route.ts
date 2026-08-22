import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleFitService } from "@/lib/services/integrations/google-fit.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/integrations/google-fit/sync
 * Syncs latest steps, active calories, and health metrics from Google Account.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const days = body.days ? Number(body.days) : 1;
    const timezoneOffsetMinutes = body.timezoneOffsetMinutes !== undefined ? Number(body.timezoneOffsetMinutes) : 0;

    const result = await GoogleFitService.syncGoogleFit(session.user.id, {
      days,
      timezoneOffsetMinutes,
    });

    return NextResponse.json({
      success: result.success,
      data: result,
      message: result.message,
    });
  } catch (err: any) {
    console.error("POST /api/integrations/google-fit/sync error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to sync Google Fit telemetry",
        data: {
          status: "API_ERROR",
          message: "Unable to sync steps right now.",
        },
      },
      { status: 500 }
    );
  }
}
