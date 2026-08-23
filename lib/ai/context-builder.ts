import { HealthContextService } from "@/lib/services/health-context.service";
import { ReportService } from "@/lib/services/report.service";
import { AIRulesEngine } from "./rules-engine";
import { prisma } from "@/lib/db";

export interface AssembledAIContext {
  systemPrompt: string;
  recentMessages: Array<{ role: string; content: string }>;
  relevanceCategories: string[];
}

export class AIContextBuilder {
  /**
   * Analyzes user prompt keywords to determine relevant context categories
   */
  public static analyzeQueryRelevance(prompt: string): {
    wantsNutrition: boolean;
    wantsHydration: boolean;
    wantsRunning: boolean;
    wantsWorkout: boolean;
    wantsMicronutrients: boolean;
    wantsGoals: boolean;
    wantsWeeklyPlan: boolean;
  } {
    const lower = prompt.toLowerCase();

    return {
      wantsNutrition:
        /\b(food|eat|meal|protein|carb|calorie|fat|macro|diet|lunch|dinner|breakfast|snack|hunger|soya|chicken|egg|tofu|salmon|rice)\b/i.test(
          lower
        ),
      wantsHydration: /\b(water|drink|fluid|hydration|thirst|ml|liters|bottle)\b/i.test(lower),
      wantsRunning: /\b(run|running|pace|tempo|interval|km|mile|jog|jogging|5k|10k|marathon|elevation)\b/i.test(
        lower
      ),
      wantsWorkout:
        /\b(workout|gym|lift|lifting|set|rep|bench|squat|deadlift|tonnage|volume|strength|muscle|exercise|chest|back|legs|arms)\b/i.test(
          lower
        ),
      wantsMicronutrients:
        /\b(vitamin|mineral|iron|calcium|zinc|magnesium|potassium|b12|folate|rda|micronutrient|deficiency)\b/i.test(
          lower
        ),
      wantsGoals: /\b(target|goal|bmr|tdee|weight|loss|gain|maintain|increase|decrease|update target)\b/i.test(
        lower
      ),
      wantsWeeklyPlan: /\b(plan|weekly|schedule|routine|review|blueprint|split|regimen)\b/i.test(lower),
    };
  }

  /**
   * Assembles 4-layer personalized context grounded in actual user data
   */
  public static async buildContext(
    userId: string,
    conversationId: string,
    userPrompt: string
  ): Promise<AssembledAIContext> {
    const todayStr = new Date().toISOString().split("T")[0];
    const relevance = this.analyzeQueryRelevance(userPrompt);
    const relevanceCategories: string[] = [];

    // --- Layer 1: Recent Conversation Messages ---
    const rawMessages = await (prisma as any).aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    const recentMessages = rawMessages.slice(-6).map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    // --- Retrieve User Record for Dynamic Daily Age Calculation ---
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    // --- Retrieve Centralized Health Context Snapshot ---
    const snapshot = await HealthContextService.getHealthSnapshot(userId, todayStr);

    // --- Layer 0: AI Governance Rules Engine (General Rules + Personalized Goal Rules + Daily Age) ---
    const rulesPrompt = await AIRulesEngine.buildAIRulesPrompt(
      userId,
      snapshot.profile.primaryGoal,
      userRecord?.profile?.dateOfBirth,
      userRecord?.createdAt
    );

    // --- Layer 2: User Memories & Saved Preferences ---
    let memoryContext = "";
    if (snapshot.memories.length > 0) {
      memoryContext = `\n[SAVED USER PREFERENCES & CONSTRAINTS]:\n${snapshot.memories
        .map((m: any) => `• [${m.category}] ${m.content}`)
        .join("\n")}`;
    }

    // --- Layer 3: User Profile & Goals ---
    const profileContext = `
[USER PROFILE & METABOLIC BASELINE]:
• Name: ${snapshot.profile.name}
• Biological Sex: ${snapshot.profile.biologicalSex}
• Height: ${snapshot.profile.heightCm} cm | Weight: ${snapshot.profile.weightKg} kg
• Primary Goal: ${snapshot.profile.primaryGoal}
• Basal Metabolic Rate (BMR): ${snapshot.profile.bmr} kcal/day
• Maintenance Energy (TDEE): ${snapshot.profile.tdee} kcal/day
• Nutrition Targets: Calories ${snapshot.nutrition.calorieTarget} kcal | Protein ${snapshot.nutrition.proteinTarget}g | Carbs ${snapshot.nutrition.carbsTarget}g | Fat ${snapshot.nutrition.fatsTarget}g
• Hydration Target: ${snapshot.hydration.targetMl} ml/day | Step Target: ${snapshot.movement.dailyStepTarget.toLocaleString()} steps/day | Running: ${snapshot.movement.weeklyRunningTargetKm} km/week | Workouts: ${snapshot.workouts.weeklyWorkoutTarget} sessions/week
`;

    // --- Layer 3.5: User's Food Database Items & Custom Recipes ---
    const userFoods = await prisma.food.findMany({
      where: {
        OR: [{ userId }, { isSystemFood: true }],
        isArchived: false,
      },
      orderBy: { createdAt: "desc" },
    });

    let foodDbContext = "";
    if (userFoods.length > 0) {
      foodDbContext = `\n[SAVED FOOD DATABASE ITEMS & RECIPES (Use these exact macros when logging)]:\n${userFoods
        .slice(0, 40)
        .map(
          (f: any) =>
            `• "${f.name}" (${f.servingSize} ${f.servingUnit}): ${f.calories} kcal, ${f.protein}g protein, ${f.carbohydrates}g carbs, ${f.fat}g fat`
        )
        .join("\n")}\n`;
    }

    // --- Layer 4: Live Dynamic Health Snapshot (Relevance-Driven) ---
    const n = snapshot.nutrition;
    const h = snapshot.hydration;
    const m = snapshot.movement;
    const w = snapshot.workouts;

    const carbsTarget = n.carbsTarget || 250;
    const carbsConsumed = n.carbsConsumed || 0;
    const carbsRemaining = Math.max(0, carbsTarget - carbsConsumed);
    const carbsPct = Math.round((carbsConsumed / carbsTarget) * 100);

    const fatsTarget = n.fatsTarget || 65;
    const fatsConsumed = n.fatsConsumed || 0;
    const fatsRemaining = Math.max(0, fatsTarget - fatsConsumed);
    const fatsPct = Math.round((fatsConsumed / fatsTarget) * 100);

    const fiberTarget = 30;
    const fiberConsumed = n.fiberConsumed || 0;
    const fiberRemaining = Math.max(0, fiberTarget - fiberConsumed);
    const fiberPct = Math.round((fiberConsumed / fiberTarget) * 100);

    const calPct = Math.round((n.caloriesConsumed / (n.calorieTarget || 2000)) * 100);
    const protPct = Math.round((n.proteinConsumed / (n.proteinTarget || 120)) * 100);

    let liveDataContext = "\n[LIVE HEALTH DATA & COMPLETE MACRONUTRIENT QUANTITIES]:";

    liveDataContext += `
• Date: ${todayStr} (Current day in progress — incomplete logging during the day is normal, not a failure)
• Nutrition State: ${n.dataState === "LOGGED" ? "DATA_LOGGED" : "NOT_LOGGED_YET (No meals recorded yet today)"}
• Calories: ${n.caloriesConsumed.toLocaleString()} / ${(n.calorieTarget || 2000).toLocaleString()} kcal (${calPct}% achieved | ${n.caloriesRemaining} kcal remaining)
• Protein: ${n.proteinConsumed}g / ${n.proteinTarget || 120}g (${protPct}% achieved | ${n.proteinRemaining}g remaining)
• Carbohydrates: ${carbsConsumed}g / ${carbsTarget}g (${carbsPct}% achieved | ${carbsRemaining}g remaining)
• Healthy Fats: ${fatsConsumed}g / ${fatsTarget}g (${fatsPct}% achieved | ${fatsRemaining}g remaining)
• Dietary Fiber: ${fiberConsumed}g / ${fiberTarget}g (${fiberPct}% achieved | ${fiberRemaining}g remaining)
• Sugar Intake: ${n.sugarConsumed}g
• Hydration Logged Today: ${h.consumedMl.toLocaleString()} / ${(h.targetMl || 2500).toLocaleString()} ml (${h.percentage}% achieved | ${h.remainingMl} ml remaining, Streak: ${h.streakDays} days)
• Movement & Steps: ${m.todaySteps.toLocaleString()} / ${m.dailyStepTarget.toLocaleString()} steps (${m.stepPercentage}% of target | ${m.todayDistanceKm} km covered)
• Active Energy Burned Today: ${m.totalActiveCalories} kcal (${m.activityCalories} kcal cardio/activities + ${m.workoutCalories} kcal workouts)
• 7-Day Health Score: ${snapshot.healthScore.isPending ? "PENDING (Getting Started)" : `${snapshot.healthScore.score}/100 (Grade: ${snapshot.healthScore.letterGrade})`}
`;
    relevanceCategories.push("NUTRITION", "HYDRATION");

    // Include Running data if relevant
    if (relevance.wantsRunning) {
      const rep = await ReportService.getFullReport(userId, "last30days");
      const act = rep.overview?.activities;
      liveDataContext += `
• 30-Day Running Volume: ${act?.totalDistanceKm || 0} km across ${act?.totalSessions || 0} sessions (This week: ${snapshot.movement.weeklyRunningDistanceKm} km / target ${snapshot.movement.weeklyRunningTargetKm} km)
• Average Running Pace: ${act?.avgPaceFormatted || "N/A"}
• Recent Pace Trend: ${(rep.charts?.runningPaceTrend || []).slice(-3).map((p) => `${p.date}: ${p.formattedPace}`).join(", ") || "No recent runs"}
`;
      relevanceCategories.push("RUNNING");
    }

    // Include Workout data if relevant
    if (relevance.wantsWorkout) {
      const rep = await ReportService.getFullReport(userId, "last30days");
      const wk = rep.overview?.workouts;
      liveDataContext += `
• 30-Day Strength Training: ${wk?.totalSessions || 0} sessions, ${wk?.totalSets || 0} sets, ${(wk?.totalVolumeKg || 0).toLocaleString()} kg total tonnage volume (This week: ${snapshot.workouts.weeklyWorkoutSessions} sessions, ${snapshot.workouts.weeklyWorkoutVolumeKg.toLocaleString()} kg)
`;
      relevanceCategories.push("WORKOUTS");
    }

    // Include Deep Micronutrients if relevant
    if (relevance.wantsMicronutrients) {
      const lowMicros = snapshot.deepNutrition.lowMicronutrients;
      liveDataContext += `
• 7-Day Low Micronutrients (<70% RDA): ${lowMicros.map((m) => `${m.label} (${m.percentage}% of ${m.target}${m.unit})`).join(", ") || "All tracked micronutrients currently optimal"}
`;
      relevanceCategories.push("MICRONUTRIENTS");
    }

    // Include Weekly Plan if relevant
    if (relevance.wantsWeeklyPlan) {
      try {
        const { WeeklyPlanService } = await import("@/lib/services/weekly-plan.service");
        const activePlan = await WeeklyPlanService.getActiveWeeklyPlan(userId, todayStr);
        if (activePlan) {
          liveDataContext += `
[ACTIVE WEEKLY HEALTH & FITNESS BLUEPRINT]:
• Week: ${activePlan.startDate} to ${activePlan.endDate}
• Goal Summary: ${activePlan.goalSummary}
• Adherence: ${activePlan.completedItemsCount}/${activePlan.totalItemsCount} items completed (${activePlan.adherencePercentage}%)
• Daily Plan Breakdown:
${activePlan.items.map((i) => `  - [${i.date}] (${i.category}) ${i.title}: ${i.isCompleted ? "✅ Completed" : "⏳ Planned"}`).join("\n")}
`;
        }
      } catch {}
    }

    let dynamicNutritionContext = "";
    try {
      const { DynamicNutritionService } = await import("@/lib/services/dynamic-nutrition.service");
      const dyn = await DynamicNutritionService.calculateDynamicOptimization(userId);
      const y = dyn.yesterdaysSummary;
      dynamicNutritionContext = `\n[YESTERDAY'S PERFORMANCE & DYNAMIC NUTRITION INTELLIGENCE]:
• Dynamic Nutrition Status: ${dyn.isDynamicEnabled ? "ENABLED (Targets auto-adapt daily)" : "DISABLED (Using static baseline)"}
• Yesterday's Date: ${y.date}
• Yesterday's Consumed: ${y.nutrition.caloriesConsumed} / ${y.nutrition.calorieTarget} kcal, ${y.nutrition.proteinConsumed} / ${y.nutrition.proteinTarget}g Protein
• Yesterday's Active Burn: ${y.movement.totalExpenditureKcal} kcal (${y.movement.distanceKm} km running, ${y.workouts.totalVolumeKg} kg lifting volume)
• Today's Optimized Targets: ${dyn.optimized.calories} kcal | ${dyn.optimized.protein}g Protein | ${dyn.optimized.carbohydrates}g Carbs | ${dyn.optimized.hydrationMl}ml Water
• Rationale: ${dyn.adjustments.map((a) => a.reason).join("; ") || "Balanced expenditure and intake."}
`;
    } catch {}

    const systemPrompt = `${rulesPrompt}\n${profileContext}${memoryContext}${foodDbContext}${dynamicNutritionContext}${liveDataContext}`;

    return {
      systemPrompt,
      recentMessages,
      relevanceCategories,
    };
  }
}
