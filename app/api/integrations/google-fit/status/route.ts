import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/integrations/google-fit/status
 * Returns Google account connection state, last synced time, and today's cached step count.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pool = prisma as any;
    const conn = await pool.integrationConnection.findUnique({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: "GOOGLE_FIT",
        },
      },
    });

    const isConnected = conn && conn.status === "CONNECTED";
    const todayStr = new Date().toISOString().split("T")[0];

    const todayLog = await pool.activityLog.findFirst({
      where: {
        userId: session.user.id,
        date: todayStr,
        source: "GOOGLE_FIT",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        isConnected: Boolean(isConnected),
        externalUsername: conn?.externalUsername || null,
        lastSyncAt: conn?.lastSyncAt ? new Date(conn.lastSyncAt).toISOString() : null,
        todaySteps: todayLog?.steps || 0,
        todayCalories: todayLog?.caloriesBurned || 0,
        todayDistanceKm: todayLog?.distanceKm || 0,
      },
    });
  } catch (err: any) {
    console.error("GET /api/integrations/google-fit/status error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve status" },
      { status: 500 }
    );
  }
}
