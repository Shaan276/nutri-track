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
    const { date, mealType, foodId, quantity, quantityUnit } = input;

    // 1. Fetch food ensuring access permissions
    const food = await FoodService.getFoodById(foodId, userId);
    if (!food) {
      throw new Error("FOOD_NOT_FOUND");
    }

    // 2. Compute nutrition snapshot
    const snapshot = this.calculateNutritionSnapshot(food, quantity);

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
        foodId,
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
}
