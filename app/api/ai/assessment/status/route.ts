import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        aiAssessmentStatus: true,
        aiAssessmentCompletedAt: true,
        primaryGoal: true,
      },
    });

    return NextResponse.json({
      status: profile?.aiAssessmentStatus || "NOT_STARTED",
      completedAt: profile?.aiAssessmentCompletedAt || null,
      primaryGoal: profile?.primaryGoal || null,
    });
  } catch (error: any) {
    console.error("GET /api/ai/assessment/status error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch assessment status" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { status } = body;

    const allowed = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "DISMISSED_FOR_NOW"];
    if (!status || !allowed.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updated = await prisma.userProfile.update({
      where: { userId: session.user.id },
      data: {
        aiAssessmentStatus: status,
        ...(status === "COMPLETED" ? { aiAssessmentCompletedAt: new Date() } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      status: updated.aiAssessmentStatus,
      completedAt: updated.aiAssessmentCompletedAt,
    });
  } catch (error: any) {
    console.error("POST /api/ai/assessment/status error:", error);
    return NextResponse.json({ error: error.message || "Failed to update assessment status" }, { status: 500 });
  }
}
