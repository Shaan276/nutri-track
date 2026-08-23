import { prisma } from "@/lib/db";
import { NutritionService } from "@/lib/services/nutrition.service";
import { HydrationService } from "@/lib/services/hydration.service";
import { ActivityService } from "@/lib/services/activity.service";
import { WorkoutService } from "@/lib/services/workout.service";
import { HealthContextService } from "@/lib/services/health-context.service";

export interface YesterdaysDataSummary {
  date: string;
  nutrition: {
    caloriesConsumed: number;
    calorieTarget: number;
    proteinConsumed: number;
    proteinTarget: number;
    carbsConsumed: number;
    carbsTarget: number;
    fatConsumed: number;
    fatTarget: number;
    fiberConsumed: number;
    calorieDelta: number; // positive = surplus, negative = deficit
    proteinDelta: number;
  };
  hydration: {
    consumedMl: number;
    targetMl: number;
    deltaMl: number;
    percentage: number;
  };
  movement: {
    steps: number;
    distanceKm: number;
    activeCaloriesBurned: number;
    runsCount: number;
    workoutCalories: number;
    totalExpenditureKcal: number;
  };
  workouts: {
    sessionsCount: number;
    totalSets: number;
    totalVolumeKg: number;
  };
}

export interface DynamicNutritionTargetResult {
  isDynamicEnabled: boolean;
  date: string;
  yesterdayDate: string;
  primaryGoal: string;
  baseline: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    hydrationMl: number;
  };
  optimized: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    hydrationMl: number;
  };
  adjustments: Array<{
    target: "calories" | "protein" | "carbohydrates" | "fat" | "hydrationMl";
    delta: number;
    unit: string;
    reason: string;
  }>;
  aiCoachingInsight: string;
  yesterdaysSummary: YesterdaysDataSummary;
}

export class DynamicNutritionService {
  private static DYNAMIC_NUTRITION_PREFIX = "[DYNAMIC_NUTRITION_ENABLED]:";

  /**
   * Retrieves whether Dynamic Nutrition auto-optimization is enabled for a user
   */
  public static async isDynamicNutritionEnabled(userId: string): Promise<boolean> {
    try {
      const memory = await (prisma as any).aiMemory.findFirst({
        where: {
          userId,
          category: "PREFERENCE",
          content: { startsWith: this.DYNAMIC_NUTRITION_PREFIX },
        },
      });

      if (memory) {
        return memory.content.includes("true");
      }
      return true; // Enabled by default for intelligence!
    } catch {
      return true;
    }
  }

  /**
   * Toggles or sets Dynamic Nutrition auto-optimization preference
   */
  public static async setDynamicNutritionEnabled(userId: string, enabled: boolean): Promise<boolean> {
    try {
      const existing = await (prisma as any).aiMemory.findFirst({
        where: {
          userId,
          category: "PREFERENCE",
          content: { startsWith: this.DYNAMIC_NUTRITION_PREFIX },
        },
      });

      const content = `${this.DYNAMIC_NUTRITION_PREFIX} ${enabled ? "true" : "false"}`;

      if (existing) {
        await (prisma as any).aiMemory.update({
          where: { id: existing.id },
          data: { content },
        });
      } else {
        await (prisma as any).aiMemory.create({
          data: {
            userId,
            category: "PREFERENCE",
            content,
          },
        });
      }

      return enabled;
    } catch (err) {
      console.error("Failed to set dynamic nutrition status:", err);
      return enabled;
    }
  }

  /**
   * Aggregates yesterday's comprehensive nutrition, hydration, runs, and workouts
   */
  public static async getYesterdaysData(userId: string, referenceDateStr?: string): Promise<YesterdaysDataSummary> {
    const today = referenceDateStr ? new Date(referenceDateStr) : new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const [dailyNutrition, dailyHydration, dailyActivities, dailyWorkouts, profile] = await Promise.all([
      NutritionService.getDailyNutrition(userId, yesterdayStr),
      HydrationService.getDailyHydration(userId, yesterdayStr),
      ActivityService.getDailyActivity(userId, yesterdayStr),
      WorkoutService.getDailyWorkouts(userId, yesterdayStr),
      HealthContextService.getHealthSnapshot(userId, yesterdayStr),
    ]);

    const caloriesConsumed = dailyNutrition.totals.calories || 0;
    const calorieTarget = profile.nutrition.calorieTarget || 2000;
    const proteinConsumed = dailyNutrition.totals.protein || 0;
    const proteinTarget = profile.nutrition.proteinTarget || 120;
    const carbsConsumed = dailyNutrition.totals.carbs || 0;
    const carbsTarget = profile.nutrition.carbsTarget || 250;
    const fatConsumed = dailyNutrition.totals.fat || 0;
    const fatTarget = profile.nutrition.fatsTarget || 65;
    const fiberConsumed = dailyNutrition.totals.fiber || 0;

    const consumedMl = dailyHydration.totalMl || 0;
    const targetMl = profile.hydration.targetMl || 2500;

    const steps = dailyActivities.totalSteps || 0;
    const distanceKm = dailyActivities.totalDistanceKm || 0;
    const activeCaloriesBurned = dailyActivities.totalCaloriesBurned || 0;
    const runsCount = (dailyActivities.activities || []).filter((a: any) => a.activityType === "RUNNING").length;

    const workoutCalories = dailyWorkouts.totalCaloriesBurned || 0;
    const totalSets = dailyWorkouts.totalSetsCompleted || 0;
    let totalVolumeKg = 0;

    for (const wk of dailyWorkouts.sessions) {
      for (const ex of wk.exercises || []) {
        for (const s of ex.sets || []) {
          totalVolumeKg += (Number(s.weightKg) || 0) * (Number(s.reps) || 0);
        }
      }
    }

    return {
      date: yesterdayStr,
      nutrition: {
        caloriesConsumed,
        calorieTarget,
        proteinConsumed,
        proteinTarget,
        carbsConsumed,
        carbsTarget,
        fatConsumed,
        fatTarget,
        fiberConsumed,
        calorieDelta: caloriesConsumed - calorieTarget,
        proteinDelta: proteinConsumed - proteinTarget,
      },
      hydration: {
        consumedMl,
        targetMl,
        deltaMl: consumedMl - targetMl,
        percentage: Math.round((consumedMl / targetMl) * 100),
      },
      movement: {
        steps,
        distanceKm: Math.round(distanceKm * 10) / 10,
        activeCaloriesBurned,
        runsCount,
        workoutCalories,
        totalExpenditureKcal: activeCaloriesBurned + workoutCalories,
      },
      workouts: {
        sessionsCount: dailyWorkouts.sessions.length,
        totalSets,
        totalVolumeKg: Math.round(totalVolumeKg),
      },
    };
  }

  /**
   * Computes today's dynamically optimized targets based on yesterday's actual data and user goals
   */
  public static async calculateDynamicOptimization(
    userId: string,
    todayDateStr?: string
  ): Promise<DynamicNutritionTargetResult> {
    const todayStr = todayDateStr || new Date().toISOString().split("T")[0];
    const isDynamicEnabled = await this.isDynamicNutritionEnabled(userId);
    const yesterdaySummary = await this.getYesterdaysData(userId, todayStr);
    const snapshot = await HealthContextService.getHealthSnapshot(userId, todayStr);

    const primaryGoal = snapshot.profile.primaryGoal || "MAINTAIN";
    const baseline = {
      calories: snapshot.nutrition.calorieTarget || 2000,
      protein: snapshot.nutrition.proteinTarget || 120,
      carbohydrates: snapshot.nutrition.carbsTarget || 250,
      fat: snapshot.nutrition.fatsTarget || 65,
      hydrationMl: snapshot.hydration.targetMl || 2500,
    };

    if (!isDynamicEnabled) {
      return {
        isDynamicEnabled: false,
        date: todayStr,
        yesterdayDate: yesterdaySummary.date,
        primaryGoal,
        baseline,
        optimized: { ...baseline },
        adjustments: [],
        aiCoachingInsight: "Dynamic Nutrition is currently OFF. Your targets are fixed at your profile baseline.",
        yesterdaysSummary: yesterdaySummary,
      };
    }

    const adjustments: Array<{
      target: "calories" | "protein" | "carbohydrates" | "fat" | "hydrationMl";
      delta: number;
      unit: string;
      reason: string;
    }> = [];

    let optCalories = baseline.calories;
    let optProtein = baseline.protein;
    let optCarbs = baseline.carbohydrates;
    let optFat = baseline.fat;
    let optHydration = baseline.hydrationMl;

    const y = yesterdaySummary;

    // 1. Protein Optimization based on yesterday's lifting/running/deficit
    if (y.workouts.totalVolumeKg > 1500 || y.movement.runsCount > 0 || y.nutrition.proteinDelta < -15) {
      const proteinBonus = y.workouts.totalVolumeKg > 3000 ? 25 : 15;
      optProtein += proteinBonus;
      adjustments.push({
        target: "protein",
        delta: proteinBonus,
        unit: "g",
        reason: `+${proteinBonus}g Protein for muscle recovery & rebuilding (yesterday: ${y.workouts.sessionsCount} workouts, ${y.workouts.totalVolumeKg}kg volume, ${y.movement.distanceKm}km running).`,
      });
    }

    // 2. Calorie & Carbohydrate Optimization based on active expenditure and goal
    if (y.movement.totalExpenditureKcal >= 300) {
      if (primaryGoal === "BUILD_MUSCLE" || primaryGoal === "MAINTAIN") {
        const calBonus = Math.min(350, Math.round(y.movement.totalExpenditureKcal * 0.5));
        const carbBonus = Math.round((calBonus * 0.7) / 4);
        optCalories += calBonus;
        optCarbs += carbBonus;
        adjustments.push({
          target: "calories",
          delta: calBonus,
          unit: "kcal",
          reason: `+${calBonus} kcal to replenish glycogen reserves from yesterday's ${y.movement.totalExpenditureKcal} active kcal burned.`,
        });
        adjustments.push({
          target: "carbohydrates",
          delta: carbBonus,
          unit: "g",
          reason: `+${carbBonus}g complex carbs for sustained athletic endurance and glycogen replenishment.`,
        });
      } else if (primaryGoal === "LOSE_WEIGHT") {
        const calBonus = Math.min(150, Math.round(y.movement.totalExpenditureKcal * 0.25));
        optCalories += calBonus;
        adjustments.push({
          target: "calories",
          delta: calBonus,
          unit: "kcal",
          reason: `+${calBonus} kcal moderate refueling to protect metabolic rate while preserving a steady fat-loss deficit.`,
        });
      }
    } else if (y.movement.totalExpenditureKcal < 100 && y.nutrition.calorieDelta > 200 && primaryGoal === "LOSE_WEIGHT") {
      const calReduction = -100;
      optCalories += calReduction;
      adjustments.push({
        target: "calories",
        delta: calReduction,
        unit: "kcal",
        reason: `-100 kcal slight calorie modulation to balance yesterday's light activity & caloric surplus.`,
      });
    }

    // 3. Hydration Optimization
    if (y.hydration.deltaMl < -400 || y.movement.distanceKm >= 4) {
      const hydraBonus = y.hydration.deltaMl < -600 ? 500 : 300;
      optHydration += hydraBonus;
      adjustments.push({
        target: "hydrationMl",
        delta: hydraBonus,
        unit: "ml",
        reason: `+${hydraBonus}ml hydration to replenish cellular hydration and electrolyte balance from yesterday.`,
      });
    }

    const aiCoachingInsight =
      adjustments.length > 0
        ? `⚡ **Dynamic Nutrition Intelligence Active**: Based on yesterday's performance (${y.movement.totalExpenditureKcal} kcal burned, ${y.workouts.totalVolumeKg}kg lifting volume, ${y.nutrition.proteinConsumed}g protein), today's targets have been optimized for your **${primaryGoal}** goal.`
        : `⚡ **Dynamic Nutrition Steady**: Yesterday's intake and expenditure were well-balanced. Your targets are primed for peak performance today!`;

    return {
      isDynamicEnabled: true,
      date: todayStr,
      yesterdayDate: yesterdaySummary.date,
      primaryGoal,
      baseline,
      optimized: {
        calories: optCalories,
        protein: optProtein,
        carbohydrates: optCarbs,
        fat: optFat,
        hydrationMl: optHydration,
      },
      adjustments,
      aiCoachingInsight,
      yesterdaysSummary: yesterdaySummary,
    };
  }
}
