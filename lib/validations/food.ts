import { z } from "zod";

export const FoodCategoryEnum = z.enum([
  "FRUITS",
  "VEGETABLES",
  "GRAINS_CEREALS",
  "PULSES_LEGUMES",
  "DAIRY",
  "NUTS_SEEDS",
  "OILS_FATS",
  "BEVERAGES",
  "SNACKS",
  "SWEETS",
  "SUPPLEMENTS",
  "OTHER",
]);

export type FoodCategory = z.infer<typeof FoodCategoryEnum>;

export const categoryDisplayNames: Record<FoodCategory, string> = {
  FRUITS: "Fruits",
  VEGETABLES: "Vegetables",
  GRAINS_CEREALS: "Grains & Cereals",
  PULSES_LEGUMES: "Pulses & Legumes",
  DAIRY: "Dairy",
  NUTS_SEEDS: "Nuts & Seeds",
  OILS_FATS: "Oils & Fats",
  BEVERAGES: "Beverages",
  SNACKS: "Snacks",
  SWEETS: "Sweets",
  SUPPLEMENTS: "Supplements",
  OTHER: "Other",
};

/**
 * Validation schema for Food item creation and update
 */
export const foodInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Food name must be at least 2 characters long")
    .max(100, "Food name must be under 100 characters"),
  category: FoodCategoryEnum.default("OTHER"),
  brand: z.string().trim().max(100, "Brand name must be under 100 characters").optional().nullable(),
  barcode: z.string().trim().max(50, "Barcode must be under 50 characters").optional().nullable(),
  servingSize: z
    .number()
    .positive("Serving size must be greater than 0"),
  servingUnit: z
    .string()
    .trim()
    .min(1, "Serving unit is required (e.g. g, ml, serving)")
    .max(30, "Serving unit must be under 30 characters"),

  // Macronutrients (non-negative)
  calories: z.number().min(0, "Calories cannot be negative").default(0),
  protein: z.number().min(0, "Protein cannot be negative").default(0),
  carbohydrates: z.number().min(0, "Carbohydrates cannot be negative").default(0),
  fat: z.number().min(0, "Fat cannot be negative").default(0),
  fiber: z.number().min(0, "Fiber cannot be negative").default(0),
  sugar: z.number().min(0, "Sugar cannot be negative").default(0),

  // Minerals (non-negative, optional/nullable)
  calcium: z.number().min(0, "Calcium cannot be negative").optional().nullable(),
  iron: z.number().min(0, "Iron cannot be negative").optional().nullable(),
  magnesium: z.number().min(0, "Magnesium cannot be negative").optional().nullable(),
  potassium: z.number().min(0, "Potassium cannot be negative").optional().nullable(),
  sodium: z.number().min(0, "Sodium cannot be negative").optional().nullable(),
  zinc: z.number().min(0, "Zinc cannot be negative").optional().nullable(),
  phosphorus: z.number().min(0, "Phosphorus cannot be negative").optional().nullable(),
  copper: z.number().min(0, "Copper cannot be negative").optional().nullable(),
  manganese: z.number().min(0, "Manganese cannot be negative").optional().nullable(),
  selenium: z.number().min(0, "Selenium cannot be negative").optional().nullable(),

  // Vitamins (non-negative, optional/nullable)
  vitaminA: z.number().min(0, "Vitamin A cannot be negative").optional().nullable(),
  vitaminC: z.number().min(0, "Vitamin C cannot be negative").optional().nullable(),
  vitaminD: z.number().min(0, "Vitamin D cannot be negative").optional().nullable(),
  vitaminE: z.number().min(0, "Vitamin E cannot be negative").optional().nullable(),
  vitaminK: z.number().min(0, "Vitamin K cannot be negative").optional().nullable(),
  vitaminB1: z.number().min(0, "Vitamin B1 cannot be negative").optional().nullable(),
  vitaminB2: z.number().min(0, "Vitamin B2 cannot be negative").optional().nullable(),
  vitaminB3: z.number().min(0, "Vitamin B3 cannot be negative").optional().nullable(),
  vitaminB5: z.number().min(0, "Vitamin B5 cannot be negative").optional().nullable(),
  vitaminB6: z.number().min(0, "Vitamin B6 cannot be negative").optional().nullable(),
  vitaminB7: z.number().min(0, "Vitamin B7 cannot be negative").optional().nullable(),
  vitaminB9: z.number().min(0, "Vitamin B9 cannot be negative").optional().nullable(),
  vitaminB12: z.number().min(0, "Vitamin B12 cannot be negative").optional().nullable(),

  // Additional fields
  water: z.number().min(0, "Water content cannot be negative").default(0),
  notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional().nullable(),
  isFavorite: z.boolean().default(false),
});

export type FoodInput = z.input<typeof foodInputSchema>;
export type FoodOutput = z.infer<typeof foodInputSchema>;
