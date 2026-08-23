import { NutritionService } from "@/lib/services/nutrition.service";
import { HydrationService } from "@/lib/services/hydration.service";
import { DeepNutritionService } from "@/lib/services/deep-nutrition.service";
import { ReportService } from "@/lib/services/report.service";
import { UserSettingsService } from "@/lib/services/user-settings.service";
import { FoodService } from "@/lib/services/food.service";
import { ActivityService } from "@/lib/services/activity.service";
import { prisma } from "@/lib/db";

export interface ToolExecutionContext {
  userId: string;
}

export interface GoalProposalPayload {
  isProposal: true;
  targetKey: string;
  targetLabel: string;
  currentValue: number;
  proposedValue: number;
  unit: string;
  reason: string;
  status: "PENDING_CONFIRMATION";
}

export interface ExerciseCalorieEstimateResult {
  exerciseType: string;
  durationMinutes: number;
  intensity: string;
  weightKgUsed: number;
  metValue: number;
  estimatedCaloriesMin: number;
  estimatedCaloriesMax: number;
  formattedRange: string;
  isEstimate: true;
  disclaimer: string;
}

const MET_TABLE: Record<string, Record<string, number>> = {
  RUNNING: {
    LIGHT: 8.0,
    MODERATE: 10.0,
    VIGOROUS: 11.5,
    VERY_VIGOROUS: 13.5,
  },
  WALKING: {
    LIGHT: 2.8,
    MODERATE: 3.5,
    VIGOROUS: 4.5,
    VERY_VIGOROUS: 5.5,
  },
  CYCLING: {
    LIGHT: 5.5,
    MODERATE: 7.5,
    VIGOROUS: 10.0,
    VERY_VIGOROUS: 12.0,
  },
  STRENGTH_TRAINING: {
    LIGHT: 3.5,
    MODERATE: 5.0,
    VIGOROUS: 6.5,
    VERY_VIGOROUS: 8.0,
  },
  HIIT: {
    LIGHT: 6.0,
    MODERATE: 8.5,
    VIGOROUS: 11.0,
    VERY_VIGOROUS: 13.0,
  },
  SWIMMING: {
    LIGHT: 5.8,
    MODERATE: 7.0,
    VIGOROUS: 9.8,
    VERY_VIGOROUS: 11.5,
  },
  YOGA: {
    LIGHT: 2.5,
    MODERATE: 3.3,
    VIGOROUS: 4.0,
    VERY_VIGOROUS: 5.0,
  },
  OTHER: {
    LIGHT: 4.0,
    MODERATE: 6.0,
    VIGOROUS: 8.0,
    VERY_VIGOROUS: 10.0,
  },
};

export class AIToolRegistry {
  /**
   * Dispatches and executes a tool call securely on behalf of the authenticated user
   */
  static async executeTool(
    toolName: string,
    args: Record<string, any>,
    context: ToolExecutionContext
  ): Promise<any> {
    const { userId } = context;

    switch (toolName) {
      case "log_meal": {
        const {
          foodName,
          mealType = "LUNCH",
          calories = 0,
          protein = 0,
          carbohydrates = 0,
          fat = 0,
          fiber = 0,
          quantity = 1,
          quantityUnit = "serving",
          category = "OTHER",
          date,
        } = args;

        const dateStr = date || new Date().toISOString().split("T")[0];

        const logged = await NutritionService.logFoodToMeal(userId, {
          date: dateStr,
          mealType: mealType as any,
          customFood: {
            name: foodName,
            calories: Number(calories),
            protein: Number(protein),
            carbs: Number(carbohydrates),
            fat: Number(fat),
            servingSize: Number(quantity) || 1,
            servingUnit: quantityUnit || "serving",
          },
          quantity: Number(quantity) || 1,
          quantityUnit: quantityUnit || "serving",
        });

        const updatedDaily = await NutritionService.getDailyNutrition(userId, dateStr);

        return {
          success: true,
          message: `Logged "${foodName}" (${calories} kcal, ${protein}g protein, ${carbohydrates}g carbs, ${fat}g fat) under ${mealType} for ${dateStr}! 🥗✨`,
          loggedEntry: logged,
          newDailyTotals: updatedDaily.totals,
          newRemaining: {
            calories: Math.max(0, updatedDaily.targets.calories - updatedDaily.totals.calories),
            protein: Math.max(0, Math.round((updatedDaily.targets.protein - updatedDaily.totals.protein) * 10) / 10),
            carbs: Math.max(0, Math.round((updatedDaily.targets.carbs - updatedDaily.totals.carbs) * 10) / 10),
            fat: Math.max(0, Math.round((updatedDaily.targets.fat - updatedDaily.totals.fat) * 10) / 10),
          },
        };
      }

      case "update_meal_entry": {
        const { foodName, newQuantity, newQuantityUnit, mealType, date } = args;
        const dateStr = date || new Date().toISOString().split("T")[0];

        // Find existing meal entry by matching food name on that date
        const daily = await NutritionService.getDailyNutrition(userId, dateStr);
        let foundEntry: any = null;
        let foundMealType: any = null;

        for (const meal of daily.meals) {
          if (mealType && meal.mealType !== mealType) continue;
          for (const ent of meal.entries) {
            const entName = ent.foodName || "";
            if (entName.toLowerCase().includes(String(foodName).toLowerCase()) || String(foodName).toLowerCase().includes(entName.toLowerCase())) {
              foundEntry = ent;
              foundMealType = meal.mealType;
              break;
            }
          }
          if (foundEntry) break;
        }

        if (!foundEntry) {
          return {
            success: false,
            message: `Could not find an existing entry for "${foodName}" in your ${dateStr} logs to edit.`,
          };
        }

        const updated = await NutritionService.updateMealEntry(userId, foundEntry.id, {
          quantity: Number(newQuantity),
          quantityUnit: newQuantityUnit || foundEntry.quantityUnit,
        });

        const updatedDaily = await NutritionService.getDailyNutrition(userId, dateStr);

        return {
          success: true,
          message: `Successfully updated "${foundEntry.foodName}" in ${foundMealType} to ${newQuantity} ${newQuantityUnit || foundEntry.quantityUnit}! 📊 New calories: ${updated.calculatedCalories} kcal, protein: ${updated.calculatedProtein}g.`,
          updatedEntry: updated,
          newDailyTotals: updatedDaily.totals,
        };
      }

      case "create_recipe_in_database": {
        const {
          name,
          servingSize = 1,
          servingUnit = "serving",
          calories = 0,
          protein = 0,
          carbohydrates = 0,
          fat = 0,
          fiber = 0,
          iron,
          calcium,
          potassium,
          sodium,
          zinc,
          vitaminC,
          category = "RECIPE",
          notes,
        } = args;

        const createdFood = await FoodService.createFood(userId, {
          name,
          category: category as any,
          servingSize: Number(servingSize) || 1,
          servingUnit: servingUnit || "serving",
          calories: Number(calories),
          protein: Number(protein),
          carbohydrates: Number(carbohydrates),
          fat: Number(fat),
          fiber: Number(fiber),
          iron: iron !== undefined ? Number(iron) : undefined,
          calcium: calcium !== undefined ? Number(calcium) : undefined,
          potassium: potassium !== undefined ? Number(potassium) : undefined,
          magnesium: args.magnesium !== undefined ? Number(args.magnesium) : undefined,
          sodium: sodium !== undefined ? Number(sodium) : undefined,
          zinc: zinc !== undefined ? Number(zinc) : undefined,
          vitaminA: args.vitaminA !== undefined ? Number(args.vitaminA) : undefined,
          vitaminC: vitaminC !== undefined ? Number(vitaminC) : undefined,
          vitaminD: args.vitaminD !== undefined ? Number(args.vitaminD) : undefined,
          vitaminB12: args.vitaminB12 !== undefined ? Number(args.vitaminB12) : undefined,
          notes,
        });

        return {
          success: true,
          message: `Saved recipe "${name}" to your Food Database! (${calories} kcal, ${protein}g protein, ${carbohydrates}g carbs, ${fat}g fat per ${servingSize} ${servingUnit}) 🍳📖✨`,
          recipeId: createdFood.id,
        };
      }

      case "log_hydration": {
        const { amountMl, beverageType = "WATER", date, notes } = args;
        const dateStr = date || new Date().toISOString().split("T")[0];

        const logged = await HydrationService.logHydration(userId, {
          amountMl: Number(amountMl),
          beverageType: beverageType as any,
          date: dateStr,
          consumedAt: new Date().toISOString(),
          notes,
        });

        const hydStatus = await HydrationService.getDailyHydration(userId, dateStr);

        return {
          success: true,
          message: `Logged ${amountMl}ml of ${beverageType.toLowerCase()}! 💧 Total today: ${hydStatus.totalMl}ml / ${hydStatus.targetMl}ml (${hydStatus.percentage}%)`,
          totalIntakeMl: hydStatus.totalMl,
          targetMl: hydStatus.targetMl,
          remainingMl: hydStatus.remainingMl,
          isGoalReached: hydStatus.isGoalReached,
        };
      }

      case "log_activity": {
        const {
          activityType = "WORKOUT",
          durationMinutes = 30,
          caloriesBurned,
          distanceKm,
          steps,
          notes,
          date,
        } = args;

        const dateStr = date || new Date().toISOString().split("T")[0];
        const movingDurationSeconds = Math.round(Number(durationMinutes) * 60);

        const logged = await ActivityService.logActivity(userId, {
          activityType: activityType as any,
          date: dateStr,
          movingDurationSeconds,
          distanceKm: distanceKm ? Number(distanceKm) : undefined,
          caloriesBurned: caloriesBurned ? Number(caloriesBurned) : undefined,
          steps: steps ? Number(steps) : undefined,
          notes,
          source: "MANUAL",
        });

        return {
          success: true,
          message: `Logged ${activityType.toLowerCase()} session (${durationMinutes} mins${distanceKm ? `, ${distanceKm} km` : ""}${caloriesBurned ? `, ~${caloriesBurned} kcal burned` : ""})! 🏃‍♂️💪🔥`,
          activityId: logged.id,
        };
      }

      case "update_user_goals": {
        const { calories, protein, carbohydrates, fat, dailyHydrationTargetMl, dailyStepTarget, weightKg, heightCm, primaryGoal } = args;

        const updated = await UserSettingsService.updateUserSettings(userId, {
          nutritionGoals: {
            ...(calories !== undefined && { calories: Number(calories) }),
            ...(protein !== undefined && { protein: Number(protein) }),
            ...(carbohydrates !== undefined && { carbohydrates: Number(carbohydrates) }),
            ...(fat !== undefined && { fat: Number(fat) }),
          },
          profile: {
            ...(weightKg !== undefined && { weightKg: Number(weightKg) }),
            ...(heightCm !== undefined && { heightCm: Number(heightCm) }),
            ...(dailyHydrationTargetMl !== undefined && { dailyHydrationTargetMl: Number(dailyHydrationTargetMl) }),
            ...(dailyStepTarget !== undefined && { dailyStepTarget: Number(dailyStepTarget) }),
            ...(primaryGoal && { primaryGoal: String(primaryGoal) }),
          },
        });

        return {
          success: true,
          message: `Successfully updated your health profile & targets! 🎯`,
          newGoals: {
            weightKg: updated.profile.weightKg,
            heightCm: updated.profile.heightCm,
            calories: updated.nutritionGoals.calories,
            protein: updated.nutritionGoals.protein,
            carbs: updated.nutritionGoals.carbohydrates,
            fat: updated.nutritionGoals.fat,
            dailyHydrationTargetMl: updated.profile.dailyHydrationTargetMl,
            dailyStepTarget: updated.profile.dailyStepTarget,
          },
        };
      }

      case "get_today_nutrition": {
        const dateStr = args.date || new Date().toISOString().split("T")[0];
        const daily = await NutritionService.getDailyNutrition(userId, dateStr);
        const hasLoggedMeals = daily.meals.some((m) => m.entries.length > 0);

        return {
          date: dateStr,
          hasLoggedMeals,
          status: hasLoggedMeals ? "DATA_LOGGED" : "NOT_LOGGED_YET",
          totals: daily.totals,
          targets: daily.targets,
          remaining: {
            calories: Math.max(0, daily.targets.calories - daily.totals.calories),
            protein: Math.max(0, Math.round((daily.targets.protein - daily.totals.protein) * 10) / 10),
            carbs: Math.max(0, Math.round((daily.targets.carbs - daily.totals.carbs) * 10) / 10),
            fat: Math.max(0, Math.round((daily.targets.fat - daily.totals.fat) * 10) / 10),
          },
          progressPercentages: daily.progress,
          mealSections: daily.meals.map((m) => ({
            mealType: m.mealType,
            entryCount: m.entries.length,
            totals: m.totals,
            foods: m.entries.map((e) => `${e.foodName} (${e.quantity}${e.quantityUnit}, ${e.protein}g protein, ${e.calories} kcal)`),
          })),
        };
      }

      case "get_hydration_status": {
        const dateStr = args.date || new Date().toISOString().split("T")[0];
        const hyd = await HydrationService.getDailyHydration(userId, dateStr);
        return {
          date: dateStr,
          totalIntakeMl: hyd.totalMl,
          targetMl: hyd.targetMl,
          remainingMl: hyd.remainingMl,
          percentage: hyd.percentage,
          isTargetMet: hyd.isGoalReached,
          entriesCount: hyd.entries.length,
          streakDays: hyd.streakDays,
        };
      }

      case "get_running_summary": {
        const days = args.daysCount || 30;
        const report = await ReportService.getFullReport(userId, "last30days");
        const actOverview = report.overview?.activities;
        const runningPaceTrend = report.charts?.runningPaceTrend || [];
        const longestRunPR = report.personalRecords?.find((pr) => pr.category === "RUNNING");

        return {
          periodDays: days,
          totalSessions: actOverview?.totalSessions || 0,
          totalDistanceKm: actOverview?.totalDistanceKm || 0,
          averagePaceFormatted: actOverview?.avgPaceFormatted || "N/A",
          runningPaceTrend: runningPaceTrend.slice(-5),
          longestRunPR: longestRunPR ? `${longestRunPR.value} ${longestRunPR.unit} on ${longestRunPR.achievedDate}` : null,
        };
      }

      case "get_workout_summary": {
        const days = args.daysCount || 30;
        const report = await ReportService.getFullReport(userId, "last30days");
        const wkOverview = report.overview?.workouts;
        const highestVolumePR = report.personalRecords?.find((pr) => pr.category === "WORKOUT");

        return {
          periodDays: days,
          totalSessions: wkOverview?.totalSessions || 0,
          totalSets: wkOverview?.totalSets || 0,
          totalVolumeKg: wkOverview?.totalVolumeKg || 0,
          highestVolumePR: highestVolumePR ? `${highestVolumePR.value} ${highestVolumePR.unit} on ${highestVolumePR.achievedDate}` : null,
        };
      }

      case "get_micronutrient_status": {
        const days = args.daysCount || 7;
        const report = await ReportService.getFullReport(userId, "last7days");
        const micros = report.micronutrients || [];

        return {
          periodDays: days,
          totalNutrientsTracked: micros.length,
          optimalNutrients: micros.filter((m) => m.percentage !== null && m.percentage >= 85).map((m) => `${m.label} (${m.percentage}%)`),
          lowNutrients: micros.filter((m) => m.percentage !== null && m.percentage < 70).map((m) => `${m.label} (${m.percentage}% of ${m.target}${m.unit})`),
        };
      }

      case "get_user_goals": {
        const settings = await UserSettingsService.getUserSettings(userId);
        return {
          user: settings.user.name,
          profile: {
            heightCm: settings.profile.heightCm,
            weightKg: settings.profile.weightKg,
            biologicalSex: settings.profile.biologicalSex,
            activityLevel: settings.profile.activityLevel,
            primaryGoal: settings.profile.primaryGoal,
          },
          metabolic: {
            bmrKcal: settings.metabolic.bmr,
            tdeeKcal: settings.metabolic.tdee,
          },
          nutritionGoals: settings.nutritionGoals,
          fitnessGoals: {
            dailyHydrationMl: settings.profile.dailyHydrationTargetMl,
            dailySteps: settings.profile.dailyStepTarget,
            weeklyRunningDistanceKm: settings.profile.weeklyRunningDistanceKm,
            weeklyWorkoutSessions: settings.profile.weeklyWorkoutSessions,
          },
        };
      }

      case "propose_goal_update": {
        const { targetKey, newValue, reason } = args;
        const settings = await UserSettingsService.getUserSettings(userId);

        const targetLabels: Record<string, { label: string; unit: string; current: number }> = {
          calories: { label: "Daily Calories", unit: "kcal", current: settings.nutritionGoals.calories },
          protein: { label: "Protein Target", unit: "g", current: settings.nutritionGoals.protein },
          carbohydrates: { label: "Carbohydrates Target", unit: "g", current: settings.nutritionGoals.carbohydrates },
          fat: { label: "Fat Target", unit: "g", current: settings.nutritionGoals.fat },
          fiber: { label: "Fiber Target", unit: "g", current: settings.nutritionGoals.fiber },
          sugar: { label: "Sugar Max", unit: "g", current: settings.nutritionGoals.sugar },
          dailyHydrationTargetMl: { label: "Daily Hydration", unit: "ml", current: settings.profile.dailyHydrationTargetMl },
          dailyStepTarget: { label: "Daily Step Target", unit: "steps", current: settings.profile.dailyStepTarget },
          weeklyRunningDistanceKm: { label: "Weekly Running Distance", unit: "km", current: settings.profile.weeklyRunningDistanceKm },
          weeklyWorkoutSessions: { label: "Weekly Workout Sessions", unit: "sessions", current: settings.profile.weeklyWorkoutSessions },
        };

        const targetInfo = targetLabels[targetKey] || { label: targetKey, unit: "", current: 0 };

        const proposal: GoalProposalPayload = {
          isProposal: true,
          targetKey,
          targetLabel: targetInfo.label,
          currentValue: targetInfo.current,
          proposedValue: Number(newValue),
          unit: targetInfo.unit,
          reason,
          status: "PENDING_CONFIRMATION",
        };

        return {
          message: `Proposed updating ${targetInfo.label} from ${targetInfo.current}${targetInfo.unit} to ${newValue}${targetInfo.unit}. A confirmation action has been presented to the user.`,
          proposal,
        };
      }

      case "estimate_exercise_calories": {
        const { exerciseType = "RUNNING", durationMinutes = 30, intensity = "MODERATE", distanceKm } = args;

        const profile = await prisma.userProfile.findUnique({ where: { userId } });
        const weightKg = profile?.weightKg || 70; // fallback to standard 70kg if missing

        const typeTable = MET_TABLE[exerciseType] || MET_TABLE.OTHER;
        const met = typeTable[intensity] || typeTable.MODERATE || 7.0;

        // Formula: Calories = MET * Weight(kg) * Duration(hours)
        const durationHours = durationMinutes / 60;
        const baseCalories = met * weightKg * durationHours;

        const estimatedCaloriesMin = Math.round(baseCalories * 0.90);
        const estimatedCaloriesMax = Math.round(baseCalories * 1.10);

        const result: ExerciseCalorieEstimateResult = {
          exerciseType,
          durationMinutes,
          intensity,
          weightKgUsed: weightKg,
          metValue: met,
          estimatedCaloriesMin,
          estimatedCaloriesMax,
          formattedRange: `Approximately ${estimatedCaloriesMin}–${estimatedCaloriesMax} kcal`,
          isEstimate: true,
          disclaimer: `Estimated energy expenditure based on MET science (${met} METs) and your body weight of ${weightKg}kg. Actual expenditure varies with heart rate, individual metabolic efficiency, terrain, and weather.`,
        };

        return result;
      }

      case "compare_with_friend": {
        const { friendUsername } = args;
        if (!friendUsername) {
          return { status: "ERROR", message: "Please provide a friend's username to compare with." };
        }

        try {
          const { CommunityService } = await import("@/lib/services/community.service");
          const comparison = await CommunityService.getFriendComparison(userId, friendUsername);
          return {
            friend: comparison.friend.name,
            friendUsername: comparison.friend.username,
            metrics: comparison.metrics,
            supportiveInsight: comparison.supportiveInsight,
          };
        } catch (err: any) {
          return {
            status: "UNAVAILABLE",
            message: err.message || "Comparison unavailable due to privacy settings or friendship status.",
          };
        }
      }

      case "generate_weekly_plan": {
        const { WeeklyPlanService } = await import("@/lib/services/weekly-plan.service");
        const { startDate, customGoal } = args;
        const plan = await WeeklyPlanService.generateAIWeeklyPlan(userId, startDate, { customGoal });
        return {
          status: "SUCCESS",
          message: `Generated weekly plan for ${plan.startDate} to ${plan.endDate} with ${plan.items.length} daily items.`,
          plan,
        };
      }

      case "get_weekly_plan": {
        const { WeeklyPlanService } = await import("@/lib/services/weekly-plan.service");
        const { date } = args;
        const plan = await WeeklyPlanService.getActiveWeeklyPlan(userId, date);
        if (!plan) {
          return { status: "NO_PLAN", message: "No active weekly plan found for this period." };
        }
        return { status: "SUCCESS", plan };
      }

      case "get_weekly_review": {
        const { WeeklyPlanService } = await import("@/lib/services/weekly-plan.service");
        const { startDate } = args;
        const review = await WeeklyPlanService.generateWeeklyReview(userId, startDate);
        return { status: "SUCCESS", review };
      }

      default:
        throw new Error(`Unknown tool name: ${toolName}`);
    }
  }
}
