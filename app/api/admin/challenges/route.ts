import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ChallengeService } from "@/lib/services/challenge.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const challenges = await ChallengeService.getAdminChallenges();
    return NextResponse.json({ success: true, challenges });
  } catch (error: any) {
    console.error("GET /api/admin/challenges error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch challenges" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, category, targetValue, unit, durationDays, badgeIcon, isPublic } = body;

    if (!title || !description || !category || !targetValue || !unit) {
      return NextResponse.json({ error: "Missing required challenge fields" }, { status: 400 });
    }

    const challenge = await ChallengeService.createChallenge({
      title,
      description,
      category,
      targetValue: Number(targetValue),
      unit,
      durationDays: Number(durationDays || 30),
      badgeIcon: badgeIcon || "Trophy",
      isPublic: isPublic !== false,
    });

    return NextResponse.json({ success: true, challenge }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/admin/challenges error:", error);
    return NextResponse.json({ error: error.message || "Failed to create challenge" }, { status: 500 });
  }
}
