import { z } from "zod";

export const NotificationCategoryEnum = z.enum([
  "HYDRATION",
  "NUTRITION",
  "ACTIVITIES",
  "WORKOUTS",
  "INSIGHTS",
  "FRIENDS",
  "FEATURE_REQUEST",
  "GOAL",
  "ACHIEVEMENT",
  "CHALLENGE",
  "SYSTEM",
  "ADMIN",
]);

export type NotificationCategory = z.infer<typeof NotificationCategoryEnum>;

export const NotificationTypeEnum = z.enum([
  "HYDRATION_REMINDER",
  "HYDRATION_GOAL",
  "HYDRATION_STREAK",
  "NUTRITION_REMINDER",
  "PROTEIN_GOAL",
  "CALORIE_GOAL",
  "ACTIVITY_MILESTONE",
  "RUNNING_RECORD",
  "WORKOUT_REMINDER",
  "WORKOUT_MILESTONE",
  "INSIGHT_ALERT",
  "FRIEND_REQUEST",
  "FRIEND_ACCEPTED",
  "FRIEND_RECOMMENDATION",
  "FRIEND_ACHIEVEMENT",
  "FEATURE_REQUEST_STATUS",
  "FEATURE_REQUEST_RESPONSE",
  "GOAL_MILESTONE",
  "GOAL_COMPLETED",
  "ACHIEVEMENT_UNLOCKED",
  "CHALLENGE_JOINED",
  "CHALLENGE_COMPLETED",
  "USER_PENDING_APPROVAL",
  "USER_APPROVED",
  "USER_REJECTED",
  "USER_SUSPENDED",
  "SYSTEM_ANNOUNCEMENT",
  "SYSTEM",
]);

export type NotificationType = z.infer<typeof NotificationTypeEnum>;

export const createNotificationSchema = z.object({
  userId: z.string().min(1),
  actorId: z.string().optional().nullable(),
  category: NotificationCategoryEnum.default("SYSTEM"),
  type: NotificationTypeEnum.default("SYSTEM"),
  title: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(1000),
  actionUrl: z.string().optional().nullable(),
  link: z.string().optional().nullable(),
  metadata: z.any().optional().nullable(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

export const getNotificationsQuerySchema = z.object({
  category: NotificationCategoryEnum.optional(),
  isRead: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Math.min(50, Math.max(1, parseInt(val, 10))) : 20)),
});

export const updateNotificationPreferencesSchema = z.object({
  hydrationReminders: z.boolean().optional(),
  nutritionReminders: z.boolean().optional(),
  workoutReminders: z.boolean().optional(),
  activityReminders: z.boolean().optional(),
  friendNotifications: z.boolean().optional(),
  insightNotifications: z.boolean().optional(),
  featureRequestNotifications: z.boolean().optional(),
  systemNotifications: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  quietHoursEnd: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  reminderFrequency: z.enum(["LOW", "MODERATE", "HIGH"]).optional(),
});

export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;