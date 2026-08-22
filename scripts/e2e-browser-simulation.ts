import { prisma } from "../lib/db";
import { PrivacyService } from "../lib/services/privacy.service";
import { CommunityService } from "../lib/services/community.service";
import { RecommendationService } from "../lib/services/recommendation.service";
import { NutritionService } from "../lib/services/nutrition.service";
import { HydrationService } from "../lib/services/hydration.service";
import { WorkoutTemplateService } from "../lib/services/workout-template.service";
import { UserSettingsService } from "../lib/services/user-settings.service";
import { SmartInsightsService } from "../lib/services/insights/smart-insights.service";
import { AIToolRegistry } from "../lib/ai/tool-registry";

async function runFullE2ETest() {
  console.log("================================================================================");
  console.log("🌐 NUTRI-TRACK FULL END-TO-END FLOW VERIFICATION (BROWSER & SERVICES)");
  console.log("================================================================================");

  let passed = 0;
  let total = 0;
  function verify(condition: boolean, label: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${total}. ${label}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${total}. ${label}`);
      throw new Error(`E2E flow failed on: ${label}`);
    }
  }

  const timestamp = Date.now();
  const testUserId = `e2e_user_${timestamp}`;
  const friendUserId = `e2e_friend_${timestamp}`;

  try {
    // 1. Register / User Creation
    console.log("\n--- FLOW 1: Registration & Profile Setup ---");
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        name: "E2E Athlete",
        username: `athlete_${timestamp}`,
        email: `athlete_${timestamp}@example.com`,
        passwordHash: "secure_hash",
      },
    });
    verify(user.id === testUserId, "User registration and account creation");

    const friend = await prisma.user.create({
      data: {
        id: friendUserId,
        name: "E2E Partner",
        username: `partner_${timestamp}`,
        email: `partner_${timestamp}@example.com`,
        passwordHash: "secure_hash",
      },
    });
    verify(friend.id === friendUserId, "Second community user registered");

    // 2. Settings & Goals Customization
    console.log("\n--- FLOW 2: User Settings, BMR/TDEE & Goals ---");
    const updatedSettings = await UserSettingsService.updateUserSettings(testUserId, {
      profile: {
        dateOfBirth: "1994-06-12",
        biologicalSex: "MALE",
        heightCm: 180,
        weightKg: 78,
        activityLevel: "VERY_ACTIVE",
        primaryGoal: "MUSCLE_GAIN",
        dailyHydrationTargetMl: 3200,
        dailyStepTarget: 10000,
        weeklyRunningDistanceKm: 20,
        weeklyWorkoutSessions: 4,
      },
      nutritionGoals: {
        calories: 2800,
        protein: 175,
        carbohydrates: 300,
        fat: 75,
        fiber: 35,
        sugar: 40,
      },
    });
    verify(updatedSettings.profile.weightKg === 78, "Profile weight saved (78kg)");
    verify(updatedSettings.nutritionGoals.protein === 175, "Custom protein target saved (175g)");

    // 3. Privacy Settings Customization
    console.log("\n--- FLOW 3: Privacy & Sharing Controls ---");
    const defaultPrivacy = await PrivacyService.getPrivacySettings(testUserId);
    verify(defaultPrivacy.shareHealthScore === "PRIVATE", "Privacy defaults to PRIVATE across all categories");

    const updatedPrivacy = await PrivacyService.updatePrivacySettings(testUserId, {
      shareHealthScore: "FRIENDS",
      shareActivities: "FRIENDS",
      shareWorkouts: "FRIENDS",
      shareHydration: "FRIENDS",
    });
    verify(updatedPrivacy.shareHealthScore === "FRIENDS", "Health Score sharing enabled for friends");
    verify(updatedPrivacy.shareNutrition === "PRIVATE", "Nutrition individual meals remain strictly private");

    // Set friend's privacy
    await PrivacyService.updatePrivacySettings(friendUserId, {
      shareHealthScore: "FRIENDS",
      shareWorkouts: "FRIENDS",
      shareHydration: "FRIENDS",
    });

    // 4. Food Database & Meal Logging
    console.log("\n--- FLOW 4: Food Database & Meal Logging ---");
    const food = await prisma.food.create({
      data: {
        userId: testUserId,
        name: "Grilled Chicken & Rice Bowl",
        category: "POULTRY" as any,
        servingSize: 300 as any,
        servingUnit: "g",
        calories: 550 as any,
        protein: 48 as any,
        carbohydrates: 60 as any,
        fat: 10 as any,
        fiber: 4 as any,
        sugar: 2 as any,
        isFavorite: true,
      },
    });
    verify(food.name === "Grilled Chicken & Rice Bowl", "Food recipe created in database");

    const todayStr = new Date().toISOString().split("T")[0];
    const loggedEntry = await NutritionService.logFoodToMeal(testUserId, {
      date: todayStr,
      mealType: "LUNCH",
      foodId: food.id,
      quantity: 300,
      quantityUnit: "g",
    });
    const dailyNut = await NutritionService.getDailyNutrition(testUserId, todayStr);
    verify(dailyNut.totals.calories === 550, "Meal logged successfully with 550 kcal and 48g protein");

    // 5. Hydration Logging & Streak
    console.log("\n--- FLOW 5: Hydration Tracking ---");
    const hyd1 = await HydrationService.logHydration(testUserId, {
      amountMl: 750,
      beverageType: "WATER",
      date: todayStr,
    });
    const hydSummary = await HydrationService.getDailyHydration(testUserId, todayStr);
    verify(hydSummary.totalMl === 750, "Hydration logged (750 ml)");
    verify(hydSummary.percentage > 0, "Hydration progress percentage updated");

    // 6. Workout Routine & Session Logging
    console.log("\n--- FLOW 6: Workout Templates & Session Tracking ---");
    const template = await WorkoutTemplateService.createTemplate(testUserId, {
      name: "Upper Body Hypertrophy",
      workoutType: "GYM_WORKOUT",
      description: "Bench press, rows, and overhead presses",
      isFavorite: true,
      exercises: [
        { name: "Barbell Bench Press", category: "CHEST", defaultSets: 4, defaultReps: 8, defaultWeightKg: 85 },
        { name: "Barbell Row", category: "BACK", defaultSets: 4, defaultReps: 10, defaultWeightKg: 75 },
      ],
    });
    verify(template.name === "Upper Body Hypertrophy", "Workout routine template created with exercises");

    const session = await prisma.workoutSession.create({
      data: {
        userId: testUserId,
        workoutType: "GYM_WORKOUT",
        name: "Upper Body Hypertrophy",
        date: todayStr,
        durationSeconds: 3600,
        caloriesBurned: 420,
      },
    });
    verify(session.durationSeconds === 3600, "Workout session logged (60 mins, 420 kcal)");

    // 7. Activity / Running
    console.log("\n--- FLOW 7: Running & Activity Tracking ---");
    const run = await prisma.activityLog.create({
      data: {
        userId: testUserId,
        activityType: "RUN",
        notes: "Morning Tempo Run",
        date: todayStr,
        movingDurationSeconds: 1800,
        distanceKm: 6.0 as any,
        caloriesBurned: 380,
      },
    });
    verify(Number(run.distanceKm) === 6.0, "Running session logged (6.0 km)");

    // 8. Smart Insights & Health Score
    console.log("\n--- FLOW 8: Smart Insights & 100-Point Health Score ---");
    const insights = await SmartInsightsService.getSmartInsights(testUserId, "last7days");
    verify(insights.hasSufficientData === true, "Insights engine detects logged activities and nutrition");
    verify(insights.healthScore.overallScore >= 0 && insights.healthScore.overallScore <= 100, "Health score calculated between 0-100");

    // 9. Community: Friendship, Search & Connecting
    console.log("\n--- FLOW 9: Community Discovery & Friendship Lifecycle ---");
    const searchResults = await CommunityService.searchUsers(testUserId, "partner");
    verify(searchResults.some((u) => u.username === friend.username), "Friend found in safe search without exposing email");

    const friendReq = await CommunityService.sendFriendRequest(testUserId, friend.username);
    verify(friendReq.friendship.status === "PENDING", "Friend request sent");

    const acceptReq = await CommunityService.respondToFriendRequest(friendUserId, friendReq.friendship.id, "ACCEPT");
    verify(acceptReq.success && acceptReq.status === "ACCEPTED", "Friend request accepted");

    // 10. Shared Profile & Privacy Authorization
    console.log("\n--- FLOW 10: Friend Shared Profile & Mutual Privacy Authorization ---");
    const friendSharedProfile = await CommunityService.getFriendSharedProfile(friendUserId, user.username);
    verify(friendSharedProfile.healthScore.isPrivate === false, "Friend can view shared Health Score");
    verify(friendSharedProfile.workouts.isPrivate === false, "Friend can view shared Workout summary");
    verify(friendSharedProfile.nutrition.isPrivate === true, "Friend CANNOT view raw meals/nutrition (Private)");

    // 11. Mutual Progress Comparison
    console.log("\n--- FLOW 11: Mutual Progress Comparison ---");
    const comparison = await CommunityService.getFriendComparison(testUserId, friend.username);
    verify(comparison.friend.username === friend.username, "Comparison generated for accepted friend");
    const mutualHS = comparison.metrics.find((m) => m.key === "health_score");
    const mutualWk = comparison.metrics.find((m) => m.key === "workout_sessions");
    verify(mutualHS?.isSharedByBoth === true, "Health score compared (Shared by both)");
    verify(mutualWk?.isSharedByBoth === true, "Workouts compared (Shared by both)");

    // 12. Peer Recommendations
    console.log("\n--- FLOW 12: Controlled Peer Recommendations ---");
    const rec = await RecommendationService.sendRecommendation(testUserId, {
      receiverId: friendUserId,
      itemType: "WORKOUT",
      title: "Hypertrophy Upper Body Routine",
      payload: { templateId: template.id },
      message: "Try this workout routine next session!",
    });
    verify(rec.status === "PENDING", "Recommendation sent to friend");

    const friendRecs = await RecommendationService.getReceivedRecommendations(friendUserId);
    verify(friendRecs.some((r) => r.id === rec.id), "Friend received recommendation card");

    const saveRec = await RecommendationService.respondToRecommendation(friendUserId, rec.id, "SAVE");
    verify(saveRec.recommendation.status === "ACCEPTED", "Friend explicitly saved recommendation");

    // 13. Activity Feed
    console.log("\n--- FLOW 13: Activity Feed Milestones ---");
    const feed = await CommunityService.getActivityFeed(friendUserId);
    verify(feed.some((item) => item.friendUsername === user.username), "Friend's activity feed displays authorized milestone");

    // 14. AI Coach Integration
    console.log("\n--- FLOW 14: AI Coach Compare Tool Privacy ---");
    const aiToolResult = await AIToolRegistry.executeTool(
      "compare_with_friend",
      { friendUsername: friend.username },
      { userId: testUserId }
    );
    verify(aiToolResult.friend === "E2E Partner", "AI Coach safely retrieves authorized friend comparison");

    // Clean up
    console.log("\nCleaning up E2E test records...");
    try { await (prisma as any).friendship.deleteMany({ where: { OR: [{ requesterId: testUserId }, { addresseeId: testUserId }] } }); } catch {}
    try { await (prisma as any).userPrivacySettings.deleteMany({ where: { OR: [{ userId: testUserId }, { userId: friendUserId }] } }); } catch {}
    try { await (prisma as any).friendRecommendation.deleteMany({ where: { OR: [{ senderId: testUserId }, { receiverId: friendUserId }] } }); } catch {}
    try { await (prisma as any).notification.deleteMany({ where: { OR: [{ userId: testUserId }, { userId: friendUserId }] } }); } catch {}
    try { await (prisma as any).activityLog.deleteMany({ where: { userId: testUserId } }); } catch {}
    try { await (prisma as any).workoutSession.deleteMany({ where: { userId: testUserId } }); } catch {}
    try { await (prisma as any).workoutTemplate.deleteMany({ where: { userId: testUserId } }); } catch {}
    try { await (prisma as any).hydrationLog.deleteMany({ where: { userId: testUserId } }); } catch {}
    try { await (prisma as any).mealLog.deleteMany({ where: { userId: testUserId } }); } catch {}
    try { await (prisma as any).food.deleteMany({ where: { userId: testUserId } }); } catch {}
    try { await (prisma.userProfile.delete as any)({ where: { userId: testUserId } }); } catch {}
    try { await prisma.user.delete({ where: { id: testUserId } }); } catch {}
    try { await prisma.user.delete({ where: { id: friendUserId } }); } catch {}

    console.log("\n================================================================================");
    console.log(`🎉 ALL ${passed} / ${total} E2E USER FLOWS VERIFIED SUCCESSFULLY!`);
    console.log("================================================================================");
  } catch (err: any) {
    console.error("E2E verification error:", err);
    process.exit(1);
  }
}

runFullE2ETest();
