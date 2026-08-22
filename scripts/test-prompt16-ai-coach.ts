/**
 * Nutri-Track — Prompt 16 Automated Test Suite
 * AI Coach, Multi-Key Fallback, Layered Context, Goal Safety & Multi-User Isolation
 */

import { prisma } from "../lib/db";
import { AICoachService } from "../lib/ai/ai-coach.service";
import { AIMemoryService } from "../lib/ai/memory-service";
import { AIContextBuilder } from "../lib/ai/context-builder";
import { AIToolRegistry } from "../lib/ai/tool-registry";
import { keyManager } from "../lib/ai/key-manager";
import { AIClient } from "../lib/ai/ai-client";
import { NutritionService } from "../lib/services/nutrition.service";

let passedCount = 0;
let totalCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`✅ [PASS] ${totalCount}. ${testName}`);
  } else {
    console.error(`❌ [FAIL] ${totalCount}. ${testName}${detail ? ` - ${detail}` : ""}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

async function runPrompt16Tests() {
  console.log("================================================================================");
  console.log("🚀 NUTRI-TRACK PROMPT 16: AI COACH & MULTI-KEY FALLBACK TEST SUITE");
  console.log("================================================================================\n");

  const testUserAId = `test_coach_user_a_${Date.now()}`;
  const testUserBId = `test_coach_user_b_${Date.now()}`;

  try {
    // Setup Test Users
    await prisma.user.create({
      data: {
        id: testUserAId,
        name: "Coach Tester Alpha",
        email: `coach_a_${Date.now()}@example.com`,
        username: `coach_a_${Date.now()}`,
        passwordHash: "hash_test_123",
      },
    });

    await prisma.user.create({
      data: {
        id: testUserBId,
        name: "Coach Tester Beta",
        email: `coach_b_${Date.now()}@example.com`,
        username: `coach_b_${Date.now()}`,
        passwordHash: "hash_test_123",
      },
    });

    await (prisma.userProfile.create as any)({
      data: {
        userId: testUserAId,
        dateOfBirth: new Date("1994-06-15"),
        biologicalSex: "MALE",
        heightCm: 180,
        weightKg: 75,
        activityLevel: "MODERATELY_ACTIVE",
        dailyHydrationTargetMl: 2800,
        dailyStepTarget: 10000,
        weeklyRunningDistanceKm: 15.0,
        weeklyWorkoutSessions: 3,
        primaryGoal: "MAINTAIN",
      },
    });

    await prisma.userNutrientTarget.create({
      data: {
        userId: testUserAId,
        calories: 2400,
        protein: 130,
        carbohydrates: 280,
        fat: 70,
        fiber: 30,
        sugar: 40,
      },
    });

    await (prisma.userProfile.create as any)({
      data: {
        userId: testUserBId,
        dateOfBirth: new Date("1998-09-20"),
        biologicalSex: "FEMALE",
        heightCm: 165,
        weightKg: 60,
        activityLevel: "LIGHTLY_ACTIVE",
        dailyHydrationTargetMl: 2200,
        dailyStepTarget: 8000,
        weeklyRunningDistanceKm: 10.0,
        weeklyWorkoutSessions: 2,
        primaryGoal: "FAT_LOSS",
      },
    });

    await prisma.userNutrientTarget.create({
      data: {
        userId: testUserBId,
        calories: 1700,
        protein: 100,
        carbohydrates: 180,
        fat: 50,
        fiber: 25,
        sugar: 30,
      },
    });

    // Enable Mock Mode for AI Client tests
    keyManager.setMockMode(true);

    // --- TEST GROUP 1: Conversation Lifecycle & Persistence ---
    console.log("--- TEST GROUP 1: Conversation Lifecycle & Persistence ---");
    const convA1 = await AICoachService.createConversation(testUserAId, "Nutrition Planning");
    assert(!!convA1.id, "User A conversation created successfully");
    assert(convA1.title === "Nutrition Planning", "Conversation title preserved accurately");

    const convListA = await AICoachService.getUserConversations(testUserAId);
    assert(convListA.length >= 1, "User A conversation listed in history");

    // Message persistence
    const chatRes1 = await AICoachService.processMessage(
      testUserAId,
      convA1.id,
      "How much protein do I have left today?"
    );
    assert(!!chatRes1.userMessage?.id, "User message persisted in PostgreSQL");
    assert(!!chatRes1.assistantMessage?.id, "Assistant reply persisted in PostgreSQL");

    // Conversation survives reload
    const reloadedConv = await AICoachService.getConversation(testUserAId, convA1.id);
    assert(reloadedConv.messages.length >= 2, "Conversation messages survive reload / refresh");

    // Create second conversation
    const convA2 = await AICoachService.createConversation(testUserAId, "Running Analysis");
    const updatedListA = await AICoachService.getUserConversations(testUserAId);
    assert(updatedListA.length >= 2, "Multiple conversation threads supported for user");

    // Delete conversation
    await AICoachService.deleteConversation(testUserAId, convA2.id);
    const afterDeleteList = await AICoachService.getUserConversations(testUserAId);
    assert(afterDeleteList.every((c) => c.id !== convA2.id), "Conversation successfully deleted");

    // --- TEST GROUP 2: Multi-User Security & Isolation ---
    console.log("\n--- TEST GROUP 2: Multi-User Security & Isolation ---");
    let unauthorizedAccessCaught = false;
    try {
      // User B attempts to access User A's conversation
      await AICoachService.getConversation(testUserBId, convA1.id);
    } catch (err: any) {
      unauthorizedAccessCaught = err.message.includes("Unauthorized");
    }
    assert(unauthorizedAccessCaught, "User B blocked from reading User A conversation");

    let unauthorizedDeleteCaught = false;
    try {
      // User B attempts to delete User A's conversation
      await AICoachService.deleteConversation(testUserBId, convA1.id);
    } catch (err: any) {
      unauthorizedDeleteCaught = err.message.includes("Unauthorized");
    }
    assert(unauthorizedDeleteCaught, "User B blocked from deleting User A conversation");

    let unauthorizedPostCaught = false;
    try {
      // User B attempts to post message to User A's conversation
      await AICoachService.processMessage(testUserBId, convA1.id, "Malicious message");
    } catch (err: any) {
      unauthorizedPostCaught = err.message.includes("Unauthorized");
    }
    assert(unauthorizedPostCaught, "User B blocked from sending message to User A conversation");

    // --- TEST GROUP 3: AI Memory & Multi-User Isolation ---
    console.log("\n--- TEST GROUP 3: AI Memory & Multi-User Isolation ---");
    const memA = await AIMemoryService.addMemory(testUserAId, {
      category: "PREFERENCE",
      content: "Prefers plant-based protein sources",
      importance: 4,
    });
    assert(!!memA?.id, "AI Memory saved for User A");

    // Auto-detect dietary preference
    await AIMemoryService.autoCapturePreferences(testUserAId, "I am vegetarian and training for a marathon");
    const userAMemories = await AIMemoryService.getUserMemories(testUserAId);
    assert(userAMemories.some((m: any) => m.content.includes("vegetarian")), "Vegetarian preference auto-captured into memory");

    // Multi-user memory isolation
    const userBMemories = await AIMemoryService.getUserMemories(testUserBId);
    assert(userBMemories.length === 0, "User B has 0 access to User A AI memories");

    let memoryDeleteBlocked = false;
    try {
      await AIMemoryService.deleteMemory(testUserBId, memA!.id);
    } catch (err: any) {
      memoryDeleteBlocked = err.message.includes("Unauthorized");
    }
    assert(memoryDeleteBlocked, "User B blocked from deleting User A AI memory");

    // --- TEST GROUP 4: Relevance Context Builder ---
    console.log("\n--- TEST GROUP 4: Relevance Context Builder ---");
    const nutQuery = AIContextBuilder.analyzeQueryRelevance("How much protein and carbs do I have left?");
    assert(nutQuery.wantsNutrition === true, "Nutrition intent accurately detected");
    assert(nutQuery.wantsRunning === false, "Unrelated running excluded for nutrition query");

    const runQuery = AIContextBuilder.analyzeQueryRelevance("How did my running pace trend this week?");
    assert(runQuery.wantsRunning === true, "Running intent accurately detected");
    assert(runQuery.wantsMicronutrients === false, "Unrelated micronutrient data excluded for running query");

    const builtContext = await AIContextBuilder.buildContext(testUserAId, convA1.id, "How is my protein intake?");
    assert(builtContext.systemPrompt.includes("130"), "User A target protein (130g) present in assembled context");
    assert(builtContext.systemPrompt.includes("plant-based"), "Saved user preference memory included in context");

    // --- TEST GROUP 5: Grounding & Missing Data Safety (Prompt 15 + 16 Rule) ---
    console.log("\n--- TEST GROUP 5: Grounding & Missing Data Safety ---");
    const nutToolEmpty = await AIToolRegistry.executeTool("get_today_nutrition", {}, { userId: testUserAId });
    assert(nutToolEmpty.status === "NOT_LOGGED_YET", "Empty day marked as NOT_LOGGED_YET");
    assert(nutToolEmpty.hasLoggedMeals === false, "hasLoggedMeals is false when no food logged");
    assert(nutToolEmpty.remaining.protein === 130, "Protein remaining accurately calculated as full 130g target");

    // Log a meal and test State B
    const todayStr = new Date().toISOString().split("T")[0];
    const meal = await prisma.mealLog.create({
      data: {
        userId: testUserAId,
        date: todayStr,
        mealType: "LUNCH",
        name: "Tofu Rice Bowl",
      },
    });

    const food = await prisma.food.create({
      data: {
        userId: testUserAId,
        name: "Firm Tofu",
        calories: 300,
        protein: 35,
        carbohydrates: 10,
        fat: 15,
        servingSize: 200,
        servingUnit: "g",
      },
    });

    await prisma.mealEntry.create({
      data: {
        mealLogId: meal.id,
        foodId: food.id,
        quantity: 200,
        quantityUnit: "g",
        calculatedCalories: 300,
        calculatedProtein: 35,
        calculatedCarbs: 10,
        calculatedFat: 15,
        calculatedFiber: 2,
        calculatedSugar: 1,
      },
    });

    const nutToolLogged = await AIToolRegistry.executeTool("get_today_nutrition", {}, { userId: testUserAId });
    assert(nutToolLogged.status === "DATA_LOGGED", "State B: status updated to DATA_LOGGED");
    assert(nutToolLogged.totals.protein === 35, "Totals reflect actual logged 35g protein");
    assert(nutToolLogged.remaining.protein === 95, "Calculated remaining: 130 - 35 = 95g protein");

    // --- TEST GROUP 6: Exercise Calorie Estimation (MET Science) ---
    console.log("\n--- TEST GROUP 6: Exercise Calorie Estimation ---");
    const estCal = await AIToolRegistry.executeTool(
      "estimate_exercise_calories",
      { exerciseType: "RUNNING", durationMinutes: 45, intensity: "MODERATE" },
      { userId: testUserAId }
    );
    assert(estCal.isEstimate === true, "Calorie calculation explicitly flagged as an estimate");
    assert(estCal.weightKgUsed === 75, "User weight (75kg) used in MET calculation");
    assert(estCal.metValue === 10.0, "Moderate running MET (10.0) applied");
    assert(estCal.estimatedCaloriesMin > 450 && estCal.estimatedCaloriesMax < 650, "Calorie range calculated logically");
    assert(estCal.disclaimer.includes("Estimated energy expenditure"), "Clear scientific disclaimer included");

    // --- TEST GROUP 7: Goal Update Confirmation Safety ---
    console.log("\n--- TEST GROUP 7: Goal Update Confirmation Safety ---");
    const proposalRes = await AIToolRegistry.executeTool(
      "propose_goal_update",
      { targetKey: "protein", newValue: 160, reason: "Higher protein for muscle maintenance" },
      { userId: testUserAId }
    );
    assert(proposalRes.proposal?.status === "PENDING_CONFIRMATION", "Target proposal created with PENDING_CONFIRMATION");
    assert(proposalRes.proposal?.proposedValue === 160, "Proposed target value is 160g");

    // Verify database was NOT changed yet (Strict safety rule)
    const checkBeforeConfirm = await NutritionService.getDailyNutrition(testUserAId, todayStr);
    assert(checkBeforeConfirm.targets.protein === 130, "Database target remains unchanged at 130g before confirmation");

    // Now execute explicit confirmation
    const confirmRes = await AICoachService.confirmGoalUpdate(testUserAId, "protein", 160);
    assert(confirmRes.success === true, "Explicit goal update executed successfully");

    // Verify dynamic propagation
    const checkAfterConfirm = await NutritionService.getDailyNutrition(testUserAId, todayStr);
    assert(checkAfterConfirm.targets.protein === 160, "Database and NutritionService dynamically updated to 160g protein");

    // --- TEST GROUP 8: Three API Key Fallback System ---
    console.log("\n--- TEST GROUP 8: Three API Key Fallback System ---");
    keyManager.setMockMode(true);
    keyManager.resetStates();

    // 1. Primary key initial selection
    const key1 = keyManager.getActiveKey();
    assert(key1 !== null, "Key Manager provides active developer key");
    assert(key1?.index === 0, "Key Manager selects Key 1 by default");

    // 2. Simulate 429 Rate Limit on Key 1 -> Fallback to Key 2
    keyManager.recordRateLimit(0);
    // Simulate setting mock key for key 2 so fallback works in offline test
    keyManager.setMockMode(true);
    keyManager.recordRateLimit(0); // put key 0 in cooldown

    const key2 = keyManager.getActiveKey();
    assert(key2?.index === 1, "Key Manager seamlessly fell back to Key 2 after Key 1 rate limit");

    // 3. Simulate exhaustion on Key 2 -> Fallback to Key 3
    keyManager.recordRateLimit(1);
    const key3 = keyManager.getActiveKey();
    assert(key3?.index === 2, "Key Manager seamlessly fell back to Key 3 after Key 2 cooldown");

    // 4. Simulate all keys unavailable -> Graceful error
    keyManager.recordRateLimit(2);
    const allExhausted = keyManager.getActiveKey();
    assert(allExhausted === null, "Key Manager returns null when all 3 keys are exhausted");

    const gracefulRes = await AIClient.generateCoachResponse(
      "context",
      [],
      "Hello",
      { userId: testUserAId }
    );
    assert(
      gracefulRes.reply.includes("peak capacity") || gracefulRes.reply.includes("unavailable"),
      "Graceful user-facing notice returned when all keys are unavailable"
    );

    // 5. Verify API keys NEVER appear in responses
    const serialized = JSON.stringify(gracefulRes) + JSON.stringify(reloadedConv);
    assert(!serialized.includes("sk-") && !serialized.includes("AI_API_KEY"), "Developer API keys never leaked to client or responses");

    console.log("\nCleaning up test fixtures...");
    try { await prisma.mealLog.delete({ where: { id: meal.id } }); } catch {}
    try { await prisma.food.delete({ where: { id: food.id } }); } catch {}
    try { await (prisma as any).aiMessage.deleteMany({ where: { conversationId: convA1.id } }); } catch {}
    try { await (prisma as any).aiConversation.deleteMany({ where: { userId: testUserAId } }); } catch {}
    try { await (prisma as any).aiMemory.deleteMany({ where: { userId: testUserAId } }); } catch {}
    try { await (prisma.userNutrientTarget.delete as any)({ where: { userId: testUserAId } }); } catch {}
    try { await (prisma.userProfile.delete as any)({ where: { userId: testUserAId } }); } catch {}
    try { await prisma.user.delete({ where: { id: testUserAId } }); } catch {}

    try { await (prisma.userNutrientTarget.delete as any)({ where: { userId: testUserBId } }); } catch {}
    try { await (prisma.userProfile.delete as any)({ where: { userId: testUserBId } }); } catch {}
    try { await prisma.user.delete({ where: { id: testUserBId } }); } catch {}

    console.log("\n================================================================================");
    console.log(`📊 FINAL TEST RESULTS: ${passedCount} / ${totalCount} TESTS PASSED`);
    console.log("================================================================================");
    console.log("🎉 ALL PROMPT 16 AUTOMATED TESTS PASSED SUCCESSFULLY!\n");
  } catch (err: any) {
    console.error("Test execution error:", err);
    process.exit(1);
  }
}

runPrompt16Tests();
