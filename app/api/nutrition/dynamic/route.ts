import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { DynamicNutritionService } from "@/lib/services/dynamic-nutrition.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || undefined;

    const data = await DynamicNutritionService.calculateDynamicOptimization(session.user.id, date);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("GET /api/nutrition/dynamic error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate dynamic nutrition" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const enabled = Boolean(body.enabled);

    const updatedStatus = await DynamicNutritionService.setDynamicNutritionEnabled(
      session.user.id,
      enabled
    );

    const data = await DynamicNutritionService.calculateDynamicOptimization(session.user.id);

    return NextResponse.json({
      status: "success",
      isDynamicEnabled: updatedStatus,
      message: updatedStatus
        ? "Dynamic Nutrition enabled! Today's targets are now auto-optimized from yesterday's performance."
        : "Dynamic Nutrition disabled. Today's targets are set to static profile baseline.",
      data,
    });
  } catch (error: any) {
    console.error("POST /api/nutrition/dynamic error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update dynamic nutrition status" },
      { status: 500 }
    );
  }
}
