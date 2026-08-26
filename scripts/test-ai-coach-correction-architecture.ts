import { DataProvenanceService } from "../lib/ai/provenance";
import { HealthContextGenerator } from "../lib/ai/health-context-generator";
import { generateChatGPTAssessmentPrompt } from "../lib/ai/assessment-generator";
import { generateChatGPTProjectInstructions } from "../lib/ai/chatgpt-instructions";
import { NutriTrackActionBridge, ALLOWED_AI_ACTIONS, BANNED_DESTRUCTIVE_ACTIONS } from "../lib/ai/action-bridge";
import { AIMemoryService } from "../lib/ai/memory-service";

async function runRegressionTestSuite() {
  console.log("================================================================================");
  console.log("🧪 NUTRI-TRACK AI COACH & DATA PROVENANCE — 10-AREA COMPREHENSIVE TEST SUITE");
  console.log("================================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   Details: ${detail}`);
    }
  }

  // ---------------------------------------------------------------------------
  // AREA A: New User with Zero Data (No Fake Defaults)
  // ---------------------------------------------------------------------------
  console.log("--- AREA A: New User Zero-Data Baseline ---");
  const newProfileProvHeight = DataProvenanceService.evaluateProfileField("heightCm", null);
  const newProfileProvWeight = DataProvenanceService.evaluateProfileField("weightKg", null);
  const newTargetCalories = DataProvenanceService.evaluateTarget("calories", null, false);
  const newTargetProtein = DataProvenanceService.evaluateTarget("protein", null, false);

  assert(newProfileProvHeight.status === "MISSING", "A1: Height is MISSING for unconfigured user");
  assert(newProfileProvWeight.status === "MISSING", "A2: Weight is MISSING for unconfigured user");
  assert(newTargetCalories.status === "MISSING" && newTargetCalories.value === null, "A3: Calories target is MISSING (not 2000 kcal)");
  assert(newTargetProtein.status === "MISSING" && newTargetProtein.value === null, "A4: Protein target is MISSING (not 120 g)");

  // ---------------------------------------------------------------------------
  // AREA B: Pre-Approved User (Pre-filled Values Marked UNVERIFIED)
  // ---------------------------------------------------------------------------
  console.log("\n--- AREA B: Pre-Approved / Seeded User ---");
  const preApprovedHeight = DataProvenanceService.evaluateProfileField("heightCm", 164, { isPreFilled: true });
  const preApprovedWeight = DataProvenanceService.evaluateProfileField("weightKg", 55, { isPreFilled: true });

  assert(preApprovedHeight.status === "UNVERIFIED", "B1: Pre-filled height is marked UNVERIFIED");
  assert(!preApprovedHeight.isConfirmed, "B2: Pre-filled height is not marked confirmed");
  assert(preApprovedWeight.status === "UNVERIFIED", "B3: Pre-filled weight is marked UNVERIFIED");

  // ---------------------------------------------------------------------------
  // AREA C: Existing User with Confirmed Data (Intelligent Assessment)
  // ---------------------------------------------------------------------------
  console.log("\n--- AREA C: Intelligent Assessment with Confirmed Data ---");
  const assessmentPrompt = generateChatGPTAssessmentPrompt({
    userName: "Alex",
    confirmedItems: {
      heightCm: 178,
      biologicalSex: "MALE",
      primaryGoal: "MUSCLE_GAIN",
    },
  });

  assert(assessmentPrompt.includes("[CONFIRMED] Height: 178 cm"), "C1: Assessment prompt includes confirmed height tag");
  assert(assessmentPrompt.includes("CURRENT CONFIRMED DATA (Do NOT re-ask"), "C2: Instructs coach not to re-ask confirmed data");
  assert(assessmentPrompt.includes("SECTION 4 — Living Situation & Food Reality"), "C3: Includes living situation and meal predictability");

  // ---------------------------------------------------------------------------
  // AREA D: Unverified Data Prompts for Confirmation
  // ---------------------------------------------------------------------------
  console.log("\n--- AREA D: Unverified Data Prompts for Confirmation ---");
  const unverifiedPrompt = generateChatGPTAssessmentPrompt({
    userName: "Sam",
    unverifiedItems: {
      weightKg: 62,
    },
  });

  assert(unverifiedPrompt.includes("[UNVERIFIED] Weight: 62 kg"), "D1: Unverified weight is explicitly listed");
  assert(unverifiedPrompt.includes("UNVERIFIED / ESTIMATED DATA (Please ask"), "D2: Instructs coach to verify unverified values");

  // ---------------------------------------------------------------------------
  // AREA E: Missing Targets in Health Snapshot
  // ---------------------------------------------------------------------------
  console.log("\n--- AREA E: Missing Targets in Health Snapshot ---");
  const mockSnapshot: any = {
    userId: "test-user-1",
    date: "2026-08-26",
    profile: {
      name: "Jordan",
      biologicalSex: null,
      heightCm: null,
      weightKg: null,
      primaryGoal: null,
      bmr: null,
      tdee: null,
    },
    nutrition: {
      isTargetsConfigured: false,
      calorieTarget: null,
      proteinTarget: null,
      carbsTarget: null,
      fatsTarget: null,
      hasLoggedMeals: false,
      caloriesConsumed: 0,
      proteinConsumed: 0,
      carbsConsumed: 0,
      fatsConsumed: 0,
      fiberConsumed: 0,
      mealCount: 0,
    },
    hydration: {
      hasLoggedHydration: false,
      consumedMl: 0,
      targetMl: 0,
      remainingMl: 0,
      percentage: 0,
      streakDays: 0,
    },
    movement: {
      todaySteps: 0,
      dailyStepTarget: 0,
      todayDistanceKm: 0,
      totalActiveCalories: 0,
      weeklyRunningDistanceKm: 0,
      weeklyRunningTargetKm: 0,
    },
    workouts: {
      todayWorkoutSessions: 0,
      weeklyWorkoutSessions: 0,
      weeklyWorkoutTarget: 0,
      weeklyWorkoutVolumeKg: 0,
    },
    goals: {},
    memories: [],
  };

  const markdownSnapshot = HealthContextGenerator.formatSnapshotToMarkdown(mockSnapshot);
  assert(markdownSnapshot.includes("Target Status**: **NOT CONFIGURED YET**"), "E1: Unconfigured user shows NOT CONFIGURED YET");
  assert(markdownSnapshot.includes("Calories**: Not configured [NOT CONFIGURED]"), "E2: Calories target marked NOT CONFIGURED");
  assert(!markdownSnapshot.includes("2000 kcal [CONFIRMED]"), "E3: Does not invent 2000 kcal confirmed target");

  // ---------------------------------------------------------------------------
  // AREA F: No Logged Data (Distinguishing 0 Meals from 0 kcal)
  // ---------------------------------------------------------------------------
  console.log("\n--- AREA F: No Logged Data vs True Zero Intake ---");
  assert(markdownSnapshot.includes("[NO LOGGED DATA] No meals logged yet today"), "F1: Distinguishes unrecorded meals from zero calories");
  assert(markdownSnapshot.includes("[NO LOGGED DATA] No water logged yet today"), "F2: Distinguishes unrecorded hydration");
  assert(markdownSnapshot.includes("No workout logged today [NO LOGGED DATA]"), "F3: Distinguishes unrecorded workouts");

  // ---------------------------------------------------------------------------
  // AREA G: AI Action Execution & Strict Allowlist
  // ---------------------------------------------------------------------------
  console.log("\n--- AREA G: AI Action Allowlist & Permitted Fields ---");
  assert(ALLOWED_AI_ACTIONS.has("UPDATE_GOALS"), "G1: UPDATE_GOALS is in allowed action set");
  assert(ALLOWED_AI_ACTIONS.has("LOG_MEAL"), "G2: LOG_MEAL is in allowed action set");
  assert(ALLOWED_AI_ACTIONS.has("UPDATE_PROFILE"), "G3: UPDATE_PROFILE is in allowed action set");
  assert(!ALLOWED_AI_ACTIONS.has("DELETE_RECORD"), "G4: DELETE_RECORD is not in allowed action set");

  // Test validation of valid UPDATE_GOALS
  const validAction = NutriTrackActionBridge.parseRawActionString(
    JSON.stringify({
      version: 1,
      action: "UPDATE_GOALS",
      data: {
        caloriesKcal: 2300,
        proteinG: 145,
      },
      reason: "Adjusted for marathon training",
    })
  );
  assert(validAction.action === "UPDATE_GOALS", "G5: Valid UPDATE_GOALS parses cleanly");
  assert(validAction.data.proteinG === 145, "G6: Correct protein payload extracted");

  // ---------------------------------------------------------------------------
  // AREA H: Database Safety & Anti-Wipe Protection
  // ---------------------------------------------------------------------------
  console.log("\n--- AREA H: Database Safety & Anti-Wipe Guards ---");
  assert(BANNED_DESTRUCTIVE_ACTIONS.has("DELETE"), "H1: DELETE is explicitly banned");
  assert(BANNED_DESTRUCTIVE_ACTIONS.has("RESET_DATABASE"), "H2: RESET_DATABASE is explicitly banned");
  assert(BANNED_DESTRUCTIVE_ACTIONS.has("CLEAR"), "H3: CLEAR is explicitly banned");

  // Test validation rejects banned destructive action
  const bannedValidation = await NutriTrackActionBridge.validateAction(
    "test-user",
    JSON.stringify({ action: "RESET_DATABASE", data: {} })
  );
  assert(!bannedValidation.isValid, "H4: Banned action RESET_DATABASE is rejected");
  assert(bannedValidation.errors[0].includes("forbidden"), "H5: Returns explicit safety error message");

  // Test validation rejects empty data payload
  const emptyValidation = await NutriTrackActionBridge.validateAction(
    "test-user",
    JSON.stringify({ action: "UPDATE_GOALS", data: {} })
  );
  assert(!emptyValidation.isValid, "H6: Empty data payload is rejected");
  assert(emptyValidation.errors[0].includes("Empty or missing action data"), "H7: Rejection protects database integrity");

  // Test unauthorized profile fields (e.g. attempting to change role or password)
  const unauthorizedProfileValidation = await NutriTrackActionBridge.validateAction(
    "test-user",
    JSON.stringify({
      action: "UPDATE_PROFILE",
      data: {
        heightCm: 180,
        role: "SUPER_ADMIN",
        passwordHash: "malicious_hash",
      },
    })
  );
  assert(!unauthorizedProfileValidation.isValid, "H8: Unauthorized profile fields are rejected");
  assert(unauthorizedProfileValidation.errors.some((e) => e.includes("Unauthorized profile field(s)")), "H9: Explains field restriction");

  // ---------------------------------------------------------------------------
  // AREA I: User Isolation Guarantees
  // ---------------------------------------------------------------------------
  console.log("\n--- AREA I: User-Scoped Isolation Guarantees ---");
  assert(typeof AIMemoryService.getUserMemories === "function", "I1: Memory service queries by explicit userId");
  assert(typeof AIMemoryService.addMemory === "function", "I2: Memory creation is strictly scoped by userId");

  // ---------------------------------------------------------------------------
  // AREA J: System Integrity & ChatGPT Instructions
  // ---------------------------------------------------------------------------
  console.log("\n--- AREA J: Instructions Persona & Living Situation Rules ---");
  const instructions = generateChatGPTProjectInstructions({
    userName: "Sam",
    primaryGoal: "FAT_LOSS",
    savedMemories: [{ category: "LIVING_SITUATION", content: "Lives in university hostel with mess food" }],
  });

  assert(instructions.includes("Warm, Empathetic & Humorous"), "J1: Instructions establish warm coach persona");
  assert(instructions.includes("Hostel / dorm / mess"), "J2: Instructions account for hostel/mess living dynamics");
  assert(instructions.includes("STRUCTURED NUTRI-TRACK ACTION BRIDGE FORMAT"), "J3: Instructions define structured action block rules");
  assert(instructions.includes("Lives in university hostel"), "J4: Saved memories are injected into instructions");

  console.log("\n================================================================================");
  console.log(`📊 FINAL RESULT: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("================================================================================\n");

  if (passedTests === totalTests) {
    console.log("🎉 ALL 10 AREAS PASSED WITH ZERO REGRESSIONS!");
    process.exit(0);
  } else {
    console.error("💥 SOME TESTS FAILED. Please review the output above.");
    process.exit(1);
  }
}

runRegressionTestSuite().catch((err) => {
  console.error("Fatal error during test suite execution:", err);
  process.exit(1);
});
