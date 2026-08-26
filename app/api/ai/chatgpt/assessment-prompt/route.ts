import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateChatGPTAssessmentPrompt } from "@/lib/ai/assessment-generator";
import { HealthContextService } from "@/lib/services/health-context.service";
import { AIMemoryService } from "@/lib/ai/memory-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai/chatgpt/assessment-prompt
 * Returns the intelligent, provenance-aware health assessment prompt for copying into ChatGPT.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [snapshot, memories] = await Promise.all([
      HealthContextService.getHealthSnapshot(session.user.id).catch(() => null),
      AIMemoryService.getUserMemories(session.user.id).catch(() => []),
    ]);

    const profile = snapshot?.profile;

    const prompt = generateChatGPTAssessmentPrompt({
      userName: session.user.name || profile?.name || "me",
      confirmedItems: {
        heightCm: profile?.heightCm || null,
        weightKg: profile?.weightKg || null,
        biologicalSex: profile?.biologicalSex || null,
        primaryGoal: profile?.primaryGoal || null,
      },
      savedMemories: (memories || []).map((m: any) => ({ category: m.category, content: m.content })),
    });

    return NextResponse.json({
      success: true,
      prompt,
    });
  } catch (error: any) {
    console.error("GET /api/ai/chatgpt/assessment-prompt error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate assessment prompt" },
      { status: 500 }
    );
  }
}
