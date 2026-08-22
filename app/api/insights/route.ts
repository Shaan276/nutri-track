import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SmartInsightsService } from "@/lib/services/insights/smart-insights.service";
import { ReportRangePreset } from "@/lib/validations/report";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const rawPreset = searchParams.get("preset") || "last7days";
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const validPresets: ReportRangePreset[] = [
      "today",
      "thisWeek",
      "last7days",
      "last30days",
      "thisMonth",
      "custom",
    ];

    const preset: ReportRangePreset = validPresets.includes(rawPreset as ReportRangePreset)
      ? (rawPreset as ReportRangePreset)
      : "last7days";

    const insights = await SmartInsightsService.getSmartInsights(
      session.user.id,
      preset,
      startDate,
      endDate
    );

    return NextResponse.json(insights, { status: 200 });
  } catch (error) {
    console.error("Smart Insights API error:", error);
    return NextResponse.json(
      { error: "Failed to generate smart insights", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
