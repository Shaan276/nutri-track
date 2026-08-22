import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { HealthContextService } from "@/lib/services/health-context.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/health-context/snapshot?date=YYYY-MM-DD
 * Retrieves the centralized, single-source-of-truth live health snapshot for the authenticated user.
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Expected YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const snapshot = await HealthContextService.getHealthSnapshot(session.user.id, date);

    return NextResponse.json({
      status: "success",
      data: snapshot,
    });
  } catch (error: any) {
    console.error("GET /api/health-context/snapshot error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve health context snapshot" },
      { status: 500 }
    );
  }
}
