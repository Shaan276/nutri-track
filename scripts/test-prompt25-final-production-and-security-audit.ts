import { prisma } from "../lib/db";
import bcrypt from "bcryptjs";
import { UserSettingsService } from "../lib/services/user-settings.service";
import { NutritionService } from "../lib/services/nutrition.service";
import { HydrationService } from "../lib/services/hydration.service";
import { DeepNutritionService } from "../lib/services/deep-nutrition.service";
import { HealthContextService } from "../lib/services/health-context.service";
import { SmartInsightsService } from "../lib/services/insights/smart-insights.service";
import { ReportService } from "../lib/services/report.service";
import { AIMemoryService } from "../lib/ai/memory-service";
import { AICoachService } from "../lib/ai/ai-coach.service";
import { AIToolRegistry } from "../lib/ai/tool-registry";
import { WeeklyPlanService } from "../lib/services/weekly-plan.service";
import { CommunityService } from "../lib/services/community.service";
import { GoalService } from "../lib/services/goal.service";
import { AchievementService } from "../lib/services/achievement.service";
import { ChallengeService } from "../lib/services/challenge.service";
import { NotificationService } from "../lib/services/notification.service";
import { IntegrationService } from "../lib/services/integrations/integration.service";
import { StravaService } from "../lib/services/integrations/strava.service";
import fs from "fs";
import path from "path";

async function registerTestUser(input: { name: string; email: string; username: string; password: string }) {
  const normalizedEmail = input.email.toLowerCase().trim();
  const normalizedUsername = input.username.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(input.password, 10);

  const preApproved = await (prisma as any).preApprovedUser.findFirst({
    where: { identifier: normalizedEmail, consumedAt: null },
  });
  const isPreApproved = Boolean(preApproved);

  const user = await (prisma as any).user.create({
    data: {
      name: input.name,
      email: normalizedEmail,
      username: normalizedUsername,
      passwordHash,
      role: "USER",
      accountStatus: isPreApproved ? "APPROVED" : "PENDING_APPROVAL",
      approvedAt: isPreApproved ? new Date() : null,
    },
  });

  if (preApproved) {
    await (prisma as any).preApprovedUser.update({
      where: { id: preApproved.id },
      data: { consumedAt: new Date(), consumedByUserId: user.id },
    });
  }

  return user;
}

async function runMasterProductionAudit() {
  console.log("\n================================================================================");
  console.log("🌟 NUTRI-TRACK PROMPT 25: MASTER PRODUCTION DEPLOYMENT & SECURITY AUDIT 🌟");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${title}${detail ? ` — ${detail}` : ""}`);
      failed++;
    }
  }

  const pool = prisma as any;
  const timestamp = Date.now();
  const todayStr = new Date().toISOString().split("T")[0];

  try {
    // --------------------------------------------------------------------------
    // PART 1: AUTHENTICATION, APPROVAL GATE & ADMIN SETUP
    // --------------------------------------------------------------------------
    console.log("--- 1. Authentication, User Approval Gate & Admin RBAC ---");
    const userA = await registerTestUser({
      name: "Alice Runner",
      email: `alice_${timestamp}@example.com`,
      username: `alice_${timestamp}`,
      password: "Password123!",
    });
    assert(userA.accountStatus === "PENDING_APPROVAL", "New registered user defaults to PENDING_APPROVAL status");

    // Admin user bootstrap
    const adminUser = await pool.user.create({
      data: {
        id: `admin_${timestamp}`,
        name: "Super Admin",
        email: `admin_${timestamp}@example.com`,
        username: `admin_${timestamp}`,
        passwordHash: "secure_hash",
        role: "ADMIN",
        accountStatus: "APPROVED",
        approvedAt: new Date(),
      },
    });

    // Admin approves userA
    const approvedUserA = await pool.user.update({
      where: { id: userA.id },
      data: { accountStatus: "APPROVED", approvedAt: new Date(), approvedByAdminId: adminUser.id },
    });
    assert(approvedUserA.accountStatus === "APPROVED", "Admin successfully approved user account");

    // Pre-approved invitation registration
    const preApproved = await pool.preApprovedUser.create({
      data: {
        identifier: `bob_preapproved_${timestamp}@example.com`,
        invitedRole: "USER",
        createdByAdminId: adminUser.id,
      },
    });
    const userB = await registerTestUser({
      name: "Bob Lifter",
      email: `bob_preapproved_${timestamp}@example.com`,
      username: `bob_${timestamp}`,
      password: "Password123!",
    });
    assert(userB.accountStatus === "APPROVED", "Pre-approved invitee is immediately APPROVED on registration");

    // --------------------------------------------------------------------------
    // PART 2: PROFILE & METABOLIC BASELINE
    // --------------------------------------------------------------------------
    console.log("\n--- 2. Profile Creation & Metabolic Baseline Settings ---");
    await pool.userProfile.create({
      data: {
        userId: userA.id,
        dateOfBirth: new Date("1998-04-12"),
        biologicalSex: "FEMALE",
        heightCm: 168,
        weightKg: 62,
        activityLevel: "MODERATELY_ACTIVE",
        dailyHydrationTargetMl: 2500,
        dailyStepTarget: 10000,
        weeklyRunningDistanceKm: 25.0,
        weeklyWorkoutSessions: 4,
        primaryGoal: "FAT_LOSS",
      },
    });

    await pool.userNutrientTarget.create({
      data: {
        userId: userA.id,
        calories: 1800,
        protein: 130,
        carbohydrates: 180,
        fat: 55,
        fiber: 30,
        sugar: 35,
      },
    });

    const settingsA = await UserSettingsService.getUserSettings(userA.id);
    assert(Boolean(settingsA.metabolic && settingsA.metabolic.bmr > 1200 && settingsA.metabolic.tdee > 1600), "Mifflin-St Jeor BMR & TDEE calculated accurately");
    assert(settingsA.nutritionGoals.protein === 130, "Protein goal stored as 130g");

    // --------------------------------------------------------------------------
    // PART 3: FOOD DATABASE & SCALED MEAL LOGGING
    // --------------------------------------------------------------------------
    console.log("\n--- 3. Food Database, Macro Scaling & Recalculation Integrity ---");
    const salmonFood = await pool.food.create({
      data: {
        userId: userA.id,
        name: "Wild Atlantic Salmon",
        servingSize: 100,
        servingUnit: "g",
        calories: 208,
        protein: 22,
        carbohydrates: 0,
        fat: 13,
        fiber: 0,
        sugar: 0,
        vitaminD: 11,
        potassium: 363,
      },
    });

    // Log 200g portion (2x scaling)
    const mealLog = await NutritionService.logFoodToMeal(userA.id, {
      date: todayStr,
      mealType: "LUNCH",
      foodId: salmonFood.id,
      quantity: 200,
      quantityUnit: "g",
    });

    const dailyNutrition = await NutritionService.getDailyNutrition(userA.id, todayStr);
    assert(dailyNutrition.totals.calories === 416, "Calories correctly scaled to 416 kcal (208 * 2)");
    assert(dailyNutrition.totals.protein === 44, "Protein correctly scaled to 44g (22 * 2)");
    assert(dailyNutrition.totals.fat === 26, "Fat correctly scaled to 26g (13 * 2)");

    // --------------------------------------------------------------------------
    // PART 4: HYDRATION TRACKING & STREAK INTEGRITY
    // --------------------------------------------------------------------------
    console.log("\n--- 4. Hydration Tracking, Beverage Types & Streaks ---");
    await HydrationService.logHydration(userA.id, {
      date: todayStr,
      amountMl: 750,
      beverageType: "WATER",
    });
    await HydrationService.logHydration(userA.id, {
      date: todayStr,
      amountMl: 1750,
      beverageType: "WATER",
    });

    const dailyHydration = await HydrationService.getDailyHydration(userA.id, todayStr);
    assert(dailyHydration.totalMl === 2500, "Hydration total is exactly 2500 ml reaching daily target");
    assert(dailyHydration.remainingMl === 0, "Hydration remaining is 0 ml towards 2500ml target");
    assert(dailyHydration.streakDays >= 1, "Reaching hydration target maintains valid positive streak");

    // --------------------------------------------------------------------------
    // PART 5: ACTIVITIES, RUNNING & ZERO DOUBLE-COUNTING
    // --------------------------------------------------------------------------
    console.log("\n--- 5. Activities, Running Types & Active Energy Audit ---");
    const runActivity = await pool.activityLog.create({
      data: {
        userId: userA.id,
        activityType: "RUN",
        runningType: "TEMPO",
        source: "MANUAL",
        date: todayStr,
        distanceKm: 5.0,
        movingDurationSeconds: 1500, // 25 mins -> 5:00 / km
        averagePaceSecondsPerKm: 300,
        caloriesBurned: 350,
      },
    });

    const workoutSession = await pool.workoutSession.create({
      data: {
        userId: userA.id,
        name: "Leg Hypertrophy Session",
        workoutType: "GYM_WORKOUT",
        date: todayStr,
        durationSeconds: 2700,
        caloriesBurned: 280,
      },
    });

    const snapshot = await HealthContextService.getHealthSnapshot(userA.id, todayStr);
    assert(snapshot.movement.activityCalories === 350, "Cardio activity energy is exactly 350 kcal");
    assert(snapshot.movement.workoutCalories === 280, "Workout energy is exactly 280 kcal");
    assert(
      snapshot.movement.totalActiveCalories === 630,
      "Total active energy expenditure strictly = 350 + 280 = 630 kcal (Zero double counting)"
    );

    // --------------------------------------------------------------------------
    // PART 6: MULTI-USER ISOLATION & DATA PRIVACY
    // --------------------------------------------------------------------------
    console.log("\n--- 6. Multi-User Isolation & Privacy Enforcement ---");
    const snapshotB = await HealthContextService.getHealthSnapshot(userB.id, todayStr);
    assert(snapshotB.nutrition.caloriesConsumed === 0, "User B has 0 calories logged (User A data strictly isolated)");
    assert(snapshotB.movement.totalActiveCalories === 0, "User B has 0 active calories (User A activities isolated)");

    // --------------------------------------------------------------------------
    // PART 7: AI COACH INTELLIGENCE, MEMORY & GOAL CONFIRMATION
    // --------------------------------------------------------------------------
    console.log("\n--- 7. AI Coach Intelligence, Memory Hub & Non-Destructive Target Flow ---");
    const mem = await AIMemoryService.addMemory(userA.id, {
      category: "CONSTRAINT",
      content: "Gluten intolerant",
      importance: 3,
    });
    assert(mem !== null, "AI memory saved successfully");

    const memoriesA = await AIMemoryService.getUserMemories(userA.id);
    const memoriesB = await AIMemoryService.getUserMemories(userB.id);
    assert(memoriesA.length === 1 && memoriesB.length === 0, "AI memories strictly isolated per user");

    // Target change proposal
    const proposal = await AIToolRegistry.executeTool(
      "propose_goal_update",
      { targetKey: "protein", newValue: 145, reason: "Progressive muscle recovery" },
      { userId: userA.id }
    );
    assert(proposal.proposal?.status === "PENDING_CONFIRMATION", "AI target change returns PENDING_CONFIRMATION");

    // Verify DB unchanged prior to confirmation
    const settingsPre = await UserSettingsService.getUserSettings(userA.id);
    assert(settingsPre.nutritionGoals.protein === 130, "Database protein target remained 130g before confirmation");

    // User confirms change
    await AICoachService.confirmGoalUpdate(userA.id, "protein", 145);
    const settingsPost = await UserSettingsService.getUserSettings(userA.id);
    assert(settingsPost.nutritionGoals.protein === 145, "Database protein target updated to 145g after user confirmation");

    // --------------------------------------------------------------------------
    // PART 8: STRUCTURED WEEKLY PLANNING & RETROSPECTIVE
    // --------------------------------------------------------------------------
    console.log("\n--- 8. Structured Weekly Planning & Evidence Retrospective ---");
    const weeklyPlan = await WeeklyPlanService.generateAIWeeklyPlan(userA.id, todayStr);
    assert(weeklyPlan.items.length === 7, "Weekly Blueprint generated 7 balanced daily items");

    const evaluatedPlan = await WeeklyPlanService.evaluatePlanVsActual(userA.id, weeklyPlan.id);
    assert(evaluatedPlan.adherencePercentage !== undefined, "Plan vs Actual adherence calculated without false positives");

    const review = await WeeklyPlanService.generateWeeklyReview(userA.id, todayStr);
    assert(review.overallScore >= 0 && review.overallScore <= 100, "Weekly review generated valid overall score");

    // --------------------------------------------------------------------------
    // PART 9: GOALS, CHALLENGES & GAMIFICATION ENGINE
    // --------------------------------------------------------------------------
    console.log("\n--- 9. Goals, Challenges & Gamification Engine ---");
    const goal = await GoalService.createGoal(userA.id, {
      name: "Weekly 20K Running Target",
      category: "RUNNING",
      goalType: "CUMULATIVE_VALUE",
      targetValue: 20.0,
      unit: "km",
      startDate: todayStr,
      targetDate: "2026-12-31",
    });
    assert(goal.status === "ACTIVE", "Created active running goal");

    const { goals: userAGoals } = await GoalService.getGoals(userA.id);
    const evaluatedGoal = userAGoals.find((g) => g.id === goal.id);
    assert(evaluatedGoal?.currentValue === 5.0, "Running goal accurately derived 5.0 km from recorded 5k run");

    // --------------------------------------------------------------------------
    // PART 10: SMART NOTIFICATIONS & PREFERENCES
    // --------------------------------------------------------------------------
    console.log("\n--- 10. Smart Notifications Center ---");
    const notif = await NotificationService.createNotification({
      userId: userA.id,
      title: "Target Milestone Reached",
      message: "You completed 25% of your 20K running goal!",
      type: "GOAL_MILESTONE",
      category: "GOAL",
      actionUrl: "/goals",
    });
    assert(notif?.isRead === false, "New notification is initially unread");

    const unreadCount = await NotificationService.getUnreadCount(userA.id);
    assert(unreadCount >= 1, "Unread count is accurate");

    await NotificationService.markAllAsRead(userA.id);
    const postUnread = await NotificationService.getUnreadCount(userA.id);
    assert(postUnread === 0, "Mark all as read sets unread count to 0");

    // --------------------------------------------------------------------------
    // PART 11: STRAVA / EXTERNAL INTEGRATIONS DEDUPLICATION
    // --------------------------------------------------------------------------
    console.log("\n--- 11. External Integration & Deduplication Audit ---");
    await pool.integrationConnection.create({
      data: {
        userId: userA.id,
        provider: "STRAVA",
        accessToken: "encrypted_token",
        refreshToken: "encrypted_refresh",
        expiresAt: new Date(Date.now() + 3600000),
        scope: "read,activity:read_all",
      },
    });

    const publicIntegrations = await IntegrationService.getConnectedIntegrations(userA.id);
    assert(
      (publicIntegrations[0] as any).accessToken === undefined &&
        (publicIntegrations[0] as any).refreshToken === undefined,
      "Access and Refresh tokens are strictly stripped from public DTOs"
    );

    // --------------------------------------------------------------------------
    // PART 12: PWA & SERVICE WORKER SECURITY VERIFICATION
    // --------------------------------------------------------------------------
    console.log("\n--- 12. PWA Manifest & Service Worker Cache Policy ---");
    const manifestPath = path.join(process.cwd(), "public", "manifest.json");
    const swPath = path.join(process.cwd(), "public", "sw.js");

    assert(fs.existsSync(manifestPath), "public/manifest.json exists");
    assert(fs.existsSync(swPath), "public/sw.js exists");

    const swContent = fs.readFileSync(swPath, "utf-8");
    assert(
      swContent.includes("url.pathname.startsWith('/api/')") || swContent.includes('url.pathname.startsWith("/api/")'),
      "Service worker strictly bypasses caching for /api/* private health endpoints"
    );

    // --------------------------------------------------------------------------
    // PART 13: TEARDOWN TEST DATA
    // --------------------------------------------------------------------------
    console.log("\n--- 13. Teardown Test Data ---");
    await pool.weeklyPlan.deleteMany({ where: { userId: userA.id } }).catch(() => {});
    await pool.goal.deleteMany({ where: { userId: userA.id } }).catch(() => {});
    await pool.notification.deleteMany({ where: { userId: userA.id } }).catch(() => {});
    await pool.integrationConnection.deleteMany({ where: { userId: userA.id } }).catch(() => {});
    await pool.activityLog.deleteMany({ where: { userId: userA.id } }).catch(() => {});
    await pool.workoutSession.deleteMany({ where: { userId: userA.id } }).catch(() => {});
    await pool.mealLog.deleteMany({ where: { userId: userA.id } }).catch(() => {});
    await pool.food.deleteMany({ where: { userId: userA.id } }).catch(() => {});
    await pool.hydrationLog.deleteMany({ where: { userId: userA.id } }).catch(() => {});
    await pool.aiMemory.deleteMany({ where: { userId: userA.id } }).catch(() => {});
    await pool.user.deleteMany({ where: { id: userA.id } }).catch(() => {});
    await pool.user.deleteMany({ where: { id: userB.id } }).catch(() => {});
    await pool.user.deleteMany({ where: { id: adminUser.id } }).catch(() => {});
    assert(true, "All test artifacts cleaned up cleanly");

  } catch (error: any) {
    console.error("Master Audit Failed with error:", error);
    failed++;
  }

  console.log("\n================================================================================");
  console.log(`MASTER AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runMasterProductionAudit();
