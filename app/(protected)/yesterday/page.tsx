import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DynamicNutritionService } from "@/lib/services/dynamic-nutrition.service";
import { YesterdaysDataClient } from "@/components/yesterday/YesterdaysDataClient";

export const dynamic = "force-dynamic";

export default async function YesterdaysDataPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    redirect("/login");
  }

  let initialData = null;
  try {
    initialData = await DynamicNutritionService.calculateDynamicOptimization(session.user.id);
  } catch (err) {
    console.error("Error calculating dynamic nutrition on /yesterday:", err);
  }

  if (!initialData) {
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    initialData = {
      isDynamicEnabled: true,
      date: todayStr,
      yesterdayDate: yesterdayStr,
      primaryGoal: "MAINTAIN",
      baseline: { calories: 2000, protein: 120, carbohydrates: 250, fat: 65, hydrationMl: 2500 },
      optimized: { calories: 2000, protein: 120, carbohydrates: 250, fat: 65, hydrationMl: 2500 },
      adjustments: [],
      aiCoachingInsight: "Dynamic Nutrition is active! Log yesterday's meals and workouts to view personalized daily adaptations.",
      yesterdaysSummary: {
        date: yesterdayStr,
        nutrition: { caloriesConsumed: 0, calorieTarget: 2000, proteinConsumed: 0, proteinTarget: 120, carbsConsumed: 0, carbsTarget: 250, fatConsumed: 0, fatTarget: 65, fiberConsumed: 0, calorieDelta: -2000, proteinDelta: -120 },
        hydration: { consumedMl: 0, targetMl: 2500, deltaMl: -2500, percentage: 0 },
        movement: { steps: 0, distanceKm: 0, activeCaloriesBurned: 0, runsCount: 0, workoutCalories: 0, totalExpenditureKcal: 0 },
        workouts: { sessionsCount: 0, totalSets: 0, totalVolumeKg: 0 },
      },
    };
  }

  return (
    <div className="p-4 sm:p-8">
      <YesterdaysDataClient initialData={initialData} />
    </div>
  );
}
