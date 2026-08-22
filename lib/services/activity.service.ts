import { prisma } from "@/lib/db";
import {
  LogActivityInput,
  UpdateActivityInput,
  ActivityType,
  RunningType,
  ActivitySource,
  calculateAveragePace,
} from "@/lib/validations/activity";

export interface ActivityEntryDto {
  id: string;
  activityType: ActivityType;
  runningType: RunningType | null;
  source: ActivitySource;
  externalId: string | null;
  externalProvider: string | null;
  date: string;
  distanceKm: number;
  movingDurationSeconds: number;
  elapsedDurationSeconds: number | null;
  averagePaceSecondsPerKm: number;
  steps: number;
  caloriesBurned: number;
  elevationGainMeters: number;
  notes: string | null;
  createdAt: string;
}

export interface DailyActivitySummary {
  date: string;
  totalDistanceKm: number;
  totalMovingDurationSeconds: number;
  averagePaceSecondsPerKm: number;
  totalSteps: number;
  totalCaloriesBurned: number;
  totalElevationGainMeters: number;
  activitiesCount: number;
  activities: ActivityEntryDto[];
}

export interface WeeklyDayActivityPoint {
  label: string;
  date: string;
  distanceKm: number;
  movingDurationSeconds: number;
  averagePaceSecondsPerKm: number;
  steps: number;
  caloriesBurned: number;
  elevationGainMeters: number;
  runsCount: number;
}

export interface WeeklyActivitySummary {
  referenceDate: string;
  totalDistanceKm: number;
  totalRuns: number;
  totalMovingDurationSeconds: number;
  averagePaceSecondsPerKm: number;
  totalSteps: number;
  totalElevationGainMeters: number;
  totalCaloriesBurned: number;
  days: WeeklyDayActivityPoint[];
}

export class ActivityService {
  /**
   * Logs a new workout or run session
   */
  static async logActivity(userId: string, input: LogActivityInput) {
    const dist = input.distanceKm || 0;
    const pace = dist > 0 ? calculateAveragePace(dist, input.movingDurationSeconds) : 0;

    return prisma.activityLog.create({
      data: {
        userId,
        activityType: input.activityType || "RUN",
        runningType: input.activityType === "RUN" ? input.runningType || "EASY" : null,
        source: input.source || "MANUAL",
        externalId: input.externalId || null,
        externalProvider: input.externalProvider || null,
        date: input.date,
        distanceKm: dist,
        movingDurationSeconds: input.movingDurationSeconds,
        elapsedDurationSeconds: input.elapsedDurationSeconds ?? null,
        averagePaceSecondsPerKm: pace,
        steps: input.steps || 0,
        caloriesBurned: input.caloriesBurned || 0,
        elevationGainMeters: input.elevationGainMeters || 0,
        notes: input.notes ? input.notes.trim() : null,
      },
    });
  }

  /**
   * Retrieves daily activity aggregates and individual sessions for a given date
   */
  static async getDailyActivity(userId: string, date: string): Promise<DailyActivitySummary> {
    const logs = await prisma.activityLog.findMany({
      where: {
        userId,
        date,
      },
    });

    let totalDist = 0;
    let totalDur = 0;
    let totalSteps = 0;
    let totalCals = 0;
    let totalElev = 0;

    const activities: ActivityEntryDto[] = logs.map((log: any) => {
      const dist = Number(log.distanceKm || 0);
      const dur = Number(log.movingDurationSeconds);
      totalDist += dist;
      totalDur += dur;
      totalSteps += Number(log.steps || 0);
      totalCals += Number(log.caloriesBurned || 0);
      totalElev += Number(log.elevationGainMeters || 0);

      return {
        id: log.id,
        activityType: log.activityType as ActivityType,
        runningType: (log.runningType as RunningType) || null,
        source: (log.source as ActivitySource) || "MANUAL",
        externalId: log.externalId || null,
        externalProvider: log.externalProvider || null,
        date: log.date,
        distanceKm: dist,
        movingDurationSeconds: dur,
        elapsedDurationSeconds: log.elapsedDurationSeconds ? Number(log.elapsedDurationSeconds) : null,
        averagePaceSecondsPerKm: Number(log.averagePaceSecondsPerKm || 0),
        steps: Number(log.steps || 0),
        caloriesBurned: Number(log.caloriesBurned || 0),
        elevationGainMeters: Number(log.elevationGainMeters || 0),
        notes: log.notes || null,
        createdAt: log.createdAt.toISOString(),
      };
    });

    const roundedDist = Math.round(totalDist * 100) / 100;
    const avgPace = roundedDist > 0 ? Math.round(totalDur / roundedDist) : 0;

    return {
      date,
      totalDistanceKm: roundedDist,
      totalMovingDurationSeconds: totalDur,
      averagePaceSecondsPerKm: avgPace,
      totalSteps,
      totalCaloriesBurned: totalCals,
      totalElevationGainMeters: totalElev,
      activitiesCount: activities.length,
      activities,
    };
  }

  /**
   * Retrieves 7-day weekly activity breakdown and trend metrics ending at referenceDate
   */
  static async getWeeklyActivitySummary(userId: string, referenceDate: string): Promise<WeeklyActivitySummary> {
    // Generate 7 days in chronological order
    const dateList: string[] = [];
    const [y, m, d] = referenceDate.split("-").map(Number);

    for (let i = 6; i >= 0; i--) {
      const dt = new Date(Date.UTC(y, m - 1, d));
      dt.setUTCDate(dt.getUTCDate() - i);
      dateList.push(dt.toISOString().split("T")[0]);
    }

    const allLogs = await prisma.activityLog.findMany({
      where: { userId },
    });

    let totalDist = 0;
    let totalDur = 0;
    let totalRuns = 0;
    let totalSteps = 0;
    let totalElev = 0;
    let totalCals = 0;

    const days: WeeklyDayActivityPoint[] = dateList.map((dStr) => {
      const [yy, mm, dd] = dStr.split("-").map(Number);
      const dtObj = new Date(Date.UTC(yy, mm - 1, dd));
      const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(dtObj);

      const dayLogs = allLogs.filter((l: any) => l.date === dStr);
      let dayDist = 0;
      let dayDur = 0;
      let daySteps = 0;
      let dayCals = 0;
      let dayElev = 0;

      for (const log of dayLogs) {
        dayDist += Number(log.distanceKm || 0);
        dayDur += Number(log.movingDurationSeconds);
        daySteps += Number(log.steps || 0);
        dayCals += Number(log.caloriesBurned || 0);
        dayElev += Number(log.elevationGainMeters || 0);
      }

      totalDist += dayDist;
      totalDur += dayDur;
      totalRuns += dayLogs.length;
      totalSteps += daySteps;
      totalElev += dayElev;
      totalCals += dayCals;

      const roundedDayDist = Math.round(dayDist * 100) / 100;
      const dayPace = roundedDayDist > 0 ? Math.round(dayDur / roundedDayDist) : 0;

      return {
        label: weekday,
        date: dStr,
        distanceKm: roundedDayDist,
        movingDurationSeconds: dayDur,
        averagePaceSecondsPerKm: dayPace,
        steps: daySteps,
        caloriesBurned: dayCals,
        elevationGainMeters: dayElev,
        runsCount: dayLogs.length,
      };
    });

    const roundedWeeklyDist = Math.round(totalDist * 100) / 100;
    const weeklyAvgPace = roundedWeeklyDist > 0 ? Math.round(totalDur / roundedWeeklyDist) : 0;

    return {
      referenceDate,
      totalDistanceKm: roundedWeeklyDist,
      totalRuns,
      totalMovingDurationSeconds: totalDur,
      averagePaceSecondsPerKm: weeklyAvgPace,
      totalSteps,
      totalElevationGainMeters: totalElev,
      totalCaloriesBurned: totalCals,
      days,
    };
  }

  /**
   * Updates an existing activity log with ownership verification
   */
  static async updateActivity(userId: string, logId: string, input: UpdateActivityInput) {
    const existing = await prisma.activityLog.findUnique({
      where: { id: logId },
    });

    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    if (existing.userId !== userId) {
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    const newDist = input.distanceKm !== undefined ? input.distanceKm : Number(existing.distanceKm || 0);
    const newDur = input.movingDurationSeconds !== undefined ? input.movingDurationSeconds : Number(existing.movingDurationSeconds);
    const newPace = newDist > 0 ? calculateAveragePace(newDist, newDur) : 0;

    return prisma.activityLog.update({
      where: { id: logId },
      data: {
        ...(input.activityType !== undefined && { activityType: input.activityType }),
        ...(input.runningType !== undefined && { runningType: input.runningType }),
        ...(input.date !== undefined && { date: input.date }),
        distanceKm: newDist,
        movingDurationSeconds: newDur,
        averagePaceSecondsPerKm: newPace,
        ...(input.elapsedDurationSeconds !== undefined && { elapsedDurationSeconds: input.elapsedDurationSeconds }),
        ...(input.steps !== undefined && { steps: input.steps }),
        ...(input.caloriesBurned !== undefined && { caloriesBurned: input.caloriesBurned }),
        ...(input.elevationGainMeters !== undefined && { elevationGainMeters: input.elevationGainMeters }),
        ...(input.notes !== undefined && { notes: input.notes ? input.notes.trim() : null }),
      },
    });
  }

  /**
   * Deletes an activity log with ownership verification
   */
  static async deleteActivity(userId: string, logId: string) {
    const existing = await prisma.activityLog.findUnique({
      where: { id: logId },
    });

    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    if (existing.userId !== userId) {
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    return prisma.activityLog.delete({
      where: { id: logId },
    });
  }
}
