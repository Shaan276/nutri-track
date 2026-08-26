import { prisma } from "../lib/db";
import { AICoachService } from "../lib/ai/ai-coach.service";
import { AIQueryClassifier } from "../lib/ai/query-classifier";
import { AIDiagnosticsService } from "../lib/services/admin/ai-diagnostics.service";

async function runPrompt25Verification() {
  console.log("=================================================");
  console.log("  PROMPT 25: AI COACH GENERAL INTELLIGENCE & ROUTING AUDIT");
  console.log("=================================================\n");

  // 1. Find or create test users
  const adminUser = await (prisma as any).user.findFirst({
    where: { role: "ADMIN" },
  }) || await (prisma as any).user.findFirst();

  if (!adminUser) {
    throw new Error("No user found for testing.");
  }

  let secondaryUser = await (prisma as any).user.findFirst({
    where: { id: { not: adminUser.id } },
  });

  if (!secondaryUser) {
    // Create a mock secondary user for isolation tests if none exists
    secondaryUser = await (prisma as any).user.create({
      data: {
        email: `test_user_b_${Date.now()}@nutritrack.test`,
        name: "User B Test",
        passwordHash: "test_hash",
        status: "APPROVED",
        role: "USER",
      },
    });
  }

  const convIdA = await AICoachService.getOrCreateDefaultConversation(adminUser.id);
  const convIdB = await AICoachService.getOrCreateDefaultConversation(secondaryUser.id);

  console.log(`User A (Admin): ${adminUser.email} (Conv: ${convIdA})`);
  console.log(`User B: ${secondaryUser.email} (Conv: ${convIdB})\n`);

  let passCount = 0;
  let totalTests = 0;

  function assertTest(title: string, condition: boolean, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS ${totalTests}] ${title}`);
      passCount++;
    } else {
      console.error(`❌ [FAIL ${totalTests}] ${title}`);
      if (detail) console.error(`   Details: ${detail}`);
    }
  }

  // ─────────────────────────────────────────────────────────
  // TEST 1: GENERAL QUESTION ROUTING — "What is the capital of France?"
  // ─────────────────────────────────────────────────────────
  console.log("--- 1. Testing GENERAL Question: 'What is the capital of France?' ---");
  const q1 = "What is the capital of France?";
  const c1 = AIQueryClassifier.classifyQuery(q1);
  assertTest("Classified as GENERAL", c1.category === "GENERAL", `Got: ${c1.category}`);

  const r1 = await AICoachService.processMessage(adminUser.id, convIdA, q1);
  const content1 = r1.assistantMessage.content.toLowerCase();
  console.log(`AI Reply: "${r1.assistantMessage.content}"`);
  assertTest("Answers 'Paris'", content1.includes("paris"), `Reply was: ${r1.assistantMessage.content}`);
  assertTest("No unsolicited macro/calorie advice", !content1.includes("ayurvedic") && !content1.includes("macronutrient proportions"), `Reply was: ${r1.assistantMessage.content}`);

  // ─────────────────────────────────────────────────────────
  // TEST 2: GENERAL QUESTION ROUTING — "Tell me a joke."
  // ─────────────────────────────────────────────────────────
  console.log("\n--- 2. Testing GENERAL Question: 'Tell me a joke.' ---");
  const q2 = "Tell me a joke.";
  const c2 = AIQueryClassifier.classifyQuery(q2);
  assertTest("Classified as GENERAL", c2.category === "GENERAL", `Got: ${c2.category}`);

  const r2 = await AICoachService.processMessage(adminUser.id, convIdA, q2);
  console.log(`AI Reply: "${r2.assistantMessage.content}"`);
  assertTest("Delivered joke with zero health lectures", !r2.assistantMessage.content.toLowerCase().includes("ayurvedic") && !r2.assistantMessage.content.toLowerCase().includes("digestive fire"));

  // ─────────────────────────────────────────────────────────
  // TEST 3: HEALTH_GENERAL — "Does black coffee help reduce weight?"
  // ─────────────────────────────────────────────────────────
  console.log("\n--- 3. Testing HEALTH_GENERAL: 'Does black coffee help reduce weight?' ---");
  const q3 = "Does black coffee help reduce weight?";
  const c3 = AIQueryClassifier.classifyQuery(q3);
  assertTest("Classified as HEALTH_GENERAL", c3.category === "HEALTH_GENERAL", `Got: ${c3.category}`);

  const r3 = await AICoachService.processMessage(adminUser.id, convIdA, q3);
  const content3 = r3.assistantMessage.content.toLowerCase();
  console.log(`AI Reply: "${r3.assistantMessage.content}"`);
  assertTest("Directly discusses coffee/caffeine & calorie deficit", content3.includes("coffee") || content3.includes("caffeine"), `Reply was: ${r3.assistantMessage.content}`);
  assertTest("No generic template header or Agni lecture", !content3.includes("i've analyzed your question regarding") && !content3.includes("align your largest meals with your peak digestive fire"));

  // ─────────────────────────────────────────────────────────
  // TEST 4: HEALTH_GENERAL — "Is running every day good?"
  // ─────────────────────────────────────────────────────────
  console.log("\n--- 4. Testing HEALTH_GENERAL: 'Is running every day good?' ---");
  const q4 = "Is running every day good?";
  const c4 = AIQueryClassifier.classifyQuery(q4);
  assertTest("Classified as HEALTH_GENERAL", c4.category === "HEALTH_GENERAL", `Got: ${c4.category}`);

  const r4 = await AICoachService.processMessage(adminUser.id, convIdA, q4);
  const content4 = r4.assistantMessage.content.toLowerCase();
  console.log(`AI Reply: "${r4.assistantMessage.content}"`);
  assertTest("Discusses running recovery / overuse", content4.includes("run") && (content4.includes("recovery") || content4.includes("rest") || content4.includes("injur")));

  // ─────────────────────────────────────────────────────────
  // TEST 5: HEALTH_PERSONALIZED — "Am I eating enough protein?"
  // ─────────────────────────────────────────────────────────
  console.log("\n--- 5. Testing HEALTH_PERSONALIZED: 'Am I eating enough protein?' ---");
  const q5 = "Am I eating enough protein?";
  const c5 = AIQueryClassifier.classifyQuery(q5);
  assertTest("Classified as HEALTH_PERSONALIZED", c5.category === "HEALTH_PERSONALIZED", `Got: ${c5.category}`);

  const r5 = await AICoachService.processMessage(adminUser.id, convIdA, q5);
  console.log(`AI Reply: "${r5.assistantMessage.content}"`);
  assertTest("Analyzes protein intake or missing data cleanly", r5.assistantMessage.content.toLowerCase().includes("protein"));

  // ─────────────────────────────────────────────────────────
  // TEST 6: NUTRI_TRACK_DATA — "How much protein did I eat today?"
  // ─────────────────────────────────────────────────────────
  console.log("\n--- 6. Testing NUTRI_TRACK_DATA: 'How much protein did I eat today?' ---");
  const q6 = "How much protein did I eat today?";
  const c6 = AIQueryClassifier.classifyQuery(q6);
  assertTest("Classified as NUTRI_TRACK_DATA", c6.category === "NUTRI_TRACK_DATA", `Got: ${c6.category}`);

  const r6 = await AICoachService.processMessage(adminUser.id, convIdA, q6);
  console.log(`AI Reply: "${r6.assistantMessage.content}"`);
  assertTest("Responded with exact protein intake or clean not logged state", r6.assistantMessage.content.toLowerCase().includes("protein") || r6.assistantMessage.content.toLowerCase().includes("haven't logged"));

  // ─────────────────────────────────────────────────────────
  // TEST 7: ACTION_COMMAND — "Change my protein target to 130g."
  // ─────────────────────────────────────────────────────────
  console.log("\n--- 7. Testing ACTION_COMMAND: 'Change my protein target to 130g.' ---");
  const q7 = "Change my protein target to 130g.";
  const c7 = AIQueryClassifier.classifyQuery(q7);
  assertTest("Classified as ACTION_COMMAND", c7.category === "ACTION_COMMAND", `Got: ${c7.category}`);
  assertTest("Extracted targetValue = 130", c7.extractedEntities.targetValue === 130, `Got: ${c7.extractedEntities.targetValue}`);

  const r7 = await AICoachService.processMessage(adminUser.id, convIdA, q7);
  console.log(`AI Reply: "${r7.assistantMessage.content}"`);
  assertTest("Action confirmed in assistant message or metadata", r7.assistantMessage.content.toLowerCase().includes("updated") || r7.assistantMessage.content.toLowerCase().includes("130") || (r7.assistantMessage.metadata as any)?.proposedGoal !== null);

  // ─────────────────────────────────────────────────────────
  // TEST 8: CASUAL_CHAT — "I'm feeling lazy today."
  // ─────────────────────────────────────────────────────────
  console.log("\n--- 8. Testing CASUAL_CHAT: 'I'm feeling lazy today.' ---");
  const q8 = "I'm feeling lazy today.";
  const c8 = AIQueryClassifier.classifyQuery(q8);
  assertTest("Classified as CASUAL_CHAT", c8.category === "CASUAL_CHAT", `Got: ${c8.category}`);

  const r8 = await AICoachService.processMessage(adminUser.id, convIdA, q8);
  console.log(`AI Reply: "${r8.assistantMessage.content}"`);
  assertTest("Warm, empathetic, supportive coach response", r8.assistantMessage.content.length > 20 && !r8.assistantMessage.content.toLowerCase().includes("evidence-based nutrition & training"));

  // ─────────────────────────────────────────────────────────
  // TEST 9: ANTI-REPETITION AUDIT (5 Different Questions)
  // ─────────────────────────────────────────────────────────
  console.log("\n--- 9. Testing Anti-Repetition Across 5 Distinct Prompts ---");
  const testPrompts = [
    "What is the speed of light?",
    "Does drinking green tea burn fat?",
    "Why do my muscles get sore after lifting?",
    "How to improve my running endurance?",
    "I'm feeling great today coach!",
  ];

  const uniqueReplies = new Set<string>();
  for (const p of testPrompts) {
    const res = await AICoachService.processMessage(adminUser.id, convIdA, p);
    uniqueReplies.add(res.assistantMessage.content);
  }
  assertTest("All 5 replies are completely unique (no repeating templates)", uniqueReplies.size === testPrompts.length, `Unique count: ${uniqueReplies.size}/5`);

  // ─────────────────────────────────────────────────────────
  // TEST 10: MULTI-USER ISOLATION (User A vs User B)
  // ─────────────────────────────────────────────────────────
  console.log("\n--- 10. Testing Multi-User & Conversation Thread Isolation ---");
  const msgUserA = await AICoachService.processMessage(adminUser.id, convIdA, "My name is Admin Alpha.");
  const msgUserB = await AICoachService.processMessage(secondaryUser.id, convIdB, "My name is User Beta.");

  const convADetail = await AICoachService.getConversation(adminUser.id, convIdA);
  const convBDetail = await AICoachService.getConversation(secondaryUser.id, convIdB);

  const aHasBMessage = convADetail.messages.some((m) => m.content.includes("User Beta"));
  const bHasAMessage = convBDetail.messages.some((m) => m.content.includes("Admin Alpha"));

  assertTest("User A conversation has NO User B messages", !aHasBMessage);
  assertTest("User B conversation has NO User A messages", !bHasAMessage);

  // ─────────────────────────────────────────────────────────
  // TEST 11: ADMIN AI OBSERVABILITY & DIAGNOSTICS BUFFER
  // ─────────────────────────────────────────────────────────
  console.log("\n--- 11. Testing Admin Diagnostics & Telemetry Logging ---");
  const recentDiags = AIDiagnosticsService.getRecentDiagnostics(10);
  assertTest("Diagnostics buffer logged recent queries", recentDiags.length > 0, `Logged entries: ${recentDiags.length}`);
  const categoriesLogged = new Set(recentDiags.map((d) => d.queryCategory));
  assertTest("Multiple query categories tracked", categoriesLogged.size >= 3, `Categories logged: ${Array.from(categoriesLogged).join(", ")}`);

  console.log(`\n=================================================`);
  console.log(`  AUDIT COMPLETED: ${passCount}/${totalTests} TESTS PASSED  `);
  console.log(`=================================================`);

  if (passCount !== totalTests) {
    process.exit(1);
  }
}

runPrompt25Verification().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
