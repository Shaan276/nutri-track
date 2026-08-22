import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CommunityService } from "@/lib/services/community.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    const results = await CommunityService.searchUsers(session.user.id, query);
    return NextResponse.json({ results });
  } catch (err: any) {
    console.error("GET /api/community/search error:", err);
    return NextResponse.json({ error: err.message || "Search failed" }, { status: 500 });
  }
}
