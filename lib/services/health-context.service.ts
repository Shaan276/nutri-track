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
    biologicalSex: string | null;
    heightCm: number | null;
    weightKg: number | null;
    primaryGoal: string | null;
    bmr: number | null;
    tdee: number | null;
    isProfileComplete: boolean;
  };

  nutrition: {
    dataState: HealthDataState;
    hasLoggedMeals: boolean;
    caloriesConsumed: number;
    calorieTarget: number | null;
    caloriesRemaining: number | null;
    proteinConsumed: number;
    proteinTarget: number | null;
    proteinRemaining: number | null;
    carbsConsumed: number;
    carbsTarget: number | null;
    fatsConsumed: number;
    fatsTarget: number | null;
    fiberConsumed: number;
    sugarConsumed: number;
    mealCount: number;
    isTargetsConfigured: boolean;
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

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    const weekAgoStr = weekAgo.toISOString().split("T")[0];

    // High-performance parallel database query resolution with safe error catches
    const [
      settings,
      dailyNut,
      dailyHyd,
      todayActivities,
      weeklyActivities,
      todayWorkouts,
      weeklyWorkouts,
      insights,
      rep,
      rawMemories,
      connections,
      googleSheet,
      userGoals,
    ] = await Promise.all([
      UserSettingsService.getUserSettings(userId).catch(() => ({
        user: { id: userId, name: "Member", email: "", username: "" },
        profile: {
          id: "",
          userId,
          dateOfBirth: null,
          biologicalSex: null,
          heightCm: null,
          weightKg: null,
          activityLevel: null,
          dailyHydrationTargetMl: null,
          dailyStepTarget: null,
          weeklyRunningDistanceKm: null,
          weeklyWorkoutSessions: null,
          primaryGoal: null,
          isComplete: false,
        },
        nutritionGoals: {
          calories: null,
          protein: null,
          carbohydrates: null,
          fat: null,
          fiber: null,
          sugar: null,
          isConfigured: false,
        },
        metabolic: null,
        googleSheets: {
          isConnected: false,
          spreadsheetId: null,
          spreadsheetUrl: null,
          sheetTitle: null,
          lastSyncedAt: null,
          status: "DISCONNECTED",
        },
      })),
      NutritionService.getDailyNutrition(userId, date).catch(() => ({
        date,
        meals: [],
        totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
        targets: { calories: 2000, protein: 120, carbs: 250, fat: 65, fiber: 30, sugar: 50 },
      })),
      HydrationService.getDailyHydration(userId, date).catch(() => ({
        date,
        totalMl: 0,
        targetMl: 2500,
        remainingMl: 2500,
        percentage: 0,
        isGoalReached: false,
        streakDays: 0,
        entries: [],
      })),
      pool.activityLog?.findMany({ where: { userId, date } }).catch(() => []) || Promise.resolve([]),
      pool.activityLog?.findMany({ where: { userId, date: { gte: weekAgoStr, lte: date } } }).catch(() => []) || Promise.resolve([]),
      pool.workoutSession?.findMany({ where: { userId, date } }).catch(() => []) || Promise.resolve([]),
      pool.workoutSession?.findMany({
        where: { userId, date: { gte: weekAgoStr, lte: date } },
        include: { exercises: { include: { sets: true } } },
      }).catch(() => []) || Promise.resolve([]),
      SmartInsightsService.getSmartInsights(userId, "last7days").catch(() => null),
      ReportService.getFullReport(userId, "last7days").catch(() => null),
      AIMemoryService.getUserMemories(userId).catch(() => []),
      typeof pool.integrationConnection?.findMany === "function"
        ? pool.integrationConnection.findMany({ where: { userId } }).catch(() => [])
        : Promise.resolve([]),
      typeof pool.googleSheetConnection?.findUnique === "function"
        ? pool.googleSheetConnection.findUnique({ where: { userId } }).catch(() => null)
        : Promise.resolve(null),
      typeof pool.goal?.findMany === "function"
        ? pool.goal.findMany({ where: { userId } }).catch(() => [])
        : Promise.resolve([]),
    ]);

    // 2. Nutrition calculations
    const safeDailyNut = dailyNut || {
      meals: [],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
      targets: { calories: 2000, protein: 120, carbs: 250, fat: 65, fiber: 30, sugar: 50 },
    };
    const hasLoggedMeals = (safeDailyNut.meals || []).some((m: any) => m.entries && m.entries.length > 0);
    const nutritionState: HealthDataState = hasLoggedMeals ? "LOGGED" : "NOT_LOGGED_YET";
    const caloriesRemaining = Math.max(0, (safeDailyNut.targets?.calories || 2000) - (safeDailyNut.totals?.calories || 0));
    const proteinRemaining = Math.max(
      0,
      Math.round(((safeDailyNut.targets?.protein || 120) - (safeDailyNut.totals?.protein || 0)) * 10) / 10
    );

    // 3. Hydration calculations
    const safeDailyHyd = dailyHyd || {
      totalMl: 0,
      targetMl: 2500,
      remainingMl: 2500,
      percentage: 0,
      streakDays: 0,
      entries: [],
    };
    const hasLoggedHydration = (safeDailyHyd.totalMl || 0) > 0;
    const hydrationState: HealthDataState = hasLoggedHydration ? "LOGGED" : "NOT_LOGGED_YET";

    // 4. Movement & Activity Logs
    let todaySteps = 0;
    let todayDistanceKm = 0;
    let activityCalories = 0;

    for (const act of (todayActivities || [])) {
      todaySteps += Number(act.steps) || 0;
      todayDistanceKm += Number(act.distanceKm) || 0;
      activityCalories += Number(act.caloriesBurned) || 0;
    }

    let weeklyRunningDistanceKm = 0;
    for (const act of (weeklyActivities || [])) {
      if (act.activityType === "RUN" || act.activityType === "RUNNING") {
        weeklyRunningDistanceKm += Number(act.distanceKm) || 0;
      }
    }

    // 5. Workouts
    let todayWorkoutSessions = (todayWorkouts || []).length;
    let workoutCalories = 0;
    for (const wk of (todayWorkouts || [])) {
      workoutCalories += Number(wk.caloriesBurned) || 0;
    }

    let weeklyWorkoutVolumeKg = 0;
    for (const wk of (weeklyWorkouts || [])) {
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

    // 6. Total Active Energy Expenditure
    const totalActiveCalories = activityCalories + workoutCalories;

    // 7. Health Score (100-point system)
    let healthScoreData = {
      score: 0,
      letterGrade: "PENDING",
      gradeLabel: "Getting Started",
      isPending: true,
    };
    if (insights?.healthScore) {
      healthScoreData = {
        score: insights.healthScore.overallScore || 0,
        letterGrade: insights.healthScore.grade || "PENDING",
        gradeLabel: insights.healthScore.gradeLabel || "Healthy",
        isPending: Boolean(insights.healthScore.isPending),
      };
    }

    // 8. Deep Nutrition Micronutrient Audit
    let lowMicronutrients: Array<{
      label: string;
      percentage: number;
      target: number;
      unit: string;
    }> = [];
    if (rep?.micronutrients) {
      lowMicronutrients = rep.micronutrients
        .filter((m: any) => m.percentage !== null && m.percentage < 70)
        .map((m: any) => ({
          label: m.label || "Nutrient",
          percentage: Number(m.percentage) || 0,
          target: Number(m.target) || 0,
          unit: m.unit || "",
        }));
    }

    // 9. AI Memories
    const memories = (rawMemories || []).map((m: any) => ({
      id: m.id || "",
      category: m.category || "GENERAL",
      content: m.content || "",
    }));

    // 10. Connected Integrations
    const integrations: any[] = [];
    for (const c of (connections || [])) {
      integrations.push({
        provider: c.provider,
        status: c.status,
        lastSyncAt: c.lastSyncAt ? new Date(c.lastSyncAt).toISOString() : null,
      });
    }
    if (googleSheet && !integrations.some((i: any) => i.provider === "GOOGLE_SHEETS")) {
      integrations.push({
        provider: "GOOGLE_SHEETS",
        status: googleSheet.status || "CONNECTED",
        lastSyncAt: googleSheet.lastSyncAt ? new Date(googleSheet.lastSyncAt).toISOString() : null,
      });
    }

    const safeSettings = settings || ({} as any);
    const stepTarget = safeSettings.profile?.dailyStepTarget || 10000;
    const stepPercentage = Math.min(100, Math.round((todaySteps / stepTarget) * 100));

    // 11. Goals & Active Target Snapshot
    let featuredGoal: any = null;
    const activeGoals = (userGoals || []).filter((g: any) => g.status === "ACTIVE");
    const completedGoals = (userGoals || []).filter((g: any) => g.status === "COMPLETED");
    const activeGoalsCount = activeGoals.length;
    const completedGoalsCount = completedGoals.length;

    if (activeGoals.length > 0) {
      const top = activeGoals[0];
      const progressPercentage = Math.min(100, Math.round(((top.currentValue || 0) / (top.targetValue || 1)) * 100));
      const remainingAmount = Math.max(0, Number(top.targetValue) - Number(top.currentValue || 0));
      featuredGoal = {
        name: top.name || "Goal",
        category: top.category || "HEALTH",
        progressPercentage,
        remainingAmount,
        unit: top.unit || "",
        daysRemaining: 0,
      };
    }

    return {
      userId,
      generatedAt: new Date().toISOString(),
      date,

      profile: {
        name: safeSettings.user?.name || "Member",
        biologicalSex: safeSettings.profile?.biologicalSex || null,
        heightCm: safeSettings.profile?.heightCm !== null && safeSettings.profile?.heightCm !== undefined ? Number(safeSettings.profile.heightCm) : null,
        weightKg: safeSettings.profile?.weightKg !== null && safeSettings.profile?.weightKg !== undefined ? Number(safeSettings.profile.weightKg) : null,
        primaryGoal: safeSettings.profile?.primaryGoal || null,
        bmr: safeSettings.metabolic?.bmr || null,
        tdee: safeSettings.metabolic?.tdee || null,
        isProfileComplete: Boolean(safeSettings.profile?.isComplete),
      },

      nutrition: {
        dataState: nutritionState,
        hasLoggedMeals,
        caloriesConsumed: safeDailyNut.totals?.calories || 0,
        calorieTarget: safeSettings.nutritionGoals?.calories || null,
        caloriesRemaining: safeSettings.nutritionGoals?.calories
          ? Math.max(0, safeSettings.nutritionGoals.calories - (safeDailyNut.totals?.calories || 0))
          : null,
        proteinConsumed: safeDailyNut.totals?.protein || 0,
        proteinTarget: safeSettings.nutritionGoals?.protein || null,
        proteinRemaining: safeSettings.nutritionGoals?.protein
          ? Math.max(0, safeSettings.nutritionGoals.protein - (safeDailyNut.totals?.protein || 0))
          : null,
        carbsConsumed: safeDailyNut.totals?.carbs || 0,
        carbsTarget: safeSettings.nutritionGoals?.carbohydrates || null,
        fatsConsumed: safeDailyNut.totals?.fat || 0,
        fatsTarget: safeSettings.nutritionGoals?.fat || null,
        fiberConsumed: safeDailyNut.totals?.fiber || 0,
        sugarConsumed: safeDailyNut.totals?.sugar || 0,
        mealCount: (safeDailyNut.meals || []).reduce((sum: number, m: any) => sum + (m.entries?.length || 0), 0),
        isTargetsConfigured: Boolean(safeSettings.nutritionGoals?.isConfigured),
      },

      hydration: {
        dataState: hydrationState,
        hasLoggedHydration,
        consumedMl: safeDailyHyd.totalMl || 0,
        targetMl: safeDailyHyd.targetMl || 2500,
        remainingMl: safeDailyHyd.remainingMl || 2500,
        percentage: safeDailyHyd.percentage || 0,
        streakDays: safeDailyHyd.streakDays || 0,
        entryCount: safeDailyHyd.entries?.length || 0,
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
        weeklyRunningTargetKm: safeSettings.profile?.weeklyRunningDistanceKm || 15.0,
        todayActivitySessions: (todayActivities || []).length,
      },

      workouts: {
        todayWorkoutSessions,
        weeklyWorkoutSessions: (weeklyWorkouts || []).length,
        weeklyWorkoutTarget: safeSettings.profile?.weeklyWorkoutSessions || 3,
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
        activeGoalsCount,
        completedGoalsCount,
        featuredGoal,
      },
    };
  }
}
