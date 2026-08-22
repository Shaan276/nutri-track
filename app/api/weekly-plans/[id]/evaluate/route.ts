import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WeeklyPlanService } from "@/lib/services/weekly-plan.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/weekly-plans/[id]/evaluate
 * Evaluates planned items against actual logged database records without false positives.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const evaluated = await WeeklyPlanService.evaluatePlanVsActual(session.user.id, id);

    return NextResponse.json({ success: true, data: evaluated });
  } catch (error: any) {
    console.error("POST /api/weekly-plans/[id]/evaluate error:", error);
    const status = error.message?.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: error.message || "Failed to evaluate plan" }, { status });
  }
}
