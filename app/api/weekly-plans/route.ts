import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WeeklyPlanService } from "@/lib/services/weekly-plan.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/weekly-plans[?date=YYYY-MM-DD][?activeOnly=true]
 * Retrieves weekly plans or the active plan for the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const dateStr = url.searchParams.get("date") || undefined;
    const activeOnly = url.searchParams.get("activeOnly") === "true";

    if (activeOnly || dateStr) {
      const active = await WeeklyPlanService.getActiveWeeklyPlan(session.user.id, dateStr);
      return NextResponse.json({ success: true, data: active });
    }

    const plans = await WeeklyPlanService.getUserWeeklyPlans(session.user.id);
    return NextResponse.json({ success: true, data: plans });
  } catch (error: any) {
    console.error("GET /api/weekly-plans error:", error);
    return NextResponse.json({ error: error.message || "Failed to retrieve weekly plans" }, { status: 500 });
  }
}

/**
 * POST /api/weekly-plans
 * Creates or generates a weekly plan.
 * Body can include:
 * - action: "GENERATE_AI" (with startDate, customGoal)
 * - Or direct plan object (startDate, endDate, goalSummary, items)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (body.action === "GENERATE_AI") {
      const plan = await WeeklyPlanService.generateAIWeeklyPlan(session.user.id, body.startDate, {
        customGoal: body.customGoal,
      });
      return NextResponse.json({ success: true, data: plan });
    }

    if (!body.startDate || !body.goalSummary) {
      return NextResponse.json({ error: "startDate and goalSummary are required" }, { status: 400 });
    }

    const plan = await WeeklyPlanService.createWeeklyPlan(session.user.id, {
      startDate: body.startDate,
      endDate: body.endDate,
      goalSummary: body.goalSummary,
      notes: body.notes,
      items: body.items,
    });

    return NextResponse.json({ success: true, data: plan });
  } catch (error: any) {
    console.error("POST /api/weekly-plans error:", error);
    return NextResponse.json({ error: error.message || "Failed to create weekly plan" }, { status: 400 });
  }
}
