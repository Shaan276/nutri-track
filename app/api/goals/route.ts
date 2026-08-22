import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoalService } from "@/lib/services/goal.service";
import { createGoalSchema, getGoalsQuerySchema } from "@/lib/validations/goals";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = getGoalsQuerySchema.safeParse({
      category: searchParams.get("category") || undefined,
      status: searchParams.get("status") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query parameters", details: parsed.error }, { status: 400 });
    }

    const result = await GoalService.getGoals(session.user.id, parsed.data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/goals error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch goals" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = createGoalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.format() }, { status: 400 });
    }

    const goal = await GoalService.createGoal(session.user.id, parsed.data);
    return NextResponse.json(goal, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/goals error:", error);
    return NextResponse.json({ error: error.message || "Failed to create goal" }, { status: 500 });
  }
}
