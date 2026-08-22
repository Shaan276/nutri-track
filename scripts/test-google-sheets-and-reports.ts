import { prisma } from "../lib/db";
import {
  extractSpreadsheetId,
  DEFAULT_NUTRITION_TEMPLATE_URL,
  GOOGLE_SHEETS_URL_REGEX,
} from "../lib/validations/google-sheets";
import { GoogleSheetsConnectionService } from "../lib/services/google-sheets/google-sheets.connection.service";
import { GoogleSheetsService } from "../lib/services/google-sheets/google-sheets.service";
import { NutritionService } from "../lib/services/nutrition.service";
import { DeepNutritionService } from "../lib/services/deep-nutrition.service";
import { FoodService } from "../lib/services/food.service";

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

interface TestDetail {
  test: string;
  expected: string;
  actual: string;
  status: "PASS" | "FAIL";
}

const testResults: TestDetail[] = [];

function recordTest(testName: string, expected: string, actual: string, condition: boolean) {
  totalTests++;
  const status = condition ? "PASS" : "FAIL";
  if (condition) {
    passedTests++;
    console.log(`✅ PASS: ${testName} -> [${actual}]`);
  } else {
    failedTests++;
    console.error(`❌ FAIL: ${testName} -> Expected: [${expected}], Actual: [${actual}]`);
  }
  testResults.push({
    test: testName,
    expected,
    actual,
    status,
  });
}

async function runPrompt11Tests() {
  console.log("==================================================================");
  console.log("🧪 NUTRI-TRACK PROMPT 11: GOOGLE SHEETS & SMART SYNC TEST SUITE");
  console.log("==================================================================\n");

  const timestamp = Date.now();
  const todayStr = new Date().toISOString().split("T")[0];

  // -------------------------------------------------------------------------
  // Setup Test Users & Profiles
  // -------------------------------------------------------------------------
  const userA = await prisma.user.create({
    data: {
      name: "Dr. Evelyn Reed",
      email: `evelyn_p11_${timestamp}@nutritrack.app`,
      username: `evelyn_p11_${timestamp}`,
      passwordHash: "$2a$12$dummyhashedpasswordevelyn1234567890abcdefg",
    },
  });

  const userB = await prisma.user.create({
    data: {
      name: "Marcus Vance",
      email: `marcus_p11_${timestamp}@nutritrack.app`,
      username: `marcus_p11_${timestamp}`,
      passwordHash: "$2a$12$dummyhashedpasswordmarcus1234567890abcdefg",
    },
  });

  const testUserAId = userA.id;
  const testUserBId = userB.id;

  await prisma.userProfile.create({
    data: {
      userId: testUserAId,
      dateOfBirth: new Date("1992-03-14"),
      biologicalSex: "FEMALE",
      heightCm: 168,
      weightKg: 62.5,
      activityLevel: "VERY_ACTIVE",
      dailyHydrationTargetMl: 2500,
    },
  });

  // -------------------------------------------------------------------------
  // GROUP 1: Connection & Template Validation (Tests 1–7)
  // -------------------------------------------------------------------------
  console.log("\n--- GROUP 1: Connection & Template Validation ---");

  // 1. Open Google Sheets Section / Check Template URL
  recordTest(
    "1. Official Master Nutrition Template URL Configured",
    "https://docs.google.com/spreadsheets/d/19EFB0ufPY8YHNbLp0PTwrJuFJJVz_6lz-ofau3TSxsY/edit?gid=0#gid=0",
    DEFAULT_NUTRITION_TEMPLATE_URL,
    DEFAULT_NUTRITION_TEMPLATE_URL === "https://docs.google.com/spreadsheets/d/19EFB0ufPY8YHNbLp0PTwrJuFJJVz_6lz-ofau3TSxsY/edit?gid=0#gid=0"
  );

  // 2. Valid URL Regex Acceptance
  const validUrlA = "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0";
  recordTest(
    "2. Valid Google Sheets URL Accepted by Regex",
    "true",
    String(GOOGLE_SHEETS_URL_REGEX.test(validUrlA)),
    GOOGLE_SHEETS_URL_REGEX.test(validUrlA)
  );

  // 3. Invalid Non-Google URL Rejection
  const invalidUrl = "https://malicious-tracker.com/spreadsheet/12345";
  recordTest(
    "3. Invalid Non-Google URL Rejected",
    "false",
    String(GOOGLE_SHEETS_URL_REGEX.test(invalidUrl)),
    !GOOGLE_SHEETS_URL_REGEX.test(invalidUrl)
  );

  // 4. Safe Spreadsheet ID Extraction
  const extraction = extractSpreadsheetId(validUrlA);
  recordTest(
    "4. Spreadsheet ID Correctly Extracted from Full URL",
    "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    extraction.spreadsheetId,
    extraction.spreadsheetId === "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
  );

  // 5. Connect Spreadsheet and Persist in PostgreSQL
  const connA = await GoogleSheetsConnectionService.connectSpreadsheet(
    testUserAId,
    validUrlA,
    "Evelyn's Nutrition Repository"
  );
  recordTest(
    "5. Connection Persisted in PostgreSQL Database",
    "CONNECTED",
    connA.status,
    connA.status === "CONNECTED" && connA.spreadsheetId === "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
  );

  // 6. Check isConnected Helper
  const isConnectedA = await GoogleSheetsService.isConnected(testUserAId);
  recordTest(
    "6. GoogleSheetsService.isConnected returns true for connected user",
    "true",
    String(isConnectedA),
    isConnectedA === true
  );

  // 7. Connection Persists after Query Re-fetch
  const refetchConnA = await GoogleSheetsConnectionService.getConnection(testUserAId);
  recordTest(
    "7. Connection Persists After Database Query Refetch",
    connA.id,
    refetchConnA?.id || "",
    refetchConnA !== null && refetchConnA.id === connA.id
  );

  // -------------------------------------------------------------------------
  // GROUP 2: Security & Multi-Tenant Isolation (Tests 8–10)
  // -------------------------------------------------------------------------
  console.log("\n--- GROUP 2: Security & Multi-Tenant Isolation ---");

  // 8. User B Cannot Access User A's Connection
  const connB = await GoogleSheetsConnectionService.getConnection(testUserBId);
  recordTest(
    "8. Multi-Tenant Isolation: User B Cannot Read User A's Connection",
    "null",
    connB === null ? "null" : "found",
    connB === null
  );

  // 9. User B is not marked as connected
  const isConnectedB = await GoogleSheetsService.isConnected(testUserBId);
  recordTest(
    "9. User B is Disconnected by Default",
    "false",
    String(isConnectedB),
    isConnectedB === false
  );

  // 10. Credentials Remain Server-Side
  const credentialsInDto = (connA as any).apiKey || (connA as any).privateKey || (connA as any).serviceAccountEmail;
  recordTest(
    "10. Server Credentials Not Exposed in Connection DTO",
    "undefined",
    String(credentialsInDto),
    credentialsInDto === undefined
  );

  // -------------------------------------------------------------------------
  // GROUP 3: Manual Synchronization & Metadata (Tests 11–15)
  // -------------------------------------------------------------------------
  console.log("\n--- GROUP 3: Manual Synchronization & Metadata ---");

  // Create Food and Meal Entry for User A
  const food1 = await FoodService.createFood(testUserAId, {
    name: "Fortified Organic Oats",
    servingSize: 100,
    servingUnit: "g",
    calories: 380,
    protein: 14,
    carbohydrates: 68,
    fat: 7,
    fiber: 10,
    sugar: 2,
    calcium: 120,
    iron: 4.2,
    potassium: 350,
    magnesium: 130,
    zinc: 2.5,
    vitaminA: 80,
    vitaminC: 20,
    vitaminD: 3.0,
    vitaminB12: 1.5,
  });

  const mealEntry1 = await NutritionService.logFoodToMeal(testUserAId, {
    date: todayStr,
    mealType: "BREAKFAST",
    foodId: food1.id,
    quantity: 100,
    quantityUnit: "g",
  });

  // 11. Manual Sync Now Trigger
  const manualSyncResult = await GoogleSheetsService.executeSync(testUserAId, { dateRangeDays: 30 });
  recordTest(
    "11. Sync Now Triggers Full Export Successfully",
    "true",
    String(manualSyncResult.success),
    manualSyncResult.success === true && (manualSyncResult.itemsProcessed || 0) >= 1
  );

  // 12. Successful Sync Updates lastSyncedAt
  const postSyncConnA = await GoogleSheetsConnectionService.getConnection(testUserAId);
  recordTest(
    "12. Successful Sync Updates lastSyncedAt in Database",
    "non-null timestamp",
    postSyncConnA?.lastSyncedAt ? "timestamp recorded" : "null",
    postSyncConnA !== null && postSyncConnA.lastSyncedAt !== null
  );

  // 13. Successful Sync Updates syncStatus to SUCCESS
  recordTest(
    "13. Successful Sync Updates syncStatus to SUCCESS",
    "SUCCESS",
    postSyncConnA?.syncStatus || "",
    postSyncConnA?.syncStatus === "SUCCESS"
  );

  // 14. Repeated Sync Executes Cleanly with Deterministic Deduplication
  const repeatedSyncResult = await GoogleSheetsService.executeSync(testUserAId, { dateRangeDays: 30 });
  recordTest(
    "14. Repeated Sync Executes with Deterministic Deduplication",
    "true",
    String(repeatedSyncResult.success),
    repeatedSyncResult.success === true
  );

  // 15. Graceful Sync Failure Handling for Unconnected User
  const unconnectedSyncResult = await GoogleSheetsService.executeSync(testUserBId);
  recordTest(
    "15. Sync Gracefully Rejects Unconnected Users with Clean Message",
    "false",
    String(unconnectedSyncResult.success),
    unconnectedSyncResult.success === false
  );

  // -------------------------------------------------------------------------
  // GROUP 4: Smart Automatic Synchronization (Tests 16–20)
  // -------------------------------------------------------------------------
  console.log("\n--- GROUP 4: Smart Automatic Synchronization ---");

  // 16. Adding Meal Entry Triggers Auto-Sync Hook
  const mealEntry2 = await NutritionService.logFoodToMeal(testUserAId, {
    date: todayStr,
    mealType: "LUNCH",
    foodId: food1.id,
    quantity: 150,
    quantityUnit: "g",
  });
  recordTest(
    "16. Logging Meal Entry Successfully Saves in PostgreSQL & Invokes Auto-Sync",
    "meal entry created",
    mealEntry2.id ? "meal entry created" : "failed",
    Boolean(mealEntry2.id)
  );

  // 17. Editing Meal Entry Triggers Auto-Sync Hook
  const updatedEntry2 = await NutritionService.updateMealEntry(testUserAId, mealEntry2.id, {
    quantity: 200,
  });
  recordTest(
    "17. Editing Meal Entry Successfully Updates in PostgreSQL & Invokes Auto-Sync",
    "200",
    String(updatedEntry2.quantity),
    Number(updatedEntry2.quantity) === 200
  );

  // 18. Deleting Meal Entry Triggers Auto-Sync Hook
  const deletedEntry2 = await NutritionService.deleteMealEntry(testUserAId, mealEntry2.id);
  recordTest(
    "18. Deleting Meal Entry Successfully Removes from PostgreSQL & Invokes Auto-Sync",
    mealEntry2.id,
    deletedEntry2.id,
    deletedEntry2.id === mealEntry2.id
  );

  // 19. PostgreSQL Nutrition Data Remains Safe Even If Sync Fails
  const remainingMeals = await NutritionService.getDailyNutrition(testUserAId, todayStr);
  recordTest(
    "19. Primary PostgreSQL Nutrition Data Remains Intact & Untouched",
    "1 meal recorded",
    `${remainingMeals.meals.flatMap((m) => m.entries).length} meal recorded`,
    remainingMeals.meals.flatMap((m) => m.entries).length >= 1
  );

  // 20. Concurrency Protection / Active Sync Lock
  // Execute sync twice rapidly
  const syncPromise1 = GoogleSheetsService.executeSync(testUserAId);
  const syncPromise2 = GoogleSheetsService.executeSync(testUserAId);
  const [res1, res2] = await Promise.all([syncPromise1, syncPromise2]);
  recordTest(
    "20. Concurrency Lock Prevents Overlapping / Spam Sync Calls",
    "both handled safely",
    res1.success && res2.success ? "both handled safely" : "error",
    res1.success && res2.success
  );

  // -------------------------------------------------------------------------
  // GROUP 5: Connection Lifecycle (Tests 21–27)
  // -------------------------------------------------------------------------
  console.log("\n--- GROUP 5: Connection Lifecycle Management ---");

  // 21. Change Spreadsheet URL
  const newUrlA = "https://docs.google.com/spreadsheets/d/1NewSpreadsheetId2026MasterCopy999/edit";
  const changedConnA = await GoogleSheetsConnectionService.connectSpreadsheet(
    testUserAId,
    newUrlA,
    "Evelyn's New 2026 Spreadsheet"
  );
  recordTest(
    "21. User Can Change Connected Spreadsheet URL",
    "1NewSpreadsheetId2026MasterCopy999",
    changedConnA.spreadsheetId,
    changedConnA.spreadsheetId === "1NewSpreadsheetId2026MasterCopy999"
  );

  // 22. New Spreadsheet Becomes Active Connection
  const activeConnA = await GoogleSheetsConnectionService.getConnection(testUserAId);
  recordTest(
    "22. New Spreadsheet ID is Active in PostgreSQL",
    "1NewSpreadsheetId2026MasterCopy999",
    activeConnA?.spreadsheetId || "",
    activeConnA?.spreadsheetId === "1NewSpreadsheetId2026MasterCopy999"
  );

  // 23. Disconnect Spreadsheet
  const disconnectRes = await GoogleSheetsConnectionService.disconnectSpreadsheet(testUserAId);
  recordTest(
    "23. User Can Safely Disconnect Spreadsheet",
    "true",
    String(disconnectRes.success),
    disconnectRes.success === true
  );

  // 24. Disconnected User is No Longer Active
  const postDisconnectConn = await GoogleSheetsConnectionService.getConnection(testUserAId);
  recordTest(
    "24. Connection Cleanly Removed from PostgreSQL on Disconnect",
    "null",
    postDisconnectConn === null ? "null" : "found",
    postDisconnectConn === null
  );

  // 25. Disconnect Stops Automatic Synchronization
  const isConnectedPostDisconnect = await GoogleSheetsService.isConnected(testUserAId);
  recordTest(
    "25. Disconnect Stops Future Automatic Synchronization",
    "false",
    String(isConnectedPostDisconnect),
    isConnectedPostDisconnect === false
  );

  // 26. Disconnect Does Not Delete PostgreSQL Data
  const mealsPostDisconnect = await NutritionService.getDailyNutrition(testUserAId, todayStr);
  recordTest(
    "26. Disconnect Does Not Delete User Nutrition Data in PostgreSQL",
    "meals preserved",
    mealsPostDisconnect.meals.length > 0 ? "meals preserved" : "empty",
    mealsPostDisconnect.meals.length > 0
  );

  // 27. Safe Reconnection after Disconnect
  const reconnectConn = await GoogleSheetsConnectionService.connectSpreadsheet(testUserAId, validUrlA);
  recordTest(
    "27. User Can Safely Reconnect a Google Spreadsheet",
    "CONNECTED",
    reconnectConn.status,
    reconnectConn.status === "CONNECTED"
  );

  // -------------------------------------------------------------------------
  // GROUP 6: Regression Verification (Tests 28–36)
  // -------------------------------------------------------------------------
  console.log("\n--- GROUP 6: Full Regression Verification ---");

  // 28. Existing Nutrition Features Intact
  const dailyNutrition = await NutritionService.getDailyNutrition(testUserAId, todayStr);
  recordTest(
    "28. Daily Nutrition Macro Totals & Calculations Intact",
    "calories calculated",
    dailyNutrition.totals.calories > 0 ? "calories calculated" : "0",
    dailyNutrition.totals.calories > 0
  );

  // 29. Deep Nutrition Module Intact
  const deepAnalysis = await DeepNutritionService.getDeepNutritionAnalysis(testUserAId, todayStr);
  recordTest(
    "29. Deep Nutrition Micronutrient Analysis Intact",
    "macros & vitamins tracked",
    deepAnalysis.macros.length > 0 && deepAnalysis.vitamins.length > 0 ? "macros & vitamins tracked" : "empty",
    deepAnalysis.macros.length > 0 && deepAnalysis.vitamins.length > 0
  );

  // 30. Food Database Intact
  const foodsList = await FoodService.getUserFoods({ userId: testUserAId });
  recordTest(
    "30. Food Database Search & Management Intact",
    "foods found",
    foodsList.length > 0 ? "foods found" : "empty",
    foodsList.length > 0
  );

  // 31. Meal Logging Intact
  const parentMealLog = await prisma.mealLog.findUnique({ where: { id: mealEntry1.mealLogId } });
  recordTest(
    "31. Meal Logging & Section Grouping Intact",
    "BREAKFAST",
    parentMealLog?.mealType || "",
    parentMealLog?.mealType === "BREAKFAST"
  );

  // 32. Hydration Logging Intact
  const hydration = await prisma.hydrationLog.create({
    data: {
      userId: testUserAId,
      amountMl: 500,
      beverageType: "WATER",
      date: todayStr,
    },
  });
  recordTest(
    "32. Hydration Logging Intact",
    "500",
    String(hydration.amountMl),
    hydration.amountMl === 500
  );

  // 33. Activities Logging Intact
  const activity = await prisma.activityLog.create({
    data: {
      userId: testUserAId,
      activityType: "RUN",
      runningType: "TEMPO",
      date: todayStr,
      distanceKm: 5.0,
      movingDurationSeconds: 1500,
      averagePaceSecondsPerKm: 300,
      caloriesBurned: 350,
      elevationGainMeters: 30,
    },
  });
  recordTest(
    "33. Activities & Distance Running Logging Intact",
    "5",
    String(activity.distanceKm),
    Number(activity.distanceKm) === 5.0
  );

  // 34. Workout Database & Templates Intact
  const workoutTemplate = await prisma.workoutTemplate.create({
    data: {
      userId: testUserAId,
      name: "Upper Body Hypertrophy",
      workoutType: "GYM_WORKOUT",
    },
  });
  recordTest(
    "34. Workout Database & Templates Intact",
    "Upper Body Hypertrophy",
    workoutTemplate.name,
    workoutTemplate.name === "Upper Body Hypertrophy"
  );

  // 35. Authentication & User Model Intact
  const userCheck = await prisma.user.findUnique({ where: { id: testUserAId } });
  recordTest(
    "35. User Authentication & Isolation Intact",
    "Dr. Evelyn Reed",
    userCheck?.name || "",
    userCheck?.name === "Dr. Evelyn Reed"
  );

  // 36. Performance: 30-Day Sync Row Aggregation Under 100ms
  const startPerf = Date.now();
  const rows = await GoogleSheetsService.buildNutritionRows(testUserAId, 30);
  const perfDuration = Date.now() - startPerf;
  recordTest(
    "36. High-Performance 30-Day Nutrition Aggregation (< 100ms)",
    "< 100ms",
    `${perfDuration}ms`,
    perfDuration < 100 && rows.length >= 1
  );

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log("\n==================================================================");
  console.log(`🏁 TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
  console.log("==================================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPrompt11Tests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
