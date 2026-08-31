import { AIQueryClassifier } from "../lib/ai/query-classifier";
import { NutriTrackActionBridge } from "../lib/ai/action-bridge";
import { HydrationService } from "../lib/services/hydration.service";

async function runSemanticUpdateTests() {
  console.log("================================================================================");
  console.log("🧪 NUTRI-TRACK SEMANTIC UPDATE & SUBTRACTION QA SUITE");
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

  // ===========================================================================
  // 1. QUERY CLASSIFICATION TESTS: SUBTRACT vs ADD vs SET
  // ===========================================================================
  console.log("--- 1. Query Classification Semantics ---");

  const qRemove = AIQueryClassifier.classifyQuery("Remove 750 ml of water");
  assert(
    qRemove.category === "ACTION_COMMAND" &&
    qRemove.extractedEntities.actionType === "ADJUST_HYDRATION" &&
    qRemove.extractedEntities.operation === "SUBTRACT" &&
    qRemove.extractedEntities.targetValue === 750,
    "S1: 'Remove 750 ml of water' classified as ADJUST_HYDRATION SUBTRACT 750ml"
  );

  const qSubtract = AIQueryClassifier.classifyQuery("Subtract 500 ml from today's water");
  assert(
    qSubtract.extractedEntities.actionType === "ADJUST_HYDRATION" &&
    qSubtract.extractedEntities.operation === "SUBTRACT" &&
    qSubtract.extractedEntities.targetValue === 500,
    "S2: 'Subtract 500 ml from today's water' classified as ADJUST_HYDRATION SUBTRACT 500ml"
  );

  const qSet = AIQueryClassifier.classifyQuery("Set today's water intake to 2000 ml");
  assert(
    qSet.extractedEntities.actionType === "ADJUST_HYDRATION" &&
    qSet.extractedEntities.operation === "SET" &&
    qSet.extractedEntities.targetValue === 2000,
    "S3: 'Set today's water intake to 2000 ml' classified as ADJUST_HYDRATION SET 2000ml"
  );

  const qAdd = AIQueryClassifier.classifyQuery("Add 750 ml water");
  assert(
    qAdd.extractedEntities.actionType === "LOG_HYDRATION" &&
    qAdd.extractedEntities.operation === "ADD" &&
    qAdd.extractedEntities.targetValue === 750,
    "S4: 'Add 750 ml water' classified as LOG_HYDRATION ADD 750ml"
  );

  const qCorrect = AIQueryClassifier.classifyQuery("Actually I drank 1800 ml, not 2300 ml");
  assert(
    qCorrect.extractedEntities.actionType === "ADJUST_HYDRATION" &&
    qCorrect.extractedEntities.operation === "SET" &&
    qCorrect.extractedEntities.targetValue === 1800,
    "S5: 'Actually I drank 1800 ml, not 2300 ml' classified as ADJUST_HYDRATION SET 1800ml"
  );

  // ===========================================================================
  // 2. ACTION BRIDGE VALIDATION TESTS
  // ===========================================================================
  console.log("\n--- 2. Action Bridge Validation ---");

  const testUserId = "usr_test_semantic_123";

  // Action Bridge Parsing & Validation for Subtraction
  const subActionPayload = {
    version: 1,
    action: "ADJUST_HYDRATION",
    data: {
      operation: "SUBTRACT",
      amountMl: 750,
    },
    reason: "User requested removal of 750ml water",
  };

  const valSub = await NutriTrackActionBridge.validateAction(testUserId, JSON.stringify(subActionPayload));
  assert(valSub.isValid, "S6: ADJUST_HYDRATION SUBTRACT action is valid");
  assert(valSub.diffs.length > 0, "S7: Diffs are generated for subtraction");
  assert(valSub.diffs[0].proposedValue.includes("-750 ml"), "S8: Diff correctly displays -750 ml subtraction");

  // Action Bridge Parsing & Validation for Absolute Set
  const setActionPayload = {
    version: 1,
    action: "ADJUST_HYDRATION",
    data: {
      operation: "SET",
      amountMl: 2000,
    },
    reason: "User set total to 2000ml",
  };

  const valSet = await NutriTrackActionBridge.validateAction(testUserId, JSON.stringify(setActionPayload));
  assert(valSet.isValid, "S9: ADJUST_HYDRATION SET action is valid");
  assert(valSet.diffs[0].proposedValue.includes("2000 ml"), "S10: Diff correctly displays 2000 ml total");

  console.log("\n================================================================================");
  console.log(`📊 FINAL RESULT: ${passed}/${total} SEMANTIC UPDATE TESTS PASSED`);
  console.log("================================================================================\n");

  if (passed === total) {
    console.log("🎉 ALL SEMANTIC UPDATE & SUBTRACTION TESTS PASSED!");
    process.exit(0);
  } else {
    console.error("💥 SOME TESTS FAILED.");
    process.exit(1);
  }
}

runSemanticUpdateTests().catch((err) => {
  console.error("Fatal error in semantic test suite:", err);
  process.exit(1);
});
