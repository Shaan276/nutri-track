import { prisma } from "@/lib/db";
import { LogMealEntryInput, UpdateMealEntryInput, MealType } from "@/lib/validations/meal";
import { FoodService } from "./food.service";
import { GoogleSheetsService } from "./google-sheets/google-sheets.service";

export interface DailyTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface ProgressPercentages {
  caloriesPercent: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
  fiberPercent: number;
  sugarPercent: number;
}

export interface MealSectionSummary {
  mealType: MealType;
  mealLogId: string | null;
  name: string | null;
  totals: MacroTotals;
  entries: Array<{
    id: string;
    foodId: string;
    foodName: string;
    foodCategory: string;
    brand: string | null;
    quantity: number;
    quantityUnit: string;
    referenceServingSize: number;
    referenceServingUnit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    createdAt: string;
  }>;
}

export interface DailyNutritionResponse {
  date: string;
  totals: MacroTotals;
  targets: DailyTargets;
  progress: ProgressPercentages;
  meals: MealSectionSummary[];
}

export class NutritionService {
  /**
   * Baseline Daily Targets (Default baseline for health tracking)
   */
  static getDefaultTargets(): DailyTargets {
    return {
      calories: 2000,
      protein: 120,
      carbs: 250,
      fat: 65,
      fiber: 30,
      sugar: 35,
    };
  }

  /**
   * Helper: Calculates the exact nutrition snapshot from food reference serving and consumed quantity
   */
  static calculateNutritionSnapshot(food: any, quantity: number) {
    const servingSize = Number(food.servingSize);
    if (!servingSize || servingSize <= 0) {
      throw new Error("Invalid food reference serving size");
    }

    const multiplier = quantity / servingSize;

    // Use precise arithmetic and round to 2 decimal places
    const calculatedCalories = Math.round(Number(food.calories || 0) * multiplier * 100) / 100;
    const calculatedProtein = Math.round(Number(food.protein || 0) * multiplier * 100) / 100;
    const calculatedCarbs = Math.round(Number(food.carbohydrates || 0) * multiplier * 100) / 100;
    const calculatedFat = Math.round(Number(food.fat || 0) * multiplier * 100) / 100;
    const calculatedFiber = Math.round(Number(food.fiber || 0) * multiplier * 100) / 100;
    const calculatedSugar = Math.round(Number(food.sugar || 0) * multiplier * 100) / 100;

    return {
      calculatedCalories,
      calculatedProtein,
      calculatedCarbs,
      calculatedFat,
      calculatedFiber,
      calculatedSugar,
    };
  }

  /**
   * Retrieves full aggregated daily nutrition breakdown for a specific user and date
   */
  static async getDailyNutrition(userId: string, date: string): Promise<DailyNutritionResponse> {
    // 1. Fetch meal logs for the given date and user
    const mealLogs = await prisma.mealLog.findMany({
      where: {
        userId,
        date,
      },
      include: {
        entries: {
          include: {
            food: true,
          },
        },
      },
    });

    const mealTypes: MealType[] = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"];

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;
    let totalSugar = 0;

    // 2. Map all 4 meal sections
    const meals: MealSectionSummary[] = mealTypes.map((mType) => {
      const log = mealLogs.find((l: any) => l.mealType === mType);

      let mCal = 0;
      let mProt = 0;
      let mCarb = 0;
      let mFat = 0;
      let mFib = 0;
      let mSug = 0;

      const entries = (log?.entries || []).map((entry: any) => {
        const cal = Number(entry.calculatedCalories || 0);
        const prot = Number(entry.calculatedProtein || 0);
        const carb = Number(entry.calculatedCarbs || 0);
        const fat = Number(entry.calculatedFat || 0);
        const fib = Number(entry.calculatedFiber || 0);
        const sug = Number(entry.calculatedSugar || 0);

        mCal += cal;
        mProt += prot;
        mCarb += carb;
        mFat += fat;
        mFib += fib;
        mSug += sug;

        return {
          id: entry.id,
          foodId: entry.foodId,
          foodName: entry.food?.name || "Unknown Food",
          foodCategory: entry.food?.category || "OTHER",
          brand: entry.food?.brand || null,
          quantity: Number(entry.quantity),
          quantityUnit: entry.quantityUnit,
          referenceServingSize: Number(entry.food?.servingSize || 100),
          referenceServingUnit: entry.food?.servingUnit || "g",
          calories: cal,
          protein: prot,
          carbs: carb,
          fat: fat,
          fiber: fib,
          sugar: sug,
          createdAt: entry.createdAt.toISOString(),
        };
      });

      totalCalories += mCal;
      totalProtein += mProt;
      totalCarbs += mCarb;
      totalFat += mFat;
      totalFiber += mFib;
      totalSugar += mSug;

      return {
        mealType: mType,
        mealLogId: log?.id || null,
        name: log?.name || null,
        totals: {
          calories: Math.round(mCal * 10) / 10,
          protein: Math.round(mProt * 10) / 10,
          carbs: Math.round(mCarb * 10) / 10,
          fat: Math.round(mFat * 10) / 10,
          fiber: Math.round(mFib * 10) / 10,
          sugar: Math.round(mSug * 10) / 10,
        },
        entries,
      };
    });

    const totals: MacroTotals = {
      calories: Math.round(totalCalories * 10) / 10,
      protein: Math.round(totalProtein * 10) / 10,
      carbs: Math.round(totalCarbs * 10) / 10,
      fat: Math.round(totalFat * 10) / 10,
      fiber: Math.round(totalFiber * 10) / 10,
      sugar: Math.round(totalSugar * 10) / 10,
    };

    const userTarget = await prisma.userNutrientTarget.findUnique({
      where: { userId },
    });

    const targets: DailyTargets = {
      calories: Number(userTarget?.calories || 2000),
      protein: Number(userTarget?.protein || 120),
      carbs: Number(userTarget?.carbohydrates || 250),
      fat: Number(userTarget?.fat || 65),
      fiber: Number(userTarget?.fiber || 30),
      sugar: Number(userTarget?.sugar || 35),
    };

    const progress: ProgressPercentages = {
      caloriesPercent: targets.calories > 0 ? Math.round((totals.calories / targets.calories) * 100) : 0,
      proteinPercent: targets.protein > 0 ? Math.round((totals.protein / targets.protein) * 100) : 0,
      carbsPercent: targets.carbs > 0 ? Math.round((totals.carbs / targets.carbs) * 100) : 0,
      fatPercent: targets.fat > 0 ? Math.round((totals.fat / targets.fat) * 100) : 0,
      fiberPercent: targets.fiber > 0 ? Math.round((totals.fiber / targets.fiber) * 100) : 0,
      sugarPercent: targets.sugar > 0 ? Math.round((totals.sugar / targets.sugar) * 100) : 0,
    };

    return {
      date,
      totals,
      targets,
      progress,
      meals,
    };
  }

  /**
    * Logs a food entry to a specific meal and date with snapshot calculation
   */
  static async logFoodToMeal(userId: string, input: LogMealEntryInput) {
    const { date, mealType, foodId, customFood, ingredients, quantity = 100, quantityUnit = "g" } = input;

    let targetFood: any = null;

    if (foodId) {
      targetFood = await FoodService.getFoodById(foodId, userId);
    }

    if (!targetFood && customFood?.name) {
      // Check if food already exists for this user with same name
      const existing = await prisma.food.findFirst({
        where: {
          name: { equals: customFood.name.trim(), mode: "insensitive" },
          OR: [{ userId }, { isSystemFood: true }],
        },
      });

      if (existing) {
        targetFood = existing;
      } else {
        // Calculate macro values if ingredients provided
        let calcCal = Number(customFood.calories || 0);
        let calcProt = Number(customFood.protein || 0);
        let calcCarb = Number(customFood.carbs || 0);
        let calcFat = Number(customFood.fat || 0);

        const ingredientList = customFood.ingredients || ingredients || [];
        if (ingredientList.length > 0) {
          calcCal = 0;
          calcProt = 0;
          calcCarb = 0;
          calcFat = 0;
          for (const ing of ingredientList) {
            const factor = (ing.quantityG || 0) / 100;
            calcCal += (ing.caloriesPer100g || 0) * factor;
            calcProt += (ing.proteinPer100g || 0) * factor;
            calcCarb += (ing.carbsPer100g || 0) * factor;
            calcFat += (ing.fatPer100g || 0) * factor;
          }
        }

        const validCategories = [
          "FRUITS", "VEGETABLES", "GRAINS_CEREALS", "PULSES_LEGUMES", "DAIRY",
          "NUTS_SEEDS", "OILS_FATS", "BEVERAGES", "SNACKS", "SWEETS", "SUPPLEMENTS", "OTHER"
        ];
        const rawCat = String((customFood as any)?.category || "").toUpperCase();
        const safeCategory = validCategories.includes(rawCat) ? (rawCat as any) : "OTHER";

        const effectiveServingSize = Number(customFood.servingSize) || Number(quantity) || 1;
        const effectiveServingUnit = customFood.servingUnit || quantityUnit || "serving";

        targetFood = await prisma.food.create({
          data: {
            userId,
            name: customFood.name.trim(),
            category: safeCategory,
            servingSize: effectiveServingSize,
            servingUnit: effectiveServingUnit,
            calories: Math.round(calcCal * 10) / 10,
            protein: Math.round(calcProt * 10) / 10,
            carbohydrates: Math.round(calcCarb * 10) / 10,
            fat: Math.round(calcFat * 10) / 10,
            fiber: Number((customFood as any).fiber || 0),
            sugar: Number((customFood as any).sugar || 0),
            // Micronutrients & Minerals
            iron: (customFood as any).iron !== undefined ? Number((customFood as any).iron) : null,
            calcium: (customFood as any).calcium !== undefined ? Number((customFood as any).calcium) : null,
            potassium: (customFood as any).potassium !== undefined ? Number((customFood as any).potassium) : null,
            magnesium: (customFood as any).magnesium !== undefined ? Number((customFood as any).magnesium) : null,
            zinc: (customFood as any).zinc !== undefined ? Number((customFood as any).zinc) : null,
            sodium: (customFood as any).sodium !== undefined ? Number((customFood as any).sodium) : null,
            // Vitamins
            vitaminA: (customFood as any).vitaminA !== undefined ? Number((customFood as any).vitaminA) : null,
            vitaminC: (customFood as any).vitaminC !== undefined ? Number((customFood as any).vitaminC) : null,
            vitaminD: (customFood as any).vitaminD !== undefined ? Number((customFood as any).vitaminD) : null,
            vitaminE: (customFood as any).vitaminE !== undefined ? Number((customFood as any).vitaminE) : null,
            vitaminB12: (customFood as any).vitaminB12 !== undefined ? Number((customFood as any).vitaminB12) : null,
            vitaminB6: (customFood as any).vitaminB6 !== undefined ? Number((customFood as any).vitaminB6) : null,
            isSystemFood: false,
          },
        });
      }
    }

    if (!targetFood) {
      throw new Error("FOOD_NOT_FOUND");
    }

    // 2. Compute nutrition snapshot
    const allIngredients = customFood?.ingredients || ingredients || [];
    let snapshot = this.calculateNutritionSnapshot(targetFood, quantity);

    // If explicit custom food values were passed and matched the portion, preserve exact calculated numbers
    if (customFood && !allIngredients.length && customFood.calories !== undefined) {
      const mult = quantity && Number(targetFood.servingSize) > 0 ? quantity / Number(targetFood.servingSize) : 1;
      snapshot = {
        calculatedCalories: Math.round(Number(customFood.calories) * mult * 10) / 10,
        calculatedProtein: Math.round(Number(customFood.protein || 0) * mult * 10) / 10,
        calculatedCarbs: Math.round(Number(customFood.carbs || 0) * mult * 10) / 10,
        calculatedFat: Math.round(Number(customFood.fat || 0) * mult * 10) / 10,
        calculatedFiber: Math.round(Number((customFood as any).fiber || 0) * mult * 10) / 10,
        calculatedSugar: Math.round(Number((customFood as any).sugar || 0) * mult * 10) / 10,
      };
    }

    // If explicit macro breakdown with ingredients was submitted, use exact calculation
    if (allIngredients.length > 0) {
      let totCal = 0;
      let totProt = 0;
      let totCarb = 0;
      let totFat = 0;
      for (const ing of allIngredients) {
        const factor = (ing.quantityG || 0) / 100;
        totCal += (ing.caloriesPer100g || 0) * factor;
        totProt += (ing.proteinPer100g || 0) * factor;
        totCarb += (ing.carbsPer100g || 0) * factor;
        totFat += (ing.fatPer100g || 0) * factor;
      }
      snapshot = {
        calculatedCalories: Math.round(totCal * 10) / 10,
        calculatedProtein: Math.round(totProt * 10) / 10,
        calculatedCarbs: Math.round(totCarb * 10) / 10,
        calculatedFat: Math.round(totFat * 10) / 10,
        calculatedFiber: 0,
        calculatedSugar: 0,
      };
    }

    // 3. Find or create MealLog for (userId, date, mealType)
    let mealLog = await prisma.mealLog.findFirst({
      where: {
        userId,
        date,
        mealType,
      },
    });

    if (!mealLog) {
      mealLog = await prisma.mealLog.create({
        data: {
          userId,
          date,
          mealType,
        },
      });
    }

    // 4. Create MealEntry with snapshot
    const entry = await prisma.mealEntry.create({
      data: {
        mealLogId: mealLog.id,
        foodId: targetFood.id,
        quantity,
        quantityUnit,
        calculatedCalories: snapshot.calculatedCalories,
        calculatedProtein: snapshot.calculatedProtein,
        calculatedCarbs: snapshot.calculatedCarbs,
        calculatedFat: snapshot.calculatedFat,
        calculatedFiber: snapshot.calculatedFiber,
        calculatedSugar: snapshot.calculatedSugar,
      },
    });

    // Smart background synchronization (non-blocking)
    GoogleSheetsService.triggerAutoSync(userId);

    return entry;
  }

  /**
   * Updates an existing meal entry's quantity or meal type
   */
  static async updateMealEntry(userId: string, entryId: string, input: UpdateMealEntryInput) {
    // 1. Fetch entry and verify ownership
    const entry = await prisma.mealEntry.findUnique({
      where: { id: entryId },
      include: {
        mealLog: true,
        food: true,
      },
    });

    if (!entry) {
      throw new Error("NOT_FOUND");
    }

    if (entry.mealLog?.userId !== userId) {
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    const newQuantity = input.quantity !== undefined ? input.quantity : Number(entry.quantity);
    const newUnit = input.quantityUnit || entry.quantityUnit;

    // Recalculate snapshot based on the food reference
    const snapshot = this.calculateNutritionSnapshot(entry.food, newQuantity);

    let targetMealLogId = entry.mealLogId;

    // If changing meal type
    if (input.mealType && input.mealType !== entry.mealLog.mealType) {
      let targetLog = await prisma.mealLog.findFirst({
        where: {
          userId,
          date: entry.mealLog.date,
          mealType: input.mealType,
        },
      });

      if (!targetLog) {
        targetLog = await prisma.mealLog.create({
          data: {
            userId,
            date: entry.mealLog.date,
            mealType: input.mealType,
          },
        });
      }
      targetMealLogId = targetLog.id;
    }

    const updated = await prisma.mealEntry.update({
      where: { id: entryId },
      data: {
        mealLogId: targetMealLogId,
        quantity: newQuantity,
        quantityUnit: newUnit,
        calculatedCalories: snapshot.calculatedCalories,
        calculatedProtein: snapshot.calculatedProtein,
        calculatedCarbs: snapshot.calculatedCarbs,
        calculatedFat: snapshot.calculatedFat,
        calculatedFiber: snapshot.calculatedFiber,
        calculatedSugar: snapshot.calculatedSugar,
      },
    });

    // Smart background synchronization (non-blocking)
    GoogleSheetsService.triggerAutoSync(userId);

    return updated;
  }

  /**
   * Deletes a meal entry with strict ownership verification
   */
  static async deleteMealEntry(userId: string, entryId: string) {
    const entry = await prisma.mealEntry.findUnique({
      where: { id: entryId },
      include: { mealLog: true },
    });

    if (!entry) {
      throw new Error("NOT_FOUND");
    }

    if (entry.mealLog?.userId !== userId) {
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    const deleted = await prisma.mealEntry.delete({
      where: { id: entryId },
    });

    // Check if mealLog has remaining entries; if not, optionally clean up
    const remaining = await prisma.mealEntry.findMany({
      where: { mealLogId: entry.mealLogId },
    });

    if (remaining.length === 0) {
      try {
        await prisma.mealLog.delete({ where: { id: entry.mealLogId } });
      } catch {
        // ignore
      }
    }

    // Smart background synchronization (non-blocking)
    GoogleSheetsService.triggerAutoSync(userId);

    return deleted;
  }

  /**
   * Clears daily logs for a given user and date
   */
  static async clearDailyLogs(
    userId: string,
    date: string,
    section: "ALL" | "MEALS" | "HYDRATION" | "ACTIVITIES" = "ALL"
  ) {
    let clearedMealsCount = 0;
    let clearedHydrationCount = 0;
    let clearedActivitiesCount = 0;

    if (section === "ALL" || section === "MEALS") {
      const mealLogs = await prisma.mealLog.findMany({
        where: { userId, date },
        include: { entries: true },
      });
      clearedMealsCount = mealLogs.reduce((acc, m) => acc + m.entries.length, 0);

      if (mealLogs.length > 0) {
        await prisma.mealLog.deleteMany({
          where: { userId, date },
        });
      }
    }

    if (section === "ALL" || section === "HYDRATION") {
      const deletedHydration = await prisma.hydrationLog.deleteMany({
        where: { userId, date },
      });
      clearedHydrationCount = deletedHydration.count;
    }

    if (section === "ALL" || section === "ACTIVITIES") {
      try {
        const deletedActivities = await (prisma as any).activity.deleteMany({
          where: { userId, date },
        });
        clearedActivitiesCount = deletedActivities.count;
      } catch {}
    }

    // Smart background synchronization (non-blocking)
    GoogleSheetsService.triggerAutoSync(userId);

    return {
      clearedMealsCount,
      clearedHydrationCount,
      clearedActivitiesCount,
    };
  }
}
