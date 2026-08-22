import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CommunityService } from "@/lib/services/community.service";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = params;
    const profile = await CommunityService.getFriendSharedProfile(session.user.id, username);
    return NextResponse.json(profile);
  } catch (err: any) {
    console.error("GET /api/community/users/[username] error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch user profile" }, { status: 404 });
  }
}
