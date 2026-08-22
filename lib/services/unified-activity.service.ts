import { prisma } from "@/lib/db";
import { ActivityService, ActivityEntryDto } from "@/lib/services/activity.service";
import { WorkoutService, WorkoutSessionDto } from "@/lib/services/workout.service";
import {
  ActivityType,
  RunningType,
  activityTypeDisplayNames,
  activityTypeIcons,
  formatPace,
  formatDuration,
  calculateCyclingSpeed,
} from "@/lib/validations/activity";
import {
  WorkoutType,
  workoutTypeDisplayNames,
  workoutTypeIcons,
} from "@/lib/validations/workout";

export type UnifiedActivityKind = "CARDIO" | "WORKOUT";

export interface UnifiedActivityItem {
  id: string;
  kind: UnifiedActivityKind;
  categoryKey: ActivityType | WorkoutType;
  title: string;
  subtitle: string;
  icon: string;
  date: string;
  durationSeconds: number;
  caloriesBurned: number;
  // Cardio specific fields
  distanceKm?: number | null;
  steps?: number | null;
  elevationGainMeters?: number | null;
  runningType?: RunningType | null;
  speedKmh?: number | null;
  paceFormatted?: string | null;
  // Workout specific fields
  workoutType?: WorkoutType | null;
  totalSets?: number | null;
  exercises?: any[] | null;
  notes?: string | null;
  source?: string | null;
  externalProvider?: string | null;
  createdAt: string;
}

export interface UnifiedDailyActivitiesSummary {
  date: string;
  totalActiveDurationSeconds: number;
  totalCaloriesBurned: number;
  totalDistanceKm: number;
  totalSteps: number;
  totalActivitiesCount: number;
  cardioCount: number;
  workoutCount: number;
  items: UnifiedActivityItem[];
}

export interface ActivityDistributionSlice {
  name: string;
  categoryKey: string;
  durationSeconds: number;
  durationMinutes: number;
  percentage: number;
  color: string;
  icon: string;
  count: number;
}

export interface UnifiedWeeklyActivitiesSummary {
  referenceDate: string;
  totalActiveDurationSeconds: number;
  totalCaloriesBurned: number;
  totalDistanceKm: number;
  totalActivitiesCount: number;
  days: {
    date: string;
    label: string;
    durationMinutes: number;
    durationSeconds: number;
    caloriesBurned: number;
    distanceKm: number;
    activitiesCount: number;
  }[];
  distribution: ActivityDistributionSlice[];
}

const CATEGORY_COLORS: Record<string, string> = {
  RUN: "#10B981",         // Emerald
  WALK: "#3B82F6",        // Blue
  CYCLING: "#F59E0B",     // Amber
  HIIT: "#EF4444",        // Rose
  HOME_WORKOUT: "#A855F7",// Purple
  GYM_WORKOUT: "#8B5CF6", // Violet
  OTHER: "#64748B",       // Slate
};

export class UnifiedActivityService {
  /**
   * Retrieves unified daily activity telemetry combining cardio activities and workout sessions
   */
  static async getDailyActivities(userId: string, date: string): Promise<UnifiedDailyActivitiesSummary> {
    const [cardioSummary, workoutSummary] = await Promise.all([
      ActivityService.getDailyActivity(userId, date),
      WorkoutService.getDailyWorkouts(userId, date),
    ]);

    const items: UnifiedActivityItem[] = [];

    // Map Cardio logs
    for (const act of cardioSummary.activities) {
      let subtitle = "";
      if (act.activityType === "RUN") {
        const paceStr = formatPace(act.averagePaceSecondsPerKm);
        subtitle = `${act.distanceKm} km • Pace ${paceStr}`;
      } else if (act.activityType === "WALK") {
        subtitle = `${act.distanceKm} km • ${act.steps} steps`;
      } else if (act.activityType === "CYCLING") {
        const speed = calculateCyclingSpeed(act.distanceKm, act.movingDurationSeconds);
        subtitle = `${act.distanceKm} km • Avg Speed ${speed} km/h`;
      } else if (act.activityType === "HIIT") {
        subtitle = `High-Intensity Interval Session`;
      } else {
        subtitle = act.notes || "Cardio session";
      }

      items.push({
        id: act.id,
        kind: "CARDIO",
        categoryKey: act.activityType,
        title: activityTypeDisplayNames[act.activityType] || "Activity",
        subtitle,
        icon: activityTypeIcons[act.activityType] || "🏃",
        date: act.date,
        durationSeconds: act.movingDurationSeconds,
        caloriesBurned: act.caloriesBurned,
        distanceKm: act.distanceKm,
        steps: act.steps,
        elevationGainMeters: act.elevationGainMeters,
        runningType: act.runningType,
        speedKmh: act.activityType === "CYCLING" ? calculateCyclingSpeed(act.distanceKm, act.movingDurationSeconds) : null,
        paceFormatted: act.activityType === "RUN" ? formatPace(act.averagePaceSecondsPerKm) : null,
        notes: act.notes,
        source: act.source || "MANUAL",
        externalProvider: act.externalProvider,
        createdAt: act.createdAt,
      });
    }

    // Map Workout sessions
    for (const ws of workoutSummary.sessions) {
      const exerciseCount = ws.exercises.length;
      const subtitle = `${exerciseCount} ${exerciseCount === 1 ? "exercise" : "exercises"} • ${ws.totalSets} sets`;

      items.push({
        id: ws.id,
        kind: "WORKOUT",
        categoryKey: ws.workoutType,
        title: ws.name,
        subtitle,
        icon: ws.workoutType === "HOME_WORKOUT" ? "🏠" : "🏋️",
        date: ws.date,
        durationSeconds: ws.durationSeconds,
        caloriesBurned: ws.caloriesBurned,
        workoutType: ws.workoutType,
        totalSets: ws.totalSets,
        exercises: ws.exercises,
        notes: ws.notes,
        createdAt: ws.createdAt,
      });
    }

    // Sort chronologically descending
    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalActiveDurationSeconds = cardioSummary.totalMovingDurationSeconds + workoutSummary.totalDurationSeconds;
    const totalCaloriesBurned = cardioSummary.totalCaloriesBurned + workoutSummary.totalCaloriesBurned;
    const totalDistanceKm = Math.round(cardioSummary.totalDistanceKm * 100) / 100;
    const totalSteps = cardioSummary.totalSteps;
    const totalActivitiesCount = items.length;

    return {
      date,
      totalActiveDurationSeconds,
      totalCaloriesBurned,
      totalDistanceKm,
      totalSteps,
      totalActivitiesCount,
      cardioCount: cardioSummary.activitiesCount,
      workoutCount: workoutSummary.totalWorkouts,
      items,
    };
  }

  /**
   * Retrieves unified 7-day weekly activity summary and category distribution
   */
  static async getWeeklyActivitiesSummary(userId: string, referenceDate: string): Promise<UnifiedWeeklyActivitiesSummary> {
    const [cardioWeekly, workoutWeekly] = await Promise.all([
      ActivityService.getWeeklyActivitySummary(userId, referenceDate),
      WorkoutService.getWeeklyWorkoutsSummary(userId, referenceDate),
    ]);

    // Construct 7 days merged
    const days: UnifiedWeeklyActivitiesSummary["days"] = [];
    const durationByCategory: Record<string, { seconds: number; count: number; name: string; icon: string }> = {
      RUN: { seconds: 0, count: 0, name: "Running", icon: "🏃" },
      WALK: { seconds: 0, count: 0, name: "Walking", icon: "🚶" },
      CYCLING: { seconds: 0, count: 0, name: "Cycling", icon: "🚴" },
      HIIT: { seconds: 0, count: 0, name: "HIIT", icon: "🔥" },
      HOME_WORKOUT: { seconds: 0, count: 0, name: "Home Workout", icon: "🏠" },
      GYM_WORKOUT: { seconds: 0, count: 0, name: "Gym Workout", icon: "🏋️" },
      OTHER: { seconds: 0, count: 0, name: "Other Activity", icon: "➕" },
    };

    // Query all records in the 7-day window to calculate exact category distribution
    const startDate = cardioWeekly.days[0]?.date || referenceDate;
    const endDate = cardioWeekly.days[cardioWeekly.days.length - 1]?.date || referenceDate;

    const [allCardio, allWorkouts] = await Promise.all([
      prisma.activityLog.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
      }),
      prisma.workoutSession.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    for (const c of allCardio) {
      const cat = c.activityType;
      if (durationByCategory[cat]) {
        durationByCategory[cat].seconds += c.movingDurationSeconds;
        durationByCategory[cat].count += 1;
      }
    }

    for (const w of allWorkouts) {
      const cat = w.workoutType;
      if (durationByCategory[cat]) {
        durationByCategory[cat].seconds += w.durationSeconds;
        durationByCategory[cat].count += 1;
      }
    }

    for (let i = 0; i < cardioWeekly.days.length; i++) {
      const cDay = cardioWeekly.days[i];
      const wDay = workoutWeekly.days[i] || { durationSeconds: 0, caloriesBurned: 0, workoutsCount: 0 };

      const durationSeconds = (cDay?.movingDurationSeconds || 0) + (wDay.durationSeconds || 0);
      const caloriesBurned = (cDay?.caloriesBurned || 0) + (wDay.caloriesBurned || 0);
      const distanceKm = cDay?.distanceKm || 0;
      const activitiesCount = (cDay?.runsCount || 0) + (wDay.workoutsCount || 0);

      days.push({
        date: cDay?.date || "",
        label: cDay?.label || "",
        durationMinutes: Math.round(durationSeconds / 60),
        durationSeconds,
        caloriesBurned,
        distanceKm,
        activitiesCount,
      });
    }

    const totalActiveDurationSeconds = cardioWeekly.totalMovingDurationSeconds + workoutWeekly.totalDurationSeconds;
    const totalCaloriesBurned = cardioWeekly.totalCaloriesBurned + workoutWeekly.totalCaloriesBurned;
    const totalDistanceKm = Math.round(cardioWeekly.totalDistanceKm * 100) / 100;
    const totalActivitiesCount = cardioWeekly.totalRuns + workoutWeekly.totalWorkouts;

    // Calculate distribution slices
    const distribution: ActivityDistributionSlice[] = [];
    for (const [key, data] of Object.entries(durationByCategory)) {
      if (data.seconds > 0 || data.count > 0) {
        const percentage = totalActiveDurationSeconds > 0
          ? Math.round((data.seconds / totalActiveDurationSeconds) * 100)
          : 0;

        distribution.push({
          name: data.name,
          categoryKey: key,
          durationSeconds: data.seconds,
          durationMinutes: Math.round(data.seconds / 60),
          percentage,
          color: CATEGORY_COLORS[key] || "#64748B",
          icon: data.icon,
          count: data.count,
        });
      }
    }

    // Sort distribution by duration descending
    distribution.sort((a, b) => b.durationSeconds - a.durationSeconds);

    return {
      referenceDate,
      totalActiveDurationSeconds,
      totalCaloriesBurned,
      totalDistanceKm,
      totalActivitiesCount,
      days,
      distribution,
    };
  }
}
