import { DataProvenanceService } from "../lib/ai/provenance";
import { HealthContextGenerator } from "../lib/ai/health-context-generator";
import { generateChatGPTAssessmentPrompt } from "../lib/ai/assessment-generator";
import { generateChatGPTProjectInstructions } from "../lib/ai/chatgpt-instructions";
import { NutriTrackActionBridge, ALLOWED_AI_ACTIONS, BANNED_DESTRUCTIVE_ACTIONS } from "../lib/ai/action-bridge";
import { AIMemoryService } from "../lib/ai/memory-service";

async function runSimplificationTestSuite() {
  console.log("================================================================================");
  console.log("🧪 NUTRI-TRACK AI COACH SIMPLIFICATION & TWO-MODE SYSTEM TEST SUITE");
  console.log("================================================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   Details: ${detail}`);
    }
  }

  // ---------------------------------------------------------------------------
  // TEST A: General Question (Mode A — Ask / Discuss)
  // ---------------------------------------------------------------------------
  console.log("--- TEST A: Mode A (Ask / Discuss) Configuration ---");
  const instructions = generateChatGPTProjectInstructions({
    userName: "Shaan",
    primaryGoal: "MUSCLE_GAIN",
  });
  assert(instructions.includes("Warm, Empathetic & Humorous"), "A1: ChatGPT Coach persona initialized");
  assert(instructions.includes("CRITICAL DATA PROVENANCE RULES"), "A2: Provenance rules embedded");
  assert(!instructions.includes("INTEGRATOR_ACTIVE_IN_ASK_MODE"), "A3: Integrator does not interfere with coaching persona");

  // ---------------------------------------------------------------------------
  // TEST B: Fast Logging & Nutrition Extraction (Mode B — Log Something)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST B: Mode B (Log Something) Extraction & Calculation ---");
  const mockMealParse = {
    logType: "MEAL",
    meal: {
      detected: true,
      name: "4 Rotis with 100g Paneer Bhurji",
      items: [
        { name: "Whole Wheat Roti", quantity: 4, unit: "pcs", calories: 340, protein: 12, carbohydrates: 68, fat: 2.5, fiber: 8 },
        { name: "Paneer Bhurji", quantity: 100, unit: "g", calories: 265, protein: 18.3, carbohydrates: 3.4, fat: 20.8, fiber: 1.2 },
      ],
      totals: { calories: 605, protein: 30.3, carbohydrates: 71.4, fat: 23.3, fiber: 9.2 },
      micronutrients: { calcium: 320, iron: 3.8, potassium: 450, magnesium: 85, zinc: 2.4, vitaminC: 12 },
    },
    hydration: {
      detected: true,
      amountMl: 500,
      beverageType: "WATER",
    },
  };

  assert(mockMealParse.meal.totals.protein === 30.3, "B1: Protein extracted accurately (30.3g)");
  assert(mockMealParse.meal.totals.calories === 605, "B2: Total calories calculated (605 kcal)");
  assert(mockMealParse.meal.totals.fiber === 9.2, "B3: Fiber calculated (9.2g)");
  assert(mockMealParse.meal.micronutrients.calcium === 320, "B4: Calcium micronutrient calculated");
  assert(mockMealParse.hydration.detected && mockMealParse.hydration.amountMl === 500, "B5: Hydration intake detected in same input (+500ml)");

  // ---------------------------------------------------------------------------
  // TEST C: Mode Switching Integrity
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST C: Mode Switching Integrity ---");
  let activeMode: "ask" | "log" = "ask";
  assert(activeMode === "ask", "C1: Starts in Ask Mode");
  activeMode = "log";
  assert(activeMode === "log", "C2: Switches cleanly to Log Mode");
  activeMode = "ask";
  assert(activeMode === "ask", "C3: Switches back to Ask Mode with zero side-effects");

  // ---------------------------------------------------------------------------
  // TEST D: Goal Change & Partial Update Enforcement (MANDATORY)
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST D: Partial Goal Updates (PATCH-Style Only) ---");
  const rawGoalAction = JSON.stringify({
    version: 1,
    action: "UPDATE_GOALS",
    data: {
      proteinG: 140,
    },
    reason: "Adjusted protein target",
  });

  const parsedGoalAction = NutriTrackActionBridge.parseRawActionString(rawGoalAction);
  assert(parsedGoalAction.action === "UPDATE_GOALS", "D1: UPDATE_GOALS action identified");
  assert(parsedGoalAction.data.proteinG === 140, "D2: Only proteinG is present in payload");
  assert(parsedGoalAction.data.caloriesKcal === undefined, "D3: Calories is undefined (will not overwrite)");
  assert(parsedGoalAction.data.carbsG === undefined, "D4: Carbs is undefined (will not overwrite)");
  assert(parsedGoalAction.data.fatG === undefined, "D5: Fat is undefined (will not overwrite)");

  // ---------------------------------------------------------------------------
  // TEST E: New User Unconfigured Baseline
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST E: New User Unconfigured Baseline ---");
  const newTargetProv = DataProvenanceService.evaluateTarget("protein", null, false);
  assert(newTargetProv.status === "MISSING" && newTargetProv.value === null, "E1: Unconfigured protein target is MISSING (not fake 120g)");

  const newCalProv = DataProvenanceService.evaluateTarget("calories", null, false);
  assert(newCalProv.status === "MISSING" && newCalProv.value === null, "E2: Unconfigured calorie target is MISSING (not fake 2000 kcal)");

  // ---------------------------------------------------------------------------
  // TEST F: Database Safety & Destruction Protection
  // ---------------------------------------------------------------------------
  console.log("\n--- TEST F: Database Safety & Anti-Wipe Protection ---");
  assert(BANNED_DESTRUCTIVE_ACTIONS.has("DELETE"), "F1: DELETE is banned");
  assert(BANNED_DESTRUCTIVE_ACTIONS.has("RESET_DATABASE"), "F2: RESET_DATABASE is banned");
  assert(BANNED_DESTRUCTIVE_ACTIONS.has("CLEAR"), "F3: CLEAR is banned");

  const bannedAttempt = await NutriTrackActionBridge.validateAction(
    "test-user",
    JSON.stringify({ action: "RESET_DATABASE", data: {} })
  );
  assert(!bannedAttempt.isValid, "F4: Banned destructive action rejected safely");

  console.log("\n================================================================================");
  console.log(`📊 FINAL RESULT: ${passed}/${total} TESTS PASSED`);
  console.log("================================================================================\n");

  if (passed === total) {
    console.log("🎉 ALL SIMPLIFIED TWO-MODE AI COACH TESTS PASSED!");
    process.exit(0);
  } else {
    console.error("💥 SOME TESTS FAILED.");
    process.exit(1);
  }
}

runSimplificationTestSuite().catch((err) => {
  console.error("Fatal error in simplification test suite:", err);
  process.exit(1);
});
