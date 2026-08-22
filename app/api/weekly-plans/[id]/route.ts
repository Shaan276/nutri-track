import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WeeklyPlanService } from "@/lib/services/weekly-plan.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/weekly-plans/[id]
 * Retrieves a single weekly plan by ID with strict ownership validation.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const plan = await WeeklyPlanService.getWeeklyPlanById(session.user.id, id);
    return NextResponse.json({ success: true, data: plan });
  } catch (error: any) {
    console.error("GET /api/weekly-plans/[id] error:", error);
    const status = error.message?.includes("Unauthorized") ? 403 : 404;
    return NextResponse.json({ error: error.message || "Failed to retrieve plan" }, { status });
  }
}

/**
 * PATCH /api/weekly-plans/[id]
 * Updates a weekly plan (goalSummary, status, notes).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const updated = await WeeklyPlanService.updateWeeklyPlan(session.user.id, id, {
      goalSummary: body.goalSummary,
      status: body.status,
      notes: body.notes,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PATCH /api/weekly-plans/[id] error:", error);
    const status = error.message?.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: error.message || "Failed to update plan" }, { status });
  }
}

/**
 * DELETE /api/weekly-plans/[id]
 * Deletes a weekly plan and its items.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    await WeeklyPlanService.deleteWeeklyPlan(session.user.id, id);

    return NextResponse.json({ success: true, message: "Weekly plan deleted" });
  } catch (error: any) {
    console.error("DELETE /api/weekly-plans/[id] error:", error);
    const status = error.message?.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: error.message || "Failed to delete plan" }, { status });
  }
}
