import { prisma } from "../lib/db";
import { FoodService } from "../lib/services/food.service";
import { NutritionService } from "../lib/services/nutrition.service";
import { HydrationService } from "../lib/services/hydration.service";
import { ActivityService } from "../lib/services/activity.service";
import { UnifiedActivityService } from "../lib/services/unified-activity.service";
import { WorkoutService } from "../lib/services/workout.service";
import { HealthContextService } from "../lib/services/health-context.service";
import { SmartInsightsService } from "../lib/services/insights/smart-insights.service";
import { PrivacyService } from "../lib/services/privacy.service";
import { NotificationService } from "../lib/services/notification.service";
import { SmartReminderService } from "../lib/services/smart-reminder.service";
import { GoogleSheetsConnectionService } from "../lib/services/google-sheets/google-sheets.connection.service";
import {
  calculateSafePercentage,
  resolveDataStatus,
  formatSafePace,
  formatSafeNumber,
} from "../lib/utils/data-state";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, description: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${description}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${description}`);
    failedCount++;
  }
}

async function runTests() {
  console.log("\n========================================================");
  console.log("PROMPT 22: SYSTEM STABILIZATION & DATA INTEGRITY AUDIT");
  console.log("========================================================\n");

  const pool = prisma as any;
  const todayStr = new Date().toISOString().split("T")[0];

  // Setup Test Users
  const userAId = `audit_user_a_${Date.now()}`;
  const userBId = `audit_user_b_${Date.now()}`;
  const adminId = `audit_admin_${Date.now()}`;

  await pool.user.create({
    data: {
      id: userAId,
      name: "Audit User A",
      username: `audita_${Date.now()}`,
      email: `audita_${Date.now()}@example.com`,
      passwordHash: "hash",
      role: "USER",
      accountStatus: "APPROVED",
    },
  });

  await pool.userProfile.create({
    data: {
      userId: userAId,
      dateOfBirth: new Date("1995-05-15"),
      biologicalSex: "MALE",
      heightCm: 180,
      weightKg: 75,
      activityLevel: "MODERATELY_ACTIVE",
      primaryGoal: "MAINTAIN_WEIGHT",
      dailyHydrationTargetMl: 2500,
      dailyStepTarget: 10000,
      weeklyRunningDistanceKm: 15.0,
      weeklyWorkoutSessions: 4,
    },
  });

  await pool.user.create({
    data: {
      id: userBId,
      name: "Audit User B",
      username: `auditb_${Date.now()}`,
      email: `auditb_${Date.now()}@example.com`,
      passwordHash: "hash",
      role: "USER",
      accountStatus: "APPROVED",
    },
  });

  await pool.userProfile.create({
    data: {
      userId: userBId,
      dateOfBirth: new Date("1998-08-20"),
      biologicalSex: "FEMALE",
      heightCm: 165,
      weightKg: 60,
      activityLevel: "LIGHTLY_ACTIVE",
      primaryGoal: "LOSE_WEIGHT",
      dailyHydrationTargetMl: 2000,
      dailyStepTarget: 8000,
      weeklyRunningDistanceKm: 10.0,
      weeklyWorkoutSessions: 3,
    },
  });

  await pool.user.create({
    data: {
      id: adminId,
      name: "Audit Admin",
      username: `auditadmin_${Date.now()}`,
      email: `auditadmin_${Date.now()}@example.com`,
      passwordHash: "hash",
      role: "ADMIN",
      accountStatus: "APPROVED",
    },
  });

  // --- PART 1: ZERO-DATA & MISSING DATA STANDARD ---
  console.log("--- PART 1: Zero-Data & Missing Data Standard ---");
  assert(calculateSafePercentage(0, 2000) === 0, "calculateSafePercentage(0, 2000) === 0 (Safe 0%)");
  assert(calculateSafePercentage(null, 2000) === 0, "calculateSafePercentage(null, 2000) === 0 (No NaN)");
  assert(calculateSafePercentage(500, 0) === 0, "calculateSafePercentage(500, 0) === 0 (Zero division protection)");
  assert(calculateSafePercentage(2500, 2000, { maxCap: 100 }) === 100, "calculateSafePercentage with maxCap 100%");
  assert(resolveDataStatus(0, 2000, { isEndOfDay: false }) === "NOT_LOGGED_YET", "resolveDataStatus(0) is NOT_LOGGED_YET during daytime (No false failure)");
  assert(resolveDataStatus(0, 2000, { isEndOfDay: true }) === "GOAL_MISSED", "resolveDataStatus(0) is GOAL_MISSED at end of day");
  assert(resolveDataStatus(1000, 2000, { isEndOfDay: false }) === "IN_PROGRESS", "resolveDataStatus(1000/2000) is IN_PROGRESS");
  assert(resolveDataStatus(2000, 2000) === "GOAL_MET", "resolveDataStatus(2000/2000) is GOAL_MET");
  assert(formatSafePace(null) === "--:-- /km", "formatSafePace(null) returns clean placeholder");
  assert(formatSafePace(330) === "5'30\"/km", "formatSafePace(330s) returns 5'30\"/km");
  assert(formatSafeNumber(NaN, 0) === 0, "formatSafeNumber(NaN) returns 0 fallback");

  // Initial Zero-Data Snapshot check
  const initialSnapshotA = await HealthContextService.getHealthSnapshot(userAId, todayStr);
  assert(initialSnapshotA.nutrition.dataState === "NOT_LOGGED_YET", "Initial nutrition dataState is NOT_LOGGED_YET");
  assert(initialSnapshotA.nutrition.caloriesConsumed === 0, "Initial calories consumed is 0");
  assert(initialSnapshotA.hydration.dataState === "NOT_LOGGED_YET", "Initial hydration dataState is NOT_LOGGED_YET");
  assert(initialSnapshotA.hydration.consumedMl === 0, "Initial hydration consumed is 0");

  // --- PART 2: NUTRITION LOGGING, EDIT & DELETE RECALCULATION INTEGRITY ---
  console.log("\n--- PART 2: Nutrition Logging, Edit & Delete Recalculation Integrity ---");
  // 1. Create a food item via FoodService
  const foodItem = await FoodService.createFood(userAId, {
    name: "Oatmeal with Berries",
    category: "GRAINS_CEREALS",
    servingSize: 100,
    servingUnit: "g",
    calories: 350,
    protein: 12,
    carbohydrates: 60,
    fat: 6,
    fiber: 8,
    sugar: 10,
  });

  // 2. Log Food to Meal via NutritionService (150g -> 1.5 * 350 = 525 kcal, 18g P)
  const loggedEntry = await NutritionService.logFoodToMeal(userAId, {
    date: todayStr,
    mealType: "BREAKFAST",
    foodId: foodItem.id,
    quantity: 150,
    quantityUnit: "g",
  });

  // 3. Verify Centralized Services & Snapshot updated immediately
  const snapshotAfterLog = await HealthContextService.getHealthSnapshot(userAId, todayStr);
  assert(snapshotAfterLog.nutrition.dataState === "LOGGED", "Nutrition dataState transitioned to LOGGED");
  assert(snapshotAfterLog.nutrition.caloriesConsumed === 525, "Snapshot reflects exactly 525 calories");
  assert(snapshotAfterLog.nutrition.proteinConsumed === 18, "Snapshot reflects exactly 18g protein");

  // 4. Edit Meal Entry via NutritionService (change quantity from 150g to 200g -> 700 kcal, 24g P)
  await NutritionService.updateMealEntry(userAId, loggedEntry.id, {
    quantity: 200,
    quantityUnit: "g",
  });

  const snapshotAfterEdit = await HealthContextService.getHealthSnapshot(userAId, todayStr);
  assert(snapshotAfterEdit.nutrition.caloriesConsumed === 700, "Snapshot updated after edit to 700 kcal (No stale totals)");
  assert(snapshotAfterEdit.nutrition.proteinConsumed === 24, "Snapshot updated after edit to 24g protein");

  // 5. Delete Meal Entry via NutritionService
  await NutritionService.deleteMealEntry(userAId, loggedEntry.id);

  const snapshotAfterDelete = await HealthContextService.getHealthSnapshot(userAId, todayStr);
  assert(snapshotAfterDelete.nutrition.caloriesConsumed === 0, "Calories reverted cleanly to 0 upon deletion");
  assert(snapshotAfterDelete.nutrition.dataState === "NOT_LOGGED_YET", "DataState reverted cleanly to NOT_LOGGED_YET");

  // --- PART 3: HYDRATION LOGGING & CASCADE INTEGRITY ---
  console.log("\n--- PART 3: Hydration Logging & Cascade Integrity ---");
  const hydLog = await HydrationService.logHydration(userAId, {
    date: todayStr,
    amountMl: 750,
    beverageType: "WATER",
  });

  const hydAfterLog = await HealthContextService.getHealthSnapshot(userAId, todayStr);
  assert(hydAfterLog.hydration.consumedMl === 750, "Snapshot reflects 750 ml hydration");
  assert(hydAfterLog.hydration.dataState === "LOGGED", "Hydration dataState is LOGGED");

  // Delete Hydration Log
  await HydrationService.deleteHydration(userAId, hydLog.id);
  const hydAfterDelete = await HealthContextService.getHealthSnapshot(userAId, todayStr);
  assert(hydAfterDelete.hydration.consumedMl === 0, "Hydration reverted cleanly to 0 upon deletion");

  // --- PART 4: ACTIVITIES, WORKOUTS & DOUBLE-COUNTING AUDIT ---
  console.log("\n--- PART 4: Activities, Workouts & Double-Counting Audit ---");
  const actLog = await ActivityService.logActivity(userAId, {
    date: todayStr,
    activityType: "RUN",
    runningType: "EASY",
    movingDurationSeconds: 1800, // 30 mins
    distanceKm: 5.0,
    steps: 5000,
    caloriesBurned: 400,
    source: "MANUAL",
  });

  const workoutSession = await pool.workoutSession.create({
    data: {
      userId: userAId,
      date: todayStr,
      name: "Chest & Triceps",
      durationMinutes: 45,
      caloriesBurned: 300,
      notes: "Heavy bench day",
    },
  });

  const movementSnapshot = await HealthContextService.getHealthSnapshot(userAId, todayStr);
  assert(movementSnapshot.movement.todaySteps === 5000, "Movement steps accurately mapped (5000)");
  assert(movementSnapshot.movement.activityCalories === 400, "Activity calories mapped (400)");
  assert(movementSnapshot.movement.workoutCalories === 300, "Workout calories mapped (300)");
  assert(movementSnapshot.movement.totalActiveCalories === 700, "Total active calories strictly = 400 + 300 = 700 kcal (No double-counting)");

  // Clean up movement logs
  await pool.activityLog.delete({ where: { id: actLog.id } });
  await pool.workoutSession.delete({ where: { id: workoutSession.id } });

  // --- PART 5: MULTI-USER ISOLATION AUDIT ---
  console.log("\n--- PART 5: Multi-User Isolation Audit ---");
  // Log food for User A only
  const mealA = await NutritionService.logFoodToMeal(userAId, {
    date: todayStr,
    mealType: "LUNCH",
    foodId: foodItem.id,
    quantity: 200,
    quantityUnit: "g",
  });

  const snapshotA = await HealthContextService.getHealthSnapshot(userAId, todayStr);
  const snapshotB = await HealthContextService.getHealthSnapshot(userBId, todayStr);

  assert(snapshotA.nutrition.caloriesConsumed === 700, "User A snapshot has 700 kcal");
  assert(snapshotB.nutrition.caloriesConsumed === 0, "User B snapshot has 0 kcal (100% User Isolation)");
  assert(snapshotB.nutrition.dataState === "NOT_LOGGED_YET", "User B dataState is strictly NOT_LOGGED_YET");

  await NutritionService.deleteMealEntry(userAId, mealA.id);

  // --- PART 6: PRIVACY ENGINE & ADMIN MASTER ACCESS ---
  console.log("\n--- PART 6: Privacy Engine & Admin Master Access ---");
  const privacyCheckUserToUser = await PrivacyService.canAccessCategory(userBId, userAId, "NUTRITION");
  assert(privacyCheckUserToUser === false, "Unconnected User B CANNOT view User A's private nutrition");

  const privacyCheckAdminToUser = await PrivacyService.canAccessCategory(adminId, userAId, "NUTRITION");
  assert(privacyCheckAdminToUser === true, "Admin User IS GRANTED Admin Master Access to view User A's nutrition");

  // --- PART 7: NOTIFICATIONS & SMART REMINDERS ---
  console.log("\n--- PART 7: Notifications & Smart Reminders ---");
  const notif = await NotificationService.createNotification({
    userId: userAId,
    category: "HYDRATION",
    type: "HYDRATION_REMINDER",
    title: "Afternoon Check-in",
    message: "Hydration check",
    actionUrl: "/hydration",
  });
  assert(notif !== null && notif.actionUrl === "/hydration", "Notification created with safe internal actionUrl");

  const unreadBefore = await NotificationService.getUnreadCount(userAId);
  assert(unreadBefore >= 1, "Unread notification count is >= 1");

  await NotificationService.markAllAsRead(userAId);
  const unreadAfter = await NotificationService.getUnreadCount(userAId);
  assert(unreadAfter === 0, "Unread count reset to 0 after markAllAsRead");

  // --- PART 8: GOOGLE SHEETS CONNECTION ISOLATION ---
  console.log("\n--- PART 8: Google Sheets Connection Isolation ---");
  const isConnectedA = await GoogleSheetsConnectionService.getConnection(userAId);
  const isConnectedB = await GoogleSheetsConnectionService.getConnection(userBId);
  assert(isConnectedA === null, "User A has no active connection initially");
  assert(isConnectedB === null, "User B has no active connection initially (Isolated)");

  // Clean up test users
  try {
    await pool.userNotificationPreference?.delete?.({ where: { userId: userAId } });
    await pool.userNotificationPreference?.delete?.({ where: { userId: userBId } });
    await pool.notification?.deleteMany({ where: { userId: userAId } });
    await pool.notification?.deleteMany({ where: { userId: userBId } });
    await pool.food?.deleteMany({ where: { userId: userAId } });
    await pool.userProfile?.delete?.({ where: { userId: userAId } });
    await pool.userProfile?.delete?.({ where: { userId: userBId } });
    await pool.user?.delete({ where: { id: userAId } });
    await pool.user?.delete({ where: { id: userBId } });
    await pool.user?.delete({ where: { id: adminId } });
  } catch {}

  console.log("\n========================================================");
  console.log(`AUDIT SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("========================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});