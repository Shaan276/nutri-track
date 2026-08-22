import { z } from "zod";

export const WorkoutTypeEnum = z.enum(["HOME_WORKOUT", "GYM_WORKOUT"]);

export type WorkoutType = z.infer<typeof WorkoutTypeEnum>;

export const workoutTypeDisplayNames: Record<WorkoutType, string> = {
  HOME_WORKOUT: "Home Workout",
  GYM_WORKOUT: "Gym Workout",
};

export const workoutTypeIcons: Record<WorkoutType, string> = {
  HOME_WORKOUT: "🏠",
  GYM_WORKOUT: "🏋️",
};

/**
 * Workout Set Schema
 */
export const workoutSetSchema = z.object({
  id: z.string().optional(),
  setNumber: z.number().int().min(1, "Set number must be >= 1").default(1),
  reps: z.number().int().min(1, "Reps must be >= 1").max(1000).optional().nullable(),
  weightKg: z.number().min(0, "Weight cannot be negative").max(1000).optional().nullable(),
  durationSeconds: z.number().int().min(1, "Duration must be >= 1s").max(86400).optional().nullable(),
  distanceKm: z.number().min(0).max(500).optional().nullable(),
  notes: z.string().trim().max(200).optional().nullable(),
});

export type WorkoutSetInput = z.infer<typeof workoutSetSchema>;

/**
 * Workout Exercise Schema
 */
export const workoutExerciseSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Exercise name is required").max(100),
  category: z.string().trim().max(50).optional().nullable(),
  orderIndex: z.number().int().min(0).default(0),
  notes: z.string().trim().max(200).optional().nullable(),
  sets: z.array(workoutSetSchema).min(1, "Each exercise must have at least 1 set"),
});

export type WorkoutExerciseInput = z.infer<typeof workoutExerciseSchema>;

/**
 * Full Workout Session Logging Schema
 */
export const logWorkoutSchema = z.object({
  workoutType: WorkoutTypeEnum.default("GYM_WORKOUT"),
  name: z.string().trim().min(1, "Workout name is required").max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  durationSeconds: z.number().int().min(0).max(86400).default(0),
  caloriesBurned: z.number().int().min(0).max(20000).default(0),
  notes: z.string().trim().max(500).optional().nullable(),
  exercises: z.array(workoutExerciseSchema).min(1, "Workout must contain at least 1 exercise"),
});

export type LogWorkoutInput = z.input<typeof logWorkoutSchema>;

/**
 * Workout Update Schema
 */
export const updateWorkoutSchema = z.object({
  workoutType: WorkoutTypeEnum.optional(),
  name: z.string().trim().min(1).max(100).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  durationSeconds: z.number().int().min(0).max(86400).optional(),
  caloriesBurned: z.number().int().min(0).max(20000).optional(),
  notes: z.string().trim().max(500).optional().nullable(),
  exercises: z.array(workoutExerciseSchema).optional(),
});

export type UpdateWorkoutInput = z.infer<typeof updateWorkoutSchema>;
