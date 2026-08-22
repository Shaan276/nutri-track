import { z } from "zod";

export const ActivityTypeEnum = z.enum([
  "RUN",
  "WALK",
  "CYCLING",
  "HIIT",
  "OTHER",
]);

export type ActivityType = z.infer<typeof ActivityTypeEnum>;

export const RunningTypeEnum = z.enum([
  "EASY",
  "LONG",
  "TEMPO",
  "RECOVERY",
  "INTERVAL",
  "RACE",
  "OTHER",
]);

export type RunningType = z.infer<typeof RunningTypeEnum>;

export const ActivitySourceEnum = z.enum([
  "MANUAL",
  "STRAVA",
  "HEALTH_CONNECT",
  "FUTURE_PROVIDER",
]);

export type ActivitySource = z.infer<typeof ActivitySourceEnum>;

export const HiitIntensityEnum = z.enum(["LOW", "MODERATE", "HIGH", "VERY_HIGH"]);
export type HiitIntensity = z.infer<typeof HiitIntensityEnum>;

export const hiitIntensityDisplayNames: Record<HiitIntensity, string> = {
  LOW: "Low Intensity",
  MODERATE: "Moderate Intensity",
  HIGH: "High Intensity",
  VERY_HIGH: "Very High Intensity",
};

export const activityTypeDisplayNames: Record<ActivityType, string> = {
  RUN: "Running",
  WALK: "Walking",
  CYCLING: "Cycling",
  HIIT: "HIIT / Cardio",
  OTHER: "Other Activity",
};

export const activityTypeIcons: Record<ActivityType, string> = {
  RUN: "🏃",
  WALK: "🚶",
  CYCLING: "🚴",
  HIIT: "🔥",
  OTHER: "➕",
};

export const runningTypeDisplayNames: Record<RunningType, string> = {
  EASY: "Easy Run",
  LONG: "Long Run",
  TEMPO: "Tempo Run",
  RECOVERY: "Recovery Run",
  INTERVAL: "Interval Run",
  RACE: "Race",
  OTHER: "Other Run",
};

export const runningTypeDescriptions: Record<RunningType, string> = {
  EASY: "Comfortable conversational effort. Used to build aerobic fitness without excessive fatigue.",
  LONG: "A longer-duration run performed primarily at an easy or controlled effort to develop endurance.",
  TEMPO: "A sustained moderate-hard effort designed to improve lactate threshold and running efficiency.",
  RECOVERY: "A very easy, short run intended to promote recovery after harder training.",
  INTERVAL: "Structured repetitions of harder efforts separated by recovery periods.",
  RACE: "A competitive effort where the user can optionally record the event.",
  OTHER: "Custom or mixed running workout session.",
};

export const runningTypeBadges: Record<RunningType, { label: string; color: string }> = {
  EASY: { label: "Easy", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" },
  LONG: { label: "Long", color: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  TEMPO: { label: "Tempo", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" },
  RECOVERY: { label: "Recovery", color: "bg-purple-500/20 text-purple-300 border-purple-500/40" },
  INTERVAL: { label: "Interval", color: "bg-rose-500/20 text-rose-300 border-rose-500/40" },
  RACE: { label: "Race", color: "bg-red-500/20 text-red-300 border-red-500/40" },
  OTHER: { label: "Other", color: "bg-slate-700/60 text-slate-200 border-slate-600" },
};

/**
 * Formats pace in seconds per km to standard MM:SS / km format
 * Example: 330 seconds -> "5:30 / km"
 */
export function formatPace(secondsPerKm: number): string {
  if (!secondsPerKm || isNaN(secondsPerKm) || secondsPerKm <= 0 || !isFinite(secondsPerKm)) {
    return "--:-- / km";
  }
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  const paddedSec = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${minutes}:${paddedSec} / km`;
}

/**
 * Formats duration in seconds to standard HH:MM:SS or MM:SS
 * Example: 1725 seconds -> "28:45"
 * Example: 3900 seconds -> "1:05:00"
 */
export function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) {
    return "00:00";
  }
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const paddedMin = minutes < 10 && hours > 0 ? `0${minutes}` : `${minutes}`;
  const paddedSec = seconds < 10 ? `0${seconds}` : `${seconds}`;

  if (hours > 0) {
    return `${hours}:${paddedMin}:${paddedSec}`;
  }
  return `${minutes}:${paddedSec}`;
}

/**
 * Calculates average pace (seconds per km) from distance and duration
 */
export function calculateAveragePace(distanceKm: number, durationSeconds: number): number {
  if (!distanceKm || distanceKm <= 0 || !durationSeconds || durationSeconds <= 0) {
    return 0;
  }
  return Math.round(durationSeconds / distanceKm);
}

/**
 * Calculates speed in km/h from distance and duration
 */
export function calculateCyclingSpeed(distanceKm: number, durationSeconds: number): number {
  if (!distanceKm || distanceKm <= 0 || !durationSeconds || durationSeconds <= 0) {
    return 0;
  }
  const hours = durationSeconds / 3600;
  return Math.round((distanceKm / hours) * 10) / 10;
}

/**
 * Dynamic Validation schema for logging an activity
 */
export const logActivitySchema = z
  .object({
    activityType: ActivityTypeEnum.default("RUN"),
    runningType: RunningTypeEnum.optional().nullable(),
    source: ActivitySourceEnum.optional().default("MANUAL"),
    externalId: z.string().optional().nullable(),
    externalProvider: z.string().optional().nullable(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    distanceKm: z
      .number()
      .min(0, "Distance cannot be negative")
      .max(500, "Distance cannot exceed 500 km")
      .optional()
      .default(0),
    movingDurationSeconds: z
      .number({ message: "Duration is required" })
      .int("Duration must be in whole seconds")
      .positive("Duration must be greater than 0 seconds")
      .max(86400, "Duration cannot exceed 24 hours"),
    elapsedDurationSeconds: z.number().int().positive().optional().nullable(),
    steps: z
      .number()
      .int()
      .min(0, "Steps cannot be negative")
      .max(200000, "Steps cannot exceed 200,000")
      .optional()
      .default(0),
    caloriesBurned: z
      .number()
      .int()
      .min(0, "Calories burned cannot be negative")
      .max(20000, "Calories burned cannot exceed 20,000")
      .optional()
      .default(0),
    elevationGainMeters: z
      .number()
      .int()
      .min(0, "Elevation gain cannot be negative")
      .max(10000, "Elevation gain cannot exceed 10,000 meters")
      .optional()
      .default(0),
    notes: z.string().trim().max(300, "Notes cannot exceed 300 characters").optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // 1. RUN requires runningType and distance > 0
    if (data.activityType === "RUN") {
      if (!data.runningType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Running Type (Easy, Long, Tempo, Recovery, Interval, Race, Other) is required for runs",
          path: ["runningType"],
        });
      }
      if (!data.distanceKm || data.distanceKm <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Distance must be greater than 0 km for a run",
          path: ["distanceKm"],
        });
      }
    }

    // 2. WALK requires distance > 0
    if (data.activityType === "WALK" && (!data.distanceKm || data.distanceKm <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Distance must be greater than 0 km for a walk",
        path: ["distanceKm"],
      });
    }

    // 3. CYCLING requires distance > 0
    if (data.activityType === "CYCLING" && (!data.distanceKm || data.distanceKm <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Distance must be greater than 0 km for cycling",
        path: ["distanceKm"],
      });
    }
  });

export type LogActivityInput = z.input<typeof logActivitySchema>;

/**
 * Validation schema for updating an existing activity
 */
export const updateActivitySchema = z.object({
  activityType: ActivityTypeEnum.optional(),
  runningType: RunningTypeEnum.optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  distanceKm: z.number().min(0).max(500).optional(),
  movingDurationSeconds: z.number().int().positive().max(86400).optional(),
  elapsedDurationSeconds: z.number().int().positive().optional().nullable(),
  steps: z.number().int().min(0).max(200000).optional(),
  caloriesBurned: z.number().int().min(0).max(20000).optional(),
  elevationGainMeters: z.number().int().min(0).max(10000).optional(),
  notes: z.string().trim().max(300).optional().nullable(),
});

export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
