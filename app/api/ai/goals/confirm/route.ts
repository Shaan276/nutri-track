import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AICoachService } from "@/lib/ai/ai-coach.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { targetKey, newValue } = body;

    if (!targetKey || newValue === undefined || isNaN(Number(newValue))) {
      return NextResponse.json({ error: "Valid targetKey and numeric newValue are required" }, { status: 400 });
    }

    const result = await AICoachService.confirmGoalUpdate(
      session.user.id,
      targetKey,
      Number(newValue)
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/ai/goals/confirm error:", error);
    return NextResponse.json({ error: error.message || "Failed to update target" }, { status: 500 });
  }
}
