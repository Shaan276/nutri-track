import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { HealthContextGenerator } from "@/lib/ai/health-context-generator";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai/chatgpt/context
 * Returns a rich, formatted Markdown Health Context Snapshot of the user's Nutri-Track data
 * for copying directly into their ChatGPT Project.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contextMarkdown = await HealthContextGenerator.generateMarkdownSummary(session.user.id);

    return NextResponse.json({
      success: true,
      context: contextMarkdown,
      markdown: contextMarkdown,
    });
  } catch (error: any) {
    console.error("GET /api/ai/chatgpt/context error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate health context summary" },
      { status: 500 }
    );
  }
}
