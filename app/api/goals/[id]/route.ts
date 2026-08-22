import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoalService } from "@/lib/services/goal.service";
import { updateGoalSchema } from "@/lib/validations/goals";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goal = await GoalService.getGoalById(session.user.id, params.id);
    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json(goal);
  } catch (error: any) {
    console.error(`GET /api/goals/${params.id} error:`, error);
    return NextResponse.json({ error: error.message || "Failed to fetch goal" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateGoalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const updated = await GoalService.updateGoal(session.user.id, params.id, parsed.data);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(`PATCH /api/goals/${params.id} error:`, error);
    return NextResponse.json({ error: error.message || "Failed to update goal" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await GoalService.deleteGoal(session.user.id, params.id);
    return NextResponse.json({ success: true, message: "Goal deleted successfully" });
  } catch (error: any) {
    console.error(`DELETE /api/goals/${params.id} error:`, error);
    return NextResponse.json({ error: error.message || "Failed to delete goal" }, { status: 500 });
  }
}
