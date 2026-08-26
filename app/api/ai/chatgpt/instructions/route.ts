import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateChatGPTProjectInstructions } from "@/lib/ai/chatgpt-instructions";
import { UserSettingsService } from "@/lib/services/user-settings.service";
import { AIMemoryService } from "@/lib/ai/memory-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai/chatgpt/instructions
 * Generates personalized Custom Instructions for the user's dedicated ChatGPT Project.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [settings, memories] = await Promise.all([
      UserSettingsService.getUserSettings(session.user.id).catch(() => null),
      AIMemoryService.getUserMemories(session.user.id).catch(() => []),
    ]);

    const instructions = generateChatGPTProjectInstructions({
      userName: session.user.name || settings?.user?.name || "Member",
      primaryGoal: settings?.profile?.primaryGoal || null,
      biologicalSex: settings?.profile?.biologicalSex || null,
      heightCm: settings?.profile?.heightCm || null,
      weightKg: settings?.profile?.weightKg || null,
      activityLevel: settings?.profile?.activityLevel || null,
      savedMemories: (memories || []).map((m: any) => ({ category: m.category, content: m.content })),
    });

    return NextResponse.json({
      success: true,
      instructions,
    });
  } catch (error: any) {
    console.error("GET /api/ai/chatgpt/instructions error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate project instructions" },
      { status: 500 }
    );
  }
}
