import { NutritionService } from "@/lib/services/nutrition.service";
import { HydrationService } from "@/lib/services/hydration.service";
import { DeepNutritionService } from "@/lib/services/deep-nutrition.service";
import { ReportService } from "@/lib/services/report.service";
import { UserSettingsService } from "@/lib/services/user-settings.service";
import { FoodService } from "@/lib/services/food.service";
import { ActivityService } from "@/lib/services/activity.service";
import { WorkoutService } from "@/lib/services/workout.service";
import { AIMemoryService } from "@/lib/ai/memory-service";
import { FoodNLP, LoggedMealCandidate } from "@/lib/nlp/food-nlp";
import { DynamicNutritionService } from "@/lib/services/dynamic-nutrition.service";
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
      case "log_meal":
      case "create_meal_log": {
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
          iron,
          calcium,
          potassium,
          magnesium,
          zinc,
          sodium,
          vitaminA,
          vitaminC,
          vitaminD,
          vitaminE,
          vitaminB12,
          vitaminB6,
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
            fiber: Number(fiber || 0),
            sugar: Number(args.sugar || 0),
            servingSize: Number(quantity) || 1,
            servingUnit: quantityUnit || "serving",
            iron: iron !== undefined ? Number(iron) : undefined,
            calcium: calcium !== undefined ? Number(calcium) : undefined,
            potassium: potassium !== undefined ? Number(potassium) : undefined,
            magnesium: magnesium !== undefined ? Number(magnesium) : undefined,
            zinc: zinc !== undefined ? Number(zinc) : undefined,
            sodium: sodium !== undefined ? Number(sodium) : undefined,
            vitaminA: vitaminA !== undefined ? Number(vitaminA) : undefined,
            vitaminC: vitaminC !== undefined ? Number(vitaminC) : undefined,
            vitaminD: vitaminD !== undefined ? Number(vitaminD) : undefined,
            vitaminE: vitaminE !== undefined ? Number(vitaminE) : undefined,
            vitaminB12: vitaminB12 !== undefined ? Number(vitaminB12) : undefined,
            vitaminB6: vitaminB6 !== undefined ? Number(vitaminB6) : undefined,
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

      case "update_meal_entry":
      case "update_meal_log": {
        const { foodName, newQuantity, newQuantityUnit, mealType, date } = args;
        const dateStr = date || new Date().toISOString().split("T")[0];

        // Find existing meal entry using FoodNLP
        const daily = await NutritionService.getDailyNutrition(userId, dateStr);
        const allCandidates: LoggedMealCandidate[] = daily.meals.flatMap((m) =>
          m.entries.map((e) => ({
            id: e.id,
            foodName: e.foodName,
            mealType: m.mealType,
            calories: e.calories,
            protein: e.protein,
            quantity: Number(e.quantity),
            quantityUnit: e.quantityUnit,
          }))
        );

        const matchResult = FoodNLP.findBestMatch(String(foodName), allCandidates, mealType);
        const foundEntry = matchResult.bestMatch;

        if (!foundEntry) {
          const suggestions = allCandidates.map((c) => `• ${c.foodName} (${c.quantity} ${c.quantityUnit}, ${c.mealType})`);
          if (suggestions.length > 0) {
            return {
              success: false,
              message: `Could not find an exact entry for "${foodName}" in your ${dateStr} logs to edit.\n\nHere are the meals currently logged:\n${suggestions.join("\n")}\n\nWhich one would you like to update? 📊✨`,
              suggestions: allCandidates,
            };
          }
          return {
            success: false,
            message: `You haven't logged any meals yet for ${dateStr} to edit.`,
          };
        }

        const updated = await NutritionService.updateMealEntry(userId, foundEntry.id, {
          quantity: Number(newQuantity),
          quantityUnit: newQuantityUnit || foundEntry.quantityUnit,
        });

        const updatedDaily = await NutritionService.getDailyNutrition(userId, dateStr);

        return {
          success: true,
          message: `Successfully updated "${foundEntry.foodName}" in ${foundEntry.mealType} to ${newQuantity} ${newQuantityUnit || foundEntry.quantityUnit}! 📊 New calories: ${updated.calculatedCalories} kcal, protein: ${updated.calculatedProtein}g.`,
          updatedEntry: updated,
          newDailyTotals: updatedDaily.totals,
        };
      }

      case "delete_meal_entry": {
        const { foodName, mealType, date } = args;
        const dateStr = date || new Date().toISOString().split("T")[0];

        const daily = await NutritionService.getDailyNutrition(userId, dateStr);
        const allCandidates: LoggedMealCandidate[] = daily.meals.flatMap((m) =>
          m.entries.map((e) => ({
            id: e.id,
            foodName: e.foodName,
            mealType: m.mealType,
            calories: e.calories,
            protein: e.protein,
            quantity: Number(e.quantity),
            quantityUnit: e.quantityUnit,
          }))
        );

        const genericWords = ["it", "this", "the meal", "the food", "that", "this meal", "today's meal", "todays meal"];
        let foundEntry: LoggedMealCandidate | null = null;
        if (genericWords.includes(String(foodName).toLowerCase()) && allCandidates.length > 0) {
          foundEntry = allCandidates[allCandidates.length - 1];
        } else {
          const matchResult = FoodNLP.findBestMatch(String(foodName), allCandidates, mealType);
          foundEntry = matchResult.bestMatch;
        }

        if (!foundEntry) {
          const suggestions = allCandidates.map((c) => `• ${c.foodName} (${c.calories} kcal, ${c.mealType})`);
          if (suggestions.length > 0) {
            return {
              success: false,
              message: `Could not find an exact match for "${foodName}" in your ${dateStr} food journal.\n\nHere are the meals currently logged for today:\n${suggestions.join("\n")}\n\nDid you mean one of these? Reply with "remove <Dish Name>" to delete it! 💡🥗`,
              suggestions: allCandidates,
            };
          }

          return {
            success: false,
            message: `You haven't logged any meals yet for ${dateStr}, so there is nothing to delete! 🥗✨`,
          };
        }

        await NutritionService.deleteMealEntry(userId, foundEntry.id);
        const updatedDaily = await NutritionService.getDailyNutrition(userId, dateStr);

        return {
          success: true,
          message: `Deleted "${foundEntry.foodName}" from ${foundEntry.mealType} for ${dateStr}! 🗑️✨ Updated daily calories: ${updatedDaily.totals.calories} kcal.`,
          newDailyTotals: updatedDaily.totals,
        };
      }

      case "clear_day_logs": {
        const { date, section = "ALL" } = args;
        const dateStr = date || new Date().toISOString().split("T")[0];

        const cleared = await NutritionService.clearDailyLogs(userId, dateStr, section as any);
        const updatedDaily = await NutritionService.getDailyNutrition(userId, dateStr);

        return {
          success: true,
          message: `Cleared ${cleared.clearedMealsCount} meal entries, ${cleared.clearedHydrationCount} hydration logs, and ${cleared.clearedActivitiesCount} activities for ${dateStr}! 🗑️✨ Daily calories and macros are now reset to 0.`,
          clearedCounts: cleared,
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

      case "delete_recipe_from_database": {
        const { recipeName, foodName, name } = args;
        const targetQuery = (recipeName || foodName || name || "").trim();

        const userFoods = await prisma.food.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        });

        if (userFoods.length === 0) {
          return {
            success: false,
            message: "Your Food Database is currently empty.",
          };
        }

        const candidates: LoggedMealCandidate[] = userFoods.map((f) => ({
          id: f.id,
          foodName: f.name,
          mealType: "CUSTOM_RECIPE",
          calories: Number(f.calories),
          protein: Number(f.protein),
        }));

        const genericWords = ["it", "this", "the meal", "the food", "the recipe", "that", "this meal", "this recipe", "my recipe"];
        let matchedFood: any = null;

        if ((genericWords.includes(targetQuery.toLowerCase()) || !targetQuery) && userFoods.length > 0) {
          matchedFood = userFoods[0];
        } else {
          const match = FoodNLP.findBestMatch(targetQuery, candidates);
          if (match && match.bestMatch) {
            matchedFood = userFoods.find((f) => f.id === match.bestMatch?.id);
          }
        }

        if (!matchedFood) {
          const suggestions = userFoods.slice(0, 6).map((f) => `• "${f.name}" (${f.calories} kcal, ${f.protein}g protein)`).join("\n");
          return {
            success: false,
            message: `Could not find a recipe matching "${targetQuery}" in your Food Database.\n\nYour saved recipes:\n${suggestions}`,
          };
        }

        await FoodService.deleteFood(matchedFood.id, userId);

        return {
          success: true,
          message: `Deleted recipe "${matchedFood.name}" from your Food Database! 🗑️📖✨`,
          deletedRecipe: {
            id: matchedFood.id,
            name: matchedFood.name,
          },
        };
      }

      case "update_recipe_in_database": {
        const { recipeName, foodName, name, newName, calories, protein, carbohydrates, fat, fiber, servingSize, servingUnit, notes } = args;
        const targetQuery = (recipeName || foodName || name || "").trim();

        const userFoods = await prisma.food.findMany({ where: { userId } });
        const candidates: LoggedMealCandidate[] = userFoods.map((f) => ({
          id: f.id,
          foodName: f.name,
          mealType: "CUSTOM_RECIPE",
          calories: Number(f.calories),
          protein: Number(f.protein),
        }));

        const match = FoodNLP.findBestMatch(targetQuery, candidates);
        if (!match || !match.bestMatch) {
          return {
            success: false,
            message: `Could not find recipe "${targetQuery}" to update in your Food Database.`,
          };
        }

        const matchedRecipe = match.bestMatch;
        const updated = await FoodService.updateFood(matchedRecipe.id, userId, {
          ...(newName && { name: newName }),
          ...(calories !== undefined && { calories: Number(calories) }),
          ...(protein !== undefined && { protein: Number(protein) }),
          ...(carbohydrates !== undefined && { carbohydrates: Number(carbohydrates) }),
          ...(fat !== undefined && { fat: Number(fat) }),
          ...(fiber !== undefined && { fiber: Number(fiber) }),
          ...(servingSize !== undefined && { servingSize: Number(servingSize) }),
          ...(servingUnit && { servingUnit: String(servingUnit) }),
          ...(notes !== undefined && { notes: String(notes) }),
        });

        return {
          success: true,
          message: `Updated recipe "${updated.name}" in your Food Database! (${updated.calories} kcal, ${updated.protein}g protein, ${updated.carbohydrates}g carbs, ${updated.fat}g fat) 🍳✨`,
          updatedRecipe: updated,
        };
      }

      case "log_hydration":
      case "create_hydration_log": {
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

      case "log_activity":
      case "create_activity": {
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

      case "update_user_profile":
      case "update_profile": {
        const {
          weightKg,
          heightCm,
          dateOfBirth,
          biologicalSex,
          activityLevel,
          primaryGoal,
          dailyHydrationTargetMl,
          dailyStepTarget,
          weeklyRunningDistanceKm,
          weeklyWorkoutSessions,
        } = args;

        const updated = await UserSettingsService.updateUserSettings(userId, {
          profile: {
            ...(weightKg !== undefined && { weightKg: Number(weightKg) }),
            ...(heightCm !== undefined && { heightCm: Number(heightCm) }),
            ...(dateOfBirth && { dateOfBirth: String(dateOfBirth) }),
            ...(biologicalSex && { biologicalSex: biologicalSex as any }),
            ...(activityLevel && { activityLevel: activityLevel as any }),
            ...(primaryGoal && { primaryGoal: primaryGoal as any }),
            ...(dailyHydrationTargetMl !== undefined && { dailyHydrationTargetMl: Number(dailyHydrationTargetMl) }),
            ...(dailyStepTarget !== undefined && { dailyStepTarget: Number(dailyStepTarget) }),
            ...(weeklyRunningDistanceKm !== undefined && { weeklyRunningDistanceKm: Number(weeklyRunningDistanceKm) }),
            ...(weeklyWorkoutSessions !== undefined && { weeklyWorkoutSessions: Number(weeklyWorkoutSessions) }),
          },
        });

        const changes: string[] = [];
        if (weightKg !== undefined) changes.push(`Weight: ${updated.profile.weightKg} kg`);
        if (heightCm !== undefined) changes.push(`Height: ${updated.profile.heightCm} cm`);
        if (activityLevel) changes.push(`Activity: ${updated.profile.activityLevel}`);
        if (primaryGoal) changes.push(`Goal: ${updated.profile.primaryGoal}`);

        return {
          success: true,
          message: `Done — I've updated your profile! ⚖️✨ ${changes.join(" | ")} (New BMR: ${updated.metabolic.bmr} kcal, TDEE: ${updated.metabolic.tdee} kcal/day).`,
          updatedProfile: updated.profile,
          metabolic: updated.metabolic,
        };
      }

      case "update_weight": {
        const { weightKg } = args;
        if (weightKg === undefined || isNaN(Number(weightKg))) {
          return { success: false, message: "Please provide a valid weight in kilograms." };
        }
        const updated = await UserSettingsService.updateUserSettings(userId, {
          profile: { weightKg: Number(weightKg) },
        });
        return {
          success: true,
          message: `Done — I've updated your weight to ${updated.profile.weightKg} kg! ⚖️✨ (Updated TDEE: ${updated.metabolic.tdee} kcal/day).`,
          weightKg: updated.profile.weightKg,
          metabolic: updated.metabolic,
        };
      }

      case "update_user_goals":
      case "update_goals":
      case "update_calorie_target":
      case "update_protein_target":
      case "update_hydration_target": {
        const {
          calories,
          protein,
          carbohydrates,
          carbs,
          fat,
          fats,
          fiber,
          dailyHydrationTargetMl,
          hydrationMl,
          dailyStepTarget,
          stepsTarget,
          weeklyRunningDistanceKm,
          runningTargetKm,
          weeklyWorkoutSessions,
          workoutTarget,
          weightKg,
          heightCm,
          primaryGoal,
        } = args;

        const effectiveCarbs = carbohydrates !== undefined ? carbohydrates : carbs;
        const effectiveFat = fat !== undefined ? fat : fats;
        const effectiveHydration = dailyHydrationTargetMl !== undefined ? dailyHydrationTargetMl : hydrationMl;
        const effectiveSteps = dailyStepTarget !== undefined ? dailyStepTarget : stepsTarget;
        const effectiveRunning = weeklyRunningDistanceKm !== undefined ? weeklyRunningDistanceKm : runningTargetKm;
        const effectiveWorkouts = weeklyWorkoutSessions !== undefined ? weeklyWorkoutSessions : workoutTarget;

        const updated = await UserSettingsService.updateUserSettings(userId, {
          nutritionGoals: {
            ...(calories !== undefined && { calories: Number(calories) }),
            ...(protein !== undefined && { protein: Number(protein) }),
            ...(effectiveCarbs !== undefined && { carbohydrates: Number(effectiveCarbs) }),
            ...(effectiveFat !== undefined && { fat: Number(effectiveFat) }),
            ...(fiber !== undefined && { fiber: Number(fiber) }),
          },
          profile: {
            ...(weightKg !== undefined && { weightKg: Number(weightKg) }),
            ...(heightCm !== undefined && { heightCm: Number(heightCm) }),
            ...(effectiveHydration !== undefined && { dailyHydrationTargetMl: Number(effectiveHydration) }),
            ...(effectiveSteps !== undefined && { dailyStepTarget: Number(effectiveSteps) }),
            ...(effectiveRunning !== undefined && { weeklyRunningDistanceKm: Number(effectiveRunning) }),
            ...(effectiveWorkouts !== undefined && { weeklyWorkoutSessions: Number(effectiveWorkouts) }),
            ...(primaryGoal && { primaryGoal: String(primaryGoal) as any }),
          },
        });

        const targetBullets: string[] = [];
        if (calories !== undefined) targetBullets.push(`Calories: ${updated.nutritionGoals.calories} kcal`);
        if (protein !== undefined) targetBullets.push(`Protein: ${updated.nutritionGoals.protein}g`);
        if (effectiveCarbs !== undefined) targetBullets.push(`Carbs: ${updated.nutritionGoals.carbohydrates}g`);
        if (effectiveFat !== undefined) targetBullets.push(`Fats: ${updated.nutritionGoals.fat}g`);
        if (effectiveHydration !== undefined) targetBullets.push(`Water: ${updated.profile.dailyHydrationTargetMl}ml`);
        if (effectiveSteps !== undefined) targetBullets.push(`Steps: ${updated.profile.dailyStepTarget.toLocaleString()}/day`);
        if (primaryGoal) targetBullets.push(`Primary Goal: ${updated.profile.primaryGoal}`);

        return {
          success: true,
          message: `Done — I've updated your daily targets! 🎯✨\n${targetBullets.map((b) => `• ${b}`).join("\n")}`,
          newGoals: {
            calories: updated.nutritionGoals.calories,
            protein: updated.nutritionGoals.protein,
            carbs: updated.nutritionGoals.carbohydrates,
            fat: updated.nutritionGoals.fat,
            fiber: updated.nutritionGoals.fiber,
            dailyHydrationTargetMl: updated.profile.dailyHydrationTargetMl,
            dailyStepTarget: updated.profile.dailyStepTarget,
            primaryGoal: updated.profile.primaryGoal,
          },
        };
      }

      case "update_micronutrient_targets": {
        const {
          iron,
          calcium,
          potassium,
          magnesium,
          zinc,
          sodium,
          vitaminA,
          vitaminC,
          vitaminD,
          vitaminE,
          vitaminB12,
          vitaminB6,
          folate,
        } = args;

        const updated = await DeepNutritionService.updateUserTargets(userId, {
          ...(iron !== undefined && { iron: Number(iron) }),
          ...(calcium !== undefined && { calcium: Number(calcium) }),
          ...(potassium !== undefined && { potassium: Number(potassium) }),
          ...(magnesium !== undefined && { magnesium: Number(magnesium) }),
          ...(zinc !== undefined && { zinc: Number(zinc) }),
          ...(sodium !== undefined && { sodium: Number(sodium) }),
          ...(vitaminA !== undefined && { vitaminA: Number(vitaminA) }),
          ...(vitaminC !== undefined && { vitaminC: Number(vitaminC) }),
          ...(vitaminD !== undefined && { vitaminD: Number(vitaminD) }),
          ...(vitaminE !== undefined && { vitaminE: Number(vitaminE) }),
          ...(vitaminB12 !== undefined && { vitaminB12: Number(vitaminB12) }),
          ...(vitaminB6 !== undefined && { vitaminB6: Number(vitaminB6) }),
          ...(folate !== undefined && { folate: Number(folate) }),
        });

        return {
          success: true,
          message: "Updated your personalized micronutrient targets in Deep Nutrition! 🥗🔬✨",
          targets: updated,
        };
      }

      case "create_workout":
      case "log_workout": {
        const {
          name = "Strength Training",
          workoutType = "STRENGTH",
          durationMinutes = 45,
          caloriesBurned,
          exercises,
          notes,
          date,
        } = args;

        const dateStr = date || new Date().toISOString().split("T")[0];
        const durationSeconds = Math.round(Number(durationMinutes) * 60);

        const session = await WorkoutService.createWorkoutSession(userId, {
          name,
          workoutType: workoutType as any,
          date: dateStr,
          durationSeconds,
          caloriesBurned: caloriesBurned ? Number(caloriesBurned) : undefined,
          notes,
          exercises: exercises || [],
        });

        return {
          success: true,
          message: `Logged workout "${session.name}" (${durationMinutes} mins${caloriesBurned ? `, ~${caloriesBurned} kcal burned` : ""}) with ${session.exercises.length} exercises! 💪🔥`,
          workoutId: session.id,
        };
      }

      case "update_workout": {
        const { workoutId, name, durationMinutes, caloriesBurned, notes, date } = args;
        if (!workoutId) {
          return { success: false, message: "Please provide the workout ID to update." };
        }
        const updated = await WorkoutService.updateWorkoutSession(userId, workoutId, {
          ...(name && { name }),
          ...(durationMinutes !== undefined && { durationSeconds: Math.round(Number(durationMinutes) * 60) }),
          ...(caloriesBurned !== undefined && { caloriesBurned: Number(caloriesBurned) }),
          ...(notes !== undefined && { notes }),
          ...(date && { date }),
        });
        return {
          success: true,
          message: `Updated workout session "${updated.name}"! 💪✨`,
          workout: updated,
        };
      }

      case "delete_workout_session":
      case "delete_workout": {
        const { workoutId, date, name } = args;
        let targetId = workoutId;

        if (!targetId) {
          const dateStr = date || new Date().toISOString().split("T")[0];
          const daily = await WorkoutService.getDailyWorkouts(userId, dateStr);
          if (daily.sessions.length === 0) {
            return { success: false, message: `No workout sessions found for ${dateStr}.` };
          }
          if (name) {
            const found = daily.sessions.find((s) => s.name.toLowerCase().includes(name.toLowerCase()));
            targetId = found ? found.id : daily.sessions[daily.sessions.length - 1].id;
          } else {
            targetId = daily.sessions[daily.sessions.length - 1].id;
          }
        }

        await WorkoutService.deleteWorkoutSession(userId, targetId);
        return {
          success: true,
          message: `Deleted workout session! 🗑️💪`,
        };
      }

      case "update_activity": {
        const { logId, activityType, durationMinutes, distanceKm, caloriesBurned, steps, notes, date } = args;
        if (!logId) {
          return { success: false, message: "Please provide the activity log ID to update." };
        }
        const updated = await ActivityService.updateActivity(userId, logId, {
          ...(activityType && { activityType: activityType as any }),
          ...(durationMinutes !== undefined && { movingDurationSeconds: Math.round(Number(durationMinutes) * 60) }),
          ...(distanceKm !== undefined && { distanceKm: Number(distanceKm) }),
          ...(caloriesBurned !== undefined && { caloriesBurned: Number(caloriesBurned) }),
          ...(steps !== undefined && { steps: Number(steps) }),
          ...(notes !== undefined && { notes }),
          ...(date && { date }),
        });
        return {
          success: true,
          message: `Updated activity log! 🏃‍♂️✨`,
          activity: updated,
        };
      }

      case "delete_hydration_log": {
        const dateStr = args.date || new Date().toISOString().split("T")[0];
        const hyd = await HydrationService.getDailyHydration(userId, dateStr);
        if (hyd.entries.length === 0) {
          return {
            success: false,
            message: `No hydration entries found for ${dateStr}.`,
          };
        }
        const lastLog = hyd.entries[hyd.entries.length - 1];
        await prisma.hydrationLog.delete({ where: { id: lastLog.id } });
        const updated = await HydrationService.getDailyHydration(userId, dateStr);
        return {
          success: true,
          message: `Deleted ${lastLog.amountMl}ml ${lastLog.beverageType.toLowerCase()} from ${dateStr}. Current hydration: ${updated.totalMl}ml / ${updated.targetMl}ml (${updated.percentage}%). 💧🗑️`,
          updatedTotals: updated,
        };
      }

      case "delete_activity_log": {
        const dateStr = args.date || new Date().toISOString().split("T")[0];
        const actSummary = await ActivityService.getDailyActivity(userId, dateStr);
        if (actSummary.activities.length === 0) {
          return {
            success: false,
            message: `No activity logs found for ${dateStr}.`,
          };
        }
        const toDelete = actSummary.activities[actSummary.activities.length - 1];
        await ActivityService.deleteActivity(userId, toDelete.id);
        return {
          success: true,
          message: `Deleted activity "${toDelete.activityType.toLowerCase()}" from ${dateStr}! 🏃‍♂️🗑️`,
        };
      }

      case "generate_next_day_recommendations":
      case "get_tomorrow_recommendations": {
        const forecast = await DynamicNutritionService.generateNextDayForecast(userId, args.date);
        return {
          success: true,
          message: forecast.coachingSummary,
          forecast,
        };
      }

      case "get_daily_health_review": {
        const review = await DynamicNutritionService.getDailyHealthReview(userId, args.date);
        return {
          success: true,
          message: `Daily Health Review for ${review.date}:\n• What Went Well: ${review.whatWentWell.join(", ")}\n• Focus Areas: ${review.whatNeedsFocus.join(", ")}`,
          review,
        };
      }

      case "update_user_setting":
      case "save_user_memory": {
        const { key, category = "PREFERENCE", content, value } = args;
        const memoryContent = content || (key ? `${key}: ${value}` : "");
        if (!memoryContent) {
          return { success: false, message: "Please provide a preference or setting content to save." };
        }
        const saved = await AIMemoryService.addMemory(userId, {
          category: category as any,
          content: memoryContent,
        });
        return {
          success: true,
          message: `Saved your preference to AI Memory: "${saved?.content || memoryContent}" 🧠✨`,
          memoryId: saved?.id,
        };
      }

      case "delete_user_memory": {
        const { memoryId, contentQuery } = args;
        if (memoryId) {
          await AIMemoryService.deleteMemory(userId, memoryId);
          return { success: true, message: `Deleted memory item. 🗑️🧠` };
        }
        const memories = await AIMemoryService.getUserMemories(userId);
        if (contentQuery) {
          const matched = memories.find((m: any) => m.content.toLowerCase().includes(contentQuery.toLowerCase()));
          if (matched) {
            await AIMemoryService.deleteMemory(userId, matched.id);
            return { success: true, message: `Deleted memory item: "${matched.content}" 🗑️🧠` };
          }
        }
        return { success: false, message: "Could not find a matching memory item to delete." };
      }

      case "toggle_dynamic_nutrition": {
        const enabled = args.enabled !== undefined ? Boolean(args.enabled) : true;
        const res = await DynamicNutritionService.setDynamicNutritionEnabled(userId, enabled);
        const opt = await DynamicNutritionService.calculateDynamicOptimization(userId);
        return {
          success: true,
          isDynamicNutritionEnabled: res,
          message: res
            ? `⚡ Dynamic Nutrition is now ENABLED! Today's targets are automatically optimized based on yesterday's activity, workouts, and intake.`
            : `Dynamic Nutrition is now DISABLED. Targets are set to your static profile baseline.`,
          dynamicPlan: opt,
        };
      }

      case "get_yesterdays_data_and_dynamic_targets": {
        const opt = await DynamicNutritionService.calculateDynamicOptimization(userId, args.date);
        return {
          success: true,
          date: opt.date,
          yesterdayDate: opt.yesterdayDate,
          isDynamicEnabled: opt.isDynamicEnabled,
          baselineTargets: opt.baseline,
          optimizedTargets: opt.optimized,
          adjustments: opt.adjustments,
          aiCoachingInsight: opt.aiCoachingInsight,
          yesterdaysSummary: opt.yesterdaysSummary,
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
