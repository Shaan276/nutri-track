import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/ai/actions/history
 * Retrieves recent action audit log records for the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") || 20), 50);

    const pool = prisma as any;
    const history = await pool.aiActionLog.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      history,
      actions: history,
    });
  } catch (error: any) {
    console.error("GET /api/ai/actions/history error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load action history" },
      { status: 500 }
    );
  }
}
