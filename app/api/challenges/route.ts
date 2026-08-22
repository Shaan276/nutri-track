import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ChallengeService } from "@/lib/services/challenge.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const challenges = await ChallengeService.getChallenges(session.user.id);
    return NextResponse.json({ challenges });
  } catch (error: any) {
    console.error("GET /api/challenges error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch challenges" }, { status: 500 });
  }
}
