import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RecommendationService } from "@/lib/services/recommendation.service";

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
    const { action } = body; // 'SAVE' | 'DISMISS'

    if (!action || !["SAVE", "DISMISS"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const result = await RecommendationService.respondToRecommendation(session.user.id, id, action);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("PUT /api/community/recommendations/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to respond to recommendation" }, { status: 400 });
  }
}
