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

export const ingredientSchema = z.object({
  name: z.string().trim().min(1, "Ingredient name is required"),
  quantityG: z.number().min(0, "Quantity cannot be negative"),
  state: z.enum(["RAW", "COOKED"]).default("RAW"),
  caloriesPer100g: z.number().min(0).default(0),
  proteinPer100g: z.number().min(0).default(0),
  carbsPer100g: z.number().min(0).default(0),
  fatPer100g: z.number().min(0).default(0),
});

export type IngredientItem = z.infer<typeof ingredientSchema>;

/**
 * Validation schema for logging a food or dish to a meal
 */
export const logMealEntrySchema = z
  .object({
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    mealType: MealTypeEnum,
    foodId: z.string().optional().nullable(),
    customFood: z
      .object({
        name: z.string().trim().min(1, "Dish/Food name is required"),
        calories: z.number().min(0).default(0),
        protein: z.number().min(0).default(0),
        carbs: z.number().min(0).default(0),
        fat: z.number().min(0).default(0),
        servingSize: z.number().optional().default(100),
        servingUnit: z.string().optional().default("g"),
        ingredients: z.array(ingredientSchema).optional(),
      })
      .optional()
      .nullable(),
    ingredients: z.array(ingredientSchema).optional(),
    quantity: z
      .number()
      .positive("Quantity must be greater than 0")
      .default(100),
    quantityUnit: z
      .string()
      .trim()
      .min(1, "Quantity unit is required")
      .default("g"),
  })
  .refine(
    (data) => Boolean(data.foodId || data.customFood?.name),
    {
      message: "Please select a food item or enter a dish name",
      path: ["foodId"],
    }
  );

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
