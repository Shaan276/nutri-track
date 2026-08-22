import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DeepNutritionService } from "@/lib/services/deep-nutrition.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/deep-nutrition?date=YYYY-MM-DD
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    const analysis = await DeepNutritionService.getDeepNutritionAnalysis(session.user.id, date);

    return NextResponse.json({ success: true, data: analysis });
  } catch (err: any) {
    console.error("GET /api/deep-nutrition error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch deep nutrition analysis" },
      { status: 500 }
    );
  }
}
