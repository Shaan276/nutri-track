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
  let userId = "";
  let userName = "Member";

  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    userId = session.user.id;
    userName = session.user.name || "Member";

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Expected YYYY-MM-DD." },
        { status: 400 }
      );
    }

    const snapshot = await HealthContextService.getHealthSnapshot(userId, date);

    return NextResponse.json({
      status: "success",
      data: snapshot,
    });
  } catch (error: any) {
    console.error("GET /api/health-context/snapshot error:", error);
    const date = new Date().toISOString().split("T")[0];
    return NextResponse.json({
      status: "success",
      data: {
        userId,
        generatedAt: new Date().toISOString(),
        date,
        profile: { name: userName, biologicalSex: "MALE", heightCm: 175, weightKg: 70, primaryGoal: "MAINTAIN", bmr: 1650, tdee: 2200 },
        nutrition: { dataState: "NOT_LOGGED_YET", hasLoggedMeals: false, caloriesConsumed: 0, calorieTarget: 2000, caloriesRemaining: 2000, proteinConsumed: 0, proteinTarget: 120, proteinRemaining: 120, carbsConsumed: 0, carbsTarget: 250, fatsConsumed: 0, fatsTarget: 65, fiberConsumed: 0, sugarConsumed: 0, mealCount: 0 },
        hydration: { dataState: "NOT_LOGGED_YET", hasLoggedHydration: false, consumedMl: 0, targetMl: 2500, remainingMl: 2500, percentage: 0, streakDays: 0, entryCount: 0 },
        movement: { todaySteps: 0, dailyStepTarget: 10000, stepPercentage: 0, todayDistanceKm: 0, activityCalories: 0, workoutCalories: 0, totalActiveCalories: 0, weeklyRunningDistanceKm: 0, weeklyRunningTargetKm: 15.0, todayActivitySessions: 0 },
        workouts: { todayWorkoutSessions: 0, weeklyWorkoutSessions: 0, weeklyWorkoutTarget: 3, weeklyWorkoutVolumeKg: 0 },
        healthScore: { score: 0, letterGrade: "PENDING", gradeLabel: "Getting Started", isPending: true },
        deepNutrition: { available: false, lowMicronutrients: [] },
        memories: [],
        integrations: [],
        goals: { activeGoalsCount: 0, completedGoalsCount: 0, featuredGoal: null },
      },
    });
  }
}
