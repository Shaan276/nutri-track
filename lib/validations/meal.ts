import { z } from "zod";

export const MealTypeEnum = z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]);
export type MealType = z.infer<typeof MealTypeEnum>;

export const mealTypeDisplayNames: Record<MealType, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snacks",
};

export const mealTypeIcons: Record<MealType, string> = {
  BREAKFAST: "🌅",
  LUNCH: "☀️",
  DINNER: "🌙",
  SNACK: "🍎",
};

/**
 * Validation schema for logging a food to a meal
 */
export const logMealEntrySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  mealType: MealTypeEnum,
  foodId: z.string().min(1, "Food ID is required"),
  quantity: z
    .number()
    .positive("Quantity must be greater than 0"),
  quantityUnit: z
    .string()
    .trim()
    .min(1, "Quantity unit is required"),
});

export type LogMealEntryInput = z.infer<typeof logMealEntrySchema>;

/**
 * Validation schema for updating a logged meal entry
 */
export const updateMealEntrySchema = z.object({
  quantity: z
    .number()
    .positive("Quantity must be greater than 0"),
  quantityUnit: z.string().trim().min(1).optional(),
  mealType: MealTypeEnum.optional(),
});

export type UpdateMealEntryInput = z.infer<typeof updateMealEntrySchema>;
