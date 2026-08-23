import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AICoachService } from "@/lib/ai/ai-coach.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/assessment/start
 * Automatically starts or resumes the interactive all-in-one health assessment for the user.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await AICoachService.startOrResumeAssessment(session.user.id);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("POST /api/ai/assessment/start error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start assessment" },
      { status: 500 }
    );
  }
}
