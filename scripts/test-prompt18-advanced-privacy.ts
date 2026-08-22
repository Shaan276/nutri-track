import { prisma } from "../lib/db";
import { PrivacyService } from "../lib/services/privacy.service";
import { CommunityService } from "../lib/services/community.service";
import { RecommendationService } from "../lib/services/recommendation.service";
import { AIContextBuilder } from "../lib/ai/context-builder";
import { PRIVACY_CATEGORIES_META, UserGranularPrivacyDto } from "../lib/validations/privacy";
import * as fs from "fs";
import * as path from "path";

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
    failedTests++;
  }
}

async function runPrompt18Tests() {
  console.log("\n=======================================================");
  console.log("   NUTRI-TRACK PROMPT 18: ADVANCED PRIVACY & COMMUNITY");
  console.log("=======================================================\n");

  const timestamp = Date.now();
  const userAEmail = `alice_p18_${timestamp}@example.com`;
  const userBEmail = `bob_p18_${timestamp}@example.com`;
  const userCEmail = `charlie_p18_${timestamp}@example.com`;
  const userDEmail = `david_p18_${timestamp}@example.com`;

  // 1. Check Sidebar Cleanup (Kcal Out removed)
  console.log("--- 1. Navigation & UI Structure Cleanup ---");
  const sidebarFile = path.join(process.cwd(), "components", "layout", "Sidebar.tsx");
  const sidebarContent = fs.readFileSync(sidebarFile, "utf-8");
  assert(
    !sidebarContent.includes('name: "Kcal Out"') && !sidebarContent.includes("href: '/kcal-out'"),
    "Kcal Out navigation item completely removed from Sidebar"
  );

  // Register test users
  console.log("\n--- 2. User Setup & Privacy Initialization ---");
  const userA = await prisma.user.create({
    data: {
      id: `usr_a_${timestamp}`,
      email: userAEmail,
      passwordHash: "Password123!",
      name: "Alice Privacy",
      username: `alice_p18_${timestamp}`,
    },
  });
  const userB = await prisma.user.create({
    data: {
      id: `usr_b_${timestamp}`,
      email: userBEmail,
      passwordHash: "Password123!",
      name: "Bob Privacy",
      username: `bob_p18_${timestamp}`,
    },
  });
  const userC = await prisma.user.create({
    data: {
      id: `usr_c_${timestamp}`,
      email: userCEmail,
      passwordHash: "Password123!",
      name: "Charlie Privacy",
      username: `charlie_p18_${timestamp}`,
    },
  });
  const userD = await prisma.user.create({
    data: {
      id: `usr_d_${timestamp}`,
      email: userDEmail,
      passwordHash: "Password123!",
      name: "David Blocked",
      username: `david_p18_${timestamp}`,
    },
  });

  // Test 2: Default privacy initialization
  const defaultInit = await PrivacyService.initializeDefaultPrivacy(userA.id);
  assert(
    defaultInit.nutrition === "FRIENDS" &&
      defaultInit.activities === "FRIENDS" &&
      defaultInit.workouts === "FRIENDS" &&
      defaultInit.hydration === "FRIENDS" &&
      defaultInit.insightsProgress === "FRIENDS" &&
      defaultInit.reports === "FRIENDS",
    "Default initialization sets standard categories to FRIENDS"
  );

  // Test 3: Safe Fallback for unconfigured or unknown user
  const unconfiguredPrivacy = await PrivacyService.getCategoryVisibility("non_existent_user_id", "NUTRITION");
  assert(
    unconfiguredPrivacy === "PRIVATE",
    "Fail-Safe Rule: Unresolved privacy settings default safely to PRIVATE, never PUBLIC"
  );

  // Test 4: Updating granular privacy settings
  console.log("\n--- 3. Granular Privacy Updates ---");
  const updatedA = await PrivacyService.updatePrivacySettings(userA.id, {
    nutrition: "PRIVATE",
    activities: "PUBLIC",
    hydration: "FRIENDS",
    workouts: "PRIVATE",
  });
  assert(
    updatedA.nutrition === "PRIVATE" && updatedA.activities === "PUBLIC" && updatedA.workouts === "PRIVATE",
    "User can independently toggle granular privacy per category"
  );

  // Establish Friendships:
  // Alice <-> Bob : ACCEPTED
  // Alice <-> Charlie : PENDING
  // Alice <-> David : BLOCKED
  console.log("\n--- 4. Relationship Setup ---");
  const reqBob = await CommunityService.sendFriendRequest(userA.id, userB.username);
  await CommunityService.respondToFriendRequest(userB.id, reqBob.friendship.id, "ACCEPT");

  await CommunityService.sendFriendRequest(userA.id, userC.username);

  // Block David
  await (prisma as any).friendship.create({
    data: {
      requesterId: userA.id,
      addresseeId: userD.id,
      status: "BLOCKED",
    },
  });

  // Test 5: Owner Access Engine
  console.log("\n--- 5. Server-Side 5-Step Authorization Engine ---");
  const ownerNutrition = await PrivacyService.canAccessCategory(userA.id, userA.id, "NUTRITION");
  const ownerWorkouts = await PrivacyService.canAccessCategory(userA.id, userA.id, "WORKOUTS");
  assert(
    ownerNutrition === true && ownerWorkouts === true,
    "Step 1 (Owner): Data owner always has 100% access to their own private data"
  );

  // Test 6: Not Connected User Access
  const unconnectedAccess = await PrivacyService.canAccessCategory(
    "random_unconnected_id",
    userA.id,
    "HYDRATION" // User A's hydration is FRIENDS
  );
  assert(
    unconnectedAccess === false,
    "Unconnected user cannot access categories set to FRIENDS"
  );

  // Test 7: Accepted Friend Access to FRIENDS category
  const friendHydrationAccess = await PrivacyService.canAccessCategory(userB.id, userA.id, "HYDRATION");
  assert(
    friendHydrationAccess === true,
    "Accepted friend CAN access categories set to FRIENDS"
  );

  // Test 8: Accepted Friend Access to PRIVATE category
  const friendNutritionAccess = await PrivacyService.canAccessCategory(userB.id, userA.id, "NUTRITION");
  assert(
    friendNutritionAccess === false,
    "Accepted friend CANNOT access categories set to PRIVATE by the owner"
  );

  // Test 9: PUBLIC Category Access (even unconnected)
  const publicAccess = await PrivacyService.canAccessCategory("stranger_id", userA.id, "ACTIVITIES");
  assert(
    publicAccess === true,
    "Categories set to PUBLIC are accessible to any authenticated viewer"
  );

  // Test 10: Pending Friend Access
  const pendingHydrationAccess = await PrivacyService.canAccessCategory(userC.id, userA.id, "HYDRATION");
  assert(
    pendingHydrationAccess === false,
    "Pending friend CANNOT access categories set to FRIENDS"
  );

  // Test 11: Blocked User Access
  const blockedAccess = await PrivacyService.canAccessCategory(userD.id, userA.id, "ACTIVITIES");
  assert(
    blockedAccess === false,
    "Blocked user CANNOT access any category even if set to PUBLIC"
  );

  // Test 12: High-Performance Batch Category Authorization
  console.log("\n--- 6. Batch Privacy Evaluation ---");
  const batchBob = await PrivacyService.canAccessCategoriesBatch(userB.id, userA.id, [
    "PROFILE",
    "NUTRITION",
    "ACTIVITIES",
    "WORKOUTS",
    "HYDRATION",
  ]);
  assert(
    batchBob.NUTRITION === false &&
      batchBob.ACTIVITIES === true &&
      batchBob.WORKOUTS === false &&
      batchBob.HYDRATION === true,
    "Batch evaluation correctly resolves multi-category permissions in 1 pass"
  );

  // Test 13: Friend Shared Profile Experience (Masking private data)
  console.log("\n--- 7. Friend Shared Profile Experience ---");
  const bobViewsAlice = await CommunityService.getFriendSharedProfile(userB.id, userA.username);
  assert(
    bobViewsAlice.nutrition.isPrivate === true &&
      bobViewsAlice.nutrition.data === null &&
      bobViewsAlice.workouts.isPrivate === true &&
      bobViewsAlice.workouts.data === null,
    "Friend profile cleanly masks private sections (isPrivate=true, data=null)"
  );

  // Test 14: Shared section accessible with non-private status
  assert(
    bobViewsAlice.hydration.isPrivate === false && bobViewsAlice.activities.isPrivate === false,
    "Friend profile cleanly provides access to shared sections (isPrivate=false)"
  );

  // Test 15: No fake 0 leaking for private data
  assert(
    bobViewsAlice.nutrition.data === null,
    "Private nutrition never defaults to 0 or 0g"
  );

  // Test 16: Log activity data for User A and User B to test feeds & comparisons
  console.log("\n--- 8. Data State & Mutual Comparisons ---");
  await (prisma as any).activityLog.create({
    data: {
      userId: userA.id,
      activityType: "RUNNING",
      durationMinutes: 30,
      distanceKm: 5.0,
      caloriesBurned: 350,
      intensity: "MODERATE",
      date: new Date(),
    },
  });

  await (prisma as any).activityLog.create({
    data: {
      userId: userB.id,
      activityType: "RUNNING",
      durationMinutes: 45,
      distanceKm: 8.0,
      caloriesBurned: 520,
      intensity: "HIGH",
      date: new Date(),
    },
  });

  // Ensure Bob's activities is FRIENDS
  await PrivacyService.updatePrivacySettings(userB.id, {
    activities: "FRIENDS",
    workouts: "PRIVATE",
    hydration: "FRIENDS",
  });

  // Test 17: Mutual Comparison when both allow
  const comparison = await CommunityService.getFriendComparison(userA.id, userB.username);
  const runMetric = comparison.metrics.find((m) => m.key === "running_distance");
  assert(
    runMetric !== undefined && runMetric.isSharedByBoth === true && runMetric.myValue !== null && runMetric.friendValue !== null,
    "Mutual comparison succeeds when both users allow Activities sharing"
  );

  // Test 18: Asymmetric Comparison (User A private, User B private)
  const workoutMetric = comparison.metrics.find((m) => m.key === "workout_sessions");
  assert(
    workoutMetric !== undefined && workoutMetric.isSharedByBoth === false && workoutMetric.myValue === null,
    "Mutual comparison is masked as Private when either user sets category to Private"
  );

  // Test 19: Privacy-Aware Activity Feed
  console.log("\n--- 9. Privacy-Aware Friend Activity Feed ---");
  const aliceFeed = await CommunityService.getActivityFeed(userA.id);
  const bobRuns = aliceFeed.filter((item) => item.friendId === userB.id && item.type === "RUN");
  assert(
    bobRuns.length > 0,
    "Activity feed includes friend runs when friend shares Activities"
  );

  // Set Bob's activities to PRIVATE and verify feed no longer exposes runs
  await PrivacyService.updatePrivacySettings(userB.id, { activities: "PRIVATE" });
  const aliceFeedAfterPrivate = await CommunityService.getActivityFeed(userA.id);
  const bobRunsHidden = aliceFeedAfterPrivate.filter((item) => item.friendId === userB.id && item.type === "RUN");
  assert(
    bobRunsHidden.length === 0,
    "Activity feed immediately hides friend runs when category is switched to PRIVATE"
  );

  // Test 20: AI Coach Privacy Isolation
  console.log("\n--- 10. AI Coach Privacy Isolation ---");
  const aliceContext = await AIContextBuilder.buildContext(userA.id, "test_conv", "How much did I run?");
  assert(
    !aliceContext.systemPrompt.includes(userB.name) && !aliceContext.systemPrompt.includes("8.0 km"),
    "AI Coach context for User A is 100% isolated and never accesses User B's activities"
  );

  // Test 21: Supportive Recommendation Flow (Non-mutating)
  console.log("\n--- 11. Friend Supportive Recommendations ---");
  const rec = await RecommendationService.sendRecommendation(userA.id, {
    receiverId: userB.id,
    itemType: "WORKOUT",
    title: "Upper Body Hypertrophy",
    payload: { sets: 4, reps: 10 },
    message: "Great routine you might like!",
  });
  assert(
    rec.id !== undefined && rec.status === "PENDING",
    "Recommendation is stored with status PENDING without mutating recipient targets"
  );

  // Test 22: Recipient accepts recommendation without overriding privacy
  const bobPrivacyBefore = await PrivacyService.getPrivacySettings(userB.id);
  await RecommendationService.respondToRecommendation(userB.id, rec.id, "SAVE");
  const bobPrivacyAfter = await PrivacyService.getPrivacySettings(userB.id);
  assert(
    bobPrivacyBefore.nutrition === bobPrivacyAfter.nutrition &&
      bobPrivacyBefore.workouts === bobPrivacyAfter.workouts,
    "Accepting recommendation does not alter receiving user's privacy settings"
  );

  // Test 23: Multi-Category Bulk Update & Consistency
  console.log("\n--- 12. Full 8-Category Bulk Updates & Consistency ---");
  const bulkPayload: UserGranularPrivacyDto = {
    profile: "PUBLIC",
    nutrition: "FRIENDS",
    deepNutrition: "PRIVATE",
    hydration: "FRIENDS",
    activities: "PUBLIC",
    workouts: "FRIENDS",
    insightsProgress: "PUBLIC",
    reports: "FRIENDS",
  };
  const bulkUpdated = await PrivacyService.updatePrivacySettings(userA.id, bulkPayload);
  assert(
    bulkUpdated.profile === "PUBLIC" &&
      bulkUpdated.deepNutrition === "PRIVATE" &&
      bulkUpdated.reports === "FRIENDS",
    "All 8 granular categories correctly persist in bulk update"
  );

  // Test 24: Backward Compatibility with Legacy getters
  assert(
    bulkUpdated.shareNutrition === "FRIENDS" &&
      bulkUpdated.shareActivities === "PUBLIC" &&
      bulkUpdated.shareWorkouts === "FRIENDS",
    "Legacy privacy getters (shareNutrition, shareActivities, etc.) remain fully backwards compatible"
  );

  // Test 25: Verification of all 8 categories defined in metadata
  assert(
    PRIVACY_CATEGORIES_META.length === 8,
    "Privacy metadata contains all 8 required categories (Profile, Nutrition, Deep Nutrition, Hydration, Activities, Workouts, Insights, Reports)"
  );

  // Final Summary
  console.log("\n=======================================================");
  console.log(`   PROMPT 18 TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log("=======================================================\n");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPrompt18Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
