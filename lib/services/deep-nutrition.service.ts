import { prisma } from "@/lib/db";
import {
  NUTRIENT_DEFINITIONS,
  MACRO_KEYS,
  MINERAL_KEYS,
  VITAMIN_KEYS,
  NutrientDefinition,
  NutrientStatus,
  calculateNutrientStatus,
  UpdateNutrientTargetsInput,
} from "@/lib/validations/deep-nutrition";

export interface NutrientItemAnalysis {
  key: string;
  name: string;
  category: "MACRO" | "MINERAL" | "VITAMIN";
  unit: string;
  consumedAmount: number | null;
  targetAmount: number;
  percentage: number | null;
  status: NutrientStatus;
  statusLabel: string;
  statusColor: string;
  description: string;
  foodSources: string;
}

export interface MacroDistributionSlice {
  name: string;
  key: string;
  grams: number;
  calories: number;
  percentage: number;
  color: string;
}

export interface DeepNutritionOverview {
  date: string;
  coverageScore: number;
  coverageRating: "EXCELLENT" | "GOOD" | "MODERATE" | "LOW" | "NO_DATA";
  coverageRatingLabel: string;
  totalNutrientsTracked: number;
  nutrientsOnTarget: number;
  nutrientsBelowTarget: number;
  nutrientsAboveTarget: number;
  nutrientsNoData: number;
}

export interface DeepNutritionResponse {
  overview: DeepNutritionOverview;
  macros: NutrientItemAnalysis[];
  minerals: NutrientItemAnalysis[];
  vitamins: NutrientItemAnalysis[];
  macroDistribution: MacroDistributionSlice[];
  loggedMealsCount: number;
  loggedFoodsCount: number;
}

export class DeepNutritionService {
  /**
   * Retrieves or initializes default user nutrient targets
   */
  static async getUserTargets(userId: string) {
    let targets = await prisma.userNutrientTarget.findUnique({
      where: { userId },
    });

    if (!targets) {
      // Build default target mapping from definitions
      const defaults: Record<string, number> = {};
      for (const [k, v] of Object.entries(NUTRIENT_DEFINITIONS)) {
        defaults[k] = v.defaultTarget;
      }

      try {
        targets = await prisma.userNutrientTarget.upsert({
          where: { userId },
          update: {},
          create: {
            userId,
            ...defaults,
          },
        });
      } catch {
        targets = await prisma.userNutrientTarget.findUnique({
          where: { userId },
        });
      }
    }

    return targets;
  }

  /**
   * Updates customizable nutrient targets for the user
   */
  static async updateUserTargets(userId: string, input: UpdateNutrientTargetsInput) {
    return prisma.userNutrientTarget.upsert({
      where: { userId },
      update: {
        ...input,
      },
      create: {
        userId,
        ...input,
      },
    });
  }

  /**
   * Computes comprehensive deep nutrition telemetry for a specific date
   */
  static async getDeepNutritionAnalysis(userId: string, date: string): Promise<DeepNutritionResponse> {
    // 1. Fetch user targets and logged meal entries for the date
    const [userTargetsRecord, mealLogs] = await Promise.all([
      this.getUserTargets(userId),
      prisma.mealLog.findMany({
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
      }),
    ]);

    // Flatten all food entries consumed today
    const allEntries: Array<{ quantity: number; food: any }> = [];
    for (const log of mealLogs) {
      for (const entry of (log as any).entries || []) {
        if (entry.food) {
          allEntries.push({
            quantity: Number(entry.quantity),
            food: entry.food,
          });
        }
      }
    }

    // 2. Proportional Scaling & Honest Null Handling across all nutrients
    // If all foods have null for a nutrient, sum is null. If at least one food has a value, sum is calculated.
    const nutrientTotals: Record<string, { sum: number; hasData: boolean }> = {};

    for (const key of Object.keys(NUTRIENT_DEFINITIONS)) {
      nutrientTotals[key] = { sum: 0, hasData: false };
    }

    for (const item of allEntries) {
      const food = item.food;
      const refServing = Number(food.servingSize || 100);
      if (refServing <= 0) continue;
      const multiplier = item.quantity / refServing;

      // Check all nutrient definitions
      for (const [nKey, nDef] of Object.entries(NUTRIENT_DEFINITIONS)) {
        // Map camelCase to potential snake_case or standard food keys
        let rawVal = (food as any)[nKey];
        if (rawVal === undefined) {
          // Check snake_case fallback
          const snakeKey = nKey.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
          rawVal = (food as any)[snakeKey];
        }

        if (rawVal !== null && rawVal !== undefined) {
          const num = Number(rawVal);
          if (!isNaN(num)) {
            nutrientTotals[nKey].sum += num * multiplier;
            nutrientTotals[nKey].hasData = true;
          }
        }
      }
    }

    // 3. Build Detailed Analysis for each nutrient category
    const userTargetsObj = userTargetsRecord as Record<string, any>;

    const buildAnalysisList = (keys: string[]): NutrientItemAnalysis[] => {
      return keys.map((key) => {
        const def = NUTRIENT_DEFINITIONS[key];
        const targetVal = Number(userTargetsObj[key] || def.defaultTarget);
        const dataStatus = nutrientTotals[key];

        const consumedAmount = dataStatus.hasData ? Math.round(dataStatus.sum * 100) / 100 : null;
        const statusInfo = calculateNutrientStatus(consumedAmount, targetVal);

        return {
          key,
          name: def.name,
          category: def.category,
          unit: def.unit,
          consumedAmount,
          targetAmount: targetVal,
          percentage: statusInfo.percentage,
          status: statusInfo.status,
          statusLabel: statusInfo.statusLabel,
          statusColor: statusInfo.statusColor,
          description: def.description,
          foodSources: def.foodSources,
        };
      });
    };

    const macros = buildAnalysisList(MACRO_KEYS);
    const minerals = buildAnalysisList(MINERAL_KEYS);
    const vitamins = buildAnalysisList(VITAMIN_KEYS);

    const allAnalyses = [...macros, ...minerals, ...vitamins];

    // 4. Calculate Overall Nutrient Coverage Score
    let scoreSum = 0;
    let scoreCount = 0;
    let onTargetCount = 0;
    let belowTargetCount = 0;
    let aboveTargetCount = 0;
    let noDataCount = 0;

    for (const item of allAnalyses) {
      if (item.consumedAmount === null) {
        noDataCount++;
      } else {
        scoreCount++;
        const pct = item.percentage ?? 0;
        // Cap individual nutrient contribution at 100% to avoid skewed average
        scoreSum += Math.min(100, pct);

        if (item.status === "ON_TRACK") {
          onTargetCount++;
        } else if (item.status === "LOW" || item.status === "NEEDS_ATTENTION") {
          belowTargetCount++;
        } else if (item.status === "HIGH") {
          aboveTargetCount++;
        }
      }
    }

    const coverageScore = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;

    let coverageRating: DeepNutritionOverview["coverageRating"] = "NO_DATA";
    let coverageRatingLabel = "No Nutrient Data";

    if (allEntries.length === 0 || scoreCount === 0) {
      coverageRating = "NO_DATA";
      coverageRatingLabel = "No Meals Logged Today";
    } else if (coverageScore >= 85) {
      coverageRating = "EXCELLENT";
      coverageRatingLabel = "Excellent Coverage";
    } else if (coverageScore >= 70) {
      coverageRating = "GOOD";
      coverageRatingLabel = "Good Coverage";
    } else if (coverageScore >= 50) {
      coverageRating = "MODERATE";
      coverageRatingLabel = "Moderate Coverage";
    } else {
      coverageRating = "LOW";
      coverageRatingLabel = "Needs Attention";
    }

    const overview: DeepNutritionOverview = {
      date,
      coverageScore,
      coverageRating,
      coverageRatingLabel,
      totalNutrientsTracked: allAnalyses.length,
      nutrientsOnTarget: onTargetCount,
      nutrientsBelowTarget: belowTargetCount,
      nutrientsAboveTarget: aboveTargetCount,
      nutrientsNoData: noDataCount,
    };

    // 5. Macro Distribution Slices for Donut Chart
    const proteinGrams = nutrientTotals.protein.hasData ? nutrientTotals.protein.sum : 0;
    const carbsGrams = nutrientTotals.carbohydrates.hasData ? nutrientTotals.carbohydrates.sum : 0;
    const fatGrams = nutrientTotals.fat.hasData ? nutrientTotals.fat.sum : 0;

    const proteinCals = proteinGrams * 4;
    const carbsCals = carbsGrams * 4;
    const fatCals = fatGrams * 9;
    const totalMacroCals = proteinCals + carbsCals + fatCals;

    const macroDistribution: MacroDistributionSlice[] = [
      {
        name: "Protein",
        key: "protein",
        grams: Math.round(proteinGrams * 10) / 10,
        calories: Math.round(proteinCals),
        percentage: totalMacroCals > 0 ? Math.round((proteinCals / totalMacroCals) * 100) : 0,
        color: "#3B82F6", // Blue
      },
      {
        name: "Carbohydrates",
        key: "carbohydrates",
        grams: Math.round(carbsGrams * 10) / 10,
        calories: Math.round(carbsCals),
        percentage: totalMacroCals > 0 ? Math.round((carbsCals / totalMacroCals) * 100) : 0,
        color: "#10B981", // Emerald
      },
      {
        name: "Fat",
        key: "fat",
        grams: Math.round(fatGrams * 10) / 10,
        calories: Math.round(fatCals),
        percentage: totalMacroCals > 0 ? Math.round((fatCals / totalMacroCals) * 100) : 0,
        color: "#F59E0B", // Amber
      },
    ];

    return {
      overview,
      macros,
      minerals,
      vitamins,
      macroDistribution,
      loggedMealsCount: mealLogs.length,
      loggedFoodsCount: allEntries.length,
    };
  }

  /**
   * Retrieves historical trend data for a specific nutrient over N days
   */
  static async getNutrientTrend(userId: string, nutrientKey: string, daysCount: number = 7) {
    const dates: string[] = [];
    const now = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split("T")[0]);
    }

    const trendPoints = [];

    for (const dt of dates) {
      const analysis = await this.getDeepNutritionAnalysis(userId, dt);
      const allNutrients = [...analysis.macros, ...analysis.minerals, ...analysis.vitamins];
      const targetItem = allNutrients.find((n) => n.key === nutrientKey);

      trendPoints.push({
        date: dt,
        label: new Date(dt + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" }),
        consumed: targetItem ? targetItem.consumedAmount : null,
        target: targetItem ? targetItem.targetAmount : 0,
        unit: targetItem ? targetItem.unit : "",
      });
    }

    return trendPoints;
  }
}
