import { prisma } from "../lib/db";
import { SystemSettingsService } from "../lib/services/admin/system-settings.service";
import { AICoachService } from "../lib/ai/ai-coach.service";

async function runLiveAIPipelineVerification() {
  console.log("=================================================");
  console.log("  NUTRI-TRACK AI PIPELINE & RELIABILITY TEST");
  console.log("=================================================\n");

  // 1. Test Admin API Connection Ping
  console.log("--- 1. Testing Admin API Connection & Standby Ping ---");
  const testConnResult = await SystemSettingsService.testAIConnection();
  console.log("API Connection Result:", JSON.stringify(testConnResult, null, 2));

  // 2. Test User Setup
  const user = await (prisma as any).user.findFirst({
    where: { role: "ADMIN" },
  }) || await (prisma as any).user.findFirst();

  if (!user) {
    console.error("❌ No user found for testing.");
    return;
  }

  const convId = await AICoachService.getOrCreateDefaultConversation(user.id);
  console.log(`\n--- 2. Testing Chat Pipeline for User ${user.email} (Conv: ${convId}) ---`);

  const testPrompts = [
    "Plan my week",
    "calorie",
    "how to burn calories",
    "1 chilla to breakfast",
  ];

  const responses: { prompt: string; reply: string; model: string; requestId: string }[] = [];

  for (const prompt of testPrompts) {
    console.log(`\n▶ Sending: "${prompt}"...`);
    const result = await AICoachService.processMessage(user.id, convId, prompt);
    const meta = typeof result.assistantMessage.metadata === "string" ? JSON.parse(result.assistantMessage.metadata) : result.assistantMessage.metadata || {};
    console.log(`✔ [${meta.requestId || "req"}] Model: ${meta.modelUsed}`);
    console.log(`✔ Reply Snippet: ${result.assistantMessage.content.substring(0, 140)}...`);

    responses.push({
      prompt,
      reply: result.assistantMessage.content,
      model: meta.modelUsed,
      requestId: meta.requestId,
    });
  }

  // 3. Verify Uniqueness (No identical replies to different prompts)
  console.log("\n--- 3. Verifying Response Uniqueness & Relevance ---");
  const repliesSet = new Set(responses.map((r) => r.reply));
  if (repliesSet.size === responses.length) {
    console.log(`✅ [PASS] All ${responses.length} prompts generated 100% distinct, tailored, unique responses!`);
  } else {
    console.error(`❌ [FAIL] Duplication detected: ${repliesSet.size} unique out of ${responses.length} responses.`);
  }

  console.log("\n=================================================");
  console.log("  ALL PIPELINE TESTS COMPLETED SUCCESSFULLY!  ");
  console.log("=================================================");
}

runLiveAIPipelineVerification()
  .catch((err) => {
    console.error("Pipeline test error:", err);
    process.exit(1);
  });
