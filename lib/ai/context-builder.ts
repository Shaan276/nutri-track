import { HealthContextService } from "@/lib/services/health-context.service";
import { ReportService } from "@/lib/services/report.service";
import { AIRulesEngine } from "./rules-engine";
import { AIQueryClassifier, QueryCategory } from "./query-classifier";
import { prisma } from "@/lib/db";

export interface AssembledAIContext {
  systemPrompt: string;
  recentMessages: Array<{ role: string; content: string }>;
  relevanceCategories: string[];
  queryCategory: QueryCategory;
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
   * Assembles category-aware, selective context grounded in actual user data.
   * Prevents full database dumps for general or casual queries.
   */
  public static async buildContext(
    userId: string,
    conversationId: string,
    userPrompt: string,
    explicitCategory?: QueryCategory
  ): Promise<AssembledAIContext> {
    const todayStr = new Date().toISOString().split("T")[0];
    const category = explicitCategory || AIQueryClassifier.classifyQuery(userPrompt).category;
    const relevance = this.analyzeQueryRelevance(userPrompt);
    const relevanceCategories: string[] = [category];

    // --- Layer 1: Recent Conversation Messages ---
    const rawMessages = await (prisma as any).aiMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    const messageLimit = category === "GENERAL" ? 4 : 6;
    const recentMessages = rawMessages.slice(-messageLimit).map((m: any) => ({
      role: m.role,
      content: m.content,
    }));

    // --- Retrieve User Record ---
    const userRecord = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    const userName = userRecord?.name || "Friend";

    // ─────────────────────────────────────────────────────────
    // 1. GENERAL QUESTION: Minimal Context Injection
    // ─────────────────────────────────────────────────────────
    if (category === "GENERAL") {
      const systemPrompt = `You are Nutri-Track AI — a brilliant, witty, helpful conversational assistant.
The user is asking a general knowledge, trivia, science, or everyday question.
• User Name: ${userName}
• Guidelines:
  - Answer the user's question directly, accurately, and engagingly.
  - Do NOT mention nutrition, calories, protein, hydration, health scores, or meal logging.
  - Do NOT append unsolicited health advice or meal logging prompts.`;

      return {
        systemPrompt,
        recentMessages,
        relevanceCategories,
        queryCategory: category,
      };
    }

    // ─────────────────────────────────────────────────────────
    // 2. CASUAL CHAT: Persona, Warmth & Empathy Context
    // ─────────────────────────────────────────────────────────
    if (category === "CASUAL_CHAT") {
      const primaryGoal = userRecord?.profile?.primaryGoal
        ? userRecord.profile.primaryGoal.replace(/_/g, " ").toLowerCase()
        : "general health & wellness";

      const systemPrompt = `You are Nutri-Track AI Coach — an intelligent, empathetic, supportive, and occasionally humorous health companion and coach.
• User Name: ${userName}
• Primary Focus: ${primaryGoal}
• Guidelines:
  - Respond naturally, conversationally, and empathetically.
  - If the user feels tired, demotivated, or skipped a workout, be encouraging with light humor (e.g. "Arre 😭 don't worry, even athletes have rest days. Let's make tomorrow count!").
  - Do NOT recite raw database tables or force unsolicited macro breakdowns into casual conversations.`;

      return {
        systemPrompt,
        recentMessages,
        relevanceCategories,
        queryCategory: category,
      };
    }

    // ─────────────────────────────────────────────────────────
    // 3. HEALTH_GENERAL: Evidence-Based Science + Optional Goal
    // ─────────────────────────────────────────────────────────
    if (category === "HEALTH_GENERAL") {
      const primaryGoal = userRecord?.profile?.primaryGoal || "General Fitness";
      const profile = userRecord?.profile;
      let metabolicNote = "";
      if (profile?.heightCm && profile?.weightKg) {
        metabolicNote = `• Physical Baseline: Height ${profile.heightCm}cm, Weight ${profile.weightKg}kg`;
      }

      const systemPrompt = `You are Nutri-Track AI Coach — an evidence-based sports, fitness, and nutrition science expert.
• User: ${userName} | Primary Goal: ${primaryGoal}
${metabolicNote}
• Guidelines:
  - Answer the specific health/physiology question directly and scientifically first.
  - Explain the mechanism clearly (e.g. energy balance, caffeine, muscle protein synthesis, sleep cycles).
  - Optionally add a brief, practical 1-sentence note for the user's goal (${primaryGoal}) ONLY if genuinely helpful.
  - Do NOT append unsolicited full-day meal templates or "Would you like me to log a meal for you?".
  - Do NOT force Ayurvedic routines unprompted unless the user asked about Ayurveda.`;

      return {
        systemPrompt,
        recentMessages,
        relevanceCategories,
        queryCategory: category,
      };
    }

    // ─────────────────────────────────────────────────────────
    // 4. HEALTH_PERSONALIZED / NUTRI_TRACK_DATA / ACTION_COMMAND
    // (Load Full Health Snapshot, Goals, Food DB & Dynamic Nutrition)
    // ─────────────────────────────────────────────────────────
    const snapshot = await HealthContextService.getHealthSnapshot(userId, todayStr);

    // AI Governance Rules Engine
    const rulesPrompt = await AIRulesEngine.buildAIRulesPrompt(
      userId,
      snapshot.profile.primaryGoal,
      userRecord?.profile?.dateOfBirth,
      userRecord?.createdAt
    );

    // User Memories & Saved Preferences
    let memoryContext = "";
    if (snapshot.memories.length > 0) {
      memoryContext = `\n[SAVED USER PREFERENCES & CONSTRAINTS]:\n${snapshot.memories
        .map((m: any) => `• [${m.category}] ${m.content}`)
        .join("\n")}`;
    }

    // Profile Context
    let profileContext = `
[USER PROFILE & METABOLIC BASELINE]:
• Name: ${snapshot.profile.name}
`;
    if (snapshot.profile.heightCm && snapshot.profile.weightKg) {
      profileContext += `• Biological Sex: ${snapshot.profile.biologicalSex || "Not specified"}
• Height: ${snapshot.profile.heightCm} cm | Weight: ${snapshot.profile.weightKg} kg
• Basal Metabolic Rate (BMR): ${snapshot.profile.bmr ? `${snapshot.profile.bmr} kcal/day` : "Not calculated"}
• Maintenance Energy (TDEE): ${snapshot.profile.tdee ? `${snapshot.profile.tdee} kcal/day` : "Not calculated"}
`;
    } else {
      profileContext += `• Biometrics (Height, Weight, Age, Sex): Not provided yet (User has not entered profile biometrics)
• Metabolic Baseline (BMR/TDEE): Not calculated (Requires user's genuine height and weight)
`;
    }

    profileContext += `• Primary Goal: ${snapshot.profile.primaryGoal || "Pending Assessment"}
`;

    if (snapshot.nutrition.calorieTarget && snapshot.nutrition.proteinTarget) {
      profileContext += `• Nutrition Targets: Calories ${snapshot.nutrition.calorieTarget} kcal | Protein ${snapshot.nutrition.proteinTarget}g | Carbs ${snapshot.nutrition.carbsTarget || "N/A"}g | Fat ${snapshot.nutrition.fatsTarget || "N/A"}g
`;
    } else {
      profileContext += `• Nutrition Targets: Not configured yet (Pending health assessment & goal setup)
`;
    }

    profileContext += `• Hydration Target: ${snapshot.hydration.targetMl ? `${snapshot.hydration.targetMl} ml/day` : "2,500 ml/day"} | Step Target: ${snapshot.movement.dailyStepTarget.toLocaleString()} steps/day | Running: ${snapshot.movement.weeklyRunningTargetKm} km/week | Workouts: ${snapshot.workouts.weeklyWorkoutTarget} sessions/week
`;

    // Food Database Items
    let foodDbContext = "";
    if (category === "ACTION_COMMAND" || relevance.wantsNutrition) {
      const userFoods = await prisma.food.findMany({
        where: {
          OR: [{ userId }, { isSystemFood: true }],
          isArchived: false,
        },
        orderBy: { createdAt: "desc" },
      });

      if (userFoods.length > 0) {
        foodDbContext = `\n[SAVED FOOD DATABASE ITEMS (Use exact macros when logging)]:\n${userFoods
          .slice(0, 30)
          .map(
            (f: any) =>
              `• "${f.name}" (${f.servingSize} ${f.servingUnit}): ${f.calories} kcal, ${f.protein}g protein, ${f.carbohydrates}g carbs, ${f.fat}g fat`
          )
          .join("\n")}\n`;
      }
    }

    // Live Data Context
    const n = snapshot.nutrition;
    const h = snapshot.hydration;
    const m = snapshot.movement;

    const carbsTarget = n.carbsTarget || 250;
    const carbsConsumed = n.carbsConsumed || 0;
    const carbsRemaining = Math.max(0, carbsTarget - carbsConsumed);

    const fatsTarget = n.fatsTarget || 65;
    const fatsConsumed = n.fatsConsumed || 0;
    const fatsRemaining = Math.max(0, fatsTarget - fatsConsumed);

    const hasCalTarget = Boolean(n.calorieTarget);
    const hasProtTarget = Boolean(n.proteinTarget);
    const calPct = hasCalTarget && n.calorieTarget! > 0 ? Math.round((n.caloriesConsumed / n.calorieTarget!) * 100) : 0;
    const protPct = hasProtTarget && n.proteinTarget! > 0 ? Math.round((n.proteinConsumed / n.proteinTarget!) * 100) : 0;

    let liveDataContext = "\n[LIVE HEALTH DATA & TODAY'S QUANTITATIVE LOGS]:";

    liveDataContext += `
• Date: ${todayStr} (Current day in progress — incomplete logging during the day is normal, not a failure)
• Nutrition State: ${n.dataState === "LOGGED" ? "DATA_LOGGED" : "NOT_LOGGED_YET (No meals recorded yet today)"}
• Calories: ${n.caloriesConsumed.toLocaleString()}${hasCalTarget ? ` / ${n.calorieTarget!.toLocaleString()} kcal (${calPct}% achieved | ${n.caloriesRemaining ?? 0} kcal remaining)` : " kcal (Target pending assessment)"}
• Protein: ${n.proteinConsumed}g${hasProtTarget ? ` / ${n.proteinTarget!}g (${protPct}% achieved | ${n.proteinRemaining ?? 0}g remaining)` : " (Target pending assessment)"}
• Carbohydrates: ${carbsConsumed}g${n.carbsTarget ? ` / ${n.carbsTarget}g (${carbsRemaining}g remaining)` : ""}
• Healthy Fats: ${fatsConsumed}g${n.fatsTarget ? ` / ${n.fatsTarget}g (${fatsRemaining}g remaining)` : ""}
• Hydration Logged Today: ${h.consumedMl.toLocaleString()} / ${(h.targetMl || 2500).toLocaleString()} ml (${h.percentage}% achieved | ${h.remainingMl} ml remaining, Streak: ${h.streakDays} days)
• Movement & Steps: ${m.todaySteps.toLocaleString()} / ${m.dailyStepTarget.toLocaleString()} steps (${m.todayDistanceKm} km covered)
• Active Energy Burned Today: ${m.totalActiveCalories} kcal
• 7-Day Health Score: ${snapshot.healthScore.isPending ? "PENDING (Getting Started)" : `${snapshot.healthScore.score}/100`}
`;

    // Include Running data if relevant
    if (relevance.wantsRunning) {
      const rep = await ReportService.getFullReport(userId, "last30days");
      const act = rep.overview?.activities;
      liveDataContext += `
• 30-Day Running Volume: ${act?.totalDistanceKm || 0} km across ${act?.totalSessions || 0} sessions (This week: ${snapshot.movement.weeklyRunningDistanceKm} km / target ${snapshot.movement.weeklyRunningTargetKm} km)
• Average Running Pace: ${act?.avgPaceFormatted || "N/A"}
`;
      relevanceCategories.push("RUNNING");
    }

    // Include Deep Micronutrients if relevant
    if (relevance.wantsMicronutrients) {
      const lowMicros = snapshot.deepNutrition.lowMicronutrients;
      liveDataContext += `
• 7-Day Low Micronutrients (<70% RDA): ${lowMicros.map((m) => `${m.label} (${m.percentage}% of ${m.target}${m.unit})`).join(", ") || "All tracked micronutrients currently optimal"}
`;
      relevanceCategories.push("MICRONUTRIENTS");
    }

    let dynamicNutritionContext = "";
    if (category === "HEALTH_PERSONALIZED") {
      try {
        const { DynamicNutritionService } = await import("@/lib/services/dynamic-nutrition.service");
        const dyn = await DynamicNutritionService.calculateDynamicOptimization(userId);
        dynamicNutritionContext = `\n[DYNAMIC NUTRITION & RECOVERY RATIONALE]:
• Today's Optimized Targets: ${dyn.optimized.calories} kcal | ${dyn.optimized.protein}g Protein | ${dyn.optimized.carbohydrates}g Carbs
• Optimization Rationale: ${dyn.adjustments.map((a) => a.reason).join("; ") || "Balanced expenditure and intake."}
`;
      } catch {}
    }

    const systemPrompt = `${rulesPrompt}\n${profileContext}${memoryContext}${foodDbContext}${dynamicNutritionContext}${liveDataContext}`;

    return {
      systemPrompt,
      recentMessages,
      relevanceCategories,
      queryCategory: category,
    };
  }
}
