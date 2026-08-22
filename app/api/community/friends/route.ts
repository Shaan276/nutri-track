import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CommunityService } from "@/lib/services/community.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const friends = await CommunityService.getFriends(session.user.id);
    const requests = await CommunityService.getPendingRequests(session.user.id);

    return NextResponse.json({
      friends,
      incomingRequests: requests.incoming,
      outgoingRequests: requests.outgoing,
    });
  } catch (err: any) {
    console.error("GET /api/community/friends error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch friends" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { target } = body;

    if (!target) {
      return NextResponse.json({ error: "Target user is required" }, { status: 400 });
    }

    const result = await CommunityService.sendFriendRequest(session.user.id, target);
    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/community/friends error:", err);
    return NextResponse.json({ error: err.message || "Failed to send friend request" }, { status: 400 });
  }
}
