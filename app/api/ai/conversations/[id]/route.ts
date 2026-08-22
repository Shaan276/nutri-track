import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AICoachService } from "@/lib/ai/ai-coach.service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversation = await AICoachService.getConversation(session.user.id, params.id);
    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error(`GET /api/ai/conversations/${params.id} error:`, error);
    const status = error.message?.includes("Unauthorized") ? 403 : 404;
    return NextResponse.json({ error: error.message || "Failed to retrieve conversation" }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await AICoachService.deleteConversation(session.user.id, params.id);
    return NextResponse.json({ success: true, message: "Conversation deleted" });
  } catch (error: any) {
    console.error(`DELETE /api/ai/conversations/${params.id} error:`, error);
    const status = error.message?.includes("Unauthorized") ? 403 : 400;
    return NextResponse.json({ error: error.message || "Failed to delete conversation" }, { status });
  }
}
