import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RecommendationService } from "@/lib/services/recommendation.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const recommendations = await RecommendationService.getReceivedRecommendations(session.user.id);
    return NextResponse.json({ recommendations });
  } catch (err: any) {
    console.error("GET /api/community/recommendations error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch recommendations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const created = await RecommendationService.sendRecommendation(session.user.id, body);
    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/community/recommendations error:", err);
    return NextResponse.json({ error: err.message || "Failed to send recommendation" }, { status: 400 });
  }
}
