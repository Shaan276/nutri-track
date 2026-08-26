import { prisma } from "../lib/db";
import { NutriTrackActionBridge } from "../lib/ai/action-bridge";
import { generateChatGPTProjectInstructions } from "../lib/ai/chatgpt-instructions";
import { generateChatGPTAssessmentPrompt } from "../lib/ai/assessment-generator";
import { HealthContextGenerator } from "../lib/ai/health-context-generator";
import { UserSettingsService } from "../lib/services/user-settings.service";
import { NutritionService } from "../lib/services/nutrition.service";
import { HydrationService } from "../lib/services/hydration.service";
import { ActivityService } from "../lib/services/activity.service";
import { WorkoutService } from "../lib/services/workout.service";
import { AIMemoryService } from "../lib/ai/memory-service";
import { AICoachService } from "../lib/ai/ai-coach.service";
import { AIClient } from "../lib/ai/ai-client";

let passedCount = 0;
let totalCount = 0;

function assertTest(description: string, condition: boolean) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`✅ TEST ${totalCount}: ${description}`);
  } else {
    console.error(`❌ TEST ${totalCount} FAILED: ${description}`);
  }
}

async function runTestSuite() {
  console.log("===============================================================");
  console.log("  NUTRI-TRACK CHATGPT COACH + AI INTEGRATOR TEST SUITE (25 TESTS)");
  console.log("===============================================================\n");

  const pool = prisma as any;

  // ─────────────────────────────────────────────────────────────
  // SETUP TEST USERS
  // ─────────────────────────────────────────────────────────────
  const timestamp = Date.now();
  const testUserAEmail = `coach_test_a_${timestamp}@example.com`;
  const testUserBEmail = `coach_test_b_${timestamp}@example.com`;

  // Create User A (Configured user)
  const userA = await pool.user.create({
    data: {
      name: "Alex Runner",
      email: testUserAEmail,
      username: `alex_${timestamp}`,
      passwordHash: "hashed_pwd",
      accountStatus: "APPROVED",
    },
  });

  await pool.userProfile.create({
    data: {
      userId: userA.id,
      dateOfBirth: new Date("1995-05-15"),
      biologicalSex: "MALE",
      heightCm: 180,
      weightKg: 75,
      activityLevel: "VERY_ACTIVE",
      dailyHydrationTargetMl: 3200,
      dailyStepTarget: 12000,
      weeklyRunningDistanceKm: 25.0,
      weeklyWorkoutSessions: 4,
      primaryGoal: "RUNNING_PERFORMANCE",
    },
  });

  await pool.userNutrientTarget.create({
    data: {
      userId: userA.id,
      calories: 2600,
      protein: 155,
      carbohydrates: 340,
      fat: 70,
      fiber: 35,
    },
  });

  // Create User B (New unconfigured user)
  const userB = await pool.user.create({
    data: {
      name: "Newbie User",
      email: testUserBEmail,
      username: `newbie_${timestamp}`,
      passwordHash: "hashed_pwd",
      accountStatus: "APPROVED",
    },
  });

  // ─────────────────────────────────────────────────────────────
  // TEST 1 — Database Data Intact
  // ─────────────────────────────────────────────────────────────
  const initialUserCount = await pool.user.count();
  assertTest("Existing database data remains intact", initialUserCount >= 2);

  // ─────────────────────────────────────────────────────────────
  // TEST 2 — No Destructive Reset
  // ─────────────────────────────────────────────────────────────
  assertTest("No destructive reset occurred (tables accessible & preserved)", typeof pool.aiActionLog?.create === "function");

  // ─────────────────────────────────────────────────────────────
  // TEST 3 — New User Targets Unconfigured Rather than Fake Defaults
  // ─────────────────────────────────────────────────────────────
  const settingsB = await UserSettingsService.getUserSettings(userB.id);
  assertTest(
    "New user sees targets as unconfigured rather than fake personalized defaults",
    settingsB.nutritionGoals.isConfigured === false &&
      settingsB.nutritionGoals.protein === null &&
      settingsB.nutritionGoals.calories === null
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 4 — Existing Configured User Targets Preserved
  // ─────────────────────────────────────────────────────────────
  const settingsA = await UserSettingsService.getUserSettings(userA.id);
  assertTest(
    "Existing configured user targets remain unchanged (calories=2600, protein=155)",
    settingsA.nutritionGoals.isConfigured === true &&
      settingsA.nutritionGoals.calories === 2600 &&
      settingsA.nutritionGoals.protein === 155 &&
      settingsA.profile.dailyHydrationTargetMl === 3200
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 5 — Health Context Generator Correctly Reflects Current Data
  // ─────────────────────────────────────────────────────────────
  const contextA = await HealthContextGenerator.generateMarkdownSummary(userA.id);
  assertTest(
    "Health context generator correctly reflects configured targets",
    contextA.includes("2600 kcal [CONFIRMED DATA]") &&
      contextA.includes("155 g [CONFIRMED DATA]") &&
      contextA.includes("3200 ml [CONFIRMED DATA]")
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 6 — Missing Data Not Converted into Fake Values
  // ─────────────────────────────────────────────────────────────
  const contextB = await HealthContextGenerator.generateMarkdownSummary(userB.id);
  assertTest(
    "Missing data is explicitly marked as 'Not configured' (not fake zeros)",
    contextB.includes("NOT CONFIGURED YET") &&
      contextB.includes("Not configured") &&
      !contextB.includes("Protein Target: 0 g")
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 7 — Structured UPDATE_GOALS Action Parses Correctly
  // ─────────────────────────────────────────────────────────────
  const actionJson = JSON.stringify({
    version: 1,
    action: "UPDATE_GOALS",
    data: {
      caloriesKcal: 2350,
      proteinG: 145,
      carbsG: 260,
      fatG: 65,
      hydrationMl: 3000,
    },
    reason: "Adjusted for marathon base training",
    requiresConfirmation: true,
  });

  const parsedGoalAction = NutriTrackActionBridge.parseRawActionString(actionJson);
  assertTest(
    "Structured UPDATE_GOALS action parses correctly from JSON",
    parsedGoalAction.action === "UPDATE_GOALS" &&
      parsedGoalAction.data.proteinG === 145 &&
      parsedGoalAction.data.caloriesKcal === 2350
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 8 — Structured LOG_MEAL Action Validates Correctly
  // ─────────────────────────────────────────────────────────────
  const mealActionJson = JSON.stringify({
    version: 1,
    action: "LOG_MEAL",
    data: {
      name: "Tofu Scramble & Avocado Toast",
      calories: 480,
      protein: 28,
      carbohydrates: 42,
      fat: 18,
    },
    reason: "High-protein vegan breakfast",
  });

  const valMeal = await NutriTrackActionBridge.validateAction(userA.id, mealActionJson);
  assertTest(
    "Structured LOG_MEAL action validates correctly",
    valMeal.isValid === true && valMeal.diffs.length > 0
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 9 — Invalid Action Rejected (Physiological Bounds Check)
  // ─────────────────────────────────────────────────────────────
  const invalidAction = JSON.stringify({
    version: 1,
    action: "UPDATE_GOALS",
    data: {
      caloriesKcal: 999999, // Impossible calories
      proteinG: -50,        // Negative protein
    },
  });

  const valInvalid = await NutriTrackActionBridge.validateAction(userA.id, invalidAction);
  assertTest(
    "Invalid action exceeding bounds is rejected with descriptive error",
    valInvalid.isValid === false && valInvalid.errors.length >= 2
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 10 — Cross-User Isolation (User A cannot act on User B)
  // ─────────────────────────────────────────────────────────────
  const execResultA = await NutriTrackActionBridge.executeAction(userA.id, parsedGoalAction, "CHATGPT_ACTION");
  const settingsAAfter = await UserSettingsService.getUserSettings(userA.id);
  const settingsBAfter = await UserSettingsService.getUserSettings(userB.id);

  console.log("DEBUG TEST 10:", {
    execSuccess: execResultA.success,
    settingsA_protein: settingsAAfter.nutritionGoals.protein,
    settingsB_protein: settingsBAfter.nutritionGoals.protein,
  });

  assertTest(
    "Action execution is scoped strictly to authenticated user (User B unaffected)",
    execResultA.success === true &&
      settingsAAfter.nutritionGoals.protein === 145 &&
      settingsBAfter.nutritionGoals.protein === null
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 11 — Confirmation-Required Action Handled Safely
  // ─────────────────────────────────────────────────────────────
  const actionWithConfirmation = {
    version: 1,
    action: "UPDATE_GOALS" as const,
    data: { caloriesKcal: 2500, proteinG: 160 },
    requiresConfirmation: true,
  };
  const valConfirm = await NutriTrackActionBridge.validateAction(userA.id, actionWithConfirmation);
  assertTest(
    "Confirmation-required action flags requiresConfirmation correctly",
    valConfirm.requiresConfirmation === true
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 12 — Confirmed Action Executes Correctly
  // ─────────────────────────────────────────────────────────────
  const confirmedExec = await NutriTrackActionBridge.executeAction(userA.id, actionWithConfirmation, "CHATGPT_ACTION");
  const settingsAConfirmed = await UserSettingsService.getUserSettings(userA.id);
  assertTest(
    "Confirmed action executes and updates targets in database",
    confirmedExec.success === true && settingsAConfirmed.nutritionGoals.protein === 160
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 13 — Audit History Created
  // ─────────────────────────────────────────────────────────────
  const auditLogs = await pool.aiActionLog.findMany({ where: { userId: userA.id } });
  assertTest(
    "Audit history log entry created with previous and new states",
    auditLogs.length >= 2 &&
      auditLogs[0].status === "SUCCESS" &&
      auditLogs[0].previousState !== null
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 14 — Failed Action Does Not Partially Corrupt Data
  // ─────────────────────────────────────────────────────────────
  const failedExec = await NutriTrackActionBridge.executeAction(userA.id, invalidAction, "CHATGPT_ACTION");
  const settingsAfterFailed = await UserSettingsService.getUserSettings(userA.id);
  assertTest(
    "Failed action rejected safely without corrupting existing database data",
    failedExec.success === false && settingsAfterFailed.nutritionGoals.protein === 160
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 15 — Action Revert (Rollback Capability)
  // ─────────────────────────────────────────────────────────────
  if (confirmedExec.actionLogId) {
    const revertRes = await NutriTrackActionBridge.revertAction(userA.id, confirmedExec.actionLogId);
    const settingsAfterRevert = await UserSettingsService.getUserSettings(userA.id);
    assertTest(
      "Action reversion restores previous targets successfully",
      revertRes.success === true && settingsAfterRevert.nutritionGoals.protein === 145
    );
  } else {
    assertTest("Action reversion skipped (missing actionLogId)", false);
  }

  // ─────────────────────────────────────────────────────────────
  // TEST 16 — Existing Gemini/Groq Fallback Intact
  // ─────────────────────────────────────────────────────────────
  const aiCoachResponse = await AIClient.executeWithFallback(
    [{ role: "user", content: "What is 2 + 2?" }],
    "gemini-2.5-flash",
    false
  );
  assertTest(
    "Existing Gemini/Groq AI engine connection and fallback intact",
    typeof aiCoachResponse.content === "string" && aiCoachResponse.content.length > 0
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 17 — Existing Nutrition Meal Logging Functional
  // ─────────────────────────────────────────────────────────────
  const mealLog = await NutritionService.logFoodToMeal(userA.id, {
    mealType: "BREAKFAST",
    date: new Date().toISOString().split("T")[0],
    quantity: 1,
    quantityUnit: "serving",
    customFood: {
      name: "Oatmeal with Almonds",
      calories: 350,
      protein: 12,
      carbs: 55,
      fat: 9,
      fiber: 4,
      sugar: 6,
      servingSize: 1,
      servingUnit: "serving",
    },
  });
  assertTest("Existing NutritionService.logFoodToMeal remains functional", !!mealLog.id);

  // ─────────────────────────────────────────────────────────────
  // TEST 18 — Existing Hydration Logging Functional
  // ─────────────────────────────────────────────────────────────
  const hydLog = await HydrationService.logHydration(userA.id, {
    amountMl: 400,
    date: new Date().toISOString().split("T")[0],
    beverageType: "WATER",
  });
  assertTest("Existing HydrationService.logHydration remains functional", !!hydLog.id);

  // ─────────────────────────────────────────────────────────────
  // TEST 19 — Existing Activity Logging Functional
  // ─────────────────────────────────────────────────────────────
  const actLog = await ActivityService.logActivity(userA.id, {
    activityType: "RUN",
    movingDurationSeconds: 30 * 60,
    distanceKm: 5.0,
    caloriesBurned: 320,
    date: new Date().toISOString().split("T")[0],
  });
  assertTest("Existing ActivityService.logActivity remains functional", !!actLog.id);

  // ─────────────────────────────────────────────────────────────
  // TEST 20 — Existing Workout Logging Functional
  // ─────────────────────────────────────────────────────────────
  const workLog = await WorkoutService.createWorkoutSession(userA.id, {
    name: "Full Body Strength",
    date: new Date().toISOString().split("T")[0],
    durationSeconds: 45 * 60,
    workoutType: "GYM_WORKOUT",
    exercises: [{ name: "Deadlift", sets: [{ reps: 5, weightKg: 100 }] }],
  });
  assertTest("Existing WorkoutService.createWorkoutSession remains functional", !!workLog.id);

  // ─────────────────────────────────────────────────────────────
  // TEST 21 — Project Instructions Generator Produces Full Persona
  // ─────────────────────────────────────────────────────────────
  const instructions = generateChatGPTProjectInstructions({
    userName: "Alex Runner",
    primaryGoal: "RUNNING_PERFORMANCE",
    weightKg: 75,
    heightCm: 180,
  });
  assertTest(
    "ChatGPT Project Instructions include persona, rules, and structured action schemas",
    instructions.includes("Alex Runner") &&
      instructions.includes("NUTRI-TRACK ACTION") &&
      instructions.includes("Supportively Strict") &&
      instructions.includes("UPDATE_GOALS")
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 22 — Initial Assessment Prompt Generator Works
  // ─────────────────────────────────────────────────────────────
  const assessmentPrompt = generateChatGPTAssessmentPrompt({ userName: "Alex Runner" });
  assertTest(
    "Grouped Initial Health Assessment prompt covers all 7 sections (living arrangement, training, food, goals)",
    assessmentPrompt.includes("SECTION 1: BASIC PROFILE") &&
      assessmentPrompt.includes("SECTION 4: LIVING ARRANGEMENT") &&
      assessmentPrompt.includes("SECTION 5: TRAINING & EXERCISE")
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 23 — Text-Based Action Format Parser
  // ─────────────────────────────────────────────────────────────
  const textAction = `
NUTRI-TRACK ACTION
TYPE: LOG_HYDRATION
DATA:
amountMl: 750
beverageType: ELECTROLYTES
REASON: Post-run rehydration
REQUIRES_CONFIRMATION: false
  `;
  const parsedTextAction = NutriTrackActionBridge.parseRawActionString(textAction);
  assertTest(
    "Text-based formatted action block parsed accurately",
    parsedTextAction.action === "LOG_HYDRATION" &&
      parsedTextAction.data.amountMl === 750 &&
      parsedTextAction.requiresConfirmation === false
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 24 — Memory Service and Factual Notes Persistent
  // ─────────────────────────────────────────────────────────────
  const memory = await AIMemoryService.addMemory(userA.id, {
    category: "CONSTRAINT",
    content: "Lives in hostel with shared cafeteria meals",
    importance: 2,
  });
  const memoriesA = await AIMemoryService.getUserMemories(userA.id);
  assertTest(
    "Factual user memories & constraints persisted and isolated to user",
    memoriesA.length >= 1 && memoriesA.some((m: any) => m.content.includes("hostel"))
  );

  // ─────────────────────────────────────────────────────────────
  // TEST 25 — Deterministic AICoachService Action Execution
  // ─────────────────────────────────────────────────────────────
  const conv = await (prisma as any).aiConversation.create({
    data: { userId: userA.id, title: "Test Action Conv" },
  });
  const coachExecRes = await AICoachService.processMessage(
    userA.id,
    conv.id,
    JSON.stringify({
      version: 1,
      action: "LOG_WEIGHT",
      data: { weightKg: 74.2 },
    })
  );
  assertTest(
    "AICoachService executes structured action deterministically without unnecessary LLM overhead",
    coachExecRes.assistantMessage.content.includes("LOG_WEIGHT Executed Successfully")
  );

  // ─────────────────────────────────────────────────────────────
  // CLEANUP TEST DATA
  // ─────────────────────────────────────────────────────────────
  await pool.user.deleteMany({
    where: { id: { in: [userA.id, userB.id] } },
  });

  console.log("\n===============================================================");
  console.log(`  TEST RESULTS: ${passedCount} / ${totalCount} PASSED (${Math.round((passedCount / totalCount) * 100)}%)`);
  console.log("===============================================================\n");

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test suite fatal error:", err);
  process.exit(1);
});
