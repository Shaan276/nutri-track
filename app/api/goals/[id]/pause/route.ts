import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoalService } from "@/lib/services/goal.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paused = await GoalService.pauseGoal(session.user.id, params.id);
    return NextResponse.json(paused);
  } catch (error: any) {
    console.error(`POST /api/goals/${params.id}/pause error:`, error);
    return NextResponse.json({ error: error.message || "Failed to pause goal" }, { status: 500 });
  }
}
