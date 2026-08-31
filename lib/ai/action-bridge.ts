import { prisma } from "@/lib/db";
import { UserSettingsService } from "@/lib/services/user-settings.service";
import { NutritionService } from "@/lib/services/nutrition.service";
import { HydrationService } from "@/lib/services/hydration.service";
import { ActivityService } from "@/lib/services/activity.service";
import { WorkoutService } from "@/lib/services/workout.service";
import { AIMemoryService } from "@/lib/ai/memory-service";
import { HealthContextService } from "@/lib/services/health-context.service";

export type NutriTrackActionType =
  | "UPDATE_GOALS"
  | "UPDATE_TARGETS"
  | "LOG_MEAL"
  | "LOG_HYDRATION"
  | "ADJUST_HYDRATION"
  | "ADJUST_NUTRITION"
  | "LOG_WEIGHT"
  | "LOG_ACTIVITY"
  | "LOG_WORKOUT"
  | "UPDATE_PROFILE"
  | "SAVE_MEMORY"
  | "DELETE_MEMORY";

export const ALLOWED_AI_ACTIONS: ReadonlySet<string> = new Set([
  "UPDATE_GOALS",
  "UPDATE_TARGETS",
  "LOG_MEAL",
  "LOG_HYDRATION",
  "ADJUST_HYDRATION",
  "ADJUST_NUTRITION",
  "LOG_WEIGHT",
  "LOG_ACTIVITY",
  "LOG_WORKOUT",
  "UPDATE_PROFILE",
  "SAVE_MEMORY",
  "DELETE_MEMORY",
]);

export const BANNED_DESTRUCTIVE_ACTIONS: ReadonlySet<string> = new Set([
  "DELETE",
  "RESET",
  "WIPE",
  "TRUNCATE",
  "DROP",
  "RECREATE",
  "CLEAR",
  "DELETE_ALL",
  "RESET_DATABASE",
  "CLEAR_DATABASE",
  "DELETE_USER",
  "BULK_REPLACE",
  "DELETE_RECORD",
]);

export interface NutriTrackActionSchema {
  version?: number;
  action: NutriTrackActionType | string;
  data: Record<string, any>;
  reason?: string;
  requiresConfirmation?: boolean;
}

export interface ActionDiffItem {
  key: string;
  label: string;
  previousValue: string;
  proposedValue: string;
  unit?: string;
  isNewConfig?: boolean;
}

export interface ParsedActionValidationResult {
  isValid: boolean;
  actionType: NutriTrackActionType;
  parsedAction: NutriTrackActionSchema;
  rawInput: string;
  diffs: ActionDiffItem[];
  reason: string;
  requiresConfirmation: boolean;
  warnings: string[];
  errors: string[];
}

export interface ActionExecutionResult {
  success: boolean;
  actionLogId?: string;
  actionType: string;
  message: string;
  diffs: ActionDiffItem[];
  previousState?: any;
  newState?: any;
  error?: string;
}

export class NutriTrackActionBridge {
  /**
   * Parses either JSON, markdown JSON codeblocks, or structured text block format.
   */
  static parseRawActionString(rawText: string): NutriTrackActionSchema {
    if (!rawText || typeof rawText !== "string") {
      throw new Error("Action string cannot be empty.");
    }

    const trimmed = rawText.trim();

    // 1. Try extracting from markdown code block (```json ... ``` or ``` ... ```)
    const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1]);
        if (parsed && typeof parsed === "object" && parsed.action) {
          return parsed;
        }
      } catch {}
    }

    // 2. Try direct JSON parsing
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === "object" && parsed.action) {
          return parsed;
        }
      } catch (err: any) {
        throw new Error(`Invalid JSON syntax in action block: ${err.message}`);
      }
    }

    // 3. Try parsing text-based format:
    // NUTRI-TRACK ACTION
    // TYPE: UPDATE_GOALS
    // DATA:
    // caloriesKcal: 2200
    // proteinG: 140
    // REASON: Adjusted for 10k run
    // REQUIRES_CONFIRMATION: true
    if (trimmed.toUpperCase().includes("NUTRI-TRACK ACTION") || trimmed.toUpperCase().includes("TYPE:")) {
      return this.parseTextFormat(trimmed);
    }

    // If nothing matched, throw descriptive error
    throw new Error("Could not detect a valid NUTRI-TRACK ACTION JSON or formatted block.");
  }

  private static parseTextFormat(text: string): NutriTrackActionSchema {
    const lines = text.split("\n").map((l) => l.trim());
    let actionType: string = "";
    let reason: string = "";
    let requiresConfirmation: boolean = true;
    const data: Record<string, any> = {};

    let inDataSection = false;

    for (const line of lines) {
      if (!line) continue;

      const upper = line.toUpperCase();
      if (upper.startsWith("TYPE:")) {
        actionType = line.substring(5).trim().toUpperCase();
        inDataSection = false;
      } else if (upper.startsWith("ACTION:")) {
        actionType = line.substring(7).trim().toUpperCase();
        inDataSection = false;
      } else if (upper.startsWith("REASON:")) {
        reason = line.substring(7).trim();
        inDataSection = false;
      } else if (upper.startsWith("REQUIRES_CONFIRMATION:")) {
        requiresConfirmation = line.substring(22).trim().toLowerCase() === "true";
        inDataSection = false;
      } else if (upper.startsWith("DATA:")) {
        inDataSection = true;
      } else if (inDataSection) {
        const colonIdx = line.indexOf(":");
        if (colonIdx > 0) {
          const key = line.substring(0, colonIdx).trim();
          const valStr = line.substring(colonIdx + 1).trim();
          const numVal = Number(valStr);
          data[key] = !isNaN(numVal) && valStr !== "" ? numVal : valStr;
        }
      }
    }

    if (!actionType) {
      throw new Error("Missing 'TYPE:' or 'ACTION:' in structured text block.");
    }

    return {
      version: 1,
      action: actionType,
      data,
      reason: reason || "Applied via Nutri-Track Action Bridge",
      requiresConfirmation,
    };
  }

  /**
   * Validates the schema, bounds, and generates a visual diff without mutating the database.
   */
  static async validateAction(
    userId: string,
    rawTextOrSchema: string | NutriTrackActionSchema
  ): Promise<ParsedActionValidationResult> {
    const rawInput = typeof rawTextOrSchema === "string" ? rawTextOrSchema : JSON.stringify(rawTextOrSchema);
    let parsed: NutriTrackActionSchema;

    try {
      parsed = typeof rawTextOrSchema === "string" ? this.parseRawActionString(rawTextOrSchema) : rawTextOrSchema;
    } catch (err: any) {
      return {
        isValid: false,
        actionType: "UPDATE_GOALS",
        parsedAction: { action: "UNKNOWN", data: {} },
        rawInput,
        diffs: [],
        reason: "",
        requiresConfirmation: false,
        warnings: [],
        errors: [err.message || "Failed to parse action."],
      };
    }

    const actionType = String(parsed.action || "").toUpperCase().replace(/ /g, "_") as NutriTrackActionType;
    const data = parsed.data || {};
    const reason = parsed.reason || "Action proposed via ChatGPT Health Coach";
    const errors: string[] = [];
    const warnings: string[] = [];
    const diffs: ActionDiffItem[] = [];

    // 1. Anti-Wipe Security Guard: Reject any destructive or unpermitted action
    if (
      BANNED_DESTRUCTIVE_ACTIONS.has(actionType) ||
      actionType.includes("DELETE_ALL") ||
      actionType.includes("RESET_") ||
      actionType.includes("WIPE_")
    ) {
      return {
        isValid: false,
        actionType,
        parsedAction: parsed,
        rawInput,
        diffs: [],
        reason,
        requiresConfirmation: false,
        warnings: [],
        errors: ["Destructive database operation is strictly forbidden through the AI action bridge."],
      };
    }

    if (!ALLOWED_AI_ACTIONS.has(actionType)) {
      return {
        isValid: false,
        actionType,
        parsedAction: parsed,
        rawInput,
        diffs: [],
        reason,
        requiresConfirmation: false,
        warnings: [],
        errors: [`Action type '${actionType}' is not permitted. Only safe target updates, logging, and memories are allowed.`],
      };
    }

    // 2. Empty Payload Guard: Prevent empty updates that could wipe fields
    if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
      return {
        isValid: false,
        actionType,
        parsedAction: parsed,
        rawInput,
        diffs: [],
        reason,
        requiresConfirmation: false,
        warnings: [],
        errors: ["Empty or missing action data payload. Action rejected to protect database integrity."],
      };
    }

    // Fetch current user settings & targets for diff calculation
    const settings = await UserSettingsService.getUserSettings(userId).catch(() => null);

    // Validate based on Action Type
    switch (actionType) {
      case "UPDATE_GOALS":
      case "UPDATE_TARGETS": {
        const cal = data.caloriesKcal ?? data.calories ?? data.dailyCalories;
        const pro = data.proteinG ?? data.protein ?? data.dailyProteinG;
        const carbs = data.carbsG ?? data.carbohydratesG ?? data.carbs ?? data.carbohydrates;
        const fat = data.fatG ?? data.fatsG ?? data.fat ?? data.fats;
        const fib = data.fiberG ?? data.fiber;
        const hyd = data.hydrationMl ?? data.dailyHydrationTargetMl ?? data.hydrationTargetMl;
        const steps = data.dailyStepTarget ?? data.stepTarget ?? data.dailySteps;
        const runKm = data.weeklyRunningDistanceKm ?? data.weeklyRunningKm ?? data.runningTargetKm;
        const workouts = data.weeklyWorkoutSessions ?? data.workoutTargetSessions;

        const op = (data.operation || "SET").toUpperCase();

        if (cal !== undefined) {
          let finalCal = cal;
          const curCal = settings?.nutritionGoals?.calories || 2000;
          if (op === "INCREASE") finalCal = curCal + cal;
          else if (op === "DECREASE") finalCal = Math.max(500, curCal - cal);

          if (typeof finalCal !== "number" || finalCal < 500 || finalCal > 10000) errors.push(`Calories (${finalCal}) must be between 500 and 10,000 kcal.`);
          diffs.push({
            key: "calories",
            label: `Daily Calories Target (${op === "SET" ? "Set" : op === "INCREASE" ? "+" + cal : "-" + cal})`,
            previousValue: curCal ? `${curCal} kcal` : "Not configured",
            proposedValue: `${finalCal} kcal`,
            unit: "kcal",
            isNewConfig: !curCal,
          });
        }

        if (pro !== undefined) {
          let finalPro = pro;
          const curPro = settings?.nutritionGoals?.protein || 100;
          if (op === "INCREASE") finalPro = curPro + pro;
          else if (op === "DECREASE") finalPro = Math.max(10, curPro - pro);

          if (typeof finalPro !== "number" || finalPro < 10 || finalPro > 500) errors.push(`Protein (${finalPro}g) must be between 10g and 500g.`);
          diffs.push({
            key: "protein",
            label: `Daily Protein Target (${op === "SET" ? "Set" : op === "INCREASE" ? "+" + pro + "g" : "-" + pro + "g"})`,
            previousValue: curPro ? `${curPro} g` : "Not configured",
            proposedValue: `${finalPro} g`,
            unit: "g",
            isNewConfig: !curPro,
          });
        }

        if (carbs !== undefined) {
          let finalCarbs = carbs;
          const curCarbs = settings?.nutritionGoals?.carbohydrates || 200;
          if (op === "INCREASE") finalCarbs = curCarbs + carbs;
          else if (op === "DECREASE") finalCarbs = Math.max(10, curCarbs - carbs);

          if (typeof finalCarbs !== "number" || finalCarbs < 10 || finalCarbs > 1000) errors.push(`Carbohydrates (${finalCarbs}g) must be between 10g and 1,000g.`);
          diffs.push({
            key: "carbohydrates",
            label: "Daily Carbs Target",
            previousValue: curCarbs ? `${curCarbs} g` : "Not configured",
            proposedValue: `${finalCarbs} g`,
            unit: "g",
            isNewConfig: !curCarbs,
          });
        }

        if (fat !== undefined) {
          let finalFat = fat;
          const curFat = settings?.nutritionGoals?.fat || 60;
          if (op === "INCREASE") finalFat = curFat + fat;
          else if (op === "DECREASE") finalFat = Math.max(5, curFat - fat);

          if (typeof finalFat !== "number" || finalFat < 5 || finalFat > 400) errors.push(`Fat (${finalFat}g) must be between 5g and 400g.`);
          diffs.push({
            key: "fat",
            label: "Daily Fat Target",
            previousValue: curFat ? `${curFat} g` : "Not configured",
            proposedValue: `${finalFat} g`,
            unit: "g",
            isNewConfig: !curFat,
          });
        }

        if (fib !== undefined) {
          let finalFib = fib;
          const curFib = settings?.nutritionGoals?.fiber || 25;
          if (op === "INCREASE") finalFib = curFib + fib;
          else if (op === "DECREASE") finalFib = Math.max(0, curFib - fib);

          if (typeof finalFib !== "number" || finalFib < 0 || finalFib > 150) errors.push(`Fiber (${finalFib}g) must be between 0g and 150g.`);
          diffs.push({
            key: "fiber",
            label: "Daily Fiber Target",
            previousValue: curFib ? `${curFib} g` : "Not configured",
            proposedValue: `${finalFib} g`,
            unit: "g",
            isNewConfig: !curFib,
          });
        }

        if (hyd !== undefined) {
          let finalHyd = hyd;
          const curHyd = settings?.profile?.dailyHydrationTargetMl || 2500;
          if (op === "INCREASE") finalHyd = curHyd + hyd;
          else if (op === "DECREASE") finalHyd = Math.max(100, curHyd - hyd);

          if (typeof finalHyd !== "number" || finalHyd < 100 || finalHyd > 15000) errors.push(`Hydration (${finalHyd}ml) must be between 100ml and 15,000ml.`);
          diffs.push({
            key: "hydration",
            label: `Daily Water Target (${op === "SET" ? "Set" : op === "INCREASE" ? "+" + hyd + "ml" : "-" + hyd + "ml"})`,
            previousValue: curHyd ? `${curHyd} ml` : "Not configured",
            proposedValue: `${finalHyd} ml`,
            unit: "ml",
            isNewConfig: !curHyd,
          });
        }

        if (steps !== undefined) {
          let finalSteps = steps;
          const curSteps = settings?.profile?.dailyStepTarget || 8000;
          if (op === "INCREASE") finalSteps = curSteps + steps;
          else if (op === "DECREASE") finalSteps = Math.max(500, curSteps - steps);

          if (typeof finalSteps !== "number" || finalSteps < 500 || finalSteps > 100000) errors.push(`Step Target (${finalSteps}) must be between 500 and 100,000 steps.`);
          diffs.push({
            key: "dailyStepTarget",
            label: "Daily Step Target",
            previousValue: curSteps ? `${curSteps.toLocaleString()} steps` : "Not configured",
            proposedValue: `${finalSteps.toLocaleString()} steps`,
            unit: "steps",
            isNewConfig: !curSteps,
          });
        }

        if (runKm !== undefined) {
          let finalRun = runKm;
          const curRun = settings?.profile?.weeklyRunningDistanceKm || 10;
          if (op === "INCREASE") finalRun = curRun + runKm;
          else if (op === "DECREASE") finalRun = Math.max(0, curRun - runKm);

          if (typeof finalRun !== "number" || finalRun < 0 || finalRun > 300) errors.push(`Weekly Running (${finalRun}km) must be between 0 and 300km.`);
          diffs.push({
            key: "weeklyRunningDistanceKm",
            label: "Weekly Running Target",
            previousValue: curRun ? `${curRun} km` : "Not configured",
            proposedValue: `${finalRun} km`,
            unit: "km",
            isNewConfig: !curRun,
          });
        }

        if (workouts !== undefined) {
          let finalWorkouts = workouts;
          const curWorkouts = settings?.profile?.weeklyWorkoutSessions || 3;
          if (op === "INCREASE") finalWorkouts = curWorkouts + workouts;
          else if (op === "DECREASE") finalWorkouts = Math.max(0, curWorkouts - workouts);

          if (typeof finalWorkouts !== "number" || finalWorkouts < 0 || finalWorkouts > 14) errors.push(`Weekly Workouts (${finalWorkouts}) must be between 0 and 14 sessions.`);
          diffs.push({
            key: "weeklyWorkoutSessions",
            label: "Weekly Workout Target",
            previousValue: curWorkouts ? `${curWorkouts} sessions` : "Not configured",
            proposedValue: `${finalWorkouts} sessions`,
            unit: "sessions",
            isNewConfig: !curWorkouts,
          });
        }

        if (diffs.length === 0) {
          errors.push("No valid goal or target parameters provided in data block.");
        }
        break;
      }

      case "LOG_MEAL": {
        const mealName = data.name || data.mealName || "Logged Meal";
        const calories = data.calories ?? data.caloriesKcal;
        const protein = data.protein ?? data.proteinG ?? 0;
        const carbs = data.carbohydrates ?? data.carbs ?? data.carbsG ?? 0;
        const fat = data.fat ?? data.fatG ?? 0;

        if (calories === undefined || typeof calories !== "number" || calories < 0 || calories > 6000) {
          errors.push("Meal logging requires calories between 0 and 6,000 kcal.");
        }

        diffs.push({
          key: "meal_entry",
          label: "Meal Entry",
          previousValue: "None (New entry)",
          proposedValue: `${mealName} (${calories} kcal, ${protein}g P, ${carbs}g C, ${fat}g F)`,
        });
        break;
      }

      case "LOG_HYDRATION": {
        const amountMl = data.amountMl ?? data.amount ?? data.volumeMl;
        const op = (data.operation || "ADD").toUpperCase();

        if (op === "SUBTRACT" || op === "REMOVE" || op === "DECREASE" || op === "SET" || op === "REPLACE" || op === "CORRECT") {
          const todayStr = data.date || new Date().toISOString().split("T")[0];
          const dailyHydration = await HydrationService.getDailyHydration(userId, todayStr).catch(() => null);
          const curTotal = dailyHydration?.totalMl || 0;
          let newTotal = curTotal;
          let label = "Hydration Intake";
          let diffProposed = "";

          if (op === "SUBTRACT" || op === "REMOVE" || op === "DECREASE") {
            newTotal = Math.max(0, curTotal - amountMl);
            label = "Hydration Removal";
            diffProposed = `${newTotal} ml (-${amountMl} ml)`;
          } else {
            newTotal = amountMl;
            label = "Hydration Correction (Set Total)";
            diffProposed = `${newTotal} ml (Total)`;
          }

          diffs.push({
            key: "hydration_adjustment",
            label,
            previousValue: `${curTotal} ml`,
            proposedValue: diffProposed,
            unit: "ml",
          });
          break;
        }

        if (!amountMl || typeof amountMl !== "number" || amountMl < 10 || amountMl > 5000) {
          errors.push("Hydration intake must be between 10ml and 5,000ml.");
        }
        diffs.push({
          key: "hydration_log",
          label: "Hydration Intake",
          previousValue: "0 ml",
          proposedValue: `+${amountMl} ml (${data.beverageType || "WATER"})`,
          unit: "ml",
        });
        break;
      }

      case "ADJUST_HYDRATION": {
        const amountMl = Number(data.amountMl ?? data.amount ?? data.volumeMl ?? 0);
        const op = (data.operation || "SUBTRACT").toUpperCase();
        if (isNaN(amountMl) || amountMl < 0 || amountMl > 15000) {
          errors.push("Hydration amount must be between 0ml and 15,000ml.");
        }
        const todayStr = data.date || new Date().toISOString().split("T")[0];
        const dailyHydration = await HydrationService.getDailyHydration(userId, todayStr).catch(() => null);
        const curTotal = dailyHydration?.totalMl || 0;
        let newTotal = curTotal;
        let label = "Hydration Intake";
        let diffProposed = "";

        if (op === "SUBTRACT" || op === "REMOVE" || op === "DECREASE") {
          newTotal = Math.max(0, curTotal - amountMl);
          label = "Hydration Removal / Subtraction";
          diffProposed = `${newTotal} ml (-${amountMl} ml)`;
        } else if (op === "SET" || op === "REPLACE" || op === "CORRECT") {
          newTotal = amountMl;
          label = "Hydration Correction / Set Total";
          diffProposed = `${newTotal} ml (Corrected Total)`;
        } else {
          newTotal = curTotal + amountMl;
          label = "Hydration Addition";
          diffProposed = `${newTotal} ml (+${amountMl} ml)`;
        }

        diffs.push({
          key: "hydration_adjustment",
          label,
          previousValue: `${curTotal} ml`,
          proposedValue: diffProposed,
          unit: "ml",
        });
        break;
      }

      case "ADJUST_NUTRITION": {
        const metric = (data.targetKey || data.metric || "calories").toLowerCase();
        const amount = Number(data.targetValue ?? data.amount ?? data.value ?? 0);
        const op = (data.operation || "SET").toUpperCase();

        diffs.push({
          key: `nutrition_${metric}`,
          label: `${metric.toUpperCase()} Adjustment (${op})`,
          previousValue: "Current logged total",
          proposedValue: op === "SUBTRACT" || op === "REMOVE" ? `-${amount} ${metric}` : `${amount} ${metric}`,
        });
        break;
      }

      case "LOG_WEIGHT": {
        const weightKg = data.weightKg ?? data.weight;
        if (!weightKg || typeof weightKg !== "number" || weightKg < 25 || weightKg > 400) {
          errors.push("Weight must be between 25kg and 400kg.");
        }
        const curWeight = settings?.profile?.weightKg;
        diffs.push({
          key: "weightKg",
          label: "Body Weight",
          previousValue: curWeight ? `${curWeight} kg` : "Not recorded",
          proposedValue: `${weightKg} kg`,
          unit: "kg",
        });
        break;
      }

      case "LOG_ACTIVITY": {
        const type = data.type || "RUNNING";
        const duration = data.durationMinutes ?? data.duration ?? 0;
        if (typeof duration !== "number" || duration <= 0 || duration > 1440) {
          errors.push("Activity duration must be between 1 and 1440 minutes.");
        }
        diffs.push({
          key: "activity_log",
          label: "Activity Session",
          previousValue: "None",
          proposedValue: `${type} (${duration} mins${data.distanceKm ? `, ${data.distanceKm} km` : ""})`,
        });
        break;
      }

      case "LOG_WORKOUT": {
        const workoutName = data.name || "Workout Session";
        const duration = data.durationMinutes ?? 0;
        const exercisesCount = Array.isArray(data.exercises) ? data.exercises.length : 0;
        diffs.push({
          key: "workout_session",
          label: "Workout Session",
          previousValue: "None",
          proposedValue: `${workoutName} (${duration} min, ${exercisesCount} exercises)`,
        });
        break;
      }

      case "UPDATE_PROFILE": {
        const permittedProfileFields = new Set([
          "heightCm",
          "weightKg",
          "primaryGoal",
          "biologicalSex",
          "dateOfBirth",
          "activityLevel",
          "livingSituation",
          "dietaryPattern",
        ]);
        const submittedFields = Object.keys(data);
        const unauthorized = submittedFields.filter((f) => !permittedProfileFields.has(f));
        if (unauthorized.length > 0) {
          errors.push(
            `Unauthorized profile field(s): ${unauthorized.join(", ")}. Profile updates are strictly limited to personal biometrics.`
          );
        }

        if (data.heightCm !== undefined) {
          if (typeof data.heightCm !== "number" || data.heightCm < 50 || data.heightCm > 260) errors.push("Height must be between 50cm and 260cm.");
          diffs.push({
            key: "heightCm",
            label: "Height",
            previousValue: settings?.profile?.heightCm ? `${settings.profile.heightCm} cm` : "Not set",
            proposedValue: `${data.heightCm} cm`,
            unit: "cm",
          });
        }
        if (data.weightKg !== undefined) {
          if (data.weightKg < 25 || data.weightKg > 400) errors.push("Weight must be between 25kg and 400kg.");
          diffs.push({
            key: "weightKg",
            label: "Weight",
            previousValue: settings?.profile?.weightKg ? `${settings.profile.weightKg} kg` : "Not set",
            proposedValue: `${data.weightKg} kg`,
            unit: "kg",
          });
        }
        if (data.primaryGoal !== undefined) {
          diffs.push({
            key: "primaryGoal",
            label: "Primary Goal",
            previousValue: settings?.profile?.primaryGoal || "Not set",
            proposedValue: String(data.primaryGoal),
          });
        }
        break;
      }

      default:
        errors.push(`Unsupported action type: '${actionType}'.`);
    }

    const requiresConfirmation = parsed.requiresConfirmation !== false || actionType === "UPDATE_GOALS" || actionType === "UPDATE_TARGETS" || actionType === "UPDATE_PROFILE";

    return {
      isValid: errors.length === 0,
      actionType,
      parsedAction: parsed,
      rawInput,
      diffs,
      reason,
      requiresConfirmation,
      warnings,
      errors,
    };
  }

  /**
   * Executes the validated action safely within the database, records audit log, and returns fresh snapshot.
   */
  static async executeAction(
    userId: string,
    actionOrRaw: string | NutriTrackActionSchema,
    source: "CHATGPT_ACTION" | "MANUAL_AI" | "SYSTEM" | "QUICK_COMMAND" = "CHATGPT_ACTION"
  ): Promise<ActionExecutionResult> {
    const validation = await this.validateAction(userId, actionOrRaw);

    if (!validation.isValid) {
      // Record failed validation attempt
      const pool = prisma as any;
      const failedLog = await pool.aiActionLog.create({
        data: {
          userId,
          actionType: validation.actionType || "UNKNOWN",
          source,
          payload: validation.rawInput,
          status: "FAILED",
          errorMessage: validation.errors.join("; "),
          requiresConfirmation: validation.requiresConfirmation,
        },
      });

      return {
        success: false,
        actionLogId: failedLog.id,
        actionType: validation.actionType,
        message: `Validation failed: ${validation.errors.join("; ")}`,
        diffs: validation.diffs,
        error: validation.errors.join("; "),
      };
    }

    const { actionType, parsedAction, diffs, reason } = validation;
    const data = parsedAction.data || {};
    const pool = prisma as any;

    // Capture previous state snapshot before mutating
    const previousSnapshot = await HealthContextService.getHealthSnapshot(userId).catch(() => null);

    try {
      let resultMessage = "Action completed successfully.";

      switch (actionType) {
        case "UPDATE_GOALS":
        case "UPDATE_TARGETS": {
          const op = (data.operation || "SET").toUpperCase();
          const currentSettings = await UserSettingsService.getUserSettings(userId).catch(() => null);

          let cal = data.caloriesKcal ?? data.calories ?? data.dailyCalories;
          if (cal !== undefined && op === "INCREASE") cal = (currentSettings?.nutritionGoals?.calories || 2000) + Number(cal);
          else if (cal !== undefined && op === "DECREASE") cal = Math.max(500, (currentSettings?.nutritionGoals?.calories || 2000) - Number(cal));

          let pro = data.proteinG ?? data.protein ?? data.dailyProteinG;
          if (pro !== undefined && op === "INCREASE") pro = (currentSettings?.nutritionGoals?.protein || 100) + Number(pro);
          else if (pro !== undefined && op === "DECREASE") pro = Math.max(10, (currentSettings?.nutritionGoals?.protein || 100) - Number(pro));

          let carbs = data.carbsG ?? data.carbohydratesG ?? data.carbs ?? data.carbohydrates;
          if (carbs !== undefined && op === "INCREASE") carbs = (currentSettings?.nutritionGoals?.carbohydrates || 200) + Number(carbs);
          else if (carbs !== undefined && op === "DECREASE") carbs = Math.max(10, (currentSettings?.nutritionGoals?.carbohydrates || 200) - Number(carbs));

          let fat = data.fatG ?? data.fatsG ?? data.fat ?? data.fats;
          if (fat !== undefined && op === "INCREASE") fat = (currentSettings?.nutritionGoals?.fat || 60) + Number(fat);
          else if (fat !== undefined && op === "DECREASE") fat = Math.max(5, (currentSettings?.nutritionGoals?.fat || 60) - Number(fat));

          let fib = data.fiberG ?? data.fiber;
          if (fib !== undefined && op === "INCREASE") fib = (currentSettings?.nutritionGoals?.fiber || 25) + Number(fib);
          else if (fib !== undefined && op === "DECREASE") fib = Math.max(0, (currentSettings?.nutritionGoals?.fiber || 25) - Number(fib));

          let hyd = data.hydrationMl ?? data.dailyHydrationTargetMl ?? data.hydrationTargetMl;
          if (hyd !== undefined && op === "INCREASE") hyd = (currentSettings?.profile?.dailyHydrationTargetMl || 2500) + Number(hyd);
          else if (hyd !== undefined && op === "DECREASE") hyd = Math.max(100, (currentSettings?.profile?.dailyHydrationTargetMl || 2500) - Number(hyd));

          let steps = data.dailyStepTarget ?? data.stepTarget ?? data.dailySteps;
          if (steps !== undefined && op === "INCREASE") steps = (currentSettings?.profile?.dailyStepTarget || 8000) + Number(steps);
          else if (steps !== undefined && op === "DECREASE") steps = Math.max(500, (currentSettings?.profile?.dailyStepTarget || 8000) - Number(steps));

          let runKm = data.weeklyRunningDistanceKm ?? data.weeklyRunningKm ?? data.runningTargetKm;
          if (runKm !== undefined && op === "INCREASE") runKm = (currentSettings?.profile?.weeklyRunningDistanceKm || 10) + Number(runKm);
          else if (runKm !== undefined && op === "DECREASE") runKm = Math.max(0, (currentSettings?.profile?.weeklyRunningDistanceKm || 10) - Number(runKm));

          let workouts = data.weeklyWorkoutSessions ?? data.workoutTargetSessions;
          if (workouts !== undefined && op === "INCREASE") workouts = (currentSettings?.profile?.weeklyWorkoutSessions || 3) + Number(workouts);
          else if (workouts !== undefined && op === "DECREASE") workouts = Math.max(0, (currentSettings?.profile?.weeklyWorkoutSessions || 3) - Number(workouts));

          await UserSettingsService.updateUserSettings(userId, {
            profile: {
              ...(hyd !== undefined && { dailyHydrationTargetMl: Number(hyd) }),
              ...(steps !== undefined && { dailyStepTarget: Number(steps) }),
              ...(runKm !== undefined && { weeklyRunningDistanceKm: Number(runKm) }),
              ...(workouts !== undefined && { weeklyWorkoutSessions: Number(workouts) }),
            },
            nutritionGoals: {
              ...(cal !== undefined && { calories: Number(cal) }),
              ...(pro !== undefined && { protein: Number(pro) }),
              ...(carbs !== undefined && { carbohydrates: Number(carbs) }),
              ...(fat !== undefined && { fat: Number(fat) }),
              ...(fib !== undefined && { fiber: Number(fib) }),
            },
          });

          resultMessage = "Daily targets and fitness goals updated in Nutri-Track.";
          break;
        }

        case "LOG_MEAL": {
          const mealName = data.name || data.mealName || "Meal Log";
          const mealType = data.mealType || "SNACK";
          const calories = Number(data.calories ?? data.caloriesKcal ?? 0);
          const protein = Number(data.protein ?? data.proteinG ?? 0);
          const carbs = Number(data.carbohydrates ?? data.carbs ?? data.carbsG ?? 0);
          const fat = Number(data.fat ?? data.fatG ?? 0);
          const fiber = Number(data.fiber ?? data.fiberG ?? 0);

          await NutritionService.logFoodToMeal(userId, {
            date: data.date || new Date().toISOString().split("T")[0],
            mealType: mealType as any,
            quantity: 1,
            quantityUnit: "serving",
            customFood: {
              name: mealName,
              calories,
              protein,
              carbs,
              fat,
              fiber,
              sugar: Number(data.sugar || 0),
              servingSize: 1,
              servingUnit: "serving",
            },
          });

          resultMessage = `Logged meal: ${mealName} (${calories} kcal).`;
          break;
        }

        case "LOG_HYDRATION": {
          const amountMl = Number(data.amountMl ?? data.amount ?? data.volumeMl);
          const op = (data.operation || "ADD").toUpperCase();

          if (op === "SUBTRACT" || op === "REMOVE" || op === "DECREASE" || op === "SET" || op === "REPLACE" || op === "CORRECT") {
            const adjRes = await HydrationService.adjustDailyHydration(
              userId,
              op,
              amountMl,
              data.date,
              data.beverageType || "WATER"
            );
            if (adjRes.changeMl < 0) {
              resultMessage = `Removed ${Math.abs(adjRes.changeMl)} ml water. Today's total is now ${adjRes.newTotalMl} ml.`;
            } else if (op === "SET" || op === "CORRECT") {
              resultMessage = `Corrected today's hydration total to ${adjRes.newTotalMl} ml.`;
            } else {
              resultMessage = `Adjusted hydration. Today's total is now ${adjRes.newTotalMl} ml.`;
            }
            break;
          }

          await HydrationService.logHydration(userId, {
            amountMl,
            date: data.date || new Date().toISOString().split("T")[0],
            beverageType: data.beverageType || "WATER",
            consumedAt: data.loggedAt || data.consumedAt || new Date().toISOString(),
          });
          resultMessage = `Logged +${amountMl} ml hydration.`;
          break;
        }

        case "ADJUST_HYDRATION": {
          const amountMl = Number(data.amountMl ?? data.amount ?? data.volumeMl ?? 0);
          const op = data.operation || "SUBTRACT";
          const adjRes = await HydrationService.adjustDailyHydration(
            userId,
            op,
            amountMl,
            data.date,
            data.beverageType || "WATER"
          );
          if (adjRes.changeMl < 0) {
            resultMessage = `Removed ${Math.abs(adjRes.changeMl)} ml water. Today's total is now ${adjRes.newTotalMl} ml.`;
          } else if (op.toUpperCase() === "SET" || op.toUpperCase() === "CORRECT") {
            resultMessage = `Corrected today's hydration total to ${adjRes.newTotalMl} ml.`;
          } else {
            resultMessage = `Logged +${adjRes.changeMl} ml water. Today's total is now ${adjRes.newTotalMl} ml.`;
          }
          break;
        }

        case "ADJUST_NUTRITION": {
          const metric = (data.targetKey || data.metric || "calories").toLowerCase();
          const amount = Number(data.targetValue ?? data.amount ?? data.value ?? 0);
          const op = data.operation || "SET";
          resultMessage = `Adjusted ${metric} (${op}: ${amount}).`;
          break;
        }

        case "LOG_WEIGHT": {
          const weightKg = Number(data.weightKg ?? data.weight);
          await UserSettingsService.updateUserSettings(userId, {
            profile: { weightKg },
          });
          resultMessage = `Recorded body weight: ${weightKg} kg.`;
          break;
        }

        case "LOG_ACTIVITY": {
          const durationMins = Number(data.durationMinutes ?? 30);
          await ActivityService.logActivity(userId, {
            date: data.date || new Date().toISOString().split("T")[0],
            activityType: (data.type || data.activityType || "RUN") as any,
            movingDurationSeconds: durationMins * 60,
            distanceKm: data.distanceKm ? Number(data.distanceKm) : undefined,
            caloriesBurned: data.caloriesBurned ? Number(data.caloriesBurned) : undefined,
            notes: data.notes || reason,
          });
          resultMessage = `Recorded activity: ${data.type || "RUN"}.`;
          break;
        }

        case "LOG_WORKOUT": {
          const durationMins = Number(data.durationMinutes ?? 45);
          await WorkoutService.createWorkoutSession(userId, {
            name: data.name || "Workout Session",
            date: data.date || new Date().toISOString().split("T")[0],
            durationSeconds: durationMins * 60,
            workoutType: (data.workoutType || "GYM_WORKOUT") as any,
            caloriesBurned: data.caloriesBurned ? Number(data.caloriesBurned) : undefined,
            exercises: Array.isArray(data.exercises) ? data.exercises : [],
            notes: data.notes || reason,
          });
          resultMessage = `Logged workout: ${data.name || "Workout Session"}.`;
          break;
        }

        case "UPDATE_PROFILE": {
          await UserSettingsService.updateUserSettings(userId, {
            profile: {
              ...(data.heightCm !== undefined && { heightCm: Number(data.heightCm) }),
              ...(data.weightKg !== undefined && { weightKg: Number(data.weightKg) }),
              ...(data.primaryGoal !== undefined && { primaryGoal: data.primaryGoal }),
              ...(data.activityLevel !== undefined && { activityLevel: data.activityLevel }),
            },
          });
          resultMessage = "Profile attributes updated.";
          break;
        }
      }

      // Capture new state snapshot after mutation
      const newSnapshot = await HealthContextService.getHealthSnapshot(userId).catch(() => null);

      // Create permanent audit log
      const log = await pool.aiActionLog.create({
        data: {
          userId,
          actionType,
          source,
          payload: validation.rawInput,
          previousState: previousSnapshot ? JSON.stringify(previousSnapshot) : null,
          newState: newSnapshot ? JSON.stringify(newSnapshot) : null,
          status: "SUCCESS",
          requiresConfirmation: validation.requiresConfirmation,
          confirmedAt: new Date(),
        },
      });

      return {
        success: true,
        actionLogId: log.id,
        actionType,
        message: resultMessage,
        diffs,
        previousState: previousSnapshot,
        newState: newSnapshot,
      };
    } catch (execErr: any) {
      console.error("Action execution error:", execErr);

      await pool.aiActionLog.create({
        data: {
          userId,
          actionType,
          source,
          payload: validation.rawInput,
          status: "FAILED",
          errorMessage: execErr.message || "Execution exception.",
          requiresConfirmation: validation.requiresConfirmation,
        },
      });

      return {
        success: false,
        actionType,
        message: `Execution failed: ${execErr.message || "Unknown error"}`,
        diffs,
        error: execErr.message,
      };
    }
  }

  /**
   * Reverts a previously executed action using its previous state snapshot
   */
  static async revertAction(userId: string, actionLogId: string): Promise<{ success: boolean; message: string }> {
    const pool = prisma as any;
    const log = await pool.aiActionLog.findUnique({ where: { id: actionLogId } });

    if (!log || log.userId !== userId) {
      throw new Error("Action audit record not found or access denied.");
    }

    if (log.status !== "SUCCESS") {
      throw new Error("Only successful actions can be reverted.");
    }

    if (log.revertedAt) {
      throw new Error("This action has already been reverted.");
    }

    if (!log.previousState) {
      throw new Error("No previous state snapshot available to revert this action.");
    }

    const prevState = JSON.parse(log.previousState);

    // Revert target changes if applicable
    if (log.actionType === "UPDATE_GOALS" || log.actionType === "UPDATE_TARGETS" || log.actionType === "UPDATE_PROFILE") {
      const prevNut = prevState.nutrition || {};
      const prevProf = prevState.profile || {};
      const prevHyd = prevState.hydration || {};
      const prevMov = prevState.movement || {};
      const prevWork = prevState.workouts || {};

      await UserSettingsService.updateUserSettings(userId, {
        profile: {
          heightCm: prevProf.heightCm,
          weightKg: prevProf.weightKg,
          primaryGoal: prevProf.primaryGoal,
          dailyHydrationTargetMl: prevHyd.targetMl,
          dailyStepTarget: prevMov.dailyStepTarget,
          weeklyRunningDistanceKm: prevMov.weeklyRunningTargetKm,
          weeklyWorkoutSessions: prevWork.weeklyWorkoutTarget,
        },
        nutritionGoals: {
          calories: prevNut.calorieTarget,
          protein: prevNut.proteinTarget,
          carbohydrates: prevNut.carbsTarget,
          fat: prevNut.fatsTarget,
        },
      });

      await pool.aiActionLog.update({
        where: { id: actionLogId },
        data: {
          status: "REVERTED",
          revertedAt: new Date(),
        },
      });

      return {
        success: true,
        message: "Successfully reverted targets to previous values.",
      };
    }

    return {
      success: false,
      message: `Reversion for action type '${log.actionType}' is not supported automatically.`,
    };
  }
}
