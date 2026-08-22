import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UnifiedActivityService } from "@/lib/services/unified-activity.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/activities?date=YYYY-MM-DD[&view=weekly]
 * Returns unified daily or weekly activity metrics combining cardio & workouts
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const view = searchParams.get("view");

    if (view === "weekly") {
      const weekly = await UnifiedActivityService.getWeeklyActivitiesSummary(session.user.id, date);
      return NextResponse.json({ success: true, data: weekly });
    }

    const daily = await UnifiedActivityService.getDailyActivities(session.user.id, date);
    return NextResponse.json({ success: true, data: daily });
  } catch (error: any) {
    console.error("GET /api/activities Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve activities." },
      { status: 500 }
    );
  }
}
