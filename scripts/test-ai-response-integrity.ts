import { prisma } from "../lib/db";
import { AICoachService } from "../lib/ai/ai-coach.service";
import { AIQueryClassifier } from "../lib/ai/query-classifier";
import { AIResponseValidator } from "../lib/ai/response-validator";
import { AIDiagnosticsService } from "../lib/services/admin/ai-diagnostics.service";
import { AIClient } from "../lib/ai/ai-client";

let passedTests = 0;
let totalTests = 0;

function assertTest(name: string, condition: boolean, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS ${totalTests}] ${name}`);
  } else {
    console.error(`❌ [FAIL ${totalTests}] ${name}`);
    if (detail) console.error(`   Details: ${detail}`);
  }
}

async function runIntegrityAudit() {
  console.log("\n=================================================");
  console.log("  NUTRI-TRACK AI RESPONSE INTEGRITY & ROUTING AUDIT");
  console.log("=================================================\n");

  // 1. Find or create test users
  const userA = (await (prisma as any).user.findFirst({
    where: { role: "ADMIN" },
    include: { profile: true },
  })) || (await (prisma as any).user.findFirst({ include: { profile: true } }));

  if (!userA) {
    throw new Error("No primary user found for testing.");
  }

  let userB = await (prisma as any).user.findFirst({
    where: { id: { not: userA.id } },
    include: { profile: true },
  });

  let createdSecondary = false;
  if (!userB) {
    userB = await (prisma as any).user.create({
      data: {
        email: `test_user_b_${Date.now()}@nutritrack.test`,
        username: `test_user_b_${Date.now()}`,
        name: "User Beta",
        passwordHash: "test_hash",
        accountStatus: "APPROVED",
        role: "USER",
      },
    });
    createdSecondary = true;
  }

  const createdConvIds: string[] = [];

  try {
    // ─────────────────────────────────────────────────────────
    // TEST 1 — Different Questions Receive Distinct Answers
    // ─────────────────────────────────────────────────────────
    console.log("\n--- TEST 1: Different Questions ---");
    const convA = await (prisma as any).aiConversation.create({
      data: {
        userId: userA.id,
        title: "Test Conversation 1",
      },
    });
    createdConvIds.push(convA.id);

    const res1 = await AICoachService.processMessage(userA.id, convA.id, "hi");
    const res2 = await AICoachService.processMessage(userA.id, convA.id, "Does black coffee help reduce weight?");
    const res3 = await AICoachService.processMessage(userA.id, convA.id, "Give me a post-workout meal to stop muscle breakdown");
    const res4 = await AICoachService.processMessage(userA.id, convA.id, "What is 2 + 2?");
    const res5 = await AICoachService.processMessage(userA.id, convA.id, "Tell me about hydration");

    const content1 = res1.assistantMessage.content.toLowerCase();
    const content2 = res2.assistantMessage.content.toLowerCase();
    const content3 = res3.assistantMessage.content.toLowerCase();
    const content4 = res4.assistantMessage.content.toLowerCase();
    const content5 = res5.assistantMessage.content.toLowerCase();

    assertTest("Message 1 is a natural greeting", content1.includes("hello") || content1.includes("hi") || content1.includes("how can i help"));
    assertTest("Message 2 specifically addresses coffee/caffeine", content2.includes("coffee") || content2.includes("caffeine") || content2.includes("calorie"));
    assertTest("Message 3 provides post-workout meal guidance", content3.includes("protein") && (content3.includes("meal") || content3.includes("workout") || content3.includes("recovery")));
    assertTest("Message 4 answers math question directly", content4.includes("4"));
    assertTest("Message 5 discusses hydration", content5.includes("hydration") || content5.includes("water") || content5.includes("fluid"));

    // Check uniqueness across all 5
    const setOfAnswers = new Set([content1, content2, content3, content4, content5]);
    assertTest("All 5 responses are completely unique", setOfAnswers.size === 5);

    // Verify none contain deprecated generic template headers
    const hasDeprecatedHeader = [content1, content2, content3, content4, content5].some((c) =>
      c.includes("i've analyzed your question regarding") || c.includes("i've noted your question regarding")
    );
    assertTest("Zero deprecated template headers in any response", !hasDeprecatedHeader);

    // ─────────────────────────────────────────────────────────
    // TEST 2 — Current Message Priority (Greeting after health discussion)
    // ─────────────────────────────────────────────────────────
    console.log("\n--- TEST 2: Current Message Priority ---");
    const convHealth = await (prisma as any).aiConversation.create({
      data: {
        userId: userA.id,
        title: "Health History Conv",
        messages: {
          create: [
            { role: "user", content: "I ran a 10k race today and my quads are burning." },
            { role: "assistant", content: "Great run! Make sure to replenish electrolytes, consume 30g protein, and do gentle stretches. 🏃‍♂️⚡" },
          ],
        },
      },
    });
    createdConvIds.push(convHealth.id);

    const resGreeting = await AICoachService.processMessage(userA.id, convHealth.id, "hi");
    const greetContent = resGreeting.assistantMessage.content.toLowerCase();
    assertTest("AI answers greeting directly rather than repeating previous quad/10k advice", (greetContent.includes("hello") || greetContent.includes("hi") || greetContent.includes("how are you") || greetContent.includes("what's on your mind")) && !greetContent.includes("quads are burning"));

    // ─────────────────────────────────────────────────────────
    // TEST 3 — Personalized Question
    // ─────────────────────────────────────────────────────────
    console.log("\n--- TEST 3: Personalized Question ---");
    const resProtein = await AICoachService.processMessage(userA.id, convA.id, "How much protein should I eat?");
    const proteinContent = resProtein.assistantMessage.content.toLowerCase();
    assertTest("Personalized protein recommendation is provided", proteinContent.includes("protein") && (proteinContent.includes("1.6") || proteinContent.includes("g") || proteinContent.includes("kg")));

    // ─────────────────────────────────────────────────────────
    // TEST 4 — Unrelated General Knowledge Question
    // ─────────────────────────────────────────────────────────
    console.log("\n--- TEST 4: Unrelated Question ---");
    const resTrivia = await AICoachService.processMessage(userA.id, convA.id, "What is the speed of light?");
    const triviaContent = resTrivia.assistantMessage.content.toLowerCase();
    assertTest("Direct trivia answer without unsolicited health lectures", triviaContent.includes("299,792") || triviaContent.includes("186,282") || triviaContent.includes("speed of light"));
    assertTest("No unsolicited macro dump in speed of light answer", !triviaContent.includes("macronutrient proportions") && !triviaContent.includes("peak digestive fire"));

    // ─────────────────────────────────────────────────────────
    // TEST 5 — Duplicate Response Detection Guard
    // ─────────────────────────────────────────────────────────
    console.log("\n--- TEST 5: Duplicate Response Detection Guard ---");
    const prevAssistant = "To stop muscle protein breakdown and accelerate muscle protein synthesis post-workout, consume 25-40g complete protein.";
    const duplicateCandidate = "To stop muscle protein breakdown and accelerate muscle protein synthesis post-workout, consume 25-40g complete protein.";
    const validationDup = AIResponseValidator.validateResponseQuality(
      "HEALTH_GENERAL",
      "Tell me about hydration",
      duplicateCandidate,
      [prevAssistant]
    );
    assertTest("Duplicate guard detects identical response for different prompt", !validationDup.isValid && !!validationDup.correctionPrompt);

    // ─────────────────────────────────────────────────────────
    // TEST 6 — Concurrent Messages & Race Conditions
    // ─────────────────────────────────────────────────────────
    console.log("\n--- TEST 6: Concurrent Messages ---");
    const [concurrentRes1, concurrentRes2] = await Promise.all([
      AICoachService.processMessage(userA.id, convA.id, "Tell me a joke"),
      AICoachService.processMessage(userA.id, convA.id, "What is the capital of France?"),
    ]);

    const jokeAns = concurrentRes1.assistantMessage.content.toLowerCase();
    const franceAns = concurrentRes2.assistantMessage.content.toLowerCase();
    assertTest("Concurrent message 1 returns a joke", jokeAns.includes("joke") || jokeAns.includes("atom") || jokeAns.includes("science"));
    assertTest("Concurrent message 2 returns Paris", franceAns.includes("paris"));

    // ─────────────────────────────────────────────────────────
    // TEST 7 — Multi-User Isolation
    // ─────────────────────────────────────────────────────────
    console.log("\n--- TEST 7: Multi-User Isolation ---");
    const convB = await (prisma as any).aiConversation.create({
      data: {
        userId: userB.id,
        title: "User B Conversation",
      },
    });
    createdConvIds.push(convB.id);

    const [userARes, userBRes] = await Promise.all([
      AICoachService.processMessage(userA.id, convA.id, "I love marathon training"),
      AICoachService.processMessage(userB.id, convB.id, "I love gentle yoga and fat loss"),
    ]);

    const convAMsgs = await (prisma as any).aiMessage.findMany({ where: { conversationId: convA.id } });
    const convBMsgs = await (prisma as any).aiMessage.findMany({ where: { conversationId: convB.id } });

    assertTest("User A conversation has zero User B messages", !convAMsgs.some((m: any) => m.content.includes("gentle yoga")));
    assertTest("User B conversation has zero User A messages", !convBMsgs.some((m: any) => m.content.includes("marathon training")));

    // ─────────────────────────────────────────────────────────
    // TEST 8 — Honest Error State on All Providers Failure
    // ─────────────────────────────────────────────────────────
    console.log("\n--- TEST 8: Honest Error State on Failure ---");
    const prevNodeEnv = process.env.NODE_ENV;
    const prevMock = process.env.MOCK_AI;
    (process.env as any).NODE_ENV = "production";
    (process.env as any).MOCK_AI = "false";

    const failResponse = await AIClient.executeWithFallback(
      [{ role: "user", content: "Something impossible with no keys" }],
      "gpt-4o",
      false
    );

    assertTest(
      "When providers fail in production, user receives honest failure message",
      failResponse.content === "Sorry, I couldn't generate a response right now. Please try again."
    );

    // Restore env
    (process.env as any).NODE_ENV = prevNodeEnv;
    (process.env as any).MOCK_AI = prevMock;

    // ─────────────────────────────────────────────────────────
    // TEST 9 — Telemetry & Diagnostics Buffer Tracking
    // ─────────────────────────────────────────────────────────
    console.log("\n--- TEST 9: Diagnostics Telemetry ---");
    const recentDiags = AIDiagnosticsService.getRecentDiagnostics(10);
    assertTest("Diagnostics buffer logged recent requests", recentDiags.length > 0);
    assertTest("Diagnostics entry contains full trace fields", recentDiags[0]?.trace !== undefined && recentDiags[0]?.trace?.userMessageReceived === true);

  } finally {
    // Cleanup test-created conversations and messages
    if (createdConvIds.length > 0) {
      await (prisma as any).aiMessage.deleteMany({
        where: { conversationId: { in: createdConvIds } },
      });
      await (prisma as any).aiConversation.deleteMany({
        where: { id: { in: createdConvIds } },
      });
    }

    if (typeof (prisma as any).$disconnect === "function") {
      await (prisma as any).$disconnect();
    }
  }

  console.log("\n=================================================");
  console.log(`  AUDIT COMPLETED: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("=================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runIntegrityAudit().catch((err) => {
  console.error("Fatal audit error:", err);
  process.exit(1);
});
