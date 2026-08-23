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

    // --- Layer 4: Live Dynamic Health Snapshot (Relevance-Driven) ---
    let liveDataContext = "\n[LIVE HEALTH DATA SNAPSHOT]:";

    liveDataContext += `
• Date: ${todayStr}
• Today's Nutrition State: ${snapshot.nutrition.dataState === "LOGGED" ? "DATA_LOGGED" : "NOT_LOGGED_YET (User has not entered food logs today)"}
• Calories Logged Today: ${snapshot.nutrition.caloriesConsumed} / ${snapshot.nutrition.calorieTarget} kcal (${snapshot.nutrition.caloriesRemaining} kcal remaining)
• Protein Logged Today: ${snapshot.nutrition.proteinConsumed} / ${snapshot.nutrition.proteinTarget} g (${snapshot.nutrition.proteinRemaining}g remaining)
• Carbs: ${snapshot.nutrition.carbsConsumed} / ${snapshot.nutrition.carbsTarget} g | Fat: ${snapshot.nutrition.fatsConsumed} / ${snapshot.nutrition.fatsTarget} g
• Hydration Logged Today: ${snapshot.hydration.consumedMl} / ${snapshot.hydration.targetMl} ml (${snapshot.hydration.remainingMl} ml remaining, Streak: ${snapshot.hydration.streakDays} days)
• Movement & Activity: ${snapshot.movement.todaySteps.toLocaleString()} steps today (${snapshot.movement.stepPercentage}% of target), ${snapshot.movement.todayDistanceKm} km covered
• Active Energy Burned Today: ${snapshot.movement.totalActiveCalories} kcal (${snapshot.movement.activityCalories} kcal cardio/activities + ${snapshot.movement.workoutCalories} kcal workouts)
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
          relevanceCategories.push("WEEKLY_PLAN");
        }
      } catch {}
    }

    const systemPrompt = `${rulesPrompt}\n${profileContext}${memoryContext}${liveDataContext}`;

    return {
      systemPrompt,
      recentMessages,
      relevanceCategories,
    };
  }
}
