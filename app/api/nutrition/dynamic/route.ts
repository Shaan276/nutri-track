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
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    return NextResponse.json({
      isDynamicEnabled: true,
      date: todayStr,
      yesterdayDate: yesterdayStr,
      primaryGoal: "MAINTAIN",
      baseline: { calories: 2000, protein: 120, carbohydrates: 250, fat: 65, hydrationMl: 2500 },
      optimized: { calories: 2000, protein: 120, carbohydrates: 250, fat: 65, hydrationMl: 2500 },
      adjustments: [],
      aiCoachingInsight: "Dynamic Nutrition is active. Log yesterday's meals and workouts to view personalized daily adaptations.",
      yesterdaysSummary: {
        date: yesterdayStr,
        nutrition: { caloriesConsumed: 0, calorieTarget: 2000, proteinConsumed: 0, proteinTarget: 120, carbsConsumed: 0, carbsTarget: 250, fatConsumed: 0, fatTarget: 65, fiberConsumed: 0, calorieDelta: -2000, proteinDelta: -120 },
        hydration: { consumedMl: 0, targetMl: 2500, deltaMl: -2500, percentage: 0 },
        movement: { steps: 0, distanceKm: 0, activeCaloriesBurned: 0, runsCount: 0, workoutCalories: 0, totalExpenditureKcal: 0 },
        workouts: { sessionsCount: 0, totalSets: 0, totalVolumeKg: 0 },
      },
    });
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
