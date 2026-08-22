import { z } from "zod";
import { WorkoutTypeEnum, WorkoutType } from "./workout";

export const workoutTemplateExerciseSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Exercise name is required").max(100),
  category: z.string().max(50).nullable().optional(),
  defaultSets: z.number().int().min(1).max(20).default(3),
  defaultReps: z.number().int().min(1).max(500).nullable().optional(),
  defaultWeightKg: z.number().min(0).max(1000).nullable().optional(),
  defaultDurationSeconds: z.number().int().min(1).max(86400).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  orderIndex: z.number().int().min(0).optional(),
});

export type WorkoutTemplateExerciseInput = z.infer<typeof workoutTemplateExerciseSchema>;

export const createWorkoutTemplateSchema = z.object({
  name: z.string().min(1, "Routine name is required").max(100),
  description: z.string().max(500).nullable().optional(),
  workoutType: WorkoutTypeEnum.default("GYM_WORKOUT"),
  isFavorite: z.boolean().default(false),
  exercises: z.array(workoutTemplateExerciseSchema).min(1, "At least 1 exercise is required in a routine blueprint"),
});

export type CreateWorkoutTemplateInput = z.infer<typeof createWorkoutTemplateSchema>;

export const updateWorkoutTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  workoutType: WorkoutTypeEnum.optional(),
  isFavorite: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  exercises: z.array(workoutTemplateExerciseSchema).min(1).optional(),
});

export type UpdateWorkoutTemplateInput = z.infer<typeof updateWorkoutTemplateSchema>;

export interface WorkoutTemplateExerciseDto {
  id: string;
  workoutTemplateId: string;
  name: string;
  category: string | null;
  defaultSets: number;
  defaultReps: number | null;
  defaultWeightKg: number | null;
  defaultDurationSeconds: number | null;
  notes: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutTemplateDto {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  workoutType: WorkoutType;
  isFavorite: boolean;
  isArchived: boolean;
  exercises: WorkoutTemplateExerciseDto[];
  totalExercises: number;
  createdAt: string;
  updatedAt: string;
}
