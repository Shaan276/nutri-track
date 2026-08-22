import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CommunityService } from "@/lib/services/community.service";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { action } = body; // 'ACCEPT' | 'DECLINE' | 'BLOCK'

    if (!action || !["ACCEPT", "DECLINE", "BLOCK"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const result = await CommunityService.respondToFriendRequest(session.user.id, id, action);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("PUT /api/community/friends/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to respond to request" }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params; // Target user ID
    await CommunityService.removeFriend(session.user.id, id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/community/friends/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to remove friend" }, { status: 400 });
  }
}
