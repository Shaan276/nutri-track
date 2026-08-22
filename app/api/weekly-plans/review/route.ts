import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WeeklyPlanService } from "@/lib/services/weekly-plan.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/weekly-plans/review[?startDate=YYYY-MM-DD]
 * Generates an evidence-grounded Weekly Review based on actual database logs.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const startDate = url.searchParams.get("startDate") || undefined;

    const review = await WeeklyPlanService.generateWeeklyReview(session.user.id, startDate);
    return NextResponse.json({ success: true, data: review });
  } catch (error: any) {
    console.error("GET /api/weekly-plans/review error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate weekly review" }, { status: 500 });
  }
}
