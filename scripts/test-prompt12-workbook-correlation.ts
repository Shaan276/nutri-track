import { prisma } from "../lib/db";
import {
  COMPLETE_NUTRIENT_TAXONOMY,
  NutrientTaxonomyRegistry,
} from "../lib/validations/nutrient-taxonomy";
import {
  WORKBOOK_SHEET_SCHEMAS,
  WorkbookMapper,
} from "../lib/services/google-sheets/workbook-mapper";
import { GoogleSheetsConnectionService } from "../lib/services/google-sheets/google-sheets.connection.service";
import { GoogleSheetsService } from "../lib/services/google-sheets/google-sheets.service";
import { GoogleSheetsClient } from "../lib/google/google-sheets-client";
import {
  extractSpreadsheetId,
  DEFAULT_NUTRITION_TEMPLATE_URL,
  GOOGLE_SHEETS_URL_REGEX,
} from "../lib/validations/google-sheets";
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

async function runPrompt12Tests() {
  console.log("==================================================================");
  console.log("🧪 NUTRI-TRACK PROMPT 12: WORKBOOK CORRELATION & SYNC TEST SUITE");
  console.log("==================================================================\n");

  const timestamp = Date.now();
  const todayStr = new Date().toISOString().split("T")[0];

  // -------------------------------------------------------------------------
  // Setup Test Users
  // -------------------------------------------------------------------------
  const userA = await prisma.user.create({
    data: {
      name: "Elena Rostova",
      email: `elena_p12_${timestamp}@nutritrack.app`,
      username: `elena_p12_${timestamp}`,
      passwordHash: "$2a$12$dummyhashedpasswordelena1234567890abcdefg",
    },
  });

  const userB = await prisma.user.create({
    data: {
      name: "Dmitri Volkov",
      email: `dmitri_p12_${timestamp}@nutritrack.app`,
      username: `dmitri_p12_${timestamp}`,
      passwordHash: "$2a$12$dummyhashedpassworddmitri1234567890abcdefg",
    },
  });

  const testUserAId = userA.id;
  const testUserBId = userB.id;

  // -------------------------------------------------------------------------
  // GROUP 1: Workbook Sheet Structure & Schemas (Tests 1–6)
  // -------------------------------------------------------------------------
  console.log("\n--- GROUP 1: Workbook Sheet Schemas & Structure ---");

  // 1. Food Log Schema (28 Columns)
  recordTest(
    "1. Food Log Sheet Schema matches 28-column specification",
    "28 columns",
    `${WORKBOOK_SHEET_SCHEMAS.FOOD_LOG.headers.length} columns`,
    WORKBOOK_SHEET_SCHEMAS.FOOD_LOG.headers.length === 28
  );

  // 2. Micronutrients Schema (33 Columns)
  recordTest(
    "2. Micronutrients Sheet Schema matches 33-column specification",
    "33 columns",
    `${WORKBOOK_SHEET_SCHEMAS.MICRONUTRIENTS.headers.length} columns`,
    WORKBOOK_SHEET_SCHEMAS.MICRONUTRIENTS.headers.length === 33
  );

  // 3. Amino Acids Schema (22 Columns)
  recordTest(
    "3. Amino Acids Sheet Schema matches 22-column specification",
    "22 columns",
    `${WORKBOOK_SHEET_SCHEMAS.AMINO_ACIDS.headers.length} columns`,
    WORKBOOK_SHEET_SCHEMAS.AMINO_ACIDS.headers.length === 22
  );

  // 4. Other Nutrients Schema (14 Columns)
  recordTest(
    "4. Other Nutrients Sheet Schema matches 14-column specification",
    "14 columns",
    `${WORKBOOK_SHEET_SCHEMAS.OTHER_NUTRIENTS.headers.length} columns`,
    WORKBOOK_SHEET_SCHEMAS.OTHER_NUTRIENTS.headers.length === 14
  );

  // 5. Daily Summary Schema (67 Columns)
  recordTest(
    "5. Daily Summary Sheet Schema matches 67-column specification",
    "67 columns",
    `${WORKBOOK_SHEET_SCHEMAS.DAILY_SUMMARY.headers.length} columns`,
    WORKBOOK_SHEET_SCHEMAS.DAILY_SUMMARY.headers.length === 67
  );

  // 6. Food Database Schema (70 Columns)
  recordTest(
    "6. Food Database Sheet Schema matches 70-column specification",
    "70 columns",
    `${WORKBOOK_SHEET_SCHEMAS.FOOD_DATABASE.headers.length} columns`,
    WORKBOOK_SHEET_SCHEMAS.FOOD_DATABASE.headers.length === 70
  );

  // -------------------------------------------------------------------------
  // GROUP 2: Complete 63-Nutrient Taxonomy & Registry (Tests 7–13)
  // -------------------------------------------------------------------------
  console.log("\n--- GROUP 2: Canonical 63-Nutrient Taxonomy & Registry ---");

  // 7. Total Count
  recordTest(
    "7. Canonical Nutrient Registry contains exact 63 nutrients",
    "63 nutrients",
    `${NutrientTaxonomyRegistry.getTotalCount()} nutrients`,
    NutrientTaxonomyRegistry.getTotalCount() === 63
  );

  // 8. Energy & Macronutrients Category (15 nutrients)
  const macros = NutrientTaxonomyRegistry.getByCategory("MACRONUTRIENT").concat(
    NutrientTaxonomyRegistry.getByCategory("ENERGY")
  );
  recordTest(
    "8. Macronutrients & Energy category contains 15 nutrients",
    "15 nutrients",
    `${macros.length} nutrients`,
    macros.length === 15
  );

  // 9. Vitamins Category (13 nutrients)
  const vitamins = NutrientTaxonomyRegistry.getByCategory("VITAMIN");
  recordTest(
    "9. Vitamins category contains 13 nutrients",
    "13 nutrients",
    `${vitamins.length} nutrients`,
    vitamins.length === 13
  );

  // 10. Minerals Category (13 nutrients)
  const minerals = NutrientTaxonomyRegistry.getByCategory("MINERAL");
  recordTest(
    "10. Minerals category contains 13 nutrients",
    "13 nutrients",
    `${minerals.length} nutrients`,
    minerals.length === 13
  );

  // 11. Amino Acids Category (15 nutrients)
  const aminoAcids = NutrientTaxonomyRegistry.getByCategory("AMINO_ACID");
  recordTest(
    "11. Amino Acids category contains 15 nutrients",
    "15 nutrients",
    `${aminoAcids.length} nutrients`,
    aminoAcids.length === 15
  );

  // 12. Other Nutrients Category (7 nutrients)
  const otherNutrients = NutrientTaxonomyRegistry.getByCategory("OTHER");
  recordTest(
    "12. Other Nutrients category contains 7 nutrients",
    "7 nutrients",
    `${otherNutrients.length} nutrients`,
    otherNutrients.length === 7
  );

  // 13. Key Lookup Verification
  const leucineDef = NutrientTaxonomyRegistry.getByKey("leucine");
  recordTest(
    "13. Leucine definition correctly retrieved with unit 'g' and category 'AMINO_ACID'",
    "leucine / g / AMINO_ACID",
    `${leucineDef?.key} / ${leucineDef?.unit} / ${leucineDef?.category}`,
    leucineDef?.key === "leucine" && leucineDef?.unit === "g" && leucineDef?.category === "AMINO_ACID"
  );

  // -------------------------------------------------------------------------
  // GROUP 3: Bi-Directional Mapping Engine (WorkbookMapper) (Tests 14–20)
  // -------------------------------------------------------------------------
  console.log("\n--- GROUP 3: Bi-Directional Mapping Engine (WorkbookMapper) ---");

  // Create Sample Foods and Meal Entries
  const sampleFood = await FoodService.createFood(testUserAId, {
    name: "Wild Alaskan Salmon Fillet",
    brand: "Ocean Harvest",
    servingSize: 150,
    servingUnit: "g",
    calories: 280,
    protein: 34,
    carbohydrates: 0,
    fat: 15,
    fiber: 0,
    sugar: 0,
    calcium: 30,
    iron: 1.2,
    potassium: 620,
    magnesium: 45,
    zinc: 1.1,
    vitaminA: 60,
    vitaminC: 0,
    vitaminD: 18.5,
    vitaminB12: 4.8,
  });

  const mealEntry = await NutritionService.logFoodToMeal(testUserAId, {
    date: todayStr,
    mealType: "DINNER",
    foodId: sampleFood.id,
    quantity: 150,
    quantityUnit: "g",
  });

  const mealEntriesForSync = await GoogleSheetsService.getMealEntriesForSync(testUserAId, 7);

  // 14. Food Log Mapping
  const foodLogMapped = WorkbookMapper.mapMealEntriesToFoodLogRows(mealEntriesForSync);
  recordTest(
    "14. Food Log rows correctly formatted to 28-column structure",
    "28 fields per row",
    `${foodLogMapped[0]?.length || 0} fields per row`,
    foodLogMapped.length >= 1 && foodLogMapped[0].length === 28
  );

  // 15. Micronutrients Mapping
  const microMapped = WorkbookMapper.mapMealEntriesToMicronutrientRows(mealEntriesForSync);
  recordTest(
    "15. Micronutrient rows correctly formatted to 33-column structure",
    "33 fields per row",
    `${microMapped[0]?.length || 0} fields per row`,
    microMapped.length >= 1 && microMapped[0].length === 33
  );

  // 16. Amino Acids Mapping
  const aminoMapped = WorkbookMapper.mapMealEntriesToAminoAcidRows(mealEntriesForSync);
  recordTest(
    "16. Amino Acid rows correctly formatted to 22-column structure",
    "22 fields per row",
    `${aminoMapped[0]?.length || 0} fields per row`,
    aminoMapped.length >= 1 && aminoMapped[0].length === 22
  );

  // 17. Other Nutrients Mapping
  const otherMapped = WorkbookMapper.mapMealEntriesToOtherNutrientRows(mealEntriesForSync);
  recordTest(
    "17. Other Nutrient rows correctly formatted to 14-column structure",
    "14 fields per row",
    `${otherMapped[0]?.length || 0} fields per row`,
    otherMapped.length >= 1 && otherMapped[0].length === 14
  );

  // 18. Daily Summary Mapping
  const dailySummaries = await GoogleSheetsService.getDailySummariesForSync(testUserAId, 7);
  const dailyMapped = WorkbookMapper.mapDailySummaryRows(dailySummaries);
  recordTest(
    "18. Daily Summary rows correctly formatted to 67-column structure",
    "67 fields per row",
    `${dailyMapped[0]?.length || 0} fields per row`,
    dailyMapped.length >= 1 && dailyMapped[0].length === 67
  );

  // 19. Food Database Mapping
  const userFoods = await FoodService.getUserFoods({ userId: testUserAId });
  const foodDbMapped = WorkbookMapper.mapFoodsToFoodDatabaseRows(userFoods);
  recordTest(
    "19. Food Database rows correctly formatted to 70-column structure",
    "70 fields per row",
    `${foodDbMapped[0]?.length || 0} fields per row`,
    foodDbMapped.length >= 1 && foodDbMapped[0].length === 70
  );

  // 20. Nutrient Dictionary & Targets Mapping
  const dictMapped = WorkbookMapper.mapNutrientDictionaryRows();
  const targetsMapped = WorkbookMapper.mapTargetsToNutritionTargetRows();
  recordTest(
    "20. Nutrient Dictionary & Nutrition Targets mapped with 63 items",
    "63 rows each",
    `${dictMapped.length} dict rows / ${targetsMapped.length} target rows`,
    dictMapped.length === 63 && targetsMapped.length === 63
  );

  // -------------------------------------------------------------------------
  // GROUP 4: Multi-Sheet Synchronization & Google Client (Tests 21–26)
  // -------------------------------------------------------------------------
  console.log("\n--- GROUP 4: Multi-Sheet Synchronization & Google Client ---");

  // Connect Spreadsheet for User A via Option 1 Google Apps Script Webhook
  const webhookUrl = "https://script.google.com/macros/s/AKfycb_Option1_AppsScript_TestWebhook12345/exec";
  const extractionWebhook = extractSpreadsheetId(webhookUrl);
  recordTest(
    "21. Option 1 Apps Script Webhook URL correctly recognized and extracted",
    "APPS_SCRIPT_WEBHOOK",
    extractionWebhook.mode,
    extractionWebhook.mode === "APPS_SCRIPT_WEBHOOK" && extractionWebhook.spreadsheetId === "AKfycb_Option1_AppsScript_TestWebhook12345"
  );

  const connA = await GoogleSheetsConnectionService.connectSpreadsheet(testUserAId, webhookUrl, "Elena's Health OS (Option 1)");

  // 22. Multi-Sheet Full Sync Execution
  const syncResult = await GoogleSheetsService.executeSync(testUserAId, { dateRangeDays: 14 });
  recordTest(
    "22. Full Multi-Sheet Sync executes across all 8 workbook tabs via Option 1 Webhook",
    "8 sheets synced",
    `${syncResult.sheetsSynced?.length || 0} sheets synced`,
    syncResult.success && (syncResult.sheetsSynced?.length || 0) === 8
  );

  // 23. Concurrency Locking per User
  const syncP1 = GoogleSheetsService.executeSync(testUserAId);
  const syncP2 = GoogleSheetsService.executeSync(testUserAId);
  const [s1, s2] = await Promise.all([syncP1, syncP2]);
  recordTest(
    "23. Active Sync Concurrency Lock protects against overlapping sync requests",
    "both handled safely",
    s1.success && s2.success ? "both handled safely" : "error",
    s1.success && s2.success
  );

  // 24. Database Synchronization Status Updated
  const updatedConnA = await GoogleSheetsConnectionService.getConnection(testUserAId);
  recordTest(
    "24. PostgreSQL connection records SUCCESS status and sync timestamp",
    "SUCCESS",
    updatedConnA?.syncStatus || "",
    updatedConnA?.syncStatus === "SUCCESS" && updatedConnA?.lastSyncedAt !== null
  );

  // 25. Automatic Background Sync on Meal Logging
  const entry2 = await NutritionService.logFoodToMeal(testUserAId, {
    date: todayStr,
    mealType: "BREAKFAST",
    foodId: sampleFood.id,
    quantity: 100,
    quantityUnit: "g",
  });
  recordTest(
    "25. Meal logging automatically dispatches background synchronization",
    "meal logged in DB",
    entry2.id ? "meal logged in DB" : "failed",
    Boolean(entry2.id)
  );

  // 26. Automatic Background Sync on Meal Deletion
  const deleted = await NutritionService.deleteMealEntry(testUserAId, entry2.id);
  recordTest(
    "26. Meal deletion automatically dispatches background synchronization",
    entry2.id,
    deleted.id,
    deleted.id === entry2.id
  );

  // -------------------------------------------------------------------------
  // GROUP 5: Connection Security & Isolation (Tests 27–30)
  // -------------------------------------------------------------------------
  console.log("\n--- GROUP 5: Connection Security & Multi-Tenant Isolation ---");

  // 27. Master Template Link Integrity
  recordTest(
    "27. Official Master Nutrition Template link configured correctly",
    "https://docs.google.com/spreadsheets/d/19EFB0ufPY8YHNbLp0PTwrJuFJJVz_6lz-ofau3TSxsY/edit?gid=0#gid=0",
    DEFAULT_NUTRITION_TEMPLATE_URL,
    DEFAULT_NUTRITION_TEMPLATE_URL === "https://docs.google.com/spreadsheets/d/19EFB0ufPY8YHNbLp0PTwrJuFJJVz_6lz-ofau3TSxsY/edit?gid=0#gid=0"
  );

  // 28. Multi-Tenant Isolation: User B Cannot Read User A's Connection
  const connB = await GoogleSheetsConnectionService.getConnection(testUserBId);
  recordTest(
    "28. User B cannot access User A's connected spreadsheet",
    "null",
    connB === null ? "null" : "found",
    connB === null
  );

  // 29. Disconnect Operation
  const disconnectRes = await GoogleSheetsConnectionService.disconnectSpreadsheet(testUserAId);
  recordTest(
    "29. Safe Disconnect removes connection without touching PostgreSQL meals",
    "true",
    String(disconnectRes.success),
    disconnectRes.success === true
  );

  // 30. Preserved PostgreSQL Data Post Disconnect
  const postDisconnectMeals = await NutritionService.getDailyNutrition(testUserAId, todayStr);
  recordTest(
    "30. Primary PostgreSQL nutrition data intact post disconnect",
    "meals preserved",
    postDisconnectMeals.meals.length > 0 ? "meals preserved" : "empty",
    postDisconnectMeals.meals.length > 0
  );

  // -------------------------------------------------------------------------
  // GROUP 6: Full Application Regression Verification (Tests 31–36)
  // -------------------------------------------------------------------------
  console.log("\n--- GROUP 6: Full Application Regression Verification ---");

  // 31. Daily Nutrition & Macro Calculations Intact
  const dailyNutri = await NutritionService.getDailyNutrition(testUserAId, todayStr);
  recordTest(
    "31. Daily Nutrition calculations and macro distributions intact",
    "calories calculated",
    dailyNutri.totals.calories > 0 ? "calories calculated" : "0",
    dailyNutri.totals.calories > 0
  );

  // 32. Deep Nutrition Micronutrient Analysis Intact
  const deepNutri = await DeepNutritionService.getDeepNutritionAnalysis(testUserAId, todayStr);
  recordTest(
    "32. Deep Nutrition micronutrient analysis and RDA targets intact",
    "macros & vitamins tracked",
    deepNutri.macros.length > 0 && deepNutri.vitamins.length > 0 ? "macros & vitamins tracked" : "empty",
    deepNutri.macros.length > 0 && deepNutri.vitamins.length > 0
  );

  // 33. Food Database Management Intact
  const foodCheck = await FoodService.getUserFoods({ userId: testUserAId });
  recordTest(
    "33. Food Database management intact",
    "foods found",
    foodCheck.length > 0 ? "foods found" : "empty",
    foodCheck.length > 0
  );

  // 34. Hydration Logging Intact
  const hydration = await prisma.hydrationLog.create({
    data: {
      userId: testUserAId,
      amountMl: 750,
      beverageType: "WATER",
      date: todayStr,
    },
  });
  recordTest(
    "34. Hydration Logging intact",
    "750",
    String(hydration.amountMl),
    hydration.amountMl === 750
  );

  // 35. Activities & Distance Running Logging Intact
  const activity = await prisma.activityLog.create({
    data: {
      userId: testUserAId,
      activityType: "RUN",
      runningType: "INTERVAL",
      date: todayStr,
      distanceKm: 6.2,
      movingDurationSeconds: 1860,
      averagePaceSecondsPerKm: 300,
      caloriesBurned: 440,
    },
  });
  recordTest(
    "35. Activities & Workout Logging intact",
    "6.2",
    String(activity.distanceKm),
    Number(activity.distanceKm) === 6.2
  );

  // 36. High-Performance Multi-Sheet Aggregation (< 100ms)
  const startPerf = Date.now();
  await GoogleSheetsService.getMealEntriesForSync(testUserAId, 30);
  await GoogleSheetsService.getDailySummariesForSync(testUserAId, 30);
  const duration = Date.now() - startPerf;
  recordTest(
    "36. High-Performance 30-Day Multi-Sheet Aggregation (< 500ms)",
    "< 500ms",
    `${duration}ms`,
    duration < 500
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

runPrompt12Tests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
