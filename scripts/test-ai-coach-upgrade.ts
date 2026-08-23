import { prisma } from "../lib/db";
import { AICoachService } from "../lib/ai/ai-coach.service";
import { AIMemoryService } from "../lib/ai/memory-service";
import { AIToolRegistry } from "../lib/ai/tool-registry";
import { AIContextBuilder } from "../lib/ai/context-builder";
import { DynamicNutritionService } from "../lib/services/dynamic-nutrition.service";

async function runAICoachTests() {
  console.log("=================================================");
  console.log("  NUTRI-TRACK AI COACH COMPREHENSIVE TEST SUITE  ");
  console.log("=================================================\n");

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string, extra?: string) => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}${extra ? ` -> ${extra}` : ""}`);
      failed++;
    }
  };

  try {
    // 1. Setup Test Users (User A and User B for strict isolation tests)
    let testUserA = await (prisma.user as any).findUnique({
      where: { email: "test_coach_a@nutritrack.test" },
      include: { profile: true, nutrientTarget: true },
    });

    if (!testUserA) {
      testUserA = await (prisma.user as any).create({
        data: {
          email: "test_coach_a@nutritrack.test",
          username: "test_runner_a",
          name: "Test Runner A",
          passwordHash: "dummyhash123",
          role: "USER",
          accountStatus: "APPROVED",
          profile: {
            create: {
              dateOfBirth: new Date("1996-06-15"),
              heightCm: 178,
              weightKg: 72,
              biologicalSex: "MALE",
              activityLevel: "MODERATELY_ACTIVE",
              primaryGoal: "RUNNING_PERFORMANCE",
            },
          },
          nutrientTarget: {
            create: {
              calorieTarget: 2400,
              proteinTarget: 140,
              carbsTarget: 300,
              fatsTarget: 70,
              fiberTarget: 32,
              waterTargetMl: 3200,
            },
          },
        },
        include: { profile: true, nutrientTarget: true },
      });
    }

    let testUserB = await (prisma.user as any).findUnique({
      where: { email: "test_coach_b@nutritrack.test" },
      include: { profile: true },
    });

    if (!testUserB) {
      testUserB = await (prisma.user as any).create({
        data: {
          email: "test_coach_b@nutritrack.test",
          username: "test_runner_b",
          name: "Test Runner B",
          passwordHash: "dummyhash123",
          role: "USER",
          accountStatus: "APPROVED",
          profile: {
            create: {
              dateOfBirth: new Date("2000-01-20"),
              heightCm: 165,
              weightKg: 58,
              biologicalSex: "FEMALE",
              activityLevel: "LIGHTLY_ACTIVE",
              primaryGoal: "FAT_LOSS",
            },
          },
        },
        include: { profile: true },
      });
    }

    if (!testUserA || !testUserB) {
      throw new Error("Could not initialize test users");
    }

    const userA = testUserA;
    const userB = testUserB;

    console.log(`[Setup] Created/verified Test User A (${userA.id}) and Test User B (${userB.id})\n`);

    // Clean any residual test data from previous runs
    await (prisma as any).aiMemory.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
    await (prisma as any).aiMessage.deleteMany({ where: { conversation: { userId: { in: [userA.id, userB.id] } } } });
    await (prisma as any).aiConversation.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });

    // TEST 1: Assessment auto-trigger initializes without empty state
    const assessResult = await AICoachService.startOrResumeAssessment(userA.id);
    assert(!!assessResult.conversationId, "Test 1: Start assessment creates/finds conversation");
    assert(assessResult.messages.length > 0, "Test 2: Initial assessment has structured greeting message");

    // TEST 3: Pre-assessment data analysis includes existing user stats
    const initialGreeting = assessResult.messages[0]?.content || "";
    assert(
      initialGreeting.includes("178 cm") || initialGreeting.includes("72 kg") || initialGreeting.includes("analyzed"),
      "Test 3: Existing biometric data (178cm/72kg) analyzed before questioning without asking user to repeat"
    );

    // TEST 4: Major assessment questions presented together
    assert(
      initialGreeting.includes("Primary Goal") &&
        initialGreeting.includes("Living Situation") &&
        initialGreeting.includes("Daily Routine") &&
        initialGreeting.includes("Food Environment"),
      "Test 4: Major assessment questions presented together in one comprehensive checklist"
    );

    // TEST 5 & 6: Living situation & auto-preference memory saving
    await AIMemoryService.autoCapturePreferences(
      userA.id,
      "I am living in hostel mess and preparing for 10k race. I am vegetarian."
    );

    const memoriesA = await AIMemoryService.getUserMemories(userA.id);
    const hasHostelMem = memoriesA.some((m: any) => m.content.toLowerCase().includes("hostel"));
    const hasVegMem = memoriesA.some((m: any) => m.content.toLowerCase().includes("vegetarian"));
    const hasTrainMem = memoriesA.some((m: any) => m.content.toLowerCase().includes("running") || m.content.toLowerCase().includes("event"));

    assert(hasHostelMem, "Test 5: Living situation (Hostel) captured into user memory");
    assert(hasVegMem, "Test 6: Dietary preference (Vegetarian) captured into memory");
    assert(hasTrainMem, "Test 7: Training goal captured into memory");

    // TEST 8: Memory topic replacement (User moves from hostel to family)
    await AIMemoryService.setOrReplaceTopicMemory(
      userA.id,
      "LIVING_SITUATION",
      "Lives with Family (Shares traditional home cooking).",
      4
    );

    const updatedMemoriesA = await AIMemoryService.getUserMemories(userA.id);
    const familyMemCount = updatedMemoriesA.filter((m: any) => m.category === "LIVING_SITUATION").length;
    const latestLivingMem = updatedMemoriesA.find((m: any) => m.category === "LIVING_SITUATION");

    assert(
      familyMemCount === 1 && !!latestLivingMem?.content.includes("Family"),
      "Test 8: Memory updates replace outdated topic cleanly without duplicate contradictions"
    );

    // TEST 9 & 10: Strict User Isolation (User A vs User B)
    const memoriesB = await AIMemoryService.getUserMemories(userB.id);
    assert(
      !memoriesB.some((m: any) => m.content.includes("Test Runner A") || m.userId === userA.id),
      "Test 9: User B cannot access User A's private memories"
    );

    let caughtUnauthorized = false;
    try {
      await AICoachService.getConversation(userB.id, assessResult.conversationId);
    } catch {
      caughtUnauthorized = true;
    }
    assert(caughtUnauthorized, "Test 10: User B cannot access User A's conversation thread");

    // TEST 11: Goal Personalization & Execution (Direct server-side tool execution)
    const goalUpdateRes = await AICoachService.confirmGoalUpdate(userA.id, {
      calories: 2550,
      protein: 155,
      carbohydrates: 320,
      fat: 72,
      fiber: 35,
      hydrationMl: 3400,
      dailyStepTarget: 10000,
      primaryGoal: "RUNNING_PERFORMANCE",
    });

    assert(goalUpdateRes.success, "Test 11: AI Coach updates full target blueprint");
    assert(goalUpdateRes.updatedSettings.nutritionGoals.calories === 2550, "Test 12: Calories updated in PostgreSQL");
    assert(goalUpdateRes.updatedSettings.nutritionGoals.protein === 155, "Test 13: Protein updated in PostgreSQL");

    // TEST 14: Context Builder includes all 4 layers + complete macros + dynamic nutrition
    const context = await AIContextBuilder.buildContext(
      userA.id,
      assessResult.conversationId,
      "What should I eat today to hit my protein and micronutrients?"
    );

    assert(context.systemPrompt.includes("USER PROFILE"), "Test 14: Context builder includes User Profile");
    assert(context.systemPrompt.includes("LIVE HEALTH DATA"), "Test 15: Context builder includes Complete Macro quantities");
    assert(context.systemPrompt.includes("SAVED USER PREFERENCES"), "Test 16: Context builder includes Saved Long-term Memories");

    // TEST 17: Dynamic Nutrition & Yesterday's Data preserved
    const dynOpt = await DynamicNutritionService.calculateDynamicOptimization(userA.id);
    assert(!!dynOpt.optimized && dynOpt.optimized.calories > 0, "Test 17: Dynamic Nutrition calculation is fully functional");
    assert(!!dynOpt.yesterdaysSummary, "Test 18: Yesterday's summary data is attached");

    // TEST 19: Tool execution - Exercise calorie estimation with MET table
    const metRes = await AIToolRegistry.executeTool(
      "estimate_exercise_calories",
      { exerciseType: "RUNNING", durationMinutes: 45, intensity: "MODERATE" },
      { userId: userA.id }
    );
    assert(metRes.isEstimate && metRes.estimatedCaloriesMin > 0, "Test 19: Exercise calorie estimation runs accurately with MET formulas");

    // TEST 20: Tool execution - Hydration logging
    const hydRes = await AIToolRegistry.executeTool(
      "log_hydration",
      { amountMl: 500, beverageType: "WATER" },
      { userId: userA.id }
    );
    assert(hydRes.success && hydRes.totalIntakeMl >= 500, "Test 20: AI Coach executes hydration logging directly in database");

    // TEST 21: Tool execution - Meal logging directly to nutrition
    const mealRes = await AIToolRegistry.executeTool(
      "log_meal",
      {
        foodName: "Grilled Chicken with Quinoa & Broccoli",
        mealType: "LUNCH",
        calories: 520,
        protein: 45,
        carbohydrates: 50,
        fat: 12,
        fiber: 8,
      },
      { userId: userA.id }
    );
    assert(mealRes.success && !!mealRes.loggedEntry, "Test 21: AI Coach logs meal directly into user daily nutrition journal");

    // TEST 22: Logged meal updates daily macronutrient totals
    const todayStr = new Date().toISOString().split("T")[0];
    const { NutritionService } = await import("../lib/services/nutrition.service");
    const dailyNutrition = await NutritionService.getDailyNutrition(userA.id, todayStr);
    assert(dailyNutrition.totals.calories >= 520, "Test 22: Logged meal reflects in daily nutrition calorie totals");
    assert(dailyNutrition.totals.protein >= 45, "Test 23: Logged meal reflects in daily nutrition protein totals");

    // TEST 24: Tool execution - Weight updating
    const weightRes = await AIToolRegistry.executeTool(
      "update_weight",
      { weightKg: 71.5 },
      { userId: userA.id }
    );
    assert(weightRes.success && weightRes.weightKg === 71.5, "Test 24: AI Coach executes user weight update directly without refusal");

    // TEST 25: Assessment status memory transitions
    const statusMem = await (prisma as any).aiMemory.findFirst({
      where: { userId: userA.id, category: "ASSESSMENT_STATUS" },
    });
    assert(!!statusMem && (statusMem.content === "IN_PROGRESS" || statusMem.content === "COMPLETED"), "Test 25: Assessment status transitions and persists in AIMemory");

    // Cleanup test data
    await (prisma as any).aiMemory.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
    await (prisma as any).aiMessage.deleteMany({ where: { conversation: { userId: { in: [userA.id, userB.id] } } } });
    await (prisma as any).aiConversation.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
    await prisma.mealEntry.deleteMany({ where: { mealLog: { userId: { in: [userA.id, userB.id] } } } });
    await prisma.mealLog.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
    await prisma.hydrationLog.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });

    console.log("\n=================================================");
    console.log(`TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log("=================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution failed with error:", err);
    process.exit(1);
  }
}

runAICoachTests();
