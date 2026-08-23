import { z } from "zod";
import { BiologicalSex, ActivityLevel } from "./profile";

export const PrimaryGoalEnum = z.enum(["FAT_LOSS", "MAINTAIN", "MUSCLE_GAIN"]);
export type PrimaryGoal = z.infer<typeof PrimaryGoalEnum>;

export const primaryGoalDisplayNames: Record<PrimaryGoal, string> = {
  FAT_LOSS: "Fat Loss (Caloric Deficit -500 kcal)",
  MAINTAIN: "Weight Maintenance (Energy Balance)",
  MUSCLE_GAIN: "Lean Muscle Gain (Caloric Surplus +300 kcal)",
};

export const UserProfileSettingsSchema = z.object({
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  biologicalSex: z.enum(["MALE", "FEMALE", "OTHER"]),
  heightCm: z.number().min(50).max(300),
  weightKg: z.number().min(20).max(500),
  activityLevel: z.enum([
    "SEDENTARY",
    "LIGHTLY_ACTIVE",
    "MODERATELY_ACTIVE",
    "VERY_ACTIVE",
    "EXTREMELY_ACTIVE",
  ]),
  primaryGoal: PrimaryGoalEnum.default("MAINTAIN"),
  dailyHydrationTargetMl: z.number().min(500).max(10000).default(2500),
  dailyStepTarget: z.number().min(1000).max(100000).default(10000),
  weeklyRunningDistanceKm: z.number().min(0).max(500).default(15.0),
  weeklyWorkoutSessions: z.number().min(0).max(28).default(3),
});

export const UserNutritionGoalsSchema = z.object({
  calories: z.number().min(500).max(10000),
  protein: z.number().min(10).max(500),
  carbohydrates: z.number().min(10).max(1000),
  fat: z.number().min(5).max(400),
  fiber: z.number().min(0).max(150).default(30),
  sugar: z.number().min(0).max(300).default(35),
});

export const UserSettingsPayloadSchema = z.object({
  profile: UserProfileSettingsSchema.partial().optional(),
  nutritionGoals: UserNutritionGoalsSchema.partial().optional(),
});

export type UserProfileSettings = z.infer<typeof UserProfileSettingsSchema>;
export type UserNutritionGoals = z.infer<typeof UserNutritionGoalsSchema>;
export type UserSettingsPayload = {
  profile?: Partial<UserProfileSettings> | Record<string, any>;
  nutritionGoals?: Partial<UserNutritionGoals> | Record<string, any>;
};

export interface CalculatedMetabolicMetrics {
  ageYears: number;
  bmr: number;
  tdee: number;
  recommendedCalories: number;
  recommendedProteinG: number;
  recommendedCarbsG: number;
  recommendedFatG: number;
  recommendedFiberG: number;
  recommendedSugarG: number;
  recommendedHydrationMl: number;
  recommendedDailySteps: number;
}

/**
 * Calculates user age from ISO date string
 */
export function calculateAge(dateOfBirth: string | Date): number {
  const dob = typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;
  const diffMs = Date.now() - dob.getTime();
  const ageDt = new Date(diffMs);
  return Math.max(12, Math.abs(ageDt.getUTCFullYear() - 1970));
}

/**
 * Calculates Mifflin-St Jeor BMR, TDEE, and optimal macronutrient distribution.
 */
export function calculateMetabolicTargets(
  weightKg: number,
  heightCm: number,
  biologicalSex: BiologicalSex | "MALE" | "FEMALE" | "OTHER",
  dateOfBirth: string | Date,
  activityLevel: ActivityLevel,
  primaryGoal: PrimaryGoal = "MAINTAIN"
): CalculatedMetabolicMetrics {
  const age = calculateAge(dateOfBirth);

  // 1. Mifflin-St Jeor BMR
  let bmr: number;
  if (biologicalSex === "FEMALE") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  } else {
    // Male or Other defaults to standard male baseline formula
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }

  bmr = Math.max(800, Math.round(bmr));

  // 2. Activity Multiplier -> TDEE
  const multipliers: Record<ActivityLevel, number> = {
    SEDENTARY: 1.2,
    LIGHTLY_ACTIVE: 1.375,
    MODERATELY_ACTIVE: 1.55,
    VERY_ACTIVE: 1.725,
    EXTREMELY_ACTIVE: 1.9,
  };

  const mult = multipliers[activityLevel] || 1.375;
  const tdee = Math.round(bmr * mult);

  // 3. Goal Adjustment
  let targetCalories = tdee;
  if (primaryGoal === "FAT_LOSS") {
    targetCalories = Math.max(biologicalSex === "FEMALE" ? 1200 : 1500, tdee - 500);
  } else if (primaryGoal === "MUSCLE_GAIN") {
    targetCalories = tdee + 300;
  }

  // 4. Macro Splits
  // Protein: ~2.0 g/kg (or 2.2 g/kg in deficit for muscle preservation)
  const proteinPerKg = primaryGoal === "FAT_LOSS" ? 2.2 : primaryGoal === "MUSCLE_GAIN" ? 2.0 : 1.8;
  const recommendedProteinG = Math.round(Math.min(targetCalories * 0.35 / 4, weightKg * proteinPerKg));

  // Fat: ~25-30% of total daily calories (min 0.8g/kg)
  const fatCalories = targetCalories * 0.28;
  const recommendedFatG = Math.round(Math.max(weightKg * 0.8, fatCalories / 9));

  // Carbohydrates: Remaining calories / 4
  const usedCalories = recommendedProteinG * 4 + recommendedFatG * 9;
  const remainingCalories = Math.max(200, targetCalories - usedCalories);
  const recommendedCarbsG = Math.round(remainingCalories / 4);

  // Fiber: ~14g per 1000 kcal (min 28g, max 45g)
  const recommendedFiberG = Math.min(45, Math.max(28, Math.round((targetCalories / 1000) * 14)));

  // Sugar: < 10% of total calories (or ~35g)
  const recommendedSugarG = Math.round((targetCalories * 0.08) / 4);

  // Hydration: ~35 ml/kg of body weight
  const recommendedHydrationMl = Math.round(Math.max(2000, Math.min(4500, weightKg * 35)));

  // Daily Steps
  const recommendedDailySteps =
    activityLevel === "SEDENTARY" ? 8000 : activityLevel === "EXTREMELY_ACTIVE" ? 12500 : 10000;

  return {
    ageYears: age,
    bmr,
    tdee,
    recommendedCalories: targetCalories,
    recommendedProteinG,
    recommendedCarbsG,
    recommendedFatG,
    recommendedFiberG,
    recommendedSugarG,
    recommendedHydrationMl,
    recommendedDailySteps,
  };
}
