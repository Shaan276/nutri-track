import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AICoachService } from "@/lib/ai/ai-coach.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversations = await AICoachService.getUserConversations(session.user.id);
    const defaultConvId = await AICoachService.getOrCreateDefaultConversation(session.user.id);

    return NextResponse.json({
      conversations,
      defaultConversationId: defaultConvId,
    });
  } catch (error: any) {
    console.error("GET /api/ai/conversations error:", error);
    return NextResponse.json({ error: error.message || "Failed to load conversations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const newConv = await AICoachService.createConversation(session.user.id, body.title);

    return NextResponse.json(newConv, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/ai/conversations error:", error);
    return NextResponse.json({ error: error.message || "Failed to create conversation" }, { status: 500 });
  }
}
