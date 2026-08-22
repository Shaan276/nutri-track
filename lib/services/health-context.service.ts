import { prisma } from "@/lib/db";
import { UserSettingsService } from "./user-settings.service";
import { NutritionService } from "./nutrition.service";
import { HydrationService } from "./hydration.service";
import { SmartInsightsService } from "./insights/smart-insights.service";
import { ReportService } from "./report.service";
import { AIMemoryService } from "@/lib/ai/memory-service";

export type HealthDataState = "LOGGED" | "NOT_LOGGED_YET" | "UNAVAILABLE" | "PENDING";

export interface HealthContextSnapshot {
  userId: string;
  generatedAt: string;
  date: string;

  profile: {
    name: string;
    biologicalSex: string;
    heightCm: number;
    weightKg: number;
    primaryGoal: string;
    bmr: number;
    tdee: number;
  };

  nutrition: {
    dataState: HealthDataState;
    hasLoggedMeals: boolean;
    caloriesConsumed: number;
    calorieTarget: number;
    caloriesRemaining: number;
    proteinConsumed: number;
    proteinTarget: number;
    proteinRemaining: number;
    carbsConsumed: number;
    carbsTarget: number;
    fatsConsumed: number;
    fatsTarget: number;
    fiberConsumed: number;
    sugarConsumed: number;
    mealCount: number;
  };

  hydration: {
    dataState: HealthDataState;
    hasLoggedHydration: boolean;
    consumedMl: number;
    targetMl: number;
    remainingMl: number;
    percentage: number;
    streakDays: number;
    entryCount: number;
  };

  movement: {
    todaySteps: number;
    dailyStepTarget: number;
    stepPercentage: number;
    todayDistanceKm: number;
    activityCalories: number;
    workoutCalories: number;
    totalActiveCalories: number;
    weeklyRunningDistanceKm: number;
    weeklyRunningTargetKm: number;
    todayActivitySessions: number;
  };

  workouts: {
    todayWorkoutSessions: number;
    weeklyWorkoutSessions: number;
    weeklyWorkoutTarget: number;
    weeklyWorkoutVolumeKg: number;
  };

  healthScore: {
    score: number;
    letterGrade: string;
    gradeLabel: string;
    isPending: boolean;
  };

  deepNutrition: {
    available: boolean;
    lowMicronutrients: Array<{
      label: string;
      percentage: number;
      target: number;
      unit: string;
    }>;
  };

  memories: Array<{
    id: string;
    category: string;
    content: string;
  }>;

  integrations: Array<{
    provider: string;
    status: string;
    lastSyncAt: string | null;
  }>;

  goals: {
    activeGoalsCount: number;
    completedGoalsCount: number;
    featuredGoal: {
      name: string;
      category: string;
      progressPercentage: number;
      remainingAmount: number;
      unit: string;
      daysRemaining: number;
    } | null;
  };
}

export class HealthContextService {
  /**
   * Builds the centralized, single-source-of-truth live health snapshot for the authenticated user
   */
  static async getHealthSnapshot(
    userId: string,
    targetDate?: string
  ): Promise<HealthContextSnapshot> {
    const date = targetDate || new Date().toISOString().split("T")[0];
    const pool = (prisma as any);

    // 1. Settings & Metabolic Baseline
    const settings = await UserSettingsService.getUserSettings(userId);

    // 2. Today's Nutrition
    const dailyNut = await NutritionService.getDailyNutrition(userId, date);
    const hasLoggedMeals = dailyNut.meals.some((m) => m.entries && m.entries.length > 0);
    const nutritionState: HealthDataState = hasLoggedMeals ? "LOGGED" : "NOT_LOGGED_YET";
    const caloriesRemaining = Math.max(0, dailyNut.targets.calories - dailyNut.totals.calories);
    const proteinRemaining = Math.max(
      0,
      Math.round((dailyNut.targets.protein - dailyNut.totals.protein) * 10) / 10
    );

    // 3. Today's Hydration
    const dailyHyd = await HydrationService.getDailyHydration(userId, date);
    const hasLoggedHydration = dailyHyd.totalMl > 0;
    const hydrationState: HealthDataState = hasLoggedHydration ? "LOGGED" : "NOT_LOGGED_YET";

    // 4. Movement & Activity Logs (Today & Weekly)
    const todayActivities = await pool.activityLog.findMany({
      where: { userId, date },
    });

    let todaySteps = 0;
    let todayDistanceKm = 0;
    let activityCalories = 0;

    for (const act of todayActivities) {
      todaySteps += Number(act.steps) || 0;
      todayDistanceKm += Number(act.distanceKm) || 0;
      activityCalories += Number(act.caloriesBurned) || 0;
    }

    // Weekly running calculation (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    const weeklyActivities = await pool.activityLog.findMany({
      where: {
        userId,
        date: { gte: weekAgoStr, lte: date },
      },
    });

    let weeklyRunningDistanceKm = 0;
    for (const act of weeklyActivities) {
      if (act.activityType === "RUN" || act.activityType === "RUNNING") {
        weeklyRunningDistanceKm += Number(act.distanceKm) || 0;
      }
    }

    // 5. Workouts (Today & Weekly)
    const todayWorkouts = await pool.workoutSession.findMany({
      where: { userId, date },
    });

    let todayWorkoutSessions = todayWorkouts.length;
    let workoutCalories = 0;
    for (const wk of todayWorkouts) {
      workoutCalories += Number(wk.caloriesBurned) || 0;
    }

    const weeklyWorkouts = await pool.workoutSession.findMany({
      where: {
        userId,
        date: { gte: weekAgoStr, lte: date },
      },
      include: {
        exercises: {
          include: { sets: true },
        },
      },
    });

    let weeklyWorkoutVolumeKg = 0;
    for (const wk of weeklyWorkouts) {
      if (wk.exercises) {
        for (const ex of wk.exercises) {
          if (ex.sets) {
            for (const s of ex.sets) {
              const reps = Number(s.reps) || 0;
              const weight = Number(s.weightKg) || 0;
              weeklyWorkoutVolumeKg += reps * weight;
            }
          }
        }
      }
    }

    // 6. Total Active Energy Expenditure (Strictly no double-counting)
    const totalActiveCalories = activityCalories + workoutCalories;

    // 7. Health Score (100-point system)
    let healthScoreData = {
      score: 0,
      letterGrade: "PENDING",
      gradeLabel: "Getting Started",
      isPending: true,
    };
    try {
      const insights = await SmartInsightsService.getSmartInsights(userId, "last7days");
      if (insights?.healthScore) {
        healthScoreData = {
          score: insights.healthScore.overallScore,
          letterGrade: insights.healthScore.grade,
          gradeLabel: insights.healthScore.gradeLabel || "Healthy",
          isPending: Boolean(insights.healthScore.isPending),
        };
      }
    } catch {
      // Safe fallback
    }

    // 8. Deep Nutrition Micronutrient Audit
    let lowMicronutrients: Array<{
      label: string;
      percentage: number;
      target: number;
      unit: string;
    }> = [];
    try {
      const rep = await ReportService.getFullReport(userId, "last7days");
      if (rep?.micronutrients) {
        lowMicronutrients = rep.micronutrients
          .filter((m) => m.percentage !== null && m.percentage < 70)
          .map((m) => ({
            label: m.label,
            percentage: m.percentage as number,
            target: m.target as number,
            unit: m.unit,
          }));
      }
    } catch {
      // Safe fallback
    }

    // 9. AI Memories
    const rawMemories = await AIMemoryService.getUserMemories(userId);
    const memories = rawMemories.map((m: any) => ({
      id: m.id,
      category: m.category,
      content: m.content,
    }));

    // 10. Connected Integrations (Tokens are never exposed)
    const connections = await pool.integrationConnection.findMany({
      where: { userId },
    });
    const integrations = connections.map((c: any) => ({
      provider: c.provider,
      status: c.status,
      lastSyncAt: c.lastSyncAt ? new Date(c.lastSyncAt).toISOString() : null,
    }));

    // Check Google Sheets legacy table if not in integration connections
    const googleSheet = await pool.googleSheetConnection.findUnique({
      where: { userId },
    });
    if (googleSheet && !integrations.some((i: any) => i.provider === "GOOGLE_SHEETS")) {
      integrations.push({
        provider: "GOOGLE_SHEETS",
        status: googleSheet.status || "CONNECTED",
        lastSyncAt: googleSheet.lastSyncAt ? new Date(googleSheet.lastSyncAt).toISOString() : null,
      });
    }

    const stepTarget = settings.profile.dailyStepTarget || 10000;
    const stepPercentage = Math.min(100, Math.round((todaySteps / stepTarget) * 100));

    // 11. Goals & Active Target Snapshot
    const userGoals = await pool.goal.findMany({ where: { userId } });
    const activeGoals = userGoals.filter((g: any) => g.status === "ACTIVE");
    const completedGoals = userGoals.filter((g: any) => g.status === "COMPLETED");
    let featuredGoal = null;
    if (activeGoals.length > 0) {
      const top = activeGoals[0];
      const progressPercentage = Math.min(100, Math.round(((top.currentValue || 0) / (top.targetValue || 1)) * 100));
      const remainingAmount = Math.max(0, Number(top.targetValue) - Number(top.currentValue || 0));
      featuredGoal = {
        name: top.name,
        category: top.category,
        progressPercentage,
        remainingAmount,
        unit: top.unit,
        daysRemaining: 0,
      };
    }

    return {
      userId,
      generatedAt: new Date().toISOString(),
      date,

      profile: {
        name: settings.user.name,
        biologicalSex: settings.profile.biologicalSex,
        heightCm: settings.profile.heightCm,
        weightKg: settings.profile.weightKg,
        primaryGoal: settings.profile.primaryGoal,
        bmr: settings.metabolic.bmr,
        tdee: settings.metabolic.tdee,
      },

      nutrition: {
        dataState: nutritionState,
        hasLoggedMeals,
        caloriesConsumed: dailyNut.totals.calories,
        calorieTarget: dailyNut.targets.calories,
        caloriesRemaining,
        proteinConsumed: dailyNut.totals.protein,
        proteinTarget: dailyNut.targets.protein,
        proteinRemaining,
        carbsConsumed: dailyNut.totals.carbs,
        carbsTarget: dailyNut.targets.carbs,
        fatsConsumed: dailyNut.totals.fat,
        fatsTarget: dailyNut.targets.fat,
        fiberConsumed: dailyNut.totals.fiber,
        sugarConsumed: dailyNut.totals.sugar,
        mealCount: dailyNut.meals.reduce((sum, m) => sum + (m.entries?.length || 0), 0),
      },

      hydration: {
        dataState: hydrationState,
        hasLoggedHydration,
        consumedMl: dailyHyd.totalMl,
        targetMl: dailyHyd.targetMl,
        remainingMl: dailyHyd.remainingMl,
        percentage: dailyHyd.percentage,
        streakDays: dailyHyd.streakDays,
        entryCount: dailyHyd.entries?.length || 0,
      },

      movement: {
        todaySteps,
        dailyStepTarget: stepTarget,
        stepPercentage,
        todayDistanceKm: Math.round(todayDistanceKm * 100) / 100,
        activityCalories,
        workoutCalories,
        totalActiveCalories,
        weeklyRunningDistanceKm: Math.round(weeklyRunningDistanceKm * 100) / 100,
        weeklyRunningTargetKm: settings.profile.weeklyRunningDistanceKm || 15.0,
        todayActivitySessions: todayActivities.length,
      },

      workouts: {
        todayWorkoutSessions,
        weeklyWorkoutSessions: weeklyWorkouts.length,
        weeklyWorkoutTarget: settings.profile.weeklyWorkoutSessions || 3,
        weeklyWorkoutVolumeKg: Math.round(weeklyWorkoutVolumeKg),
      },

      healthScore: healthScoreData,

      deepNutrition: {
        available: lowMicronutrients.length > 0 || hasLoggedMeals,
        lowMicronutrients,
      },

      memories,
      integrations,

      goals: {
        activeGoalsCount: activeGoals.length,
        completedGoalsCount: completedGoals.length,
        featuredGoal,
      },
    };
  }
}
