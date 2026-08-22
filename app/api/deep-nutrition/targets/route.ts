import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DeepNutritionService } from "@/lib/services/deep-nutrition.service";
import { updateNutrientTargetsSchema } from "@/lib/validations/deep-nutrition";

export const dynamic = "force-dynamic";

/**
 * GET /api/deep-nutrition/targets
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const targets = await DeepNutritionService.getUserTargets(session.user.id);
    return NextResponse.json({ success: true, data: targets });
  } catch (err: any) {
    console.error("GET /api/deep-nutrition/targets error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch nutrient targets" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/deep-nutrition/targets
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateNutrientTargetsSchema.parse(body);

    const updated = await DeepNutritionService.updateUserTargets(session.user.id, validated);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("PUT /api/deep-nutrition/targets error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update nutrient targets" },
      { status: 400 }
    );
  }
}
