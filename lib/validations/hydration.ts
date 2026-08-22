import { z } from "zod";

export const BeverageTypeEnum = z.enum([
  "WATER",
  "MILK",
  "BUTTERMILK",
  "LASSI",
  "TEA",
  "JUICE",
  "PROTEIN_SHAKE",
  "ORS",
  "OTHER",
]);

export type BeverageType = z.infer<typeof BeverageTypeEnum>;

export const beverageTypeDisplayNames: Record<BeverageType, string> = {
  WATER: "Water",
  TEA: "Tea / Herbal Tea",
  MILK: "Milk",
  BUTTERMILK: "Buttermilk",
  LASSI: "Lassi",
  JUICE: "Fresh Juice",
  PROTEIN_SHAKE: "Protein Shake",
  ORS: "ORS / Electrolytes",
  OTHER: "Coffee / Other",
};

export const beverageTypeIcons: Record<BeverageType, string> = {
  WATER: "💧",
  TEA: "🍵",
  MILK: "🥛",
  BUTTERMILK: "🥛",
  LASSI: "🥤",
  JUICE: "🧃",
  PROTEIN_SHAKE: "🏋️",
  ORS: "⚡",
  OTHER: "☕",
};

export const commonQuickAmounts = [200, 250, 300, 500, 750];

/**
 * Validation schema for logging water/beverage intake
 */
export const logHydrationSchema = z.object({
  amountMl: z
    .number({ message: "Amount is required" })
    .positive("Amount must be greater than 0 ml")
    .max(5000, "Single intake amount cannot exceed 5,000 ml"),
  beverageType: BeverageTypeEnum.default("WATER"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  consumedAt: z.string().optional(),
  notes: z.string().trim().max(200, "Notes cannot exceed 200 characters").optional().nullable(),
});

export type LogHydrationInput = z.infer<typeof logHydrationSchema>;

/**
 * Validation schema for updating a hydration entry
 */
export const updateHydrationSchema = z.object({
  amountMl: z
    .number()
    .positive("Amount must be greater than 0 ml")
    .max(5000, "Single intake amount cannot exceed 5,000 ml"),
  beverageType: BeverageTypeEnum.optional(),
  consumedAt: z.string().optional(),
  notes: z.string().trim().max(200, "Notes cannot exceed 200 characters").optional().nullable(),
});

export type UpdateHydrationInput = z.infer<typeof updateHydrationSchema>;

/**
 * Validation schema for updating daily hydration goal
 */
export const updateHydrationGoalSchema = z.object({
  targetMl: z
    .number({ message: "Target amount is required" })
    .int("Target must be a whole number in milliliters")
    .min(500, "Daily hydration target must be at least 500 ml")
    .max(10000, "Daily hydration target cannot exceed 10,000 ml"),
});

export type UpdateHydrationGoalInput = z.infer<typeof updateHydrationGoalSchema>;
