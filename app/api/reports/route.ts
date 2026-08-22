import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ReportService } from "@/lib/services/report.service";
import { ReportRangePreset } from "@/lib/validations/report";

export const dynamic = "force-dynamic";

/**
 * GET /api/reports
 * Fetches comprehensive analytical telemetry across Nutrition, Hydration, Activities, and Workouts
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = (searchParams.get("range") || "last7days") as ReportRangePreset;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const report = await ReportService.getFullReport(session.user.id, range, startDate, endDate);

    return NextResponse.json({ success: true, data: report });
  } catch (err: any) {
    console.error("GET /api/reports error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate analytics report" },
      { status: 500 }
    );
  }
}
