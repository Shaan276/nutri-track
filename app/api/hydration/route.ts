import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { HydrationService } from "@/lib/services/hydration.service";
import { logHydrationSchema } from "@/lib/validations/hydration";

export const dynamic = "force-dynamic";

/**
 * GET /api/hydration?date=YYYY-MM-DD&view=daily|weekly
 * Retrieves daily hydration progress or weekly trend.
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
      const weeklyData = await HydrationService.getWeeklyHydration(session.user.id, date);
      return NextResponse.json({
        status: "success",
        data: weeklyData,
      });
    }

    const dailyData = await HydrationService.getDailyHydration(session.user.id, date);

    return NextResponse.json({
      status: "success",
      data: dailyData,
    });
  } catch (error: any) {
    console.error("GET /api/hydration error:", error);
    return NextResponse.json({ error: "Failed to retrieve hydration logs" }, { status: 500 });
  }
}

/**
 * POST /api/hydration
 * Logs a water or beverage intake entry.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = logHydrationSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid hydration entry data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const entry = await HydrationService.logHydration(session.user.id, parseResult.data);

    return NextResponse.json(
      {
        status: "success",
        message: "Hydration intake logged successfully",
        entry,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/hydration error:", error);
    return NextResponse.json({ error: "Failed to log hydration entry" }, { status: 500 });
  }
}
