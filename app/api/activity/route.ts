import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ActivityService } from "@/lib/services/activity.service";
import { logActivitySchema } from "@/lib/validations/activity";

export const dynamic = "force-dynamic";

/**
 * GET /api/activity?date=YYYY-MM-DD&view=daily|weekly
 * Retrieves daily activities or weekly running trend summary.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const view = searchParams.get("view") || "daily";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format. Expected YYYY-MM-DD." }, { status: 400 });
    }

    if (view === "weekly") {
      const weeklyData = await ActivityService.getWeeklyActivitySummary(session.user.id, date);
      return NextResponse.json({
        status: "success",
        data: weeklyData,
      });
    }

    const dailyData = await ActivityService.getDailyActivity(session.user.id, date);

    return NextResponse.json({
      status: "success",
      data: dailyData,
    });
  } catch (error: any) {
    console.error("GET /api/activity error:", error);
    return NextResponse.json({ error: "Failed to retrieve activity records" }, { status: 500 });
  }
}

/**
 * POST /api/activity
 * Logs a new workout or run entry.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = logActivitySchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid activity data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const entry = await ActivityService.logActivity(session.user.id, parseResult.data);

    return NextResponse.json(
      {
        status: "success",
        message: "Run logged successfully",
        entry,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/activity error:", error);
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 });
  }
}
