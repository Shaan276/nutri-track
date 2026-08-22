import { prisma } from "@/lib/db";
import { CreateGoalInput, UpdateGoalInput, GoalCategory, GoalType, GoalStatus } from "@/lib/validations/goals";
import { NotificationService } from "@/lib/services/notification.service";
import { calculateSafePercentage } from "@/lib/utils/data-state";

export interface GoalWithProgress {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  category: GoalCategory;
  goalType: GoalType;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  targetDate: string;
  status: GoalStatus;
  completedAt: Date | null;
  lastEvaluatedAt: Date | null;
  metadata: any | null;
  createdAt: Date;
  updatedAt: Date;
  progressPercentage: number;
  remainingAmount: number;
  daysRemaining: number;
  milestones: Array<{
    percentage: number;
    reachedAt: Date;
  }>;
}

export class GoalService {
  /**
   * Create a new goal and immediately evaluate its progress from source data
   */
  static async createGoal(userId: string, input: CreateGoalInput): Promise<GoalWithProgress> {
    const pool = prisma as any;

    const goal = await pool.goal.create({
      data: {
        userId,
        name: input.name,
        description: input.description || null,
        category: input.category,
        goalType: input.goalType,
        targetValue: input.targetValue,
        currentValue: 0,
        unit: input.unit,
        startDate: input.startDate,
        targetDate: input.targetDate,
        status: "ACTIVE",
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });

    return this.evaluateGoal(goal.id, userId);
  }

  /**
   * Get all goals for a user with live progress evaluation
   */
  static async getGoals(
    userId: string,
    filters?: { category?: GoalCategory; status?: GoalStatus; limit?: number }
  ): Promise<{
    goals: GoalWithProgress[];
    activeCount: number;
    completedCount: number;
    featuredGoal: GoalWithProgress | null;
  }> {
    const pool = prisma as any;

    const where: any = { userId };
    if (filters?.category) where.category = filters.category;
    if (filters?.status) where.status = filters.status;

    const rawGoals = await pool.goal.findMany({
      where,
      take: filters?.limit || 100,
    });

    // Evaluate active goals to guarantee freshest data from source logs
    const evaluatedGoals: GoalWithProgress[] = [];
    for (const g of rawGoals) {
      if (g.status === "ACTIVE") {
        const evaluated = await this.evaluateGoal(g.id, userId);
        evaluatedGoals.push(evaluated);
      } else {
        const parsedMeta = typeof g.metadata === "string" ? JSON.parse(g.metadata) : g.metadata;
        const milestones = await pool.goalMilestone.findMany({ where: { goalId: g.id } });
        const progressPercentage = calculateSafePercentage(g.currentValue, g.targetValue, { maxCap: 100 });
        const daysRemaining = this.calculateDaysRemaining(g.targetDate);
        evaluatedGoals.push({
          ...g,
          metadata: parsedMeta,
          progressPercentage,
          remainingAmount: Math.max(0, g.targetValue - g.currentValue),
          daysRemaining,
          milestones: milestones.map((m: any) => ({
            percentage: m.percentage,
            reachedAt: m.reachedAt,
          })),
        });
      }
    }

    const allUserGoals = await pool.goal.findMany({ where: { userId } });
    const activeCount = allUserGoals.filter((g: any) => g.status === "ACTIVE").length;
    const completedCount = allUserGoals.filter((g: any) => g.status === "COMPLETED").length;

    // Featured goal: closest to completion among active goals, or most recent active goal
    const activeGoals = evaluatedGoals.filter((g) => g.status === "ACTIVE");
    let featuredGoal: GoalWithProgress | null = null;
    if (activeGoals.length > 0) {
      featuredGoal = [...activeGoals].sort((a, b) => b.progressPercentage - a.progressPercentage)[0];
    }

    return {
      goals: evaluatedGoals,
      activeCount,
      completedCount,
      featuredGoal,
    };
  }

  /**
   * Get single goal by ID with detailed evaluation
   */
  static async getGoalById(userId: string, goalId: string): Promise<GoalWithProgress | null> {
    const pool = prisma as any;
    const goal = await pool.goal.findUnique({ where: { id: goalId } });
    if (!goal || goal.userId !== userId) return null;

    if (goal.status === "ACTIVE") {
      return this.evaluateGoal(goal.id, userId);
    }

    const parsedMeta = typeof goal.metadata === "string" ? JSON.parse(goal.metadata) : goal.metadata;
    const milestones = await pool.goalMilestone.findMany({ where: { goalId } });
    const progressPercentage = calculateSafePercentage(goal.currentValue, goal.targetValue, { maxCap: 100 });
    const daysRemaining = this.calculateDaysRemaining(goal.targetDate);

    return {
      ...goal,
      metadata: parsedMeta,
      progressPercentage,
      remainingAmount: Math.max(0, goal.targetValue - goal.currentValue),
      daysRemaining,
      milestones: milestones.map((m: any) => ({
        percentage: m.percentage,
        reachedAt: m.reachedAt,
      })),
    };
  }

  /**
   * Update goal attributes
   */
  static async updateGoal(userId: string, goalId: string, input: UpdateGoalInput): Promise<GoalWithProgress> {
    const pool = prisma as any;
    const existing = await pool.goal.findUnique({ where: { id: goalId } });
    if (!existing || existing.userId !== userId) {
      throw new Error("Goal not found or access denied");
    }

    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.targetValue !== undefined) updateData.targetValue = input.targetValue;
    if (input.unit !== undefined) updateData.unit = input.unit;
    if (input.targetDate !== undefined) updateData.targetDate = input.targetDate;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.metadata !== undefined) updateData.metadata = JSON.stringify(input.metadata);

    await pool.goal.update({
      where: { id: goalId },
      data: updateData,
    });

    return this.evaluateGoal(goalId, userId);
  }

  /**
   * Pause goal
   */
  static async pauseGoal(userId: string, goalId: string): Promise<GoalWithProgress> {
    return this.updateGoal(userId, goalId, { status: "PAUSED" });
  }

  /**
   * Resume goal
   */
  static async resumeGoal(userId: string, goalId: string): Promise<GoalWithProgress> {
    return this.updateGoal(userId, goalId, { status: "ACTIVE" });
  }

  /**
   * Cancel goal
   */
  static async cancelGoal(userId: string, goalId: string): Promise<GoalWithProgress> {
    return this.updateGoal(userId, goalId, { status: "CANCELLED" });
  }

  /**
   * Delete goal
   */
  static async deleteGoal(userId: string, goalId: string): Promise<boolean> {
    const pool = prisma as any;
    const existing = await pool.goal.findUnique({ where: { id: goalId } });
    if (!existing || existing.userId !== userId) {
      throw new Error("Goal not found or access denied");
    }
    await pool.goal.delete({ where: { id: goalId } });
    return true;
  }

  /**
   * Dynamic progress evaluation engine.
   * Derives current progress strictly from source database tables across [startDate, targetDate].
   */
  static async evaluateGoal(goalId: string, userId: string): Promise<GoalWithProgress> {
    const pool = prisma as any;
    const goal = await pool.goal.findUnique({ where: { id: goalId } });
    if (!goal) throw new Error("Goal not found");

    const meta = typeof goal.metadata === "string" ? JSON.parse(goal.metadata || "{}") : goal.metadata || {};
    let calculatedValue = 0;

    switch (goal.category) {
      case "NUTRITION": {
        calculatedValue = await this.evaluateNutritionProgress(userId, goal, meta);
        break;
      }
      case "HYDRATION": {
        calculatedValue = await this.evaluateHydrationProgress(userId, goal, meta);
        break;
      }
      case "RUNNING": {
        calculatedValue = await this.evaluateRunningProgress(userId, goal, meta);
        break;
      }
      case "ACTIVITIES": {
        calculatedValue = await this.evaluateActivityProgress(userId, goal, meta);
        break;
      }
      case "WORKOUTS": {
        calculatedValue = await this.evaluateWorkoutProgress(userId, goal, meta);
        break;
      }
      case "CONSISTENCY": {
        calculatedValue = await this.evaluateConsistencyProgress(userId, goal, meta);
        break;
      }
      default:
        calculatedValue = goal.currentValue || 0;
    }

    // Determine completion status
    const isCompleted = calculatedValue >= goal.targetValue;
    const newStatus = isCompleted && goal.status === "ACTIVE" ? "COMPLETED" : goal.status;
    const completedAt = isCompleted && !goal.completedAt ? new Date() : goal.completedAt;

    // Update goal in database
    const updated = await pool.goal.update({
      where: { id: goalId },
      data: {
        currentValue: calculatedValue,
        status: newStatus,
        completedAt: completedAt ? completedAt.toISOString() : null,
        lastEvaluatedAt: new Date().toISOString(),
      },
    });

    // Milestone evaluation & deduplicated notifications
    const progressPercentage = calculateSafePercentage(calculatedValue, goal.targetValue, { maxCap: 100 });
    await this.processMilestones(userId, updated, progressPercentage);

    const milestones = await pool.goalMilestone.findMany({
      where: { goalId },
      orderBy: { percentage: "asc" },
    });

    const daysRemaining = this.calculateDaysRemaining(goal.targetDate);

    return {
      ...updated,
      metadata: meta,
      progressPercentage,
      remainingAmount: Math.max(0, goal.targetValue - calculatedValue),
      daysRemaining,
      milestones: milestones.map((m: any) => ({
        percentage: m.percentage,
        reachedAt: m.reachedAt,
      })),
    };
  }

  /**
   * Evaluates nutrition progress across [startDate, targetDate]
   */
  private static async evaluateNutritionProgress(userId: string, goal: any, meta: any): Promise<number> {
    const pool = prisma as any;
    const mealLogs = await pool.mealLog.findMany({
      where: { userId },
      include: { entries: { include: { food: true } } },
    });

    const filteredLogs = mealLogs.filter((ml: any) => ml.date >= goal.startDate && ml.date <= goal.targetDate);

    if (goal.goalType === "DAILY_TARGET_STREAK" || goal.unit === "days") {
      // Group by date and check daily target
      const dailyTotals = new Map<string, { calories: number; protein: number; fiber: number }>();
      for (const ml of filteredLogs) {
        const date = ml.date;
        const current = dailyTotals.get(date) || { calories: 0, protein: 0, fiber: 0 };
        for (const entry of ml.entries || []) {
          const factor = Number(entry.quantity) / Number(entry.food?.servingSize || 100);
          current.calories += Number(entry.food?.calories || 0) * factor;
          current.protein += Number(entry.food?.protein || 0) * factor;
          current.fiber += Number(entry.food?.fiber || 0) * factor;
        }
        dailyTotals.set(date, current);
      }

      let successfulDays = 0;
      const targetDailyVal = meta.dailyTarget || meta.dailyValue || 100;
      const nutrientKey = meta.nutrientKey || "protein";

      dailyTotals.forEach((totals) => {
        if (nutrientKey === "protein" && totals.protein >= targetDailyVal) {
          successfulDays++;
        } else if (nutrientKey === "calories" && totals.calories >= targetDailyVal) {
          successfulDays++;
        } else if (nutrientKey === "fiber" && totals.fiber >= targetDailyVal) {
          successfulDays++;
        }
      });
      return successfulDays;
    } else {
      // Cumulative sum
      let total = 0;
      for (const ml of filteredLogs) {
        for (const entry of ml.entries || []) {
          const factor = Number(entry.quantity) / Number(entry.food?.servingSize || 100);
          if (meta.nutrientKey === "protein") {
            total += Number(entry.food?.protein || 0) * factor;
          } else {
            total += Number(entry.food?.calories || 0) * factor;
          }
        }
      }
      return Math.round(total * 10) / 10;
    }
  }

  /**
   * Evaluates hydration progress across [startDate, targetDate]
   */
  private static async evaluateHydrationProgress(userId: string, goal: any, meta: any): Promise<number> {
    const pool = prisma as any;
    const hydrationLogs = await pool.hydrationLog.findMany({
      where: { userId },
    });

    const filteredLogs = hydrationLogs.filter((hl: any) => hl.date >= goal.startDate && hl.date <= goal.targetDate);

    if (goal.goalType === "DAILY_TARGET_STREAK" || goal.unit === "days") {
      const dailySums = new Map<string, number>();
      for (const hl of filteredLogs) {
        dailySums.set(hl.date, (dailySums.get(hl.date) || 0) + Number(hl.amountMl));
      }
      const targetDailyMl = meta.dailyTargetMl || meta.dailyTarget || 2500;
      let successfulDays = 0;
      dailySums.forEach((totalMl) => {
        if (totalMl >= targetDailyMl) {
          successfulDays++;
        }
      });
      return successfulDays;
    } else {
      // Cumulative ml
      const sum = filteredLogs.reduce((acc: number, hl: any) => acc + Number(hl.amountMl), 0);
      return sum;
    }
  }

  /**
   * Evaluates running progress strictly from RUN activity logs
   */
  private static async evaluateRunningProgress(userId: string, goal: any, meta: any): Promise<number> {
    const pool = prisma as any;
    const allActivities = await pool.activityLog.findMany({
      where: { userId },
    });

    // STRICT: only include activityType === "RUN"
    const runLogs = allActivities.filter(
      (a: any) =>
        a.activityType === "RUN" &&
        a.date >= goal.startDate &&
        a.date <= goal.targetDate
    );

    if (meta.subType) {
      const filteredBySubType = runLogs.filter((r: any) => r.subType === meta.subType);
      if (goal.goalType === "SESSION_COUNT" || goal.unit === "runs") {
        return filteredBySubType.length;
      }
      return filteredBySubType.reduce((acc: number, r: any) => acc + Number(r.distanceKm || 0), 0);
    }

    if (goal.goalType === "SESSION_COUNT" || goal.unit === "runs") {
      return runLogs.length;
    }

    if (goal.goalType === "TARGET_PACE") {
      // Find best pace (lowest seconds per km)
      if (runLogs.length === 0) return 0;
      const paces = runLogs
        .filter((r: any) => Number(r.distanceKm) > 0 && Number(r.durationMinutes) > 0)
        .map((r: any) => (Number(r.durationMinutes) * 60) / Number(r.distanceKm));
      return paces.length > 0 ? Math.min(...paces) : 0;
    }

    // Default cumulative distance (km)
    const totalKm = runLogs.reduce((acc: number, r: any) => acc + Number(r.distanceKm || 0), 0);
    return Math.round(totalKm * 100) / 100;
  }

  /**
   * Evaluates activity progress across all valid activity logs
   */
  private static async evaluateActivityProgress(userId: string, goal: any, meta: any): Promise<number> {
    const pool = prisma as any;
    const allActivities = await pool.activityLog.findMany({
      where: { userId },
    });

    const filtered = allActivities.filter(
      (a: any) => a.date >= goal.startDate && a.date <= goal.targetDate
    );

    if (goal.unit === "steps") {
      return filtered.reduce((acc: number, a: any) => acc + Number(a.steps || 0), 0);
    }

    if (goal.unit === "calories" || goal.unit === "kcal") {
      return filtered.reduce((acc: number, a: any) => acc + Number(a.activeCalories || 0), 0);
    }

    if (goal.unit === "km") {
      const totalKm = filtered.reduce((acc: number, a: any) => acc + Number(a.distanceKm || 0), 0);
      return Math.round(totalKm * 100) / 100;
    }

    // Default session count
    return filtered.length;
  }

  /**
   * Evaluates workout progress from workout sessions
   */
  private static async evaluateWorkoutProgress(userId: string, goal: any, meta: any): Promise<number> {
    const pool = prisma as any;
    const workoutSessions = await pool.workoutSession.findMany({
      where: { userId },
    });

    let filtered = workoutSessions.filter(
      (w: any) => w.date >= goal.startDate && w.date <= goal.targetDate
    );

    if (meta.workoutLocation === "GYM") {
      filtered = filtered.filter(
        (w: any) =>
          w.location === "GYM" ||
          w.workoutType === "GYM_WORKOUT" ||
          w.workoutType === "GYM"
      );
    } else if (meta.workoutLocation === "HOME") {
      filtered = filtered.filter(
        (w: any) =>
          w.location === "HOME" ||
          w.workoutType === "HOME_WORKOUT" ||
          w.workoutType === "HOME"
      );
    }

    if (goal.goalType === "VOLUME_LOAD" || goal.unit === "kg") {
      // Sum total volume from exercises and sets
      let totalVolume = 0;
      for (const session of filtered) {
        const exercises = await pool.workoutExercise.findMany({
          where: { sessionId: session.id },
          include: { sets: true },
        });
        for (const ex of exercises) {
          for (const s of ex.sets || []) {
            totalVolume += Number(s.reps || 0) * Number(s.weightKg || 0);
          }
        }
      }
      return Math.round(totalVolume);
    }

    // Default session count
    return filtered.length;
  }

  /**
   * Evaluates consistency progress
   */
  private static async evaluateConsistencyProgress(userId: string, goal: any, meta: any): Promise<number> {
    const pool = prisma as any;
    const [meals, hydrations, activities] = await Promise.all([
      pool.mealLog.findMany({ where: { userId } }),
      pool.hydrationLog.findMany({ where: { userId } }),
      pool.activityLog.findMany({ where: { userId } }),
    ]);

    const activeDays = new Set<string>();
    meals.forEach((m: any) => {
      if (m.date >= goal.startDate && m.date <= goal.targetDate) activeDays.add(m.date);
    });
    hydrations.forEach((h: any) => {
      if (h.date >= goal.startDate && h.date <= goal.targetDate) activeDays.add(h.date);
    });
    activities.forEach((a: any) => {
      if (a.date >= goal.startDate && a.date <= goal.targetDate) activeDays.add(a.date);
    });

    return activeDays.size;
  }

  /**
   * Milestone Recognition & Deduplicated Smart Notifications
   */
  private static async processMilestones(userId: string, goal: any, progressPercentage: number) {
    const pool = prisma as any;
    const milestoneThresholds = [25, 50, 75, 90, 100];

    for (const threshold of milestoneThresholds) {
      if (progressPercentage >= threshold) {
        // Check if milestone record exists
        const existing = await pool.goalMilestone.findFirst({
          where: { goalId: goal.id, percentage: threshold },
        });

        if (!existing) {
          // Record milestone
          await pool.goalMilestone.create({
            data: {
              goalId: goal.id,
              percentage: threshold,
              reachedAt: new Date().toISOString(),
              notifiedAt: new Date().toISOString(),
            },
          });

          // Dispatch Smart Notification
          if (threshold === 100) {
            await NotificationService.createNotification({
              userId,
              category: "GOAL",
              type: "GOAL_COMPLETED",
              title: `🎯 Goal Completed: ${goal.name}`,
              message: `Incredible job! You have reached 100% of your goal: "${goal.name}".`,
              actionUrl: `/goals`,
              metadata: { goalId: goal.id, percentage: 100 },
            });
          } else {
            await NotificationService.createNotification({
              userId,
              category: "GOAL",
              type: "GOAL_MILESTONE",
              title: `🎯 Goal Milestone Reached (${threshold}%)`,
              message: `You've achieved ${threshold}% of your goal: "${goal.name}". Keep up the momentum!`,
              actionUrl: `/goals`,
              metadata: { goalId: goal.id, percentage: threshold },
            });
          }
        }
      }
    }
  }

  /**
   * Helper to calculate remaining days until targetDate
   */
  private static calculateDaysRemaining(targetDateStr: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }
}
