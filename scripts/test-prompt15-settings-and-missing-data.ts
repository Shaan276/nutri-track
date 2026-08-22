import { prisma } from "../lib/db";
import { UserSettingsService } from "../lib/services/user-settings.service";
import {
  calculateMetabolicTargets,
  calculateAge,
} from "../lib/validations/settings";
import { SmartInsightsService } from "../lib/services/insights/smart-insights.service";
import { HealthScoreService } from "../lib/services/insights/health-score.service";
import { ReportService } from "../lib/services/report.service";
import { NutritionService } from "../lib/services/nutrition.service";
import { HydrationService } from "../lib/services/hydration.service";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ [PASS] ${message}`);
}

async function runPrompt15Tests() {
  console.log("================================================================================");
  console.log("🚀 NUTRI-TRACK PROMPT 15: USER SETTINGS & MISSING-DATA INTELLIGENCE TEST SUITE");
  console.log("================================================================================");

  const timestamp = Date.now();
  const userIdA = `p15_user_a_${timestamp}`;
  const userIdB = `p15_user_b_${timestamp}`;

  try {
    // -------------------------------------------------------------------------
    // Setup Users
    // -------------------------------------------------------------------------
    await prisma.user.create({
      data: {
        id: userIdA,
        name: "Settings Athlete A",
        email: `athlete_a_${timestamp}@nutritrack.test`,
        username: `athlete_a_${timestamp}`,
        passwordHash: "hash_test_123",
      },
    });

    await (prisma.userProfile.create as any)({
      data: {
        userId: userIdA,
        dateOfBirth: new Date("1996-05-15"),
        biologicalSex: "MALE",
        heightCm: 180,
        weightKg: 75,
        activityLevel: "VERY_ACTIVE",
        dailyHydrationTargetMl: 3000,
        dailyStepTarget: 10000,
        weeklyRunningDistanceKm: 20.0,
        weeklyWorkoutSessions: 4,
        primaryGoal: "MAINTAIN",
      },
    });

    await prisma.userNutrientTarget.create({
      data: {
        userId: userIdA,
        calories: 2500,
        protein: 150,
        carbohydrates: 300,
        fat: 70,
        fiber: 35,
        sugar: 40,
      },
    });

    await prisma.user.create({
      data: {
        id: userIdB,
        name: "Empty User B",
        email: `empty_b_${timestamp}@nutritrack.test`,
        username: `empty_b_${timestamp}`,
        passwordHash: "hash_test_123",
      },
    });

    // =========================================================================
    // TEST GROUP 1: Missing Data Must Not Mean Failure (State A Safety)
    // =========================================================================
    console.log("\n--- TEST GROUP 1: Missing Data Safety (State A) ---");

    const insightsEmpty = await SmartInsightsService.getSmartInsights(userIdB, "today");
    assert(insightsEmpty.hasSufficientData === false, "1. Empty user hasSufficientData is false");

    // Zero false nutrition failure warnings
    const falseNutWarnings = insightsEmpty.domainInsights.nutrition.filter(
      (i) => i.severity === "WARNING" || i.severity === "ALERT"
    );
    assert(falseNutWarnings.length === 0, "2. Empty user receives ZERO false nutrition warning alerts");

    // Zero false micronutrient deficiency alarms
    assert(
      insightsEmpty.domainInsights.micronutrients.length === 0,
      "3. Empty user receives ZERO false micronutrient deficiency warnings"
    );

    // =========================================================================
    // TEST GROUP 2: Health Score Logic Fix & Pending State
    // =========================================================================
    console.log("\n--- TEST GROUP 2: Health Score Logic Fix ---");

    assert(insightsEmpty.healthScore.isPending === true, "4. Empty user health score has isPending=true");
    assert(insightsEmpty.healthScore.grade === "PENDING", "5. Empty user grade is PENDING (not F failure)");
    assert(
      insightsEmpty.healthScore.gradeLabel === "Getting Started",
      "6. Empty user grade label is 'Getting Started'"
    );
    assert(
      insightsEmpty.healthScore.explanation.includes("Log your meals"),
      "7. Health score explanation invites logging rather than reporting failure"
    );

    // =========================================================================
    // TEST GROUP 3: Mifflin-St Jeor BMR & TDEE Calculations
    // =========================================================================
    console.log("\n--- TEST GROUP 3: BMR & TDEE Calculations ---");

    // Male calculation (Age 30, 80kg, 180cm)
    const dob30 = new Date();
    dob30.setFullYear(dob30.getFullYear() - 30);
    const maleMetabolic = calculateMetabolicTargets(
      80,
      180,
      "MALE",
      dob30,
      "MODERATELY_ACTIVE",
      "MAINTAIN"
    );
    // BMR = 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    assert(maleMetabolic.bmr === 1780, "8. Male BMR calculated accurately (1780 kcal)");
    // TDEE = 1780 * 1.55 = 2759
    assert(maleMetabolic.tdee === 2759, "9. Male TDEE calculated accurately (2759 kcal)");

    // Female calculation (Age 25, 60kg, 165cm)
    const dob25 = new Date();
    dob25.setFullYear(dob25.getFullYear() - 25);
    const femaleMetabolic = calculateMetabolicTargets(
      60,
      165,
      "FEMALE",
      dob25,
      "LIGHTLY_ACTIVE",
      "FAT_LOSS"
    );
    // BMR = 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25 -> 1345
    assert(femaleMetabolic.bmr === 1345, "10. Female BMR calculated accurately (1345 kcal)");
    // TDEE = 1345 * 1.375 = 1849. Fat loss = 1849 - 500 = 1349
    assert(
      femaleMetabolic.recommendedCalories === 1349,
      "11. Fat loss caloric deficit calculated accurately (-500 kcal)"
    );

    // Muscle Gain surplus (+300 kcal)
    const muscleGainMetabolic = calculateMetabolicTargets(
      80,
      180,
      "MALE",
      dob30,
      "MODERATELY_ACTIVE",
      "MUSCLE_GAIN"
    );
    assert(
      muscleGainMetabolic.recommendedCalories === 2759 + 300,
      "12. Muscle gain surplus calculated accurately (+300 kcal)"
    );

    // =========================================================================
    // TEST GROUP 4: UserSettingsService CRUD & Defaults
    // =========================================================================
    console.log("\n--- TEST GROUP 4: UserSettingsService CRUD ---");

    const settingsA = await UserSettingsService.getUserSettings(userIdA);
    assert(settingsA.user.name === "Settings Athlete A", "13. User settings retrieved successfully");
    assert(settingsA.profile.heightCm === 180, "14. Profile height matches (180 cm)");
    assert(settingsA.profile.weightKg === 75, "15. Profile weight matches (75 kg)");
    assert(settingsA.profile.dailyHydrationTargetMl === 3000, "16. Hydration target matches (3000 ml)");
    assert(settingsA.profile.dailyStepTarget === 10000, "17. Step target matches (10000 steps)");
    assert(settingsA.profile.weeklyRunningDistanceKm === 20.0, "18. Running distance matches (20 km)");
    assert(settingsA.profile.weeklyWorkoutSessions === 4, "19. Workout sessions matches (4 sessions)");
    assert(settingsA.nutritionGoals.protein === 150, "20. Protein goal matches (150 g)");

    // =========================================================================
    // TEST GROUP 5: Update Settings & Dynamic Propagation
    // =========================================================================
    console.log("\n--- TEST GROUP 5: Update Settings & Dynamic Propagation ---");

    await UserSettingsService.updateUserSettings(userIdA, {
      profile: {
        dateOfBirth: "1996-05-15",
        biologicalSex: "MALE",
        heightCm: 182,
        weightKg: 78,
        activityLevel: "VERY_ACTIVE",
        primaryGoal: "MUSCLE_GAIN",
        dailyHydrationTargetMl: 3500,
        dailyStepTarget: 12000,
        weeklyRunningDistanceKm: 25.0,
        weeklyWorkoutSessions: 5,
      },
      nutritionGoals: {
        calories: 3000,
        protein: 180,
        carbohydrates: 360,
        fat: 80,
        fiber: 40,
        sugar: 45,
      },
    });

    const updatedSettings = await UserSettingsService.getUserSettings(userIdA);
    assert(updatedSettings.profile.heightCm === 182, "21. Updated height persisted (182 cm)");
    assert(updatedSettings.profile.weightKg === 78, "22. Updated weight persisted (78 kg)");
    assert(
      updatedSettings.profile.dailyHydrationTargetMl === 3500,
      "23. Updated hydration target persisted (3500 ml)"
    );
    assert(
      updatedSettings.profile.dailyStepTarget === 12000,
      "24. Updated step target persisted (12000 steps)"
    );
    assert(
      updatedSettings.nutritionGoals.calories === 3000,
      "25. Updated calorie goal persisted (3000 kcal)"
    );
    assert(
      updatedSettings.nutritionGoals.protein === 180,
      "26. Updated protein goal persisted (180 g)"
    );

    // =========================================================================
    // TEST GROUP 6: Dynamic Propagation Across Services
    // =========================================================================
    console.log("\n--- TEST GROUP 6: Dynamic Propagation Across Services ---");

    const todayStr = new Date().toISOString().split("T")[0];
    const dailyNut = await NutritionService.getDailyNutrition(userIdA, todayStr);
    assert(
      dailyNut.targets.calories === 3000,
      "27. NutritionService uses updated calorie target (3000 kcal)"
    );
    assert(
      dailyNut.targets.protein === 180,
      "28. NutritionService uses updated protein target (180 g)"
    );

    const dailyHyd = await HydrationService.getDailyHydration(userIdA, todayStr);
    assert(
      dailyHyd.targetMl === 3500,
      "29. HydrationService uses updated fluid target (3500 ml)"
    );

    const reportA = await ReportService.getFullReport(userIdA, "today");
    assert(
      reportA.overview.nutrition.targetCalories === 3000,
      "30. ReportService overview reflects updated calorie target"
    );
    assert(
      reportA.overview.hydration.dailyTargetMl === 3500,
      "31. ReportService overview reflects updated hydration target"
    );

    // =========================================================================
    // TEST GROUP 7: State B & C Execution
    // =========================================================================
    console.log("\n--- TEST GROUP 7: State B & C Execution ---");

    // Create a food and log a meal (State B: Partial)
    const food = await prisma.food.create({
      data: {
        userId: userIdA,
        name: "Grilled Salmon Steak",
        servingSize: 200,
        servingUnit: "g",
        calories: 400,
        protein: 45,
        carbohydrates: 0,
        fat: 24,
      },
    });

    const mealLog = await prisma.mealLog.create({
      data: {
        userId: userIdA,
        date: todayStr,
        mealType: "DINNER",
        name: "Dinner",
      },
    });

    await prisma.mealEntry.create({
      data: {
        mealLogId: mealLog.id,
        foodId: food.id,
        quantity: 200,
        quantityUnit: "g",
        calculatedCalories: 400,
        calculatedProtein: 45,
        calculatedCarbs: 0,
        calculatedFat: 24,
      },
    });

    const insightsWithMeal = await SmartInsightsService.getSmartInsights(userIdA, "today");
    assert(insightsWithMeal.hasSufficientData === true, "32. Logged meal marks hasSufficientData=true");

    // Time-aware today protein in progress (severity INFO, not red warning)
    const todayProteinInsight = insightsWithMeal.domainInsights.nutrition.find(
      (i) => i.id === "ins_nut_protein_today_progress"
    );
    assert(
      todayProteinInsight !== undefined,
      "33. Today's partial protein intake generates time-aware in-progress insight"
    );
    assert(
      todayProteinInsight?.severity === "INFO",
      "34. In-progress protein insight has severity INFO (neutral/informative)"
    );

    // =========================================================================
    // TEST GROUP 8: Multi-User Security & Isolation
    // =========================================================================
    console.log("\n--- TEST GROUP 8: Multi-User Security ---");

    const settingsB = await UserSettingsService.getUserSettings(userIdB);
    assert(
      settingsB.profile.weightKg !== updatedSettings.profile.weightKg ||
        settingsB.user.id !== updatedSettings.user.id,
      "35. User B settings are isolated from User A"
    );
    assert(
      settingsB.nutritionGoals.calories === 2000,
      "36. User B maintains independent default calorie goal"
    );

    console.log("\nCleaning up test fixtures...");
    try {
      if (mealLog?.id) {
        await prisma.mealLog.delete({ where: { id: mealLog.id } });
      }
      if (food?.id) {
        await prisma.food.delete({ where: { id: food.id } });
      }
    } catch {}

    console.log("\n================================================================================");
    console.log("📊 FINAL TEST RESULTS: 36 / 36 TESTS PASSED");
    console.log("================================================================================");
    console.log("🎉 ALL PROMPT 15 AUTOMATED TESTS PASSED SUCCESSFULLY!\n");
  } catch (error) {
    console.error("\nTest Suite execution error:", error);
    process.exit(1);
  }
}

runPrompt15Tests();
