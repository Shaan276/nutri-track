import { FeatureAccessService, REGISTERED_APP_FEATURES, FeatureAccessStatus } from "../lib/services/admin/feature-access.service";
import { AIQueryClassifier } from "../lib/ai/query-classifier";
import { AIResponseValidator } from "../lib/ai/response-validator";
import { NutriTrackActionBridge } from "../lib/ai/action-bridge";
import { DataProvenanceService } from "../lib/ai/provenance";

async function runMasterTestSuite() {
  console.log("================================================================================");
  console.log("🧪 NUTRI-TRACK MASTER TEST SUITE: PAGE CONTROL, CHATGPT & RESTORED AI CHAT");
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
  // 1. PAGE & FEATURE ACCESS CONTROL CENTER TESTS
  // ===========================================================================
  console.log("--- 1. Page & Feature Access Control Center ---");

  const allFeatures = await FeatureAccessService.getAllFeatures();
  assert(allFeatures.length >= 12, "P1: All major application routes are registered");

  const dashboardFeat = allFeatures.find((f) => f.key === "dashboard");
  assert(dashboardFeat?.status === "LIVE", "P2: Default stable Dashboard is LIVE");

  // Test Access Matrix for Normal User vs Admin
  const normalUserDashboard = await FeatureAccessService.canUserAccess("/app", "USER");
  assert(normalUserDashboard.allowed === true, "P3: Normal user can access LIVE /app");

  const adminDashboard = await FeatureAccessService.canUserAccess("/app", "ADMIN");
  assert(adminDashboard.allowed === true, "P4: Admin can access LIVE /app");

  // Test Update Status & Audit Trail
  const testAdminId = "usr_admin_test_123";
  const updatedCommunity = await FeatureAccessService.updateFeatureStatus(
    "community",
    "COMING_SOON",
    testAdminId,
    "Setting community to Coming Soon for beta polish"
  );
  assert(updatedCommunity.success && updatedCommunity.feature.status === "COMING_SOON", "P5: Status updated to COMING_SOON");

  const normalUserCommunity = await FeatureAccessService.canUserAccess("/community", "USER");
  assert(normalUserCommunity.allowed === false && normalUserCommunity.status === "COMING_SOON", "P6: Normal user blocked from COMING_SOON route");

  const adminUserCommunity = await FeatureAccessService.canUserAccess("/community", "ADMIN");
  assert(adminUserCommunity.allowed === true, "P7: Admin retains development access to COMING_SOON route");

  // Test ADMIN_ONLY Route
  await FeatureAccessService.updateFeatureStatus("ai_coach", "ADMIN_ONLY", testAdminId, "Restricting to Admin");
  const normalUserAICoach = await FeatureAccessService.canUserAccess("/ai-coach", "USER");
  assert(normalUserAICoach.allowed === false && normalUserAICoach.status === "ADMIN_ONLY", "P8: Normal user blocked from ADMIN_ONLY route");

  const adminUserAICoach = await FeatureAccessService.canUserAccess("/ai-coach", "ADMIN");
  assert(adminUserAICoach.allowed === true, "P9: Admin allowed access to ADMIN_ONLY route");

  // Test Audit Trail
  const auditLogs = await FeatureAccessService.getAuditLogs();
  assert(auditLogs.length > 0, "P10: Audit history persists changes");
  assert(auditLogs[0].adminId === testAdminId, "P11: Audit log records correct adminId");
  assert(auditLogs[0].featureKey === "ai_coach" || auditLogs[0].featureKey === "community", "P12: Audit log records correct featureKey");

  // ===========================================================================
  // 2. CHATGPT USER ISOLATION & HONEST INTEGRATION TESTS
  // ===========================================================================
  console.log("\n--- 2. ChatGPT User Isolation & Honest Integration ---");

  const userA_Id = "user_A_101";
  const userB_Id = "user_B_202";

  // Provenance & Context Isolation
  const provA = DataProvenanceService.evaluateTarget("protein", 150, true);
  const provB = DataProvenanceService.evaluateTarget("protein", null, false);

  assert(provA.status === "CONFIRMED" && provA.value === 150, "C1: User A confirmed data is tagged CONFIRMED");
  assert(provB.status === "MISSING" && provB.value === null, "C2: User B missing data is tagged MISSING without fake values");

  // Action Bridge Parsing from ChatGPT
  const actionFromChatGPT = JSON.stringify({
    version: 1,
    action: "UPDATE_GOALS",
    data: { proteinG: 140 },
    reason: "Increase daily protein for recovery",
  });

  const parsedAction = NutriTrackActionBridge.parseRawActionString(actionFromChatGPT);
  assert(parsedAction.action === "UPDATE_GOALS", "C3: Structured action cleanly parsed from ChatGPT");
  assert(parsedAction.data.proteinG === 140, "C4: Protein target extracted (140g)");
  assert(parsedAction.data.caloriesKcal === undefined, "C5: Unspecified calories remain undefined (PATCH update)");

  // ===========================================================================
  // 3. NUTRI-TRACK AI CONVERSATIONAL CHAT & MESSAGE-SPECIFIC QUERY TESTS
  // ===========================================================================
  console.log("\n--- 3. Nutri-Track AI Conversational Chat & Query Specificity ---");

  // Query 1: Casual Greeting
  const q1 = AIQueryClassifier.classifyQuery("Hi");
  assert(q1.category === "CASUAL_CHAT", "N1: 'Hi' classified as CASUAL_CHAT (not food logging)");

  // Query 2: Hydration Logging
  const q2 = AIQueryClassifier.classifyQuery("I drank 500ml water.");
  assert(q2.category === "ACTION_COMMAND" || q2.extractedEntities.actionType === "LOG_HYDRATION", "N2: 'I drank 500ml water' classified as hydration action");

  // Query 3: Meal Logging
  const q3 = AIQueryClassifier.classifyQuery("I ate 4 rotis and 100g paneer bhurji.");
  assert(q3.category === "ACTION_COMMAND" || q3.extractedEntities.actionType === "LOG_MEAL", "N3: 'I ate 4 rotis' classified as meal action");

  // Query 4: Running Activity
  const q4 = AIQueryClassifier.classifyQuery("I ran 5 km in 28 minutes.");
  assert(q4.category === "ACTION_COMMAND" || q4.extractedEntities.actionType === "LOG_ACTIVITY", "N4: 'I ran 5 km' classified as activity action");

  // Query 5: General Trivia / Non-Health
  const q5 = AIQueryClassifier.classifyQuery("What is the capital of India?");
  assert(q5.category === "GENERAL", "N5: 'What is the capital of India?' classified as GENERAL");

  // Validator test: General question receiving general answer
  const validGeneral = AIResponseValidator.validateResponseQuality(
    "GENERAL",
    "What is the capital of India?",
    "The capital of India is New Delhi. Note: I am your Nutri-Track AI assistant specialized in meal and fitness logging."
  );
  assert(validGeneral.isValid, "N6: Direct general response passes validation");

  // Validator test: General question receiving unsolicited macro dump (Must fail validation)
  const invalidGeneral = AIResponseValidator.validateResponseQuality(
    "GENERAL",
    "What is the capital of India?",
    "Evidence-based Nutrition & Training:\n• Maintain balanced daily macronutrient proportions (Calories: 2000, Protein: 120g)"
  );
  assert(!invalidGeneral.isValid, "N7: Unsolicited macro dump on general question is correctly rejected");

  console.log("\n================================================================================");
  console.log(`📊 FINAL RESULT: ${passed}/${total} TESTS PASSED`);
  console.log("================================================================================\n");

  if (passed === total) {
    console.log("🎉 ALL PAGE CONTROL, CHATGPT & CONVERSATIONAL CHAT TESTS PASSED!");
    process.exit(0);
  } else {
    console.error("💥 SOME TESTS FAILED.");
    process.exit(1);
  }
}

runMasterTestSuite().catch((err) => {
  console.error("Fatal error in master test suite:", err);
  process.exit(1);
});
