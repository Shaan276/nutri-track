import { z } from "zod";

export const BiologicalSexEnum = z.enum(["MALE", "FEMALE", "OTHER"]);
export type BiologicalSex = z.infer<typeof BiologicalSexEnum>;

export const ActivityLevelEnum = z.enum([
  "SEDENTARY",
  "LIGHTLY_ACTIVE",
  "MODERATELY_ACTIVE",
  "VERY_ACTIVE",
  "EXTREMELY_ACTIVE",
]);
export type ActivityLevel = z.infer<typeof ActivityLevelEnum>;

/**
 * Validation schema for UserProfile onboarding and update
 */
export const userProfileSchema = z.object({
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((dateStr) => {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return false;
      const now = new Date();
      const age = now.getFullYear() - date.getFullYear();
      return date < now && age >= 10 && age <= 120;
    }, "Please provide a valid date of birth (age between 10 and 120)"),
  biologicalSex: BiologicalSexEnum,
  heightCm: z
    .number()
    .min(50, "Height must be at least 50 cm")
    .max(300, "Height cannot exceed 300 cm"),
  weightKg: z
    .number()
    .min(20, "Weight must be at least 20 kg")
    .max(500, "Weight cannot exceed 500 kg"),
  activityLevel: ActivityLevelEnum,
});

export type UserProfileInput = z.infer<typeof userProfileSchema>;
