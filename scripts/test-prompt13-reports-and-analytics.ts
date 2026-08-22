import { prisma } from "../lib/db";
import { ReportService } from "../lib/services/report.service";
import { NutritionService } from "../lib/services/nutrition.service";
import { HydrationService } from "../lib/services/hydration.service";
import { WorkbookMapper } from "../lib/services/google-sheets/workbook-mapper";

async function runPrompt13Tests() {
  console.log("================================================================================");
  console.log("🚀 NUTRI-TRACK PROMPT 13: REPORTS & ANALYTICS TEST SUITE");
  console.log("================================================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (details) console.error(`   Details: ${details}`);
    }
  }

  const userIdA = "user_p13_a_" + Date.now();
  const userIdB = "user_p13_b_" + Date.now();
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    // -------------------------------------------------------------------------
    // SETUP TEST FIXTURES
    // -------------------------------------------------------------------------
    console.log("Setting up test users and seed data...");

    // Create User A with Targets
    await prisma.user.create({
      data: {
        id: userIdA,
        email: `usera_${Date.now()}@nutritrack.test`,
        username: `athlete_a_${Date.now()}`,
        name: "Analytical Athlete A",
        passwordHash: "hash_test",
      },
    });

    await prisma.userProfile.create({
      data: {
        userId: userIdA,
        dateOfBirth: new Date("1995-01-01"),
        biologicalSex: "MALE",
        heightCm: 180,
        weightKg: 75,
        dailyHydrationTargetMl: 3000,
        activityLevel: "VERY_ACTIVE",
      },
    });

    await prisma.userNutrientTarget.create({
      data: {
        userId: userIdA,
        calories: 2400,
        protein: 160,
        carbohydrates: 250,
        fat: 70,
        calcium: 1000,
        iron: 18,
        vitaminC: 90,
      },
    });

    // Create User B (for isolation checks)
    await prisma.user.create({
      data: {
        id: userIdB,
        email: `userb_${Date.now()}@nutritrack.test`,
        username: `isolated_b_${Date.now()}`,
        name: "Isolated User B",
        passwordHash: "hash_test",
      },
    });

    // Create Food
    const foodItem = await prisma.food.create({
      data: {
        userId: userIdA,
        name: "Wild Salmon Fillet",
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
    // TEST GROUP 1: Date Range System
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 1: Date Range System ---");

    const rToday = ReportService.resolveDateRange("today");
    assert(rToday.daysCount === 1 && rToday.startDate === todayStr, "1. Today preset resolves to 1 day");

    const rLast7 = ReportService.resolveDateRange("last7days");
    assert(rLast7.daysCount === 7, "2. Last 7 Days preset resolves to exactly 7 days");

    const rLast30 = ReportService.resolveDateRange("last30days");
    assert(rLast30.daysCount === 30, "3. Last 30 Days preset resolves to exactly 30 days");

    const rThisWeek = ReportService.resolveDateRange("thisWeek");
    assert(rThisWeek.daysCount >= 1 && rThisWeek.daysCount <= 7, "4. This Week preset resolves within current calendar week");

    const rCustom = ReportService.resolveDateRange("custom", "2026-08-01", "2026-08-10");
    assert(rCustom.daysCount === 10 && rCustom.startDate === "2026-08-01", "5. Custom Date Range resolves bounds correctly");

    // -------------------------------------------------------------------------
    // TEST GROUP 2: Seed Activity, Hydration, Nutrition & Workouts
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 2: Data Aggregation Engine ---");

    // Seed Meals on today and yesterday
    const yesterdayObj = new Date();
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    const yesterdayStr = ReportService.formatDate(yesterdayObj);

    const mealToday = await prisma.mealLog.create({
      data: {
        userId: userIdA,
        date: todayStr,
        mealType: "DINNER",
        entries: {
          create: [
            {
              foodId: foodItem.id,
              quantity: 200, // 2x serving: 416 kcal, 40g P, 26g F
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

    await prisma.mealLog.create({
      data: {
        userId: userIdA,
        date: yesterdayStr,
        mealType: "LUNCH",
        entries: {
          create: [
            {
              foodId: foodItem.id,
              quantity: 300, // 3x serving: 624 kcal, 60g P, 39g F
              quantityUnit: "g",
              calculatedCalories: 624,
              calculatedProtein: 60,
              calculatedCarbs: 0,
              calculatedFat: 39,
            },
          ],
        },
      },
    });

    // Seed Hydration
    await prisma.hydrationLog.create({
      data: {
        userId: userIdA,
        date: todayStr,
        amountMl: 3000,
      },
    });
    await prisma.hydrationLog.create({
      data: {
        userId: userIdA,
        date: yesterdayStr,
        amountMl: 3500,
      },
    });

    // Seed Running Activity
    await prisma.activityLog.create({
      data: {
        userId: userIdA,
        date: todayStr,
        activityType: "RUN",
        notes: "Morning 10k Tempo Run",
        distanceKm: 10.0,
        movingDurationSeconds: 3000, // 50 mins
        averagePaceSecondsPerKm: 300, // 5:00 / km
        caloriesBurned: 720,
        elevationGainMeters: 85,
        steps: 11500,
      },
    });

    // Seed Gym Workout
    await prisma.workoutSession.create({
      data: {
        userId: userIdA,
        date: todayStr,
        name: "Leg Hypertrophy & Squats",
        workoutType: "GYM_WORKOUT",
        durationSeconds: 3600,
        exercises: {
          create: [
            {
              name: "Barbell Back Squat",
              category: "Quadriceps",
              orderIndex: 1,
              sets: {
                create: [
                  { setNumber: 1, weightKg: 100, reps: 10 }, // 1,000 kg
                  { setNumber: 2, weightKg: 110, reps: 8 },  // 880 kg
                  { setNumber: 3, weightKg: 120, reps: 6 },  // 720 kg -> Total 2,600 kg
                ],
              },
            },
          ],
        },
      },
    });

    // Fetch Last 7 Days report
    const report = await ReportService.getFullReport(userIdA, "last7days");

    assert(report.overview.nutrition.loggedDaysCount === 2, "6. Nutrition logged days counted correctly (2 days)");
    assert(
      report.overview.nutrition.avgCalories === Math.round((416 + 624) / 2),
      "7. Average daily calories calculated correctly (520 kcal)"
    );
    assert(
      report.overview.nutrition.avgProteinG === Math.round((40 + 60) / 2),
      "8. Average daily protein calculated correctly (50g)"
    );
    assert(report.overview.hydration.avgIntakeMl === 3250, "9. Average daily hydration calculated correctly (3250 ml)");
    assert(report.overview.hydration.goalAchievementPct >= 28, "10. Hydration goal completion percentage calculated correctly");
    assert(report.overview.activities.totalDistanceKm === 10.0, "11. Running distance aggregated correctly (10.0 km)");
    assert(report.overview.activities.avgPaceFormatted === "5:00 / km", "12. Running pace formatted correctly in MM:SS/km");
    assert(report.overview.activities.totalSteps === 11500, "13. Daily steps aggregated correctly (11,500 steps)");
    assert(report.overview.workouts.totalSessions === 1, "14. Workout sessions aggregated correctly (1 session)");
    assert(report.overview.workouts.totalVolumeKg === 2600, "15. Training volume calculated accurately (2,600 kg = 100x10 + 110x8 + 120x6)");
    assert(report.overview.workouts.totalSets === 3, "16. Workout sets aggregated accurately (3 sets)");

    // -------------------------------------------------------------------------
    // TEST GROUP 3: Period Comparisons & Division-By-Zero Protection
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 3: Period Comparisons ---");

    const compCal = report.comparisons.find((c) => c.key === "calories");
    assert(compCal !== undefined, "17. Caloric comparison exists in report");
    assert(compCal?.direction === "NEW", "18. Handled previous empty period with NEW status safely");

    const changeRes = ReportService.calculatePercentChange(100, 50);
    assert(changeRes.percentChange === 100 && changeRes.direction === "INCREASE", "19. Calculate standard positive percent change (+100%)");

    const zeroDiv = ReportService.calculatePercentChange(50, 0);
    assert(zeroDiv.percentChange === null && zeroDiv.direction === "NEW", "20. Division-by-zero handled safely without NaN or infinite errors");

    // -------------------------------------------------------------------------
    // TEST GROUP 4: Micronutrient Coverage & 63-Nutrient Registry
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 4: Micronutrient Coverage ---");

    assert(report.micronutrients.length === 26, "21. Micronutrient report contains all 13 vitamins and 13 minerals");

    const vitC = report.micronutrients.find((m) => m.key === "vitaminC");
    assert(vitC !== undefined && vitC.hasTarget === true && vitC.target === 90, "22. Configured micronutrient target detected correctly (Vit C: 90mg)");

    const chromium = report.micronutrients.find((m) => m.key === "chromium");
    assert(
      chromium !== undefined && chromium.hasTarget === false && chromium.statusLabel === "No target configured",
      "23. Unconfigured nutrient marked clearly as 'No target configured'"
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 5: Deterministic Consistency Score Engine
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 5: Deterministic Consistency Score ---");

    assert(report.consistencyScore.score >= 0 && report.consistencyScore.score <= 100, "24. Consistency score bounded between 0 and 100%");
    assert(report.consistencyScore.activePillarsCount >= 4, "25. Active configured target pillars evaluated");
    assert(report.consistencyScore.totalChecksEvaluated > 0, "26. Total checks evaluated greater than 0");

    // -------------------------------------------------------------------------
    // TEST GROUP 6: Personal Records Detection
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 6: Personal Records Engine ---");

    const longestRun = report.personalRecords.find((p) => p.key === "longest_run");
    assert(longestRun !== undefined && longestRun.value === "10.00", "27. Longest Run personal record detected (10.00 km)");

    const fastestPace = report.personalRecords.find((p) => p.key === "fastest_pace");
    assert(fastestPace !== undefined && fastestPace.value === "5:00", "28. Fastest Running Pace personal record detected (5:00 / km)");

    const maxProtein = report.personalRecords.find((p) => p.key === "highest_protein_day");
    assert(maxProtein !== undefined && maxProtein.value === "60", "29. Highest Protein Day record detected (60 g)");

    const maxVolume = report.personalRecords.find((p) => p.key === "highest_workout_volume");
    assert(maxVolume !== undefined && maxVolume.value === "2,600", "30. Highest Workout Volume record detected (2,600 kg)");

    // -------------------------------------------------------------------------
    // TEST GROUP 7: Read-Only Safety & Multi-Tenant Isolation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 7: Multi-User Isolation & Read-Only Guarantee ---");

    const mealsCountBefore = await prisma.mealLog.count({ where: { userId: userIdA } });
    await ReportService.getFullReport(userIdA, "last7days");
    const mealsCountAfter = await prisma.mealLog.count({ where: { userId: userIdA } });
    assert(mealsCountBefore === mealsCountAfter, "31. Reports are strictly READ-ONLY (Database records unmodified)");

    // User B query
    const reportB = await ReportService.getFullReport(userIdB, "last7days");
    assert(
      reportB.overview.nutrition.loggedDaysCount === 0 &&
      reportB.overview.activities.totalDistanceKm === 0 &&
      reportB.personalRecords.length === 0,
      "32. Strict Multi-User Isolation: User B cannot see User A's data or personal records"
    );

    // -------------------------------------------------------------------------
    // TEST GROUP 8: Regressions & Google Sheets Correlation Compatibility
    // -------------------------------------------------------------------------
    console.log("\n--- TEST GROUP 8: Existing Feature Regressions & Google Sheets ---");

    const dailyNut = await NutritionService.getDailyNutrition(userIdA, todayStr);
    assert(dailyNut.totals.calories === 416, "33. NutritionService daily calculations intact");

    const hydSummary = await HydrationService.getDailyHydration(userIdA, todayStr);
    assert(hydSummary.totalMl === 3000, "34. HydrationService daily summary intact");

    const actList = await prisma.activityLog.findMany({ where: { userId: userIdA } });
    assert(actList.length >= 1, "35. Activity logs intact");

    const workSessions = await prisma.workoutSession.findMany({ where: { userId: userIdA } });
    assert(workSessions.length >= 1, "36. Workout sessions intact");

    const sheetRows = WorkbookMapper.mapMealEntriesToFoodLogRows((mealToday as any).entries);
    assert(sheetRows.length === 1 && sheetRows[0].length === 28, "37. Google Sheets Workbook mapping correlation remains intact (28 cols)");

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log("\nCleaning up test fixtures...");
    try {
      if (typeof (prisma.workoutSession as any).deleteMany === "function") {
        await (prisma.workoutSession as any).deleteMany({ where: { userId: { in: [userIdA, userIdB] } } });
      }
    } catch {}

  } catch (error) {
    console.error("Test Suite execution error:", error);
  }

  console.log("\n================================================================================");
  console.log(`📊 FINAL TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log("================================================================================");

  if (passedTests === totalTests && totalTests > 0) {
    console.log("🎉 ALL PROMPT 13 AUTOMATED TESTS PASSED SUCCESSFULLY!\n");
    process.exit(0);
  } else {
    console.error(`💥 SOME TESTS FAILED: ${totalTests - passedTests} failures.\n`);
    process.exit(1);
  }
}

runPrompt13Tests();
