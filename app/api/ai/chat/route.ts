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
    const { conversationId, message, imageBase64 } = body;

    if ((!message || typeof message !== "string" || !message.trim()) && !imageBase64) {
      return NextResponse.json({ error: "Message content or meal image is required" }, { status: 400 });
    }

    let targetConvId = conversationId;
    if (!targetConvId) {
      targetConvId = await AICoachService.getOrCreateDefaultConversation(session.user.id);
    }

    const result = await AICoachService.processMessage(
      session.user.id,
      targetConvId,
      (message || "").trim(),
      imageBase64
    );

    return NextResponse.json({
      conversationId: targetConvId,
      ...result,
    });
  } catch (error: any) {
    console.error("POST /api/ai/chat error:", error);
    const status = error.message?.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json({ error: error.message || "Failed to process chat message" }, { status });
  }
}
