import { z } from "zod";

export const GoalCategoryEnum = z.enum([
  "NUTRITION",
  "HYDRATION",
  "RUNNING",
  "ACTIVITIES",
  "WORKOUTS",
  "CONSISTENCY",
]);

export type GoalCategory = z.infer<typeof GoalCategoryEnum>;

export const GoalTypeEnum = z.enum([
  "DAILY_TARGET_STREAK",
  "CUMULATIVE_VALUE",
  "TARGET_PACE",
  "SESSION_COUNT",
  "VOLUME_LOAD",
]);

export type GoalType = z.infer<typeof GoalTypeEnum>;

export const GoalStatusEnum = z.enum([
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "EXPIRED",
  "CANCELLED",
]);

export type GoalStatus = z.infer<typeof GoalStatusEnum>;

export const ChallengeStatusEnum = z.enum([
  "JOINED",
  "COMPLETED",
  "ABANDONED",
]);

export type ChallengeStatus = z.infer<typeof ChallengeStatusEnum>;

export const createGoalSchema = z
  .object({
    name: z.string().trim().min(2, "Goal name must be at least 2 characters").max(100, "Goal name too long"),
    description: z.string().trim().max(500).optional().nullable(),
    category: GoalCategoryEnum,
    goalType: GoalTypeEnum,
    targetValue: z.number().positive("Target value must be greater than 0"),
    unit: z.string().trim().min(1, "Unit is required").max(30),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be YYYY-MM-DD"),
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Target date must be YYYY-MM-DD"),
    metadata: z.record(z.string(), z.any()).optional().nullable(),
  })
  .refine((data) => data.startDate <= data.targetDate, {
    message: "Target date must be on or after start date",
    path: ["targetDate"],
  });

export type CreateGoalInput = z.infer<typeof createGoalSchema>;

export const updateGoalSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional().nullable(),
  targetValue: z.number().positive().optional(),
  unit: z.string().trim().min(1).max(30).optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: GoalStatusEnum.optional(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;

export const getGoalsQuerySchema = z.object({
  category: GoalCategoryEnum.optional(),
  status: GoalStatusEnum.optional(),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 50)),
});
