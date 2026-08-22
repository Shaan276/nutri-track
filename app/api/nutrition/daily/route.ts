import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NutritionService } from "@/lib/services/nutrition.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/nutrition/daily?date=YYYY-MM-DD
 * Retrieves consolidated daily nutrition statistics, targets, and progress.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Invalid date format. Expected YYYY-MM-DD." }, { status: 400 });
    }

    const dailyData = await NutritionService.getDailyNutrition(session.user.id, date);

    return NextResponse.json({
      status: "success",
      data: dailyData,
    });
  } catch (error: any) {
    console.error("GET /api/nutrition/daily error:", error);
    return NextResponse.json({ error: "Failed to retrieve daily nutrition" }, { status: 500 });
  }
}
