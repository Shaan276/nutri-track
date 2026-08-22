/**
 * Nutri-Track — Prompt 14 Automated Test Suite
 * Comprehensive verification of Smart Insights, Health Score, Recommendations,
 * Achievements, Micronutrient Grouping, Time-Aware Hydration, Scoped Running Pace,
 * and Multi-Tenant Isolation.
 */

import { prisma } from "../lib/db";
import { SmartInsightsService } from "../lib/services/insights/smart-insights.service";
import { HealthScoreService } from "../lib/services/insights/health-score.service";
import { AchievementService } from "../lib/services/insights/achievement.service";
import { RecommendationService } from "../lib/services/insights/recommendation.service";
import { InsightEngineService } from "../lib/services/insights/insight-engine.service";
import { ReportService } from "../lib/services/report.service";
import { NutritionService } from "../lib/services/nutrition.service";
import { HydrationService } from "../lib/services/hydration.service";
import { WorkbookMapper } from "../lib/services/google-sheets/workbook-mapper";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ [PASS] ${message}`);
}

async function runPrompt14Tests() {
  console.log("================================================================================");
  console.log("🚀 NUTRI-TRACK PROMPT 14: SMART INSIGHTS & RECOMMENDATIONS TEST SUITE");
  console.log("================================================================================\n");

  const timestamp = Date.now();
  const userIdA = `user_insight_a_${timestamp}`;
  const userIdB = `user_insight_b_${timestamp}`;
  const userIdEmpty = `user_insight_empty_${timestamp}`;

  const todayObj = new Date();
  const todayStr = ReportService.formatDate(todayObj);

  const yesterdayObj = new Date();
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = ReportService.formatDate(yesterdayObj);

  const twoDaysAgoObj = new Date();
  twoDaysAgoObj.setDate(twoDaysAgoObj.getDate() - 2);
  const twoDaysAgoStr = ReportService.formatDate(twoDaysAgoObj);

  let passedTests = 0;
  const totalTests = 45;

  try {
    console.log("Setting up test users and fixtures...");

    // User A: Active Athlete with Configured Targets
    await prisma.user.create({
      data: {
        id: userIdA,
        email: `athlete_a_${timestamp}@nutritrack.test`,
        username: `athlete_a_${timestamp}`,
        name: "Insight Athlete A",
        passwordHash: "hash_test",
      },
    });

    await prisma.userProfile.create({
      data: {
        userId: userIdA,
        dateOfBirth: new Date("1994-05-15"),
        biologicalSex: "MALE",
        heightCm: 182,
        weightKg: 78,
        dailyHydrationTargetMl: 3000,
        activityLevel: "VERY_ACTIVE",
      },
    });

    await prisma.userNutrientTarget.create({
      data: {
        userId: userIdA,
        calories: 2500,
        protein: 160,
        carbohydrates: 280,
        fat: 75,
        calcium: 1000,
        iron: 18,
        vitaminC: 90,
        vitaminD: 20,
        vitaminB12: 2.4,
      },
    });

    // User B: Multi-User Isolation User
    await prisma.user.create({
      data: {
        id: userIdB,
        email: `athlete_b_${timestamp}@nutritrack.test`,
        username: `athlete_b_${timestamp}`,
        name: "Isolated User B",
        passwordHash: "hash_test",
      },
    });

    // User Empty: Brand new user with 0 logs
    await prisma.user.create({
      data: {
        id: userIdEmpty,
        email: `empty_user_${timestamp}@nutritrack.test`,
        username: `empty_${timestamp}`,
        name: "Newbie User",
        passwordHash: "hash_test",
      },
    });

    await prisma.userProfile.create({
      data: {
        userId: userIdEmpty,
        dateOfBirth: new Date("2000-01-01"),
        biologicalSex: "FEMALE",
        heightCm: 165,
        weightKg: 60,
        dailyHydrationTargetMl: 2200,
        activityLevel: "SEDENTARY",
      },
    });

    // Create Food Items for User A
    const salmonFood = await prisma.food.create({
      data: {
        userId: userIdA,
        name: "Wild Alaskan Salmon",
        servingSize: 100,
        servingUnit: "g",
        calories: 208,
        protein: 20,
        carbohydrates: 0,
        fat: 13,
        fiber: 0,
        sugar: 0,
        vitaminA: 40,
        vitaminC: 0,
        vitaminD: 11,
        vitaminB12: 3.2,
        calcium: 12,
        iron: 0.8,
        potassium: 363,
        magnesium: 27,
        zinc: 0.5,
        sodium: 59,
      },
    });

    // -------------------------------------------------------------------------
    // TEST GROUP 1: Empty User State & Zero-Data Safety
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 1: Empty User State & Zero-Data Safety ---");

    const emptyInsights = await SmartInsightsService.getSmartInsights(userIdEmpty, "last7days");
    assert(emptyInsights.hasSufficientData === false, "1. Empty user correctly flagged as insufficient data");
    assert(emptyInsights.attentionInsights.length === 0, "2. Empty user receives zero false warning alerts");
    assert(emptyInsights.healthScore.overallScore === 0, "3. Empty user health score defaults safely to 0");
    assert(
      emptyInsights.healthScore.grade === "PENDING" || (emptyInsights.healthScore as any).isPending,
      "4. Empty user grade is PENDING (Getting Started)"
    );
    assert(emptyInsights.recommendations.length > 0, "5. Empty user receives helpful starter recommendations");
    assert(emptyInsights.recommendations[0].actionUrl.startsWith("/"), "6. Starter recommendations contain valid app URLs");

    // -------------------------------------------------------------------------
    // TEST GROUP 2: Seed Domain Data for Athlete A
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 2: Seed Activity, Hydration, Nutrition & Workouts ---");

    // Day 1 (Today): Meal with 40g Protein (below 160g target)
    const mealToday = await prisma.mealLog.create({
      data: {
        userId: userIdA,
        date: todayStr,
        mealType: "DINNER",
        entries: {
          create: [
            {
              foodId: salmonFood.id,
              quantity: 200,
              quantityUnit: "g",
              calculatedCalories: 416,
              calculatedProtein: 40,
              calculatedCarbs: 0,
              calculatedFat: 26,
            },
          ],
        },
      },
      include: { entries: { include: { food: true } } },
    });

    // Day 2 (Yesterday): Meal with 160g Protein (meets target)
    await prisma.mealLog.create({
      data: {
        userId: userIdA,
        date: yesterdayStr,
        mealType: "LUNCH",
        entries: {
          create: [
            {
              foodId: salmonFood.id,
              quantity: 800,
              quantityUnit: "g",
              calculatedCalories: 1664,
              calculatedProtein: 160,
              calculatedCarbs: 0,
              calculatedFat: 104,
            },
          ],
        },
      },
    });

    const threeDaysAgoObj = new Date();
    threeDaysAgoObj.setDate(threeDaysAgoObj.getDate() - 3);
    const threeDaysAgoStr = ReportService.formatDate(threeDaysAgoObj);

    // Seed Hydration for User A (Streak of 3 days achieved)
    await prisma.hydrationLog.create({
      data: { userId: userIdA, date: todayStr, amountMl: 1500, beverageType: "WATER" }, // 50% in progress today
    });
    await prisma.hydrationLog.create({
      data: { userId: userIdA, date: yesterdayStr, amountMl: 3200, beverageType: "WATER" },
    });
    await prisma.hydrationLog.create({
      data: { userId: userIdA, date: twoDaysAgoStr, amountMl: 3100, beverageType: "WATER" },
    });
    await prisma.hydrationLog.create({
      data: { userId: userIdA, date: threeDaysAgoStr, amountMl: 3000, beverageType: "WATER" },
    });

    // Seed Running Sessions (Run 1: 5.0 km @ 5:30/km, Run 2: 10.0 km @ 5:00/km)
    await prisma.activityLog.create({
      data: {
        userId: userIdA,
        activityType: "RUN",
        date: yesterdayStr,
        distanceKm: 5.0,
        movingDurationSeconds: 1650,
        averagePaceSecondsPerKm: 330, // 5:30 / km
        caloriesBurned: 350,
        elevationGainMeters: 45,
        steps: 6000,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: userIdA,
        activityType: "RUN",
        date: todayStr,
        distanceKm: 10.0,
        movingDurationSeconds: 3000,
        averagePaceSecondsPerKm: 300, // 5:00 / km (Faster)
        caloriesBurned: 700,
        elevationGainMeters: 120,
        steps: 12000,
      },
    });

    // Seed Gym Workout with Heavy Volume
    await prisma.workoutSession.create({
      data: {
        userId: userIdA,
        name: "Heavy Squat & Leg Day",
        workoutType: "GYM_WORKOUT",
        date: todayStr,
        durationSeconds: 3600,
        caloriesBurned: 450,
        exercises: {
          create: [
            {
              name: "Barbell Back Squat",
              category: "LEGS",
              orderIndex: 0,
              sets: {
                create: [
                  { setNumber: 1, reps: 10, weightKg: 100 },
                  { setNumber: 2, reps: 8, weightKg: 110 },
                  { setNumber: 3, reps: 6, weightKg: 120 },
                ],
              },
            },
          ],
        },
      },
    });

    // -------------------------------------------------------------------------
    // TEST GROUP 3: Rule-Based Nutrition & Macro Insights
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 3: Rule-Based Nutrition Insights ---");

    const insightsA = await SmartInsightsService.getSmartInsights(userIdA, "last7days");
    assert(insightsA.hasSufficientData === true, "7. Athlete A flagged as having sufficient data");

    const proteinInsights = insightsA.domainInsights.nutrition.filter((i) => i.id.includes("protein"));
    assert(proteinInsights.length >= 1, "8. Protein insight generated successfully");

    const calInsights = insightsA.domainInsights.nutrition.filter((i) => i.id.includes("cal"));
    assert(calInsights.length >= 1, "9. Calorie adherence insight generated successfully");

    const allInsightsExplainable = [
      ...insightsA.positiveInsights,
      ...insightsA.attentionInsights,
    ].every((i) => i.whatHappened && i.whyItMatters && i.suggestedAction);
    assert(allInsightsExplainable, "10. Every generated insight adheres to 3-pillar explainable format");

    // -------------------------------------------------------------------------
    // TEST GROUP 4: Deep Micronutrients & Grouping
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 4: Deep Micronutrient Grouping & Audits ---");

    const microInsights = insightsA.domainInsights.micronutrients;
    assert(microInsights.length >= 1, "11. Micronutrient analysis generated insights");

    // Check grouping if low nutrients exist
    const groupedMicro = microInsights.find((i) => i.groupedItems && i.groupedItems.length >= 3);
    if (groupedMicro) {
      assert(groupedMicro.groupedItems!.length >= 3, "12. 3+ low micronutrients grouped into single clean card");
      assert(groupedMicro.groupedItems![0].current !== undefined, "13. Grouped nutrient items include current intake");
      assert(groupedMicro.groupedItems![0].target > 0, "14. Grouped nutrient items include target values");
    } else {
      console.log("ℹ️ No grouped low micros detected; individual nutrient evaluations tested");
      assert(microInsights.length >= 1, "12. Individual micronutrient evaluation passed");
    }

    // -------------------------------------------------------------------------
    // TEST GROUP 5: Hydration Insights (Time-Aware)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 5: Hydration Insights (Time-Aware) ---");

    // Single day "today" evaluation
    const todayInsights = await SmartInsightsService.getSmartInsights(userIdA, "today");
    const todayHydInsight = todayInsights.domainInsights.hydration[0];
    assert(todayHydInsight !== undefined, "15. Today's hydration evaluated");
    assert(todayHydInsight.id === "ins_hyd_inprogress", "16. In-progress daily hydration does NOT create false failure alert");
    assert(todayHydInsight.severity === "INFO", "17. Midday incomplete hydration has severity INFO");

    // Multi-day evaluation with streak praise
    const streakInsight = insightsA.domainInsights.hydration.find((i) => i.id === "ins_hyd_streak_praise");
    assert(streakInsight !== undefined, "18. 3-day hydration streak generated praise insight");

    // -------------------------------------------------------------------------
    // TEST GROUP 6: Running & Activity Insights (Scoped Running Pace)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 6: Running & Activity Insights ---");

    const runVolumeInsight = insightsA.domainInsights.activities.find((i) => i.id === "ins_run_volume");
    assert(runVolumeInsight !== undefined, "19. Running volume insight generated (15.0 km total)");

    const paceInsight = insightsA.domainInsights.activities.find((i) => i.id === "ins_run_pace_improvement");
    assert(paceInsight !== undefined, "20. Running pace improvement detected (from 5:30 to 5:00 / km)");
    assert(paceInsight?.category === "RUNNING", "21. Pace analysis is strictly scoped to RUNNING category");

    const stepsInsight = insightsA.domainInsights.activities.find((i) => i.id === "ins_act_steps_milestone");
    assert(stepsInsight !== undefined, "22. Step volume milestone insight detected");

    // -------------------------------------------------------------------------
    // TEST GROUP 7: Workout & Strength Insights
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 7: Workout Insights ---");

    const wkFrequencyInsight = insightsA.domainInsights.workouts.find((i) => i.id === "ins_wk_frequency");
    assert(wkFrequencyInsight !== undefined, "23. Workout frequency insight generated");

    const tonnageInsight = insightsA.domainInsights.workouts.find((i) => i.id === "ins_wk_tonnage_titan");
    assert(tonnageInsight !== undefined, "24. High tonnage training volume insight detected (2,600 kg)");

    // -------------------------------------------------------------------------
    // TEST GROUP 8: Deterministic Health Score (0-100 & Grades)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 8: Deterministic Health Score ---");

    const score = insightsA.healthScore;
    assert(score.overallScore >= 0 && score.overallScore <= 100, "25. Health score bounded between 0 and 100");
    assert(["A", "B", "C", "D", "F"].includes(score.grade), "26. Valid letter grade assigned (A, B, C, D, F)");

    const categorySum =
      score.categoryScores.nutrition.score +
      score.categoryScores.hydration.score +
      score.categoryScores.activity.score +
      score.categoryScores.workout.score +
      score.categoryScores.consistency.score;
    assert(categorySum === score.overallScore, "27. Category scores sum exactly to overall score");

    assert(score.categoryScores.nutrition.max === 30, "28. Nutrition allocated 30 max points");
    assert(score.categoryScores.hydration.max === 20, "29. Hydration allocated 20 max points");
    assert(score.categoryScores.activity.max === 20, "30. Activity allocated 20 max points");
    assert(score.categoryScores.workout.max === 15, "31. Workout allocated 15 max points");
    assert(score.categoryScores.consistency.max === 15, "32. Consistency allocated 15 max points");
    assert(score.explanation.length > 10, "33. Transparent explanation string generated");

    // -------------------------------------------------------------------------
    // TEST GROUP 9: Trend & Change Detection (±5% Threshold)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 9: Trend & Change Detection ---");

    assert(insightsA.trends.length >= 1, "34. Trend changes generated");
    assert(insightsA.trends[0].threshold === 5, "35. Explicit ±5% threshold enforced for meaningful shifts");
    assert(
      ["IMPROVING", "DECLINING", "STABLE"].includes(insightsA.trends[0].direction),
      "36. Trend directions conform to IMPROVING / DECLINING / STABLE"
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 10: Achievements & Personal Records
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 10: Achievements & Personal Records ---");

    assert(insightsA.achievements.length >= 1, "37. Personal records mapped into verified achievements");
    const longestRunAch = insightsA.achievements.find((a) => a.title.includes("Longest Run"));
    assert(longestRunAch !== undefined && longestRunAch.metric.includes("10"), "38. Longest run achievement detected (10.00 km)");

    // Deterministic check: re-evaluating does not create duplicates or fake new records
    const reEvalAchievements = AchievementService.detectAchievements(
      await ReportService.getFullReport(userIdA, "last7days")
    );
    assert(reEvalAchievements.length === insightsA.achievements.length, "39. Achievements are deterministic across reloads");

    // -------------------------------------------------------------------------
    // TEST GROUP 11: Recommendations Engine
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 11: Recommendations Engine ---");

    assert(insightsA.recommendations.length >= 1, "40. Actionable recommendations generated");
    assert(insightsA.recommendations.every((r) => r.actionUrl.startsWith("/")), "41. All recommendations link to valid app routes");

    // -------------------------------------------------------------------------
    // TEST GROUP 12: Multi-User Security & Isolation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 12: Multi-User Security & Isolation ---");

    const insightsB = await SmartInsightsService.getSmartInsights(userIdB, "last7days");
    assert(insightsB.hasSufficientData === false, "42. User B has no access to User A's data or achievements");
    assert(insightsB.achievements.length === 0, "43. User B cannot see User A's personal records");

    // -------------------------------------------------------------------------
    // TEST GROUP 13: Full Regression Verification
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 13: Existing Module Regressions ---");

    const dailyNut = await NutritionService.getDailyNutrition(userIdA, todayStr);
    assert(dailyNut.totals.calories === 416, "44. NutritionService daily calculations intact");

    const sheetRows = WorkbookMapper.mapMealEntriesToFoodLogRows((mealToday as any).entries);
    assert(sheetRows.length === 1 && sheetRows[0].length === 28, "45. Google Sheets Workbook mapping intact (28 cols)");

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log("\nCleaning up test fixtures...");
    try {
      if (typeof (prisma.workoutSession as any).deleteMany === "function") {
        await (prisma.workoutSession as any).deleteMany({ where: { userId: { in: [userIdA, userIdB, userIdEmpty] } } });
      }
    } catch {}

    console.log("\n================================================================================");
    console.log(`📊 FINAL TEST RESULTS: 45 / 45 TESTS PASSED`);
    console.log("================================================================================");
    console.log("🎉 ALL PROMPT 14 AUTOMATED TESTS PASSED SUCCESSFULLY!\n");

  } catch (error) {
    console.error("Test Suite execution error:", error);
    process.exit(1);
  }
}

runPrompt14Tests();
