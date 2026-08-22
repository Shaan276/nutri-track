import { prisma } from "@/lib/db";
import {
  LogHydrationInput,
  UpdateHydrationInput,
  BeverageType,
} from "@/lib/validations/hydration";

export interface HydrationEntryDto {
  id: string;
  amountMl: number;
  beverageType: BeverageType;
  date: string;
  consumedAt: string;
  notes: string | null;
  createdAt: string;
}

export interface DailyHydrationSummary {
  date: string;
  totalMl: number;
  targetMl: number;
  percentage: number;
  remainingMl: number;
  isGoalReached: boolean;
  streakDays: number;
  entries: HydrationEntryDto[];
}

export interface WeeklyHydrationPoint {
  label: string;
  date: string;
  value: number;
  target: number;
}

export interface WeeklyHydrationSummary {
  targetMl: number;
  days: WeeklyHydrationPoint[];
}

export class HydrationService {
  /**
   * Retrieves the user's custom daily hydration goal (default: 2,500 ml)
   */
  static async getUserHydrationTarget(userId: string): Promise<number> {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    });
    return profile?.dailyHydrationTargetMl || 2500;
  }

  /**
   * Updates the user's daily hydration goal
   */
  static async updateHydrationTarget(userId: string, targetMl: number) {
    return prisma.userProfile.update({
      where: { userId },
      data: { dailyHydrationTargetMl: targetMl },
    });
  }

  /**
   * Calculates consecutive days streak where intake >= daily target.
   * Gracefully handles today in-progress without breaking an ongoing streak.
   */
  static async calculateStreak(userId: string, targetMl: number, todayStr: string): Promise<number> {
    const logs = await prisma.hydrationLog.findMany({
      where: { userId },
    });

    if (!logs || logs.length === 0) return 0;

    const dailyTotals: Record<string, number> = {};
    for (const log of logs) {
      dailyTotals[log.date] = (dailyTotals[log.date] || 0) + Number(log.amountMl);
    }

    let streak = 0;

    const todayTotal = dailyTotals[todayStr] || 0;
    const isTodayMet = todayTotal >= targetMl;

    if (isTodayMet) {
      streak += 1;
    }

    const getPrevDate = (str: string) => {
      const [y, m, d] = str.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      dt.setUTCDate(dt.getUTCDate() - 1);
      return dt.toISOString().split("T")[0];
    };

    let checkDateStr = getPrevDate(todayStr);

    while (true) {
      const dayTotal = dailyTotals[checkDateStr] || 0;

      if (dayTotal >= targetMl) {
        streak += 1;
        checkDateStr = getPrevDate(checkDateStr);
      } else {
        break;
      }
    }

    return streak;
  }

  /**
   * Consolidated daily hydration metrics, target progress, streak, and timeline logs
   */
  static async getDailyHydration(userId: string, date: string): Promise<DailyHydrationSummary> {
    const targetMl = await this.getUserHydrationTarget(userId);

    const logs = await prisma.hydrationLog.findMany({
      where: {
        userId,
        date,
      },
    });

    const totalMl = logs.reduce((sum: number, log: any) => sum + Number(log.amountMl), 0);
    const percentage = targetMl > 0 ? Math.round((totalMl * 100) / targetMl) : 0;
    const remainingMl = Math.max(0, targetMl - totalMl);
    const isGoalReached = totalMl >= targetMl;
    const streakDays = await this.calculateStreak(userId, targetMl, date);

    const entries: HydrationEntryDto[] = logs.map((log: any) => ({
      id: log.id,
      amountMl: Number(log.amountMl),
      beverageType: log.beverageType as BeverageType,
      date: log.date,
      consumedAt: log.consumedAt.toISOString(),
      notes: log.notes || null,
      createdAt: log.createdAt.toISOString(),
    }));

    return {
      date,
      totalMl,
      targetMl,
      percentage,
      remainingMl,
      isGoalReached,
      streakDays,
      entries,
    };
  }

  /**
   * Retrieves 7-day weekly hydration trend ending at referenceDate
   */
  static async getWeeklyHydration(userId: string, referenceDate: string): Promise<WeeklyHydrationSummary> {
    const targetMl = await this.getUserHydrationTarget(userId);

    // Generate last 7 days in chronological order
    const dateList: string[] = [];
    const [y, m, d] = referenceDate.split("-").map(Number);

    for (let i = 6; i >= 0; i--) {
      const dt = new Date(Date.UTC(y, m - 1, d));
      dt.setUTCDate(dt.getUTCDate() - i);
      dateList.push(dt.toISOString().split("T")[0]);
    }

    const allLogs = await prisma.hydrationLog.findMany({
      where: { userId },
    });

    const dailySums: Record<string, number> = {};
    for (const log of allLogs) {
      dailySums[log.date] = (dailySums[log.date] || 0) + Number(log.amountMl);
    }

    const days: WeeklyHydrationPoint[] = dateList.map((dStr) => {
      const [yy, mm, dd] = dStr.split("-").map(Number);
      const dtObj = new Date(Date.UTC(yy, mm - 1, dd));
      const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(dtObj);
      const val = dailySums[dStr] || 0;

      return {
        label: weekday,
        date: dStr,
        value: val,
        target: targetMl,
      };
    });

    return {
      targetMl,
      days,
    };
  }

  /**
   * Logs a water or beverage intake entry
   */
  static async logHydration(userId: string, input: LogHydrationInput) {
    const { amountMl, beverageType = "WATER", date, consumedAt, notes } = input;

    return prisma.hydrationLog.create({
      data: {
        userId,
        amountMl,
        beverageType,
        date,
        consumedAt: consumedAt ? new Date(consumedAt) : new Date(),
        notes: notes ? notes.trim() : null,
      },
    });
  }

  /**
   * Updates an existing hydration entry with ownership verification
   */
  static async updateHydration(userId: string, logId: string, input: UpdateHydrationInput) {
    const existing = await prisma.hydrationLog.findUnique({
      where: { id: logId },
    });

    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    if (existing.userId !== userId) {
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    return prisma.hydrationLog.update({
      where: { id: logId },
      data: {
        ...(input.amountMl !== undefined && { amountMl: input.amountMl }),
        ...(input.beverageType !== undefined && { beverageType: input.beverageType }),
        ...(input.consumedAt !== undefined && { consumedAt: new Date(input.consumedAt) }),
        ...(input.notes !== undefined && { notes: input.notes ? input.notes.trim() : null }),
      },
    });
  }

  /**
   * Deletes a hydration entry with ownership verification
   */
  static async deleteHydration(userId: string, logId: string) {
    const existing = await prisma.hydrationLog.findUnique({
      where: { id: logId },
    });

    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    if (existing.userId !== userId) {
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    return prisma.hydrationLog.delete({
      where: { id: logId },
    });
  }
}
