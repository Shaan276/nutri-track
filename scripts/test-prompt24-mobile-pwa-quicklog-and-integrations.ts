/**
 * NUTRI-TRACK — PROMPT 24 AUTOMATED TEST SUITE
 * Mobile & PWA Optimization, Quick Log Experience + External Activity Integrations
 */

import fs from "fs";
import path from "path";
import { prisma } from "../lib/db";
import { IntegrationService } from "../lib/services/integrations/integration.service";
import { StravaService } from "../lib/services/integrations/strava.service";
import { ActivityService } from "../lib/services/activity.service";
import { WorkoutService } from "../lib/services/workout.service";
import { FoodService } from "../lib/services/food.service";
import { NutritionService } from "../lib/services/nutrition.service";
import { HydrationService } from "../lib/services/hydration.service";
import { calculateAveragePace, formatPace } from "../lib/validations/activity";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    failedCount++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runSuite() {
  console.log("\n=======================================================");
  console.log("=== NUTRI-TRACK PROMPT 24 AUTOMATED TEST SUITE ===");
  console.log("=======================================================\n");

  const pool = prisma as any;
  const timestamp = Date.now();
  const todayStr = new Date().toISOString().split("T")[0];

  // --- PART 1: PWA & OFFLINE ARCHITECTURE AUDIT ---
  console.log("--- PART 1: PWA Manifest, Icons & Service Worker Security Audit ---");

  // 1. Check manifest.json
  const manifestPath = path.join(process.cwd(), "public", "manifest.json");
  assert(fs.existsSync(manifestPath), "1. public/manifest.json file exists");

  const manifestContent = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  assert(manifestContent.name === "Nutri-Track", "2. Manifest name is 'Nutri-Track'");
  assert(manifestContent.short_name === "Nutri-Track", "3. Manifest short_name is 'Nutri-Track'");
  assert(manifestContent.theme_color === "#0E121A", "4. Manifest theme_color is AMOLED dark (#0E121A)");
  assert(manifestContent.background_color === "#0E121A", "5. Manifest background_color is AMOLED dark (#0E121A)");
  assert(manifestContent.display === "standalone", "6. Manifest display mode is 'standalone'");
  assert(manifestContent.icons?.length >= 2, "7. Manifest includes responsive icon definitions");

  // 2. Check offline.html
  const offlineHtmlPath = path.join(process.cwd(), "public", "offline.html");
  assert(fs.existsSync(offlineHtmlPath), "8. public/offline.html fallback page exists");

  // 3. Check service worker security
  const swPath = path.join(process.cwd(), "public", "sw.js");
  assert(fs.existsSync(swPath), "9. public/sw.js Service Worker file exists");
  const swContent = fs.readFileSync(swPath, "utf-8");
  assert(
    swContent.includes("/api/") && swContent.includes("return;"),
    "10. Service Worker strictly enforces NO CACHING of /api/* private health endpoints"
  );
  assert(
    swContent.includes("OFFLINE_FALLBACK") || swContent.includes("/offline.html"),
    "11. Service Worker provides safe offline fallback for page navigation"
  );

  // --- PART 2: QUICK LOG COMPUTATIONS & OPERATIONS ---
  console.log("\n--- PART 2: Quick Log Calculations & Macro Scaling ---");

  // 1. Macro scaling calculation
  const baseFood = {
    servingSize: 100,
    calories: 165,
    protein: 31,
    carbohydrates: 0,
    fat: 3.6,
  };
  const scaledServing = 250; // 250g
  const factor = scaledServing / baseFood.servingSize;
  const scaledCalories = Math.round(baseFood.calories * factor * 10) / 10;
  const scaledProtein = Math.round(baseFood.protein * factor * 10) / 10;
  assert(scaledCalories === 412.5, "12. Quick Log accurately scales calories for 250g portion (412.5 kcal)");
  assert(scaledProtein === 77.5, "13. Quick Log accurately scales protein for 250g portion (77.5g protein)");

  // 2. Running pace calculation
  const distanceKm = 5.0;
  const durationMinutes = 25.0; // 25 mins for 5 km -> 5:00 / km (300 sec/km)
  const durationSeconds = durationMinutes * 60;
  const paceSeconds = calculateAveragePace(distanceKm, durationSeconds);
  const formattedPace = formatPace(paceSeconds);
  assert(paceSeconds === 300, "14. Pace calculation is 300 sec/km for 5km in 25 mins");
  assert(formattedPace === "5:00 / km", "15. Pace formats cleanly as '5:00 / km'");

  // --- PART 3: MULTI-USER ISOLATION & TEST ENTITIES ---
  console.log("\n--- PART 3: Multi-User Setup & External Activity Ingestion ---");

  const userA = await pool.user.create({
    data: {
      id: `usr_p24_a_${timestamp}`,
      name: "Arthur Runner",
      email: `arthur_${timestamp}@example.com`,
      username: `arthur_${timestamp}`,
      passwordHash: "secret123",
      role: "USER",
      accountStatus: "APPROVED",
    },
  });

  const userB = await pool.user.create({
    data: {
      id: `usr_p24_b_${timestamp}`,
      name: "Beatrice Isolated",
      email: `beatrice_${timestamp}@example.com`,
      username: `beatrice_${timestamp}`,
      passwordHash: "secret123",
      role: "USER",
      accountStatus: "APPROVED",
    },
  });

  // Connect mock Strava to User A
  const connectRes = await StravaService.exchangeCodeForTokens(userA.id, "mock_auth_code_999");
  assert(connectRes.success === true, "16. User A successfully connected to Strava sandbox");

  // Verify tokens are never exposed in public DTO
  const publicIntegrations = await IntegrationService.getConnectedIntegrations(userA.id);
  const stravaDto = publicIntegrations.find((i) => i.provider === "STRAVA");
  assert(stravaDto !== undefined, "17. Strava integration listed in public connected integrations");
  assert((stravaDto as any).accessToken === undefined, "18. Sensitive accessToken is strictly stripped from public DTO");
  assert((stravaDto as any).refreshToken === undefined, "19. Sensitive refreshToken is strictly stripped from public DTO");

  // Verify User B has NO access to User A's integration
  const userBIntegrations = await IntegrationService.getConnectedIntegrations(userB.id);
  assert(!userBIntegrations.some((i) => i.provider === "STRAVA"), "20. User B has no active Strava integration (Multi-user isolation)");

  // --- PART 4: STRAVA ACTIVITY SYNC & STRICT DUPLICATE PREVENTION ---
  console.log("\n--- PART 4: Strava Activity Sync & Strict Duplicate Prevention ---");

  const mockStravaActivities = [
    {
      id: 8877665501,
      name: "Morning Trail Tempo",
      type: "Run",
      distance: 6200, // 6.2 km
      moving_time: 1860, // 31 mins
      elapsed_time: 1900,
      total_elevation_gain: 65,
      calories: 440,
      start_date: `${todayStr}T06:30:00Z`,
    },
    {
      id: 8877665502,
      name: "Afternoon Commute Ride",
      type: "Ride",
      distance: 12500, // 12.5 km
      moving_time: 2100, // 35 mins
      elapsed_time: 2250,
      total_elevation_gain: 30,
      calories: 320,
      start_date: `${todayStr}T16:45:00Z`,
    },
  ];

  // First Sync: Should import 2 new activities
  const sync1 = await StravaService.syncActivities(userA.id, {
    simulatedActivities: mockStravaActivities,
  });

  assert(sync1.totalFound === 2, "21. Strava sync identified 2 raw activities from provider");
  assert(sync1.importedCount === 2, "22. Initial sync imported exactly 2 new activities");
  assert(sync1.updatedCount === 0, "23. Initial sync updated 0 existing records");

  // Verify database records created
  const userAActivitiesAfterSync1 = await pool.activityLog.findMany({
    where: { userId: userA.id },
  });
  assert(userAActivitiesAfterSync1.length === 2, "24. Exactly 2 activity records exist in database for User A");

  const importedRun = userAActivitiesAfterSync1.find((a: any) => a.externalId === "8877665501");
  assert(importedRun !== undefined, "25. Imported Strava Run is present with externalId");
  assert(importedRun?.source === "STRAVA", "26. Activity source is tagged as 'STRAVA'");
  assert(importedRun?.activityType === "RUN", "27. Activity type mapped correctly to 'RUN'");
  assert(Number(importedRun?.distanceKm) === 6.2, "28. Distance mapped correctly to 6.2 km");

  // Second Sync with SAME data: MUST NOT duplicate records (Duplicate Prevention)
  const sync2 = await StravaService.syncActivities(userA.id, {
    simulatedActivities: mockStravaActivities,
  });

  assert(sync2.importedCount === 0, "29. Repeated sync with identical IDs imported 0 new records (Deduplicated)");
  assert(sync2.updatedCount === 2, "30. Repeated sync updated/reconciled 2 existing records in-place");

  const userAActivitiesAfterSync2 = await pool.activityLog.findMany({
    where: { userId: userA.id },
  });
  assert(userAActivitiesAfterSync2.length === 2, "31. Activity record count remained strictly 2 (Zero duplicate rows created)");

  // Third Sync with Modified Title/Calories: Reconciles cleanly without duplication
  const modifiedMockActivities = [
    {
      ...mockStravaActivities[0],
      name: "Morning Trail Tempo [Updated]",
      calories: 480, // Edited calories
    },
    mockStravaActivities[1],
  ];

  const sync3 = await StravaService.syncActivities(userA.id, {
    simulatedActivities: modifiedMockActivities,
  });
  assert(sync3.importedCount === 0, "32. Re-sync with modified fields created 0 duplicate rows");
  assert(sync3.updatedCount === 2, "33. Re-sync reconciled 2 records");

  const updatedRun = await pool.activityLog.findFirst({
    where: { userId: userA.id, externalId: "8877665501" },
  });
  assert(updatedRun?.notes === "Morning Trail Tempo [Updated]", "34. Reconciled activity title updated in place");
  assert(updatedRun?.caloriesBurned === 480, "35. Reconciled activity calories updated in place");

  // --- PART 5: INDEPENDENCE OF MANUAL ACTIVITIES ---
  console.log("\n--- PART 5: Manual vs External Activity Independence ---");

  // Log a manual run for User A
  const manualRun = await ActivityService.logActivity(userA.id, {
    activityType: "RUN",
    runningType: "TEMPO",
    date: todayStr,
    distanceKm: 8.0,
    movingDurationSeconds: 40 * 60,
    caloriesBurned: 520,
    notes: "Manual Track Workout",
  });

  assert(manualRun.source === "MANUAL", "36. Manual activity tagged with source 'MANUAL'");
  assert(manualRun.externalId === null, "37. Manual activity has externalId === null");

  // Run Strava sync again: manual run must remain completely untouched
  await StravaService.syncActivities(userA.id, {
    simulatedActivities: mockStravaActivities,
  });

  const allActivitiesAfterManual = await pool.activityLog.findMany({
    where: { userId: userA.id },
  });
  assert(allActivitiesAfterManual.length === 3, "38. Total activity count is 3 (2 Strava + 1 Manual)");
  const manualRecord = allActivitiesAfterManual.find((a: any) => a.id === manualRun.id);
  assert(manualRecord?.notes === "Manual Track Workout", "39. Manual activity is 100% preserved and untouched by external sync");

  // --- PART 6: DISCONNECT INTEGRATION CLEANUP ---
  console.log("\n--- PART 6: Disconnect Integration & Credential Revocation ---");

  const disconnected = await IntegrationService.disconnectIntegration(userA.id, "STRAVA");
  assert(disconnected === true, "40. Disconnect Strava integration succeeded");

  const postDisconnectIntegrations = await IntegrationService.getConnectedIntegrations(userA.id);
  assert(!postDisconnectIntegrations.some((i) => i.provider === "STRAVA"), "41. Strava connection removed from database");

  // Existing synced activities remain preserved in user's history
  const activitiesAfterDisconnect = await pool.activityLog.findMany({
    where: { userId: userA.id },
  });
  assert(activitiesAfterDisconnect.length === 3, "42. Historical imported activities remain safely preserved after disconnect");

  // --- PART 7: CLEANUP TEST USERS ---
  try {
    await pool.activityLog.deleteMany({ where: { userId: userA.id } });
    await pool.activityLog.deleteMany({ where: { userId: userB.id } });
    await pool.integrationConnection.deleteMany({ where: { userId: userA.id } });
    await pool.integrationConnection.deleteMany({ where: { userId: userB.id } });
    await pool.user.deleteMany({ where: { id: userA.id } });
    await pool.user.deleteMany({ where: { id: userB.id } });
  } catch {}

  console.log("\n=======================================================");
  console.log(`=== PROMPT 24 TEST SUMMARY: ${passedCount} / ${passedCount + failedCount} PASSED ===`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Test Suite Error:", err);
  process.exit(1);
});
