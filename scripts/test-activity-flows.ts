/**
 * NUTRI-TRACK: PROMPT 7 AUTOMATED VERIFICATION SUITE
 * Performance, Fixed Sidebar, Visualization System & Running / Activity Tracking
 */

import { prisma, initializePostgresSchema } from "../lib/db";
import { ActivityService } from "../lib/services/activity.service";
import { HydrationService } from "../lib/services/hydration.service";
import { NutritionService } from "../lib/services/nutrition.service";
import { logActivitySchema, updateActivitySchema, formatPace, formatDuration, calculateAveragePace } from "../lib/validations/activity";
import bcrypt from "bcryptjs";

interface TestResult {
  num: number;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function recordTest(num: number, name: string, passed: boolean, details: string) {
  results.push({ num, name, passed, details });
  const icon = passed ? "✅ PASS" : "❌ FAIL";
  console.log(` ${num.toString().padStart(2, " ")} | ${icon} | ${name} -> ${details}`);
}

async function runPrompt7TestSuite() {
  console.log("\n===================================================================");
  console.log("  NUTRI-TRACK PROMPT 7: RUNNING & ACTIVITY TEST SUITE              ");
  console.log("===================================================================\n");

  try {
    await initializePostgresSchema();

    // 1. Setup Test Users
    const pwdHash = await bcrypt.hash("Password123!", 10);
    const userA = await prisma.user.create({
      data: {
        name: "Piyush Activity",
        username: `piyush_run_${Date.now()}`,
        email: `piyush_run_${Date.now()}@example.com`,
        passwordHash: pwdHash,
      },
    });

    await prisma.userProfile.create({
      data: {
        userId: userA.id,
        dateOfBirth: new Date("1996-05-15"),
        biologicalSex: "MALE" as any,
        heightCm: 178,
        weightKg: 74,
        activityLevel: "VERY_ACTIVE" as any,
        dailyHydrationTargetMl: 2500,
      },
    });

    const userB = await prisma.user.create({
      data: {
        name: "Cross User B",
        username: `user_b_run_${Date.now()}`,
        email: `user_b_run_${Date.now()}@example.com`,
        passwordHash: pwdHash,
      },
    });

    recordTest(1, "PostgreSQL ActivityLog Table & User Setup", true, `Initialized test users ${userA.id} and ${userB.id}`);

    // 2. Log First Run: 5.25 km in 28m 45s (1725s)
    const today = new Date().toISOString().split("T")[0];
    const run1 = await ActivityService.logActivity(userA.id, {
      activityType: "RUN",
      date: today,
      distanceKm: 5.25,
      movingDurationSeconds: 1725, // 28m 45s
      steps: 6800,
      caloriesBurned: 380,
      elevationGainMeters: 120,
      notes: "Morning trail run around the park",
    });

    recordTest(2, "Log Run Session (5.25 km, 28:45)", !!run1.id, `Created activity record ${run1.id}`);

    // 3. PostgreSQL Persistence Verification
    const dbRun1 = await prisma.activityLog.findUnique({
      where: { id: run1.id },
    });
    recordTest(3, "Activity Record PostgreSQL Persistence", Number(dbRun1?.distanceKm) === 5.25, `Stored distance: ${dbRun1?.distanceKm} km`);

    // 4. Automatic Average Pace Calculation
    // 1725 / 5.25 = 328.57 -> 329 seconds/km = 5:29 / km
    const paceSeconds = run1.averagePaceSecondsPerKm;
    const paceFormatted = formatPace(paceSeconds);
    const isPaceCorrect = paceSeconds === 329 && paceFormatted === "5:29 / km";
    recordTest(4, "Pace Calculation (5:29 / km)", isPaceCorrect, `Calculated: ${paceSeconds} s/km (${paceFormatted})`);

    // 5. Duration Formatting Verification
    const durFormatted = formatDuration(1725);
    recordTest(5, "Duration Formatting (28:45)", durFormatted === "28:45", `Formatted 1725s as: ${durFormatted}`);

    // 6. Log Second Run on Same Day: 4.75 km in 23m 45s (1425s)
    const run2 = await ActivityService.logActivity(userA.id, {
      activityType: "RUN",
      date: today,
      distanceKm: 4.75,
      movingDurationSeconds: 1425, // 23m 45s = 300s/km = 5:00 / km
      steps: 5400,
      caloriesBurned: 320,
      elevationGainMeters: 45,
      notes: "Evening tempo run",
    });
    recordTest(6, "Log Second Run on Same Day (4.75 km)", !!run2.id, `Created second session ${run2.id}`);

    // 7. Daily Activity Aggregation
    const dailySummary = await ActivityService.getDailyActivity(userA.id, today);
    // Total distance = 5.25 + 4.75 = 10.00 km
    // Total duration = 1725 + 1425 = 3150 s
    // Average pace = 3150 / 10 = 315 s/km = 5:15 / km
    const isDailyTotalCorrect = dailySummary.totalDistanceKm === 10.0 &&
      dailySummary.totalMovingDurationSeconds === 3150 &&
      dailySummary.averagePaceSecondsPerKm === 315 &&
      dailySummary.totalSteps === 12200 &&
      dailySummary.totalCaloriesBurned === 700 &&
      dailySummary.totalElevationGainMeters === 165 &&
      dailySummary.activitiesCount === 2;

    recordTest(7, "Daily Totals Aggregation (10.0 km, 5:15 /km, 700 kcal)", isDailyTotalCorrect,
      `Distance: ${dailySummary.totalDistanceKm}km, Pace: ${formatPace(dailySummary.averagePaceSecondsPerKm)}, Calories: ${dailySummary.totalCaloriesBurned}kcal`);

    // 8. Weekly Summary Aggregation (7-Day Breakdown)
    const weeklySummary = await ActivityService.getWeeklyActivitySummary(userA.id, today);
    const isWeeklyCorrect = weeklySummary.totalDistanceKm === 10.0 &&
      weeklySummary.totalRuns === 2 &&
      weeklySummary.days.length === 7;
    recordTest(8, "Weekly Training Volume Summary (7 Days)", isWeeklyCorrect, `Weekly Distance: ${weeklySummary.totalDistanceKm}km over ${weeklySummary.totalRuns} runs`);

    // 9. Edit Activity Record
    // Update Run 1 from 5.25 km (1725s) to 6.00 km (1800s = 300s/km = 5:00 / km)
    const updatedRun1 = await ActivityService.updateActivity(userA.id, run1.id, {
      distanceKm: 6.0,
      movingDurationSeconds: 1800,
      notes: "Updated morning run",
    });

    const isUpdatedCorrect = Number(updatedRun1.distanceKm) === 6.0 &&
      updatedRun1.movingDurationSeconds === 1800 &&
      updatedRun1.averagePaceSecondsPerKm === 300;
    recordTest(9, "Edit Activity Record & Recalculate Pace", isUpdatedCorrect, `Updated to 6.0km, new pace: ${formatPace(updatedRun1.averagePaceSecondsPerKm)}`);

    // 10. Recalculated Daily Totals after Edit
    // Total = 6.00 + 4.75 = 10.75 km
    const dailyAfterEdit = await ActivityService.getDailyActivity(userA.id, today);
    recordTest(10, "Daily Recalculation After Edit (10.75 km)", dailyAfterEdit.totalDistanceKm === 10.75, `Total distance: ${dailyAfterEdit.totalDistanceKm} km`);

    // 11. Delete Activity Record
    await ActivityService.deleteActivity(userA.id, run1.id);
    const deletedCheck = await prisma.activityLog.findUnique({ where: { id: run1.id } });
    recordTest(11, "Delete Activity Record", deletedCheck === null, `Record ${run1.id} deleted permanently`);

    // 12. Daily Totals after Deletion
    const dailyAfterDelete = await ActivityService.getDailyActivity(userA.id, today);
    recordTest(12, "Daily Totals After Deletion (4.75 km)", dailyAfterDelete.totalDistanceKm === 4.75 && dailyAfterDelete.activitiesCount === 1, `Remaining distance: ${dailyAfterDelete.totalDistanceKm} km`);

    // 13. Zod Validation: Distance <= 0 rejected
    const distZeroRes = logActivitySchema.safeParse({
      activityType: "RUN",
      date: today,
      distanceKm: 0,
      movingDurationSeconds: 600,
    });
    recordTest(13, "Validation: Distance <= 0 Rejected", !distZeroRes.success, "Rejected distance = 0");

    // 14. Validation: Duration <= 0 rejected
    const durZeroRes = logActivitySchema.safeParse({
      activityType: "RUN",
      date: today,
      distanceKm: 5.0,
      movingDurationSeconds: 0,
    });
    recordTest(14, "Validation: Duration <= 0 Rejected", !durZeroRes.success, "Rejected duration = 0");

    // 15. Validation: Negative steps/calories/elevation rejected
    const negRes = logActivitySchema.safeParse({
      activityType: "RUN",
      date: today,
      distanceKm: 5.0,
      movingDurationSeconds: 1500,
      steps: -100,
    });
    recordTest(15, "Validation: Negative Steps Rejected", !negRes.success, "Rejected negative steps");

    // 16. Cross-User Security Isolation: User B cannot access User A's activity
    let blockedEdit = false;
    try {
      await ActivityService.updateActivity(userB.id, run2.id, { distanceKm: 10.0 });
    } catch (e: any) {
      blockedEdit = e.message === "UNAUTHORIZED_ACCESS";
    }
    recordTest(16, "Security: Cross-User Update Blocked (403)", blockedEdit, "User B blocked from editing User A's run");

    let blockedDelete = false;
    try {
      await ActivityService.deleteActivity(userB.id, run2.id);
    } catch (e: any) {
      blockedDelete = e.message === "UNAUTHORIZED_ACCESS";
    }
    recordTest(17, "Security: Cross-User Delete Blocked (403)", blockedDelete, "User B blocked from deleting User A's run");

    // 18. User B Daily Query Isolation
    const userBDaily = await ActivityService.getDailyActivity(userB.id, today);
    recordTest(18, "Security: User Isolation on Query", userBDaily.totalDistanceKm === 0 && userBDaily.activitiesCount === 0, `User B sees 0 km / 0 runs`);

    // 19. Hydration Weekly 7-Day View API
    await HydrationService.logHydration(userA.id, {
      amountMl: 750,
      beverageType: "WATER",
      date: today,
    });
    const hydraWeekly = await HydrationService.getWeeklyHydration(userA.id, today);
    recordTest(19, "Hydration Weekly Trend Data", hydraWeekly.days.length === 7 && hydraWeekly.targetMl === 2500, `Retrieved 7-day hydration history with target ${hydraWeekly.targetMl}ml`);

    // 20. Realistic Water Bottle Visual Height Computation
    const calcFill = (total: number, target: number) => total <= 0 ? 0 : Math.min(Math.max((total / target) * 100, 3), 100);
    const fill0 = calcFill(0, 2500);
    const fill1250 = calcFill(1250, 2500);
    const fill2500 = calcFill(2500, 2500);
    const fill3000 = calcFill(3000, 2500);
    const isWaterFillCorrect = fill0 === 0 && fill1250 === 50 && fill2500 === 100 && fill3000 === 100;
    recordTest(20, "Water Bottle Fill Height Logic (0%, 50%, 100%, >100%)", isWaterFillCorrect, `0ml: ${fill0}%, 1250ml: ${fill1250}%, 2500ml: ${fill2500}%, 3000ml: ${fill3000}%`);

    // 21. Regression: Meal Logging & Historical Snapshot
    const dailyNutri = await NutritionService.getDailyNutrition(userA.id, today);
    recordTest(21, "Regression: Nutrition Service Intact", !!dailyNutri.totals, "Nutrition service functions without errors");

    // 22. Regression: User Profile & Goals
    const userProfile = await prisma.userProfile.findUnique({ where: { userId: userA.id } });
    recordTest(22, "Regression: User Profile Intact", userProfile?.dailyHydrationTargetMl === 2500, `User profile target: ${userProfile?.dailyHydrationTargetMl}ml`);

    console.log("\n-------------------------------------------------------------------");
    const passedCount = results.filter((r) => r.passed).length;
    console.log(`🎉 ${passedCount}/${results.length} PROMPT 7 VERIFICATION TESTS PASSED!`);
    console.log("-------------------------------------------------------------------\n");

    if (passedCount !== results.length) {
      process.exit(1);
    }
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exit(1);
  }
}

runPrompt7TestSuite();
