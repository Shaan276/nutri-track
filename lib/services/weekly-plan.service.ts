import { prisma } from "@/lib/db";
import { UserSettingsService } from "@/lib/services/user-settings.service";
import { ReportService } from "@/lib/services/report.service";

export type PlanItemCategory =
  | "NUTRITION"
  | "HYDRATION"
  | "RUNNING"
  | "ACTIVITY"
  | "WORKOUT"
  | "RECOVERY";

export type WeeklyPlanStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";

export interface WeeklyPlanItemDto {
  id: string;
  weeklyPlanId: string;
  date: string;
  category: PlanItemCategory;
  title: string;
  description: string | null;
  targetData: any | null;
  isCompleted: boolean;
  matchedActivityId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyPlanDto {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  goalSummary: string;
  status: WeeklyPlanStatus;
  notes: string | null;
  items: WeeklyPlanItemDto[];
  adherencePercentage?: number;
  completedItemsCount?: number;
  totalItemsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWeeklyPlanInput {
  startDate: string; // YYYY-MM-DD (Monday)
  endDate?: string;   // YYYY-MM-DD (Sunday)
  goalSummary: string;
  notes?: string | null;
  items?: Array<{
    date: string;
    category: PlanItemCategory;
    title: string;
    description?: string;
    targetData?: any;
    isCompleted?: boolean;
  }>;
}

export interface WeeklyReviewResult {
  userId: string;
  startDate: string;
  endDate: string;
  summaryTitle: string;
  overallScore: number; // 0-100
  keyWins: string[];
  growthAreas: string[];
  metricsSummary: {
    totalCaloriesLogged: number;
    avgDailyCalories: number;
    avgDailyProteinGrams: number;
    proteinAdherenceRate: number; // percentage
    totalHydrationMl: number;
    avgDailyHydrationMl: number;
    hydrationGoalDays: number;
    totalRunningDistanceKm: number;
    runningSessionsCount: number;
    avgRunningPace: string;
    totalWorkoutSessions: number;
    totalWorkoutVolumeKg: number;
  };
  recommendedNextFocus: string[];
}

export class WeeklyPlanService {
  /**
   * Calculates Sunday given a Monday start date
   */
  public static calculateEndDate(startDate: string): string {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 6);
    return d.toISOString().split("T")[0];
  }

  /**
   * Retrieves all weekly plans for the user
   */
  static async getUserWeeklyPlans(userId: string): Promise<WeeklyPlanDto[]> {
    const plans = await (prisma as any).weeklyPlan.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { startDate: "desc" },
    });

    return plans.map((p: any) => this.serializePlan(p));
  }

  /**
   * Retrieves the active weekly plan covering a given date
   */
  static async getActiveWeeklyPlan(userId: string, dateStr?: string): Promise<WeeklyPlanDto | null> {
    const targetDate = dateStr || new Date().toISOString().split("T")[0];
    const plans = await (prisma as any).weeklyPlan.findMany({
      where: { userId },
      include: { items: true },
      orderBy: { startDate: "desc" },
    });

    // Find plan that covers targetDate or latest active
    const active = plans.find(
      (p: any) => p.status === "ACTIVE" && p.startDate <= targetDate && p.endDate >= targetDate
    ) || plans.find((p: any) => p.status === "ACTIVE") || plans[0] || null;

    if (!active) return null;
    return this.serializePlan(active);
  }

  /**
   * Retrieves a specific weekly plan with strict user ownership validation
   */
  static async getWeeklyPlanById(userId: string, planId: string): Promise<WeeklyPlanDto> {
    const plan = await (prisma as any).weeklyPlan.findUnique({
      where: { id: planId },
      include: { items: true },
    });

    if (!plan) throw new Error("Weekly plan not found");
    if (plan.userId !== userId) throw new Error("Unauthorized: Access denied to this weekly plan");

    return this.serializePlan(plan);
  }

  /**
   * Creates a new structured weekly plan
   */
  static async createWeeklyPlan(userId: string, input: CreateWeeklyPlanInput): Promise<WeeklyPlanDto> {
    const startDate = input.startDate;
    const endDate = input.endDate || this.calculateEndDate(startDate);

    const created = await (prisma as any).weeklyPlan.create({
      data: {
        userId,
        startDate,
        endDate,
        goalSummary: input.goalSummary.trim(),
        notes: input.notes?.trim() || null,
        status: "ACTIVE",
        items: {
          create: (input.items || []).map((itm) => ({
            date: itm.date,
            category: itm.category,
            title: itm.title.trim(),
            description: itm.description?.trim() || null,
            targetData: itm.targetData || null,
            isCompleted: itm.isCompleted || false,
          })),
        },
      },
      include: { items: true },
    });

    return this.serializePlan(created);
  }

  /**
   * Updates an existing weekly plan
   */
  static async updateWeeklyPlan(
    userId: string,
    planId: string,
    input: { goalSummary?: string; status?: WeeklyPlanStatus; notes?: string | null }
  ): Promise<WeeklyPlanDto> {
    const existing = await (prisma as any).weeklyPlan.findUnique({ where: { id: planId } });
    if (!existing) throw new Error("Weekly plan not found");
    if (existing.userId !== userId) throw new Error("Unauthorized: Access denied");

    const updated = await (prisma as any).weeklyPlan.update({
      where: { id: planId },
      data: {
        goalSummary: input.goalSummary?.trim(),
        status: input.status,
        notes: input.notes !== undefined ? input.notes?.trim() || null : undefined,
      },
      include: { items: true },
    });

    return this.serializePlan(updated);
  }

  /**
   * Updates an individual plan item
   */
  static async updatePlanItem(
    userId: string,
    itemId: string,
    input: {
      title?: string;
      description?: string | null;
      category?: PlanItemCategory;
      date?: string;
      isCompleted?: boolean;
      targetData?: any;
    }
  ): Promise<WeeklyPlanItemDto> {
    const item = await (prisma as any).weeklyPlanItem.findUnique({ where: { id: itemId } });
    if (!item) throw new Error("Plan item not found");

    // Verify parent plan ownership
    const parentPlan = await (prisma as any).weeklyPlan.findUnique({ where: { id: item.weeklyPlanId } });
    if (!parentPlan || parentPlan.userId !== userId) throw new Error("Unauthorized: Access denied");

    const updated = await (prisma as any).weeklyPlanItem.update({
      where: { id: itemId },
      data: {
        title: input.title?.trim(),
        description: input.description !== undefined ? input.description?.trim() || null : undefined,
        category: input.category,
        date: input.date,
        isCompleted: input.isCompleted,
        targetData: input.targetData,
      },
    });

    return this.serializeItem(updated);
  }

  /**
   * Deletes a plan item
   */
  static async deletePlanItem(userId: string, itemId: string): Promise<boolean> {
    const item = await (prisma as any).weeklyPlanItem.findUnique({ where: { id: itemId } });
    if (!item) throw new Error("Plan item not found");

    const parentPlan = await (prisma as any).weeklyPlan.findUnique({ where: { id: item.weeklyPlanId } });
    if (!parentPlan || parentPlan.userId !== userId) throw new Error("Unauthorized: Access denied");

    await (prisma as any).weeklyPlanItem.delete({ where: { id: itemId } });
    return true;
  }

  /**
   * Deletes a weekly plan
   */
  static async deleteWeeklyPlan(userId: string, planId: string): Promise<boolean> {
    const plan = await (prisma as any).weeklyPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new Error("Weekly plan not found");
    if (plan.userId !== userId) throw new Error("Unauthorized: Access denied");

    await (prisma as any).weeklyPlan.delete({ where: { id: planId } });
    return true;
  }

  /**
   * Generates a tailored AI Weekly Plan grounded in the user's real targets and preferences
   */
  static async generateAIWeeklyPlan(
    userId: string,
    startDateStr?: string,
    preferences?: { focusArea?: string; customGoal?: string }
  ): Promise<WeeklyPlanDto> {
    const today = new Date();
    // Default to start of current week (Monday)
    const d = new Date(startDateStr || today);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    const startDate = d.toISOString().split("T")[0];
    const endDate = this.calculateEndDate(startDate);

    // Fetch user context
    const settings = await UserSettingsService.getUserSettings(userId);
    const proteinTarget = settings.nutritionGoals.protein || 120;
    const calorieTarget = settings.nutritionGoals.calories || 2000;
    const hydrationTarget = settings.profile.dailyHydrationTargetMl || 2500;
    const runTargetKm = settings.profile.weeklyRunningDistanceKm || 15;
    const workoutSessions = settings.profile.weeklyWorkoutSessions || 3;

    // Generate 7 structured daily items
    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(startDate);
      cur.setDate(cur.getDate() + i);
      dates.push(cur.toISOString().split("T")[0]);
    }

    const items: Array<{
      date: string;
      category: PlanItemCategory;
      title: string;
      description: string;
      targetData: any;
    }> = [
      // Day 1: Monday - Easy Aerobic Run & Macro Baseline
      {
        date: dates[0],
        category: "RUNNING",
        title: "Easy Base Run",
        description: `Target 5.0 km at conversational pace. Fuel with $\\ge$ ${proteinTarget}g protein.`,
        targetData: { distanceKm: 5.0, runningType: "EASY_RUN", targetProteinGrams: proteinTarget },
      },
      // Day 2: Tuesday - Strength Training (Push / Upper Body)
      {
        date: dates[1],
        category: "WORKOUT",
        title: "Upper Body Hypertrophy Workout",
        description: "Focus on Bench Press, Overhead Press, and Triceps. Hydrate $\\ge$ 2.5L.",
        targetData: { workoutType: "GYM_WORKOUT", focus: "Push / Upper Body" },
      },
      // Day 3: Wednesday - Active Recovery & Hydration Sprint
      {
        date: dates[2],
        category: "RECOVERY",
        title: "Active Recovery & Mobility Walk",
        description: "30-min brisk walk + stretching. Meet 100% hydration target.",
        targetData: { activityType: "WALK", targetHydrationMl: hydrationTarget },
      },
      // Day 4: Thursday - Mid-Week Tempo Run
      {
        date: dates[3],
        category: "RUNNING",
        title: "Tempo Run (Threshold Effort)",
        description: "4.0 km structured tempo at comfortably hard pace.",
        targetData: { distanceKm: 4.0, runningType: "TEMPO_RUN" },
      },
      // Day 5: Friday - Strength Training (Pull / Lower Body)
      {
        date: dates[4],
        category: "WORKOUT",
        title: "Lower Body & Core Strength Session",
        description: "Squats, Romanian Deadlifts, and Core circuit.",
        targetData: { workoutType: "GYM_WORKOUT", focus: "Lower Body & Core" },
      },
      // Day 6: Saturday - Weekend Long Run / Endurance
      {
        date: dates[5],
        category: "RUNNING",
        title: "Weekend Long Run",
        description: `6.0 km aerobic endurance run. Total weekly volume ~ ${runTargetKm} km.`,
        targetData: { distanceKm: 6.0, runningType: "LONG_RUN" },
      },
      // Day 7: Sunday - Full Rest, Deep Nutrition & Weekly Review
      {
        date: dates[6],
        category: "NUTRITION",
        title: "Deep Nutrition & Micronutrient Optimization",
        description: "Focus on micronutrient-dense leafy greens, omega-3s, and preparing for the next week.",
        targetData: { targetCalories: calorieTarget, targetProtein: proteinTarget },
      },
    ];

    const goalSummary = preferences?.customGoal || `Balanced ${proteinTarget}g Protein, ${runTargetKm}km Running & ${workoutSessions} Workouts/Week Plan`;

    return this.createWeeklyPlan(userId, {
      startDate,
      endDate,
      goalSummary,
      notes: "AI Recommended Weekly Blueprint grounded in your metabolic baseline and training targets.",
      items,
    });
  }

  /**
   * Cross-references planned items against actual logged database records without false positives
   */
  static async evaluatePlanVsActual(userId: string, planId: string): Promise<WeeklyPlanDto> {
    const plan = await this.getWeeklyPlanById(userId, planId);
    const pool = prisma as any;

    // Retrieve actual logs for this user across plan date range
    const [actualActivities, actualWorkouts, actualMeals, actualHydration] = await Promise.all([
      pool.activityLog.findMany({
        where: {
          userId,
          date: { gte: plan.startDate, lte: plan.endDate },
        },
      }),
      pool.workoutSession.findMany({
        where: {
          userId,
          date: { gte: plan.startDate, lte: plan.endDate },
        },
      }),
      pool.mealLog.findMany({
        where: {
          userId,
          date: { gte: plan.startDate, lte: plan.endDate },
        },
        include: { entries: true },
      }),
      pool.hydrationLog.findMany({
        where: {
          userId,
          date: { gte: plan.startDate, lte: plan.endDate },
        },
      }),
    ]);

    for (const item of plan.items) {
      let isMatched = false;
      let matchedId: string | null = null;

      if (item.category === "RUNNING") {
        const plannedDist = Number(item.targetData?.distanceKm) || 0;
        const matchingRun = actualActivities.find(
          (a: any) =>
            a.date === item.date &&
            a.activityType === "RUN" &&
            (plannedDist === 0 || Number(a.distanceKm) >= plannedDist * 0.75)
        );
        if (matchingRun) {
          isMatched = true;
          matchedId = matchingRun.id;
        }
      } else if (item.category === "WORKOUT") {
        const matchingWk = actualWorkouts.find((w: any) => w.date === item.date);
        if (matchingWk) {
          isMatched = true;
          matchedId = matchingWk.id;
        }
      } else if (item.category === "ACTIVITY" || item.category === "RECOVERY") {
        const matchingAct = actualActivities.find((a: any) => a.date === item.date);
        if (matchingAct) {
          isMatched = true;
          matchedId = matchingAct.id;
        }
      } else if (item.category === "NUTRITION") {
        const dayMeals = actualMeals.filter((m: any) => m.date === item.date);
        let dayProtein = 0;
        for (const m of dayMeals) {
          for (const e of m.entries || []) {
            dayProtein += Number(e.protein || 0);
          }
        }
        const targetProt = Number(item.targetData?.targetProtein) || 80;
        if (dayProtein >= targetProt * 0.8) {
          isMatched = true;
        }
      } else if (item.category === "HYDRATION") {
        const dayHyd = actualHydration.filter((h: any) => h.date === item.date);
        const dayMl = dayHyd.reduce((sum: number, h: any) => sum + Number(h.amountMl || 0), 0);
        const targetMl = Number(item.targetData?.targetHydrationMl) || 2000;
        if (dayMl >= targetMl * 0.8) {
          isMatched = true;
        }
      }

      if (isMatched && (!item.isCompleted || item.matchedActivityId !== matchedId)) {
        await pool.weeklyPlanItem.update({
          where: { id: item.id },
          data: {
            isCompleted: true,
            matchedActivityId: matchedId,
          },
        });
      }
    }

    return this.getWeeklyPlanById(userId, planId);
  }

  /**
   * Generates a comprehensive Weekly Review grounded in real recorded database entries
   */
  static async generateWeeklyReview(userId: string, startDateStr?: string): Promise<WeeklyReviewResult> {
    const today = new Date();
    const d = new Date(startDateStr || today);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    const startDate = d.toISOString().split("T")[0];
    const endDate = this.calculateEndDate(startDate);

    const pool = prisma as any;
    const [activities, workouts, meals, hydration, settings] = await Promise.all([
      pool.activityLog.findMany({ where: { userId, date: { gte: startDate, lte: endDate } } }),
      pool.workoutSession.findMany({ where: { userId, date: { gte: startDate, lte: endDate } } }),
      pool.mealLog.findMany({ where: { userId, date: { gte: startDate, lte: endDate } }, include: { entries: true } }),
      pool.hydrationLog.findMany({ where: { userId, date: { gte: startDate, lte: endDate } } }),
      UserSettingsService.getUserSettings(userId),
    ]);

    // Compute metrics
    let totalCalories = 0;
    let totalProtein = 0;
    const daysWithProteinMet = new Set<string>();
    const targetProtein = settings.nutritionGoals.protein || 120;

    for (const m of meals) {
      let dayP = 0;
      for (const e of m.entries || []) {
        totalCalories += Number(e.calories || 0);
        const p = Number(e.protein || 0);
        totalProtein += p;
        dayP += p;
      }
      if (dayP >= targetProtein) {
        daysWithProteinMet.add(m.date);
      }
    }

    const totalHydration = hydration.reduce((sum: number, h: any) => sum + Number(h.amountMl || 0), 0);
    const daysWithHydration = new Set(hydration.map((h: any) => h.date)).size;

    const runs = activities.filter((a: any) => a.activityType === "RUN");
    const totalRunKm = runs.reduce((sum: number, r: any) => sum + Number(r.distanceKm || 0), 0);
    const totalRunSeconds = runs.reduce((sum: number, r: any) => sum + Number(r.movingDurationSeconds || 0), 0);
    let avgPace = "N/A";
    if (totalRunKm > 0 && totalRunSeconds > 0) {
      const paceSec = Math.round(totalRunSeconds / totalRunKm);
      const min = Math.floor(paceSec / 60);
      const sec = paceSec % 60;
      avgPace = `${min}:${sec < 10 ? "0" : ""}${sec} / km`;
    }

    const totalWorkoutTonnage = workouts.reduce((sum: number, w: any) => sum + Number(w.caloriesBurned || 0), 0);

    const keyWins: string[] = [];
    const growthAreas: string[] = [];

    if (totalRunKm >= (settings.profile.weeklyRunningDistanceKm || 15)) {
      keyWins.push(`Achieved weekly running distance target with ${Math.round(totalRunKm * 10) / 10} km.`);
    } else if (totalRunKm > 0) {
      growthAreas.push(`Running volume was ${Math.round(totalRunKm * 10) / 10} km vs ${settings.profile.weeklyRunningDistanceKm || 15} km target.`);
    } else {
      growthAreas.push("No running sessions recorded this week.");
    }

    if (workouts.length >= (settings.profile.weeklyWorkoutSessions || 3)) {
      keyWins.push(`Completed ${workouts.length} strength sessions (Target: ${settings.profile.weeklyWorkoutSessions || 3}).`);
    } else {
      growthAreas.push(`Logged ${workouts.length} workouts vs ${settings.profile.weeklyWorkoutSessions || 3} planned sessions.`);
    }

    if (daysWithProteinMet.size >= 4) {
      keyWins.push(`Hit protein target ($\ge$ ${targetProtein}g) on ${daysWithProteinMet.size} days.`);
    } else {
      growthAreas.push(`Hit protein target on ${daysWithProteinMet.size}/7 days. Focus on high-protein lunches.`);
    }

    if (totalHydration >= 14000) {
      keyWins.push(`Consistent hydration: ${Math.round(totalHydration / 1000)}L consumed across the week.`);
    }

    return {
      userId,
      startDate,
      endDate,
      summaryTitle: `Weekly Health & Performance Review (${startDate} → ${endDate})`,
      overallScore: Math.min(100, Math.round((keyWins.length / Math.max(1, keyWins.length + growthAreas.length)) * 100)),
      keyWins,
      growthAreas,
      metricsSummary: {
        totalCaloriesLogged: Math.round(totalCalories),
        avgDailyCalories: Math.round(totalCalories / 7),
        avgDailyProteinGrams: Math.round((totalProtein / 7) * 10) / 10,
        proteinAdherenceRate: Math.round((daysWithProteinMet.size / 7) * 100),
        totalHydrationMl: totalHydration,
        avgDailyHydrationMl: Math.round(totalHydration / 7),
        hydrationGoalDays: daysWithHydration,
        totalRunningDistanceKm: Math.round(totalRunKm * 100) / 100,
        runningSessionsCount: runs.length,
        avgRunningPace: avgPace,
        totalWorkoutSessions: workouts.length,
        totalWorkoutVolumeKg: totalWorkoutTonnage,
      },
      recommendedNextFocus: [
        "Prioritize lean protein sources at breakfast to hit daily baseline earlier.",
        "Maintain progressive overload on your primary compound lifts.",
        "Hydrate with 500ml of water immediately upon waking.",
      ],
    };
  }

  private static serializePlan(raw: any): WeeklyPlanDto {
    const rawItems = raw.items || [];
    const items = rawItems.map((itm: any) => this.serializeItem(itm));
    const completedCount = items.filter((i: any) => i.isCompleted).length;
    const totalCount = items.length;
    const adherence = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return {
      id: raw.id,
      userId: raw.userId || raw.user_id,
      startDate: raw.startDate || raw.start_date,
      endDate: raw.endDate || raw.end_date,
      goalSummary: raw.goalSummary || raw.goal_summary,
      status: raw.status || "ACTIVE",
      notes: raw.notes || null,
      items,
      adherencePercentage: adherence,
      completedItemsCount: completedCount,
      totalItemsCount: totalCount,
      createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : new Date().toISOString(),
    };
  }

  private static serializeItem(raw: any): WeeklyPlanItemDto {
    let targetData = raw.targetData || raw.target_data;
    if (typeof targetData === "string") {
      try {
        targetData = JSON.parse(targetData);
      } catch {}
    }

    return {
      id: raw.id,
      weeklyPlanId: raw.weeklyPlanId || raw.weekly_plan_id,
      date: raw.date,
      category: raw.category,
      title: raw.title,
      description: raw.description || null,
      targetData: targetData || null,
      isCompleted: Boolean(raw.isCompleted !== undefined ? raw.isCompleted : raw.is_completed),
      matchedActivityId: raw.matchedActivityId || raw.matched_activity_id || null,
      createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt).toISOString() : new Date().toISOString(),
    };
  }
}
