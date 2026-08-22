import { prisma } from "@/lib/db";
import { NotificationService } from "@/lib/services/notification.service";
import { calculateSafePercentage } from "@/lib/utils/data-state";

export interface AchievementItemDto {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  points: number;
  targetValue: number;
  unit: string;
  isUnlocked: boolean;
  unlockedAt: Date | null;
  currentProgress: number;
  progressPercentage: number;
}

export const SYSTEM_ACHIEVEMENTS = [
  {
    id: "PROTEIN_7_DAY_STREAK",
    code: "PROTEIN_7_DAY_STREAK",
    name: "Protein Consistency",
    description: "Meet your daily protein target for 7 days.",
    category: "NUTRITION",
    icon: "Utensils",
    points: 100,
    targetValue: 7,
    unit: "days",
  },
  {
    id: "NUTRITION_STREAK_14",
    code: "NUTRITION_STREAK_14",
    name: "Nutrition Master",
    description: "Stay within your calorie adherence target for 14 days.",
    category: "NUTRITION",
    icon: "Salad",
    points: 150,
    targetValue: 14,
    unit: "days",
  },
  {
    id: "HYDRATION_7_DAY",
    code: "HYDRATION_7_DAY",
    name: "Hydration Warrior",
    description: "Meet your daily hydration target for 7 days.",
    category: "HYDRATION",
    icon: "Droplets",
    points: 100,
    targetValue: 7,
    unit: "days",
  },
  {
    id: "HYDRATION_30_DAY",
    code: "HYDRATION_30_DAY",
    name: "Hydration Legend",
    description: "Meet your daily hydration target for 30 total days.",
    category: "HYDRATION",
    icon: "Waves",
    points: 250,
    targetValue: 30,
    unit: "days",
  },
  {
    id: "FIRST_5K",
    code: "FIRST_5K",
    name: "First 5K",
    description: "Record a continuous run of 5.0 km or greater.",
    category: "RUNNING",
    icon: "Footprints",
    points: 50,
    targetValue: 5.0,
    unit: "km",
  },
  {
    id: "RUNNING_100K",
    code: "RUNNING_100K",
    name: "Distance Explorer",
    description: "Accumulate 100 km in cumulative running distance.",
    category: "RUNNING",
    icon: "Trophy",
    points: 200,
    targetValue: 100.0,
    unit: "km",
  },
  {
    id: "SPEED_PROGRESS",
    code: "SPEED_PROGRESS",
    name: "Speed Progress",
    description: "Record a run with an average pace faster than 5'30\"/km (330s/km).",
    category: "RUNNING",
    icon: "Zap",
    points: 100,
    targetValue: 1,
    unit: "runs",
  },
  {
    id: "WORKOUT_10",
    code: "WORKOUT_10",
    name: "Consistency Builder",
    description: "Complete 10 total workout sessions.",
    category: "WORKOUTS",
    icon: "Dumbbell",
    points: 100,
    targetValue: 10,
    unit: "workouts",
  },
  {
    id: "WORKOUT_VOLUME_10K",
    code: "WORKOUT_VOLUME_10K",
    name: "Strength Master",
    description: "Reach 10,000 kg in cumulative workout training volume.",
    category: "WORKOUTS",
    icon: "ShieldAlert",
    points: 200,
    targetValue: 10000,
    unit: "kg",
  },
  {
    id: "SEVEN_DAY_STREAK",
    code: "SEVEN_DAY_STREAK",
    name: "Seven-Day Streak",
    description: "Log nutrition, hydration, or activity for 7 consecutive days.",
    category: "CONSISTENCY",
    icon: "Flame",
    points: 100,
    targetValue: 7,
    unit: "days",
  },
  {
    id: "PERFECT_DAY",
    code: "PERFECT_DAY",
    name: "Perfect Day",
    description: "Log nutrition, hydration, and an activity all in a single day.",
    category: "CONSISTENCY",
    icon: "Sparkles",
    points: 50,
    targetValue: 1,
    unit: "days",
  },
  {
    id: "GOAL_CRUSHER",
    code: "GOAL_CRUSHER",
    name: "Goal Crusher",
    description: "Successfully complete 3 personal goals.",
    category: "CONSISTENCY",
    icon: "Crown",
    points: 200,
    targetValue: 3,
    unit: "goals",
  },
];

export class AchievementService {
  /**
   * Ensure system achievements are pre-seeded in the database
   */
  static async seedAchievements() {
    const pool = prisma as any;
    for (const ach of SYSTEM_ACHIEVEMENTS) {
      await pool.achievement.upsert({
        where: { id: ach.id },
        update: ach,
        create: ach,
      });
    }
  }

  /**
   * Get all achievements for a user with live real-data progress evaluation
   */
  static async getUserAchievements(userId: string): Promise<{
    achievements: AchievementItemDto[];
    unlockedCount: number;
    totalPoints: number;
  }> {
    await this.seedAchievements();
    const pool = prisma as any;

    // Fetch user raw data from source tables
    const [meals, hydrations, activities, workouts, goals, userProfile, userSettings] = await Promise.all([
      pool.mealLog.findMany({ where: { userId }, include: { entries: { include: { food: true } } } }),
      pool.hydrationLog.findMany({ where: { userId } }),
      pool.activityLog.findMany({ where: { userId } }),
      pool.workoutSession.findMany({ where: { userId } }),
      pool.goal.findMany({ where: { userId } }),
      pool.userProfile.findUnique({ where: { userId } }),
      pool.userNutrientTarget.findUnique({ where: { userId } }),
    ]);

    // 1. Calculate Real Metric Progresses:

    // Protein Target & Calorie Target from Settings
    const targetProtein = Number(userSettings?.proteinGrams || 100);
    const targetCalories = Number(userSettings?.calorieTarget || 2000);
    const targetHydrationMl = Number(userProfile?.dailyHydrationTargetMl || 2500);

    // Group meals by date
    const dailyMeals = new Map<string, { calories: number; protein: number }>();
    for (const ml of meals) {
      const cur = dailyMeals.get(ml.date) || { calories: 0, protein: 0 };
      for (const e of ml.entries || []) {
        const factor = Number(e.quantity) / Number(e.food?.servingSize || 100);
        cur.calories += Number(e.food?.calories || 0) * factor;
        cur.protein += Number(e.food?.protein || 0) * factor;
      }
      dailyMeals.set(ml.date, cur);
    }

    let proteinSuccessfulDays = 0;
    let calorieSuccessfulDays = 0;
    dailyMeals.forEach((totals) => {
      if (totals.protein >= targetProtein) proteinSuccessfulDays++;
      if (totals.calories >= targetCalories * 0.85 && totals.calories <= targetCalories * 1.15) {
        calorieSuccessfulDays++;
      }
    });

    // Group hydrations by date
    const dailyHydrations = new Map<string, number>();
    for (const hl of hydrations) {
      dailyHydrations.set(hl.date, (dailyHydrations.get(hl.date) || 0) + Number(hl.amountMl));
    }
    let hydrationSuccessfulDays = 0;
    dailyHydrations.forEach((sumMl) => {
      if (sumMl >= targetHydrationMl) hydrationSuccessfulDays++;
    });

    // Running calculations (STRICTLY activityType === "RUN")
    const runs = activities.filter((a: any) => a.activityType === "RUN");
    const maxSingleRunKm = runs.reduce((max: number, r: any) => Math.max(max, Number(r.distanceKm || 0)), 0);
    const totalRunningKm = runs.reduce((sum: number, r: any) => sum + Number(r.distanceKm || 0), 0);
    const fastRunsCount = runs.filter((r: any) => {
      if (Number(r.distanceKm) >= 1 && Number(r.durationMinutes) > 0) {
        const paceSecPerKm = (Number(r.durationMinutes) * 60) / Number(r.distanceKm);
        return paceSecPerKm <= 330; // sub-5:30/km
      }
      return false;
    }).length;

    // Workout volume calculation
    const totalWorkoutsCount = workouts.length;
    let totalWorkoutVolume = 0;
    for (const w of workouts) {
      const exercises = await pool.workoutExercise.findMany({
        where: { sessionId: w.id },
        include: { sets: true },
      });
      for (const ex of exercises) {
        for (const s of ex.sets || []) {
          totalWorkoutVolume += Number(s.reps || 0) * Number(s.weightKg || 0);
        }
      }
    }

    // Perfect Day calculation (same date has food, hydration, activity)
    const datesWithFood = new Set(meals.map((m: any) => m.date));
    const datesWithHydration = new Set(hydrations.map((h: any) => h.date));
    const datesWithActivity = new Set(activities.map((a: any) => a.date));
    let perfectDaysCount = 0;
    datesWithFood.forEach((d) => {
      if (datesWithHydration.has(d) && datesWithActivity.has(d)) {
        perfectDaysCount++;
      }
    });

    // Overall logged active days
    const allLoggedDates = new Set([
      ...Array.from(datesWithFood),
      ...Array.from(datesWithHydration),
      ...Array.from(datesWithActivity),
    ]);
    const totalLoggedDays = allLoggedDates.size;

    // Completed goals
    const completedGoalsCount = goals.filter((g: any) => g.status === "COMPLETED").length;

    // 2. Evaluate each achievement against current progress:
    const results: AchievementItemDto[] = [];
    let unlockedCount = 0;
    let totalPoints = 0;

    for (const ach of SYSTEM_ACHIEVEMENTS) {
      let progress = 0;
      switch (ach.id) {
        case "PROTEIN_7_DAY_STREAK":
          progress = proteinSuccessfulDays;
          break;
        case "NUTRITION_STREAK_14":
          progress = calorieSuccessfulDays;
          break;
        case "HYDRATION_7_DAY":
        case "HYDRATION_30_DAY":
          progress = hydrationSuccessfulDays;
          break;
        case "FIRST_5K":
          progress = Math.min(ach.targetValue, Math.round(maxSingleRunKm * 10) / 10);
          break;
        case "RUNNING_100K":
          progress = Math.round(totalRunningKm * 10) / 10;
          break;
        case "SPEED_PROGRESS":
          progress = fastRunsCount;
          break;
        case "WORKOUT_10":
          progress = totalWorkoutsCount;
          break;
        case "WORKOUT_VOLUME_10K":
          progress = Math.round(totalWorkoutVolume);
          break;
        case "SEVEN_DAY_STREAK":
          progress = totalLoggedDays;
          break;
        case "PERFECT_DAY":
          progress = perfectDaysCount;
          break;
        case "GOAL_CRUSHER":
          progress = completedGoalsCount;
          break;
      }

      const isCompleted = progress >= ach.targetValue;
      const progressPercentage = calculateSafePercentage(progress, ach.targetValue);

      // Check existing user achievement record
      const existing = await pool.userAchievement.findUnique({
        where: { userId_achievementId: { userId, achievementId: ach.id } },
      });

      let unlockedAt: Date | null = existing?.unlockedAt || null;

      if (isCompleted && !unlockedAt) {
        unlockedAt = new Date();
        // Save unlocked achievement
        await pool.userAchievement.upsert({
          where: { userId_achievementId: { userId, achievementId: ach.id } },
          update: {
            currentProgress: progress,
            unlockedAt: unlockedAt.toISOString(),
          },
          create: {
            userId,
            achievementId: ach.id,
            currentProgress: progress,
            unlockedAt: unlockedAt.toISOString(),
          },
        });

        // Smart Notification for fresh unlock
        await NotificationService.createNotification({
          userId,
          category: "ACHIEVEMENT",
          type: "ACHIEVEMENT_UNLOCKED",
          title: `🏆 Achievement Unlocked: ${ach.name}`,
          message: `Congratulations! You just earned the "${ach.name}" badge (+${ach.points} pts).`,
          actionUrl: `/goals?tab=achievements`,
          metadata: { achievementId: ach.id, points: ach.points },
        });
      } else if (!isCompleted && existing && existing.unlockedAt) {
        // If underlying data was deleted, revert progress
        await pool.userAchievement.update({
          where: { userId_achievementId: { userId, achievementId: ach.id } },
          data: {
            currentProgress: progress,
            unlockedAt: null,
          },
        });
        unlockedAt = null;
      } else {
        // Update current progress tracking
        await pool.userAchievement.upsert({
          where: { userId_achievementId: { userId, achievementId: ach.id } },
          update: { currentProgress: progress },
          create: { userId, achievementId: ach.id, currentProgress: progress, unlockedAt: null },
        });
      }

      if (unlockedAt) {
        unlockedCount++;
        totalPoints += ach.points;
      }

      results.push({
        id: ach.id,
        code: ach.code,
        name: ach.name,
        description: ach.description,
        category: ach.category,
        icon: ach.icon,
        points: ach.points,
        targetValue: ach.targetValue,
        unit: ach.unit,
        isUnlocked: Boolean(unlockedAt),
        unlockedAt,
        currentProgress: progress,
        progressPercentage,
      });
    }

    return {
      achievements: results,
      unlockedCount,
      totalPoints,
    };
  }
}
