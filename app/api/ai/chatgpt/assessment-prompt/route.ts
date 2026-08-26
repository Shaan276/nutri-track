import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateChatGPTAssessmentPrompt } from "@/lib/ai/assessment-generator";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai/chatgpt/assessment-prompt
 * Returns the 7-part grouped health assessment prompt for copying into ChatGPT.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prompt = generateChatGPTAssessmentPrompt({
      userName: session.user.name || "me",
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
