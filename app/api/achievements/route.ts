import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AchievementService } from "@/lib/services/achievement.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await AchievementService.getUserAchievements(session.user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/achievements error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch achievements" }, { status: 500 });
  }
}
