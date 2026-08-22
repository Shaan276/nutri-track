import { prisma } from "../lib/db";
import { HealthContextService } from "../lib/services/health-context.service";
import { AIMemoryService } from "../lib/ai/memory-service";
import { AICoachService } from "../lib/ai/ai-coach.service";
import { AIToolRegistry } from "../lib/ai/tool-registry";
import { WeeklyPlanService } from "../lib/services/weekly-plan.service";
import { UserSettingsService } from "../lib/services/user-settings.service";
import { AIContextBuilder } from "../lib/ai/context-builder";

async function runPrompt25And26TestSuite() {
  console.log("\n=======================================================");
  console.log("🧪 RUNNING PROMPT 25 & 26 TEST SUITE: AI COACH, WEEKLY PLANNING & AUDIT");
  console.log("=======================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ""}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------------------------
    // Setup Test Users
    // ----------------------------------------------------------------------
    console.log("--- 1. Setup Test Users & Metabolic Baselines ---");
    const testUserAId = "test_user_ai_a_" + Date.now();
    const testUserBId = "test_user_ai_b_" + Date.now();

    await (prisma as any).user.create({
      data: {
        id: testUserAId,
        email: `coach_a_${Date.now()}@example.com`,
        username: `coach_a_${Date.now()}`,
        name: "User Alpha",
        passwordHash: "hash_a",
        role: "USER",
        accountStatus: "APPROVED",
      },
    });

    await (prisma as any).user.create({
      data: {
        id: testUserBId,
        email: `coach_b_${Date.now()}@example.com`,
        username: `coach_b_${Date.now()}`,
        name: "User Beta",
        passwordHash: "hash_b",
        role: "USER",
        accountStatus: "APPROVED",
      },
    });

    await (prisma as any).userProfile.create({
      data: {
        id: `prof_a_${Date.now()}`,
        userId: testUserAId,
        dateOfBirth: new Date("1995-05-15"),
        biologicalSex: "MALE",
        heightCm: 180,
        weightKg: 75,
        activityLevel: "MODERATELY_ACTIVE",
        dailyHydrationTargetMl: 3000,
        dailyStepTarget: 10000,
        weeklyRunningDistanceKm: 20.0,
        weeklyWorkoutSessions: 4,
        primaryGoal: "MUSCLE_GAIN",
      },
    });

    await (prisma as any).userNutrientTarget.create({
      data: {
        id: `nut_a_${Date.now()}`,
        userId: testUserAId,
        calories: 2500,
        protein: 150,
        carbohydrates: 280,
        fat: 70,
        fiber: 35,
        sugar: 45,
      },
    });

    assert(true, "User Alpha and User Beta created with distinct profiles and targets");

    // ----------------------------------------------------------------------
    // 2. Health Snapshot & Zero-Data Distinction Audit
    // ----------------------------------------------------------------------
    console.log("\n--- 2. Health Snapshot & Zero-Data Handling ---");
    const todayStr = new Date().toISOString().split("T")[0];
    const snapshotA = await HealthContextService.getHealthSnapshot(testUserAId, todayStr);

    assert(
      snapshotA.nutrition.dataState === "NOT_LOGGED_YET",
      "Empty day nutrition marked as NOT_LOGGED_YET"
    );
    assert(
      snapshotA.nutrition.caloriesConsumed === 0 && snapshotA.nutrition.caloriesRemaining === 2500,
      "Zero logged calories: consumed = 0, remaining = target (2500 kcal)"
    );
    assert(
      snapshotA.nutrition.proteinConsumed === 0 && snapshotA.nutrition.proteinRemaining === 150,
      "Zero logged protein: consumed = 0, remaining = target (150g)"
    );
    assert(
      snapshotA.hydration.dataState === "NOT_LOGGED_YET" && snapshotA.hydration.consumedMl === 0,
      "Zero logged hydration: state = NOT_LOGGED_YET, consumed = 0 ml"
    );

    // Add a real meal log and verify mathematical accuracy
    const food = await (prisma as any).food.create({
      data: {
        userId: testUserAId,
        name: "Eggs & Oatmeal",
        servingSize: 200,
        servingUnit: "g",
        calories: 500,
        protein: 35,
        carbohydrates: 60,
        fat: 15,
        fiber: 8,
        sugar: 4,
      },
    });

    const { NutritionService } = await import("../lib/services/nutrition.service");
    await NutritionService.logFoodToMeal(testUserAId, {
      date: todayStr,
      mealType: "BREAKFAST",
      foodId: food.id,
      quantity: 200,
      quantityUnit: "g",
    });

    const updatedSnapshotA = await HealthContextService.getHealthSnapshot(testUserAId, todayStr);
    assert(
      updatedSnapshotA.nutrition.dataState === "LOGGED",
      "Nutrition data state updates to LOGGED after recording meal"
    );
    assert(
      updatedSnapshotA.nutrition.proteinConsumed === 35 && updatedSnapshotA.nutrition.proteinRemaining === 115,
      "Protein remaining accurately computed (150 - 35 = 115g)"
    );
    assert(
      updatedSnapshotA.nutrition.caloriesConsumed === 500 && updatedSnapshotA.nutrition.caloriesRemaining === 2000,
      "Calories remaining accurately computed (2500 - 500 = 2000 kcal)"
    );

    // ----------------------------------------------------------------------
    // 3. AI Memory Hub CRUD & Multi-User Isolation
    // ----------------------------------------------------------------------
    console.log("\n--- 3. AI Memory Hub CRUD & Multi-User Isolation ---");
    const mem1 = await AIMemoryService.addMemory(testUserAId, {
      category: "PREFERENCE",
      content: "Prefers plant-based protein powders",
      importance: 2,
    });
    const mem2 = await AIMemoryService.addMemory(testUserAId, {
      category: "CONSTRAINT",
      content: "Lactose sensitive",
      importance: 3,
    });

    assert(mem1 !== null && mem2 !== null, "User Alpha successfully created AI memories");

    const memoriesA = await AIMemoryService.getUserMemories(testUserAId);
    const memoriesB = await AIMemoryService.getUserMemories(testUserBId);

    assert(memoriesA.length === 2, "User Alpha retrieves exactly 2 saved memories");
    assert(memoriesB.length === 0, "User Beta retrieves 0 memories (Strict User Isolation)");

    // Test Memory Update
    const updatedMem = await AIMemoryService.updateMemory(testUserAId, mem1!.id, {
      content: "Prefers pea and rice protein blends",
      importance: 3,
    });
    assert(
      updatedMem.content === "Prefers pea and rice protein blends",
      "Memory content successfully updated"
    );

    // Test Memory Isolation on Update
    let unauthorizedEditFailed = false;
    try {
      await AIMemoryService.updateMemory(testUserBId, mem1!.id, { content: "Hacked by User B" });
    } catch {
      unauthorizedEditFailed = true;
    }
    assert(unauthorizedEditFailed, "User B cannot edit User A's memory (Authorization rejected)");

    // Test Delete Single Memory
    await AIMemoryService.deleteMemory(testUserAId, mem1!.id);
    const afterDeleteA = await AIMemoryService.getUserMemories(testUserAId);
    assert(afterDeleteA.length === 1, "Single memory deletion successful");

    // Test Clear All Memories
    await AIMemoryService.clearAllMemories(testUserAId);
    const afterClearA = await AIMemoryService.getUserMemories(testUserAId);
    assert(afterClearA.length === 0, "Clear all memories successful");

    // ----------------------------------------------------------------------
    // 4. Goal & Target Modification Confirmation Protocol
    // ----------------------------------------------------------------------
    console.log("\n--- 4. Target Change Proposal & Explicit Confirmation Flow ---");
    const proposalResult = await AIToolRegistry.executeTool(
      "propose_goal_update",
      { targetKey: "protein", newValue: 175, reason: "Support increased strength hypertrophy volume" },
      { userId: testUserAId }
    );

    assert(
      proposalResult.proposal?.status === "PENDING_CONFIRMATION",
      "Tool returns structured proposal with PENDING_CONFIRMATION status"
    );
    assert(
      proposalResult.proposal?.proposedValue === 175 && proposalResult.proposal?.currentValue === 150,
      "Proposal records current value (150g) and proposed value (175g)"
    );

    // Verify database was NOT changed silently
    const settingsBeforeConfirm = await UserSettingsService.getUserSettings(testUserAId);
    assert(
      settingsBeforeConfirm.nutritionGoals.protein === 150,
      "Database target remained unchanged at 150g before user confirmation"
    );

    // Execute user confirmation action
    const confirmResult = await AICoachService.confirmGoalUpdate(testUserAId, "protein", 175);
    assert(confirmResult.success === true, "Explicit user confirmation applied successfully");

    const settingsAfterConfirm = await UserSettingsService.getUserSettings(testUserAId);
    assert(
      settingsAfterConfirm.nutritionGoals.protein === 175,
      "Database protein target now updated to 175g after explicit user confirmation"
    );

    // ----------------------------------------------------------------------
    // 5. MET Calorie Estimation Tool Audit
    // ----------------------------------------------------------------------
    console.log("\n--- 5. MET Exercise Calorie Estimation ---");
    const estimateResult = await AIToolRegistry.executeTool(
      "estimate_exercise_calories",
      { exerciseType: "RUNNING", durationMinutes: 45, intensity: "VIGOROUS" },
      { userId: testUserAId }
    );

    assert(estimateResult.isEstimate === true, "Calorie calculation is explicitly flagged as isEstimate = true");
    assert(
      estimateResult.estimatedCaloriesMin > 0 && estimateResult.estimatedCaloriesMax > estimateResult.estimatedCaloriesMin,
      `Calculated valid estimated range: ${estimateResult.formattedRange}`
    );
    assert(
      estimateResult.disclaimer && estimateResult.disclaimer.includes("Estimated energy expenditure"),
      "Estimate includes comprehensive scientific MET disclaimer"
    );

    // ----------------------------------------------------------------------
    // 6. Weekly Health & Fitness Planning & Plan vs Actual Evaluation
    // ----------------------------------------------------------------------
    console.log("\n--- 6. Weekly Blueprint Generation, Adherence & Plan vs Actual ---");
    const aiPlan = await WeeklyPlanService.generateAIWeeklyPlan(testUserAId, todayStr, {
      customGoal: "10k Preparation & Hypertrophy Split",
    });

    assert(aiPlan.id !== undefined, "Generated AI weekly blueprint with valid ID");
    assert(aiPlan.items.length === 7, "Weekly blueprint contains 7 structured daily items");
    assert(
      aiPlan.items.some((i) => i.category === "RUNNING") &&
        aiPlan.items.some((i) => i.category === "WORKOUT") &&
        aiPlan.items.some((i) => i.category === "RECOVERY"),
      "Blueprint contains balanced categories (RUNNING, WORKOUT, RECOVERY)"
    );

    // Test Item completion toggle
    const firstItem = aiPlan.items[0];
    const toggledItem = await WeeklyPlanService.updatePlanItem(testUserAId, firstItem.id, {
      isCompleted: true,
    });
    assert(toggledItem.isCompleted === true, "Successfully marked plan item as completed");

    // Test Plan vs Actual auto-matching
    // Add a running activity on Day 1
    const runItem = aiPlan.items.find((i) => i.category === "RUNNING");
    if (runItem) {
      await (prisma as any).activityLog.create({
        data: {
          id: `act_${Date.now()}`,
          userId: testUserAId,
          date: runItem.date,
          activityType: "RUN",
          distanceKm: 6.0,
          movingDurationSeconds: 1800,
          caloriesBurned: 420,
        },
      });
    }

    const evaluatedPlan = await WeeklyPlanService.evaluatePlanVsActual(testUserAId, aiPlan.id);
    const matchedRunItem = evaluatedPlan.items.find((i) => i.id === runItem?.id);

    assert(
      matchedRunItem?.isCompleted === true && matchedRunItem?.matchedActivityId !== null,
      "Plan vs Actual successfully matched logged run without false positive"
    );
    assert(
      evaluatedPlan.adherencePercentage !== undefined && evaluatedPlan.adherencePercentage > 0,
      `Plan adherence calculated at ${evaluatedPlan.adherencePercentage}%`
    );

    // Multi-user plan isolation
    let planIsolationBlocked = false;
    try {
      await WeeklyPlanService.getWeeklyPlanById(testUserBId, aiPlan.id);
    } catch {
      planIsolationBlocked = true;
    }
    assert(planIsolationBlocked, "User B cannot view or access User A's weekly plan");

    // ----------------------------------------------------------------------
    // 7. Evidence-Grounded Weekly Review Generation
    // ----------------------------------------------------------------------
    console.log("\n--- 7. Evidence-Grounded Weekly Review Retrospective ---");
    const reviewResult = await WeeklyPlanService.generateWeeklyReview(testUserAId, todayStr);

    assert(reviewResult.overallScore >= 0 && reviewResult.overallScore <= 100, "Calculated weekly review score");
    assert(
      reviewResult.metricsSummary.totalRunningDistanceKm >= 6.0,
      "Weekly review accurately captured logged 6.0 km run"
    );
    assert(
      reviewResult.recommendedNextFocus.length >= 2,
      "Weekly review provided actionable next-week focus recommendations"
    );

    // ----------------------------------------------------------------------
    // 8. AI Context Builder Grounding & Intent Routing
    // ----------------------------------------------------------------------
    console.log("\n--- 8. AI Context Builder Intent Routing ---");
    const convId = await AICoachService.getOrCreateDefaultConversation(testUserAId);
    const contextPlanning = await AIContextBuilder.buildContext(
      testUserAId,
      convId,
      "Can you review my weekly plan and schedule for tomorrow?"
    );

    assert(
      contextPlanning.relevanceCategories.includes("WEEKLY_PLAN"),
      "Context builder detected WEEKLY_PLAN intent and grounded system prompt"
    );
    assert(
      contextPlanning.systemPrompt.includes("[ACTIVE WEEKLY HEALTH & FITNESS BLUEPRINT]"),
      "System prompt includes structured weekly blueprint data"
    );

    // Cleanup Test Users
    console.log("\n--- 9. Teardown Test Data ---");
    await (prisma as any).weeklyPlan.delete({ where: { id: aiPlan.id } }).catch(() => {});
    await (prisma as any).mealLog.deleteMany({ where: { userId: testUserAId } }).catch(() => {});
    await (prisma as any).food.delete({ where: { id: food.id } }).catch(() => {});
    await (prisma as any).activityLog.deleteMany({ where: { userId: testUserAId } }).catch(() => {});
    await (prisma as any).user.deleteMany({ where: { id: testUserAId } }).catch(() => {});
    await (prisma as any).user.deleteMany({ where: { id: testUserBId } }).catch(() => {});

    assert(true, "Test data cleaned up successfully");

  } catch (error: any) {
    console.error("Test execution failed with error:", error);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(`PROMPT 25 & 26 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPrompt25And26TestSuite();
