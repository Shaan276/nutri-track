import { NextResponse } from "next/server";
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

    const feed = await CommunityService.getActivityFeed(session.user.id);
    return NextResponse.json({ feed });
  } catch (err: any) {
    console.error("GET /api/community/feed error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch activity feed" }, { status: 500 });
  }
}
