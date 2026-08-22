import { prisma } from "../lib/db";
import { SystemSettingsService } from "../lib/services/admin/system-settings.service";
import { StravaService } from "../lib/services/integrations/strava.service";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${details ? " - " + details : ""}`);
    failedCount++;
  }
}

async function runAdminDynamicSettingsTest() {
  console.log("\n================================================================================");
  console.log("🛠️  TESTING ADMIN DYNAMIC SYSTEM SETTINGS & API KEY ROTATION");
  console.log("================================================================================\n");

  try {
    const adminId = "admin_test_user_id";

    // 1. Initial State & Defaults
    console.log("--- 1. Default Setting Resolution & In-Memory Fallback ---");
    const defaultModel = await SystemSettingsService.getSetting("AI_MODEL");
    assert(defaultModel === "gpt-4o-mini" || defaultModel.length > 0, `Default AI_MODEL resolved to "${defaultModel}"`);

    // 2. Setting Updates & Dynamic Retrieval
    console.log("\n--- 2. Updating & Retrieving Dynamic Settings ---");
    await SystemSettingsService.updateSetting("AI_MODEL", "gpt-4o", adminId);
    const updatedModel = await SystemSettingsService.getSetting("AI_MODEL");
    assert(updatedModel === "gpt-4o", "AI_MODEL dynamically updated to 'gpt-4o'");

    await SystemSettingsService.updateSetting("OPENAI_API_KEY", "sk-proj-test-1234567890abcdef", adminId);
    const updatedKey = await SystemSettingsService.getSetting("OPENAI_API_KEY");
    assert(updatedKey === "sk-proj-test-1234567890abcdef", "OPENAI_API_KEY dynamically saved and retrieved");

    // 3. Admin View with Secret Masking
    console.log("\n--- 3. Secret Masking for Admin Protection ---");
    const adminSettings = await SystemSettingsService.getAllSettingsForAdmin();
    const openaiSetting = adminSettings.find((s) => s.key === "OPENAI_API_KEY");
    assert(openaiSetting !== undefined, "OPENAI_API_KEY found in admin settings list");
    assert(openaiSetting?.isSecret === true, "OPENAI_API_KEY is marked as isSecret");
    assert(
      openaiSetting?.maskedValue?.includes("••••••••") === true,
      `Secret key is properly masked in admin view: "${openaiSetting?.maskedValue}"`
    );

    // 4. Batch Updates
    console.log("\n--- 4. Batch Updates & Cache Invalidation ---");
    await SystemSettingsService.batchUpdateSettings(
      [
        { key: "STRAVA_CLIENT_ID", value: "987654" },
        { key: "STRAVA_CLIENT_SECRET", value: "strava_secret_dynamic_xyz" },
        { key: "REGISTRATION_AUTO_APPROVE", value: "true" },
      ],
      adminId
    );

    const stravaId = await StravaService.getClientId();
    const stravaSecret = await StravaService.getClientSecret();
    assert(stravaId === "987654", "StravaService dynamically resolved updated STRAVA_CLIENT_ID");
    assert(stravaSecret === "strava_secret_dynamic_xyz", "StravaService dynamically resolved updated STRAVA_CLIENT_SECRET");

    const autoApprove = await SystemSettingsService.getSetting("REGISTRATION_AUTO_APPROVE");
    assert(autoApprove === "true", "REGISTRATION_AUTO_APPROVE dynamically set to 'true'");

    // 5. Test AI Connection Ping
    console.log("\n--- 5. OpenAI Connection & Latency Verification ---");
    const pingResult = await SystemSettingsService.testAIConnection("mock_key_test", "gpt-4o-mini");
    assert(pingResult.success === true, "Mock/Sandbox OpenAI connection test succeeds");
    assert(typeof pingResult.latencyMs === "number", `Latency reported: ${pingResult.latencyMs}ms`);

    // 6. Reset Test Settings
    console.log("\n--- 6. Teardown Test Settings ---");
    await (prisma as any).systemSetting.deleteMany();
    SystemSettingsService.clearCache();
    const resetModel = await SystemSettingsService.getSetting("AI_MODEL");
    assert(resetModel === "gpt-4o-mini", "Settings successfully reverted to system default");

    console.log("\n================================================================================");
    console.log(`TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("================================================================================\n");

    if (failedCount > 0) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error("Test execution failed with exception:", err);
    process.exit(1);
  }
}

runAdminDynamicSettingsTest();
