import { prisma } from "@/lib/db";
import { NotificationService } from "./notification.service";
import { HydrationService } from "./hydration.service";
import { NutritionService } from "./nutrition.service";

export class SmartReminderService {
  /**
   * Evaluates and dispatches context-aware smart reminders for a user
   */
  static async evaluateReminders(userId: string, currentTime: Date = new Date()) {
    const prefs = await NotificationService.getPreferences(userId);
    const todayStr = currentTime.toISOString().split("T")[0];
    const pool = prisma as any;

    // 1. Quiet Hours Check
    if (prefs.quietHoursEnabled) {
      const isQuiet = this.isWithinQuietHours(
        currentTime,
        prefs.quietHoursStart,
        prefs.quietHoursEnd
      );
      if (isQuiet) {
        return { evaluated: true, quietHoursActive: true, generated: 0 };
      }
    }

    let generatedCount = 0;
    const currentHour = currentTime.getHours(); // 0 - 23

    // 2. Hydration Reminder Evaluation
    if (prefs.hydrationReminders) {
      const hydrationGenerated = await this.evaluateHydrationReminder(
        userId,
        todayStr,
        currentHour,
        currentTime
      );
      if (hydrationGenerated) generatedCount++;
    }

    // 3. Nutrition Reminder Evaluation
    if (prefs.nutritionReminders) {
      const nutritionGenerated = await this.evaluateNutritionReminder(
        userId,
        todayStr,
        currentHour,
        currentTime
      );
      if (nutritionGenerated) generatedCount++;
    }

    // 4. Workout Reminder Evaluation
    if (prefs.workoutReminders) {
      const workoutGenerated = await this.evaluateWorkoutReminder(
        userId,
        todayStr,
        currentHour,
        currentTime
      );
      if (workoutGenerated) generatedCount++;
    }

    return {
      evaluated: true,
      quietHoursActive: false,
      generated: generatedCount,
    };
  }

  /**
   * Evaluates hydration progress contextually without early-morning failure alerts
   */
  private static async evaluateHydrationReminder(
    userId: string,
    todayStr: string,
    currentHour: number,
    currentTime: Date
  ): Promise<boolean> {
    // Early morning (< 12 PM): Day in progress, do not alarm
    if (currentHour < 12) return false;

    // Cooldown check (last 4 hours)
    const recentReminder = await this.getRecentNotification(
      userId,
      "HYDRATION_REMINDER",
      4 * 60 * 60 * 1000,
      currentTime
    );
    if (recentReminder) return false;

    try {
      const dailyHyd = await HydrationService.getDailyHydration(userId, todayStr);
      // If already reached goal or >= 80%, no reminder needed
      if (dailyHyd.percentage >= 80) return false;

      // Afternoon check (12 PM - 5 PM) and below 50%
      if (currentHour >= 12 && currentHour < 17 && dailyHyd.percentage < 50) {
        await NotificationService.createNotification({
          userId,
          category: "HYDRATION",
          type: "HYDRATION_REMINDER",
          title: "Hydration Check-in",
          message: `You're at ${dailyHyd.percentage}% of today's hydration target (${dailyHyd.totalMl} / ${dailyHyd.targetMl} ml). A glass of water can help you catch up!`,
          actionUrl: "/hydration",
        });
        return true;
      }

      // Evening check (>= 17) and below 70%
      if (currentHour >= 17 && dailyHyd.percentage < 70) {
        await NotificationService.createNotification({
          userId,
          category: "HYDRATION",
          type: "HYDRATION_REMINDER",
          title: "Evening Hydration Reminder",
          message: `You have ${dailyHyd.remainingMl} ml remaining to hit your daily hydration target (${dailyHyd.totalMl} / ${dailyHyd.targetMl} ml).`,
          actionUrl: "/hydration",
        });
        return true;
      }
    } catch {
      // Safe ignore
    }

    return false;
  }

  /**
   * Evaluates nutrition meal logging progress without treating missing data as failure
   */
  private static async evaluateNutritionReminder(
    userId: string,
    todayStr: string,
    currentHour: number,
    currentTime: Date
  ): Promise<boolean> {
    // Early day (< 14:00): Do not spam for unlogged lunch
    if (currentHour < 14) return false;

    // Cooldown check (last 6 hours)
    const recentReminder = await this.getRecentNotification(
      userId,
      "NUTRITION_REMINDER",
      6 * 60 * 60 * 1000,
      currentTime
    );
    if (recentReminder) return false;

    try {
      const dailyNut = await NutritionService.getDailyNutrition(userId, todayStr);
      const hasLoggedMeals = dailyNut.meals.some((m) => m.entries && m.entries.length > 0);

      // If user hasn't logged any food by mid-afternoon
      if (!hasLoggedMeals && currentHour >= 14) {
        await NotificationService.createNotification({
          userId,
          category: "NUTRITION",
          type: "NUTRITION_REMINDER",
          title: "Meal Logging Reminder",
          message: "You haven't logged any meals today yet. Tracking your meals helps maintain accurate daily macronutrient insights.",
          actionUrl: "/nutrition",
        });
        return true;
      }
    } catch {
      // Safe ignore
    }

    return false;
  }

  /**
   * Evaluates workout reminder only if explicitly enabled by user
   */
  private static async evaluateWorkoutReminder(
    userId: string,
    todayStr: string,
    currentHour: number,
    currentTime: Date
  ): Promise<boolean> {
    // Only in late afternoon / evening (>= 16:00)
    if (currentHour < 16) return false;

    // Cooldown check (once per day / 12 hours)
    const recentReminder = await this.getRecentNotification(
      userId,
      "WORKOUT_REMINDER",
      12 * 60 * 60 * 1000,
      currentTime
    );
    if (recentReminder) return false;

    try {
      const pool = prisma as any;
      const todayWorkouts = await pool.workoutSession.findMany({
        where: { userId, date: todayStr },
      });

      if (todayWorkouts.length === 0) {
        await NotificationService.createNotification({
          userId,
          category: "WORKOUTS",
          type: "WORKOUT_REMINDER",
          title: "Workout Reminder",
          message: "Ready for your training session today? Log your exercises, sets, and volume to keep your streak alive.",
          actionUrl: "/workouts",
        });
        return true;
      }
    } catch {
      // Safe ignore
    }

    return false;
  }

  /**
   * Helper to check if a specific notification type was recently sent within cooldownMs
   */
  private static async getRecentNotification(
    userId: string,
    type: string,
    cooldownMs: number,
    currentTime: Date
  ) {
    const pool = prisma as any;
    const sinceTime = new Date(currentTime.getTime() - cooldownMs);

    const recent = await pool.notification.findMany({
      where: {
        userId,
        type,
      },
      orderBy: { createdAt: "desc" },
      take: 1,
    });

    if (!recent || recent.length === 0) return null;
    const notif = recent[0];
    const notifTime = new Date(notif.createdAt).getTime();

    if (currentTime.getTime() - notifTime < cooldownMs) {
      return notif;
    }
    return null;
  }

  /**
   * Checks if currentTime falls within quiet hours (e.g. "22:00" to "08:00")
   */
  static isWithinQuietHours(
    currentTime: Date,
    startStr: string = "22:00",
    endStr: string = "08:00"
  ): boolean {
    const currentMins = currentTime.getHours() * 60 + currentTime.getMinutes();

    const [startH, startM] = startStr.split(":").map(Number);
    const startMins = startH * 60 + (startM || 0);

    const [endH, endM] = endStr.split(":").map(Number);
    const endMins = endH * 60 + (endM || 0);

    if (startMins <= endMins) {
      // e.g. 13:00 to 15:00
      return currentMins >= startMins && currentMins <= endMins;
    } else {
      // overnight e.g. 22:00 to 08:00
      return currentMins >= startMins || currentMins <= endMins;
    }
  }
}