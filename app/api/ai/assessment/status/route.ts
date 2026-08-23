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

    const memory = await prisma.aIMemory.findFirst({
      where: {
        userId: session.user.id,
        category: "ASSESSMENT_STATUS",
      },
    });

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { primaryGoal: true },
    }).catch(() => null);

    return NextResponse.json({
      status: memory?.content || "NOT_STARTED",
      completedAt: memory?.content === "COMPLETED" ? memory.updatedAt : null,
      primaryGoal: profile?.primaryGoal || null,
    });
  } catch (error: any) {
    console.error("GET /api/ai/assessment/status error:", error);
    return NextResponse.json({ status: "NOT_STARTED", completedAt: null }, { status: 200 });
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

    const existing = await prisma.aIMemory.findFirst({
      where: {
        userId: session.user.id,
        category: "ASSESSMENT_STATUS",
      },
    });

    let record;
    if (existing) {
      record = await prisma.aIMemory.update({
        where: { id: existing.id },
        data: {
          content: status,
          updatedAt: new Date(),
        },
      });
    } else {
      record = await prisma.aIMemory.create({
        data: {
          userId: session.user.id,
          category: "ASSESSMENT_STATUS",
          content: status,
          importance: 5,
          source: "SYSTEM",
        },
      });
    }

    return NextResponse.json({
      success: true,
      status: record.content,
      completedAt: record.content === "COMPLETED" ? record.updatedAt : null,
    });
  } catch (error: any) {
    console.error("POST /api/ai/assessment/status error:", error);
    return NextResponse.json({ error: error.message || "Failed to update assessment status" }, { status: 500 });
  }
}
