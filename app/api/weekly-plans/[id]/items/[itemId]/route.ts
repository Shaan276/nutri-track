import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WeeklyPlanService } from "@/lib/services/weekly-plan.service";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/weekly-plans/[id]/items/[itemId]
 * Updates an individual plan item (title, description, isCompleted, category, targetData).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = params;
    const body = await req.json();

    const updated = await WeeklyPlanService.updatePlanItem(session.user.id, itemId, {
      title: body.title,
      description: body.description,
      category: body.category,
      date: body.date,
      isCompleted: body.isCompleted,
      targetData: body.targetData,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PATCH /api/weekly-plans/[id]/items/[itemId] error:", error);
    const status = error.message?.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: error.message || "Failed to update plan item" }, { status });
  }
}

/**
 * DELETE /api/weekly-plans/[id]/items/[itemId]
 * Deletes an individual plan item.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = params;
    await WeeklyPlanService.deletePlanItem(session.user.id, itemId);

    return NextResponse.json({ success: true, message: "Plan item deleted" });
  } catch (error: any) {
    console.error("DELETE /api/weekly-plans/[id]/items/[itemId] error:", error);
    const status = error.message?.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: error.message || "Failed to delete plan item" }, { status });
  }
}
