/**
 * NUTRI-TRACK — PROMPT 23 AUTOMATED TEST SUITE
 * Goals, Challenges, Achievements & Gamification System
 */

import { prisma } from "../lib/db";
import { GoalService } from "../lib/services/goal.service";
import { AchievementService } from "../lib/services/achievement.service";
import { ChallengeService } from "../lib/services/challenge.service";
import { FoodService } from "../lib/services/food.service";
import { NutritionService } from "../lib/services/nutrition.service";
import { HydrationService } from "../lib/services/hydration.service";
import { ActivityService } from "../lib/services/activity.service";
import { WorkoutService } from "../lib/services/workout.service";
import { NotificationService } from "../lib/services/notification.service";
import { createGoalSchema } from "../lib/validations/goals";

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
  console.log("=== NUTRI-TRACK PROMPT 23 AUTOMATED TEST SUITE ===");
  console.log("=======================================================\n");

  const pool = prisma as any;
  const timestamp = Date.now();
  const todayStr = new Date().toISOString().split("T")[0];
  const targetDateStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Create User A and User B for multi-user isolation tests
  const userA = await pool.user.create({
    data: {
      id: `usr_gamify_a_${timestamp}`,
      name: "Alice Gamifier",
      email: `alice_gamify_${timestamp}@example.com`,
      username: `alice_gamify_${timestamp}`,
      passwordHash: "hash123",
      role: "USER",
      accountStatus: "APPROVED",
    },
  });

  const userB = await pool.user.create({
    data: {
      id: `usr_gamify_b_${timestamp}`,
      name: "Bob Isolated",
      email: `bob_gamify_${timestamp}@example.com`,
      username: `bob_gamify_${timestamp}`,
      passwordHash: "hash123",
      role: "USER",
      accountStatus: "APPROVED",
    },
  });

  // Create user profiles
  await pool.userProfile.create({
    data: {
      userId: userA.id,
      dateOfBirth: new Date("1995-01-01"),
      biologicalSex: "FEMALE",
      heightCm: 168,
      weightKg: 62,
      activityLevel: "MODERATELY_ACTIVE",
      dailyHydrationTargetMl: 2500,
    },
  });

  await pool.userNutrientTarget.create({
    data: {
      userId: userA.id,
      calorieTarget: 2000,
      proteinGrams: 120,
      carbGrams: 220,
      fatGrams: 65,
    },
  });

  // --- PART 1: GOAL CRUD, STATE TRANSITIONS & VALIDATION ---
  console.log("--- PART 1: Goal CRUD, State Transitions & Target Validation ---");

  // 1. Invalid target rejection
  const invalidTarget = createGoalSchema.safeParse({
    name: "Invalid Goal",
    category: "RUNNING",
    goalType: "CUMULATIVE_VALUE",
    targetValue: -10, // Invalid negative
    unit: "km",
    startDate: todayStr,
    targetDate: targetDateStr,
  });
  assert(!invalidTarget.success, "Schema rejects negative or zero target value");

  const invalidDates = createGoalSchema.safeParse({
    name: "Invalid Dates",
    category: "RUNNING",
    goalType: "CUMULATIVE_VALUE",
    targetValue: 50,
    unit: "km",
    startDate: "2026-08-30",
    targetDate: "2026-08-01", // targetDate before startDate
  });
  assert(!invalidDates.success, "Schema rejects targetDate occurring before startDate");

  // 2. Create Running Goal
  const runGoal = await GoalService.createGoal(userA.id, {
    name: "Run 50 km in 30 Days",
    category: "RUNNING",
    goalType: "CUMULATIVE_VALUE",
    targetValue: 50,
    unit: "km",
    startDate: todayStr,
    targetDate: targetDateStr,
  });
  assert(runGoal.id !== undefined, "Goal is successfully created with ID");
  assert(runGoal.status === "ACTIVE", "Goal defaults to ACTIVE status");
  assert(runGoal.currentValue === 0, "Initial running goal progress is 0 km");
  assert(runGoal.progressPercentage === 0, "Initial progress percentage is 0%");

  // 3. Pause & Resume Goal
  const pausedGoal = await GoalService.pauseGoal(userA.id, runGoal.id);
  assert(pausedGoal.status === "PAUSED", "Goal transitions successfully to PAUSED");

  const resumedGoal = await GoalService.resumeGoal(userA.id, runGoal.id);
  assert(resumedGoal.status === "ACTIVE", "Goal transitions successfully back to ACTIVE");

  // 4. Update Goal
  const updatedGoal = await GoalService.updateGoal(userA.id, runGoal.id, {
    name: "Run 60 km in 30 Days",
    targetValue: 60,
  });
  assert(updatedGoal.name === "Run 60 km in 30 Days", "Goal name is updated");
  assert(updatedGoal.targetValue === 60, "Goal target value is updated to 60");

  // Revert target back to 50 for subsequent tests
  await GoalService.updateGoal(userA.id, runGoal.id, { name: "Run 50 km in 30 Days", targetValue: 50 });

  // --- PART 2: AUTOMATIC PROGRESS DERIVATION & RUNNING FILTER ---
  console.log("\n--- PART 2: Automatic Progress Derivation & Strict Running Filtering ---");

  // Log a Walk (should NOT affect running goal)
  await ActivityService.logActivity(userA.id, {
    activityType: "WALK",
    date: todayStr,
    movingDurationSeconds: 45 * 60,
    distanceKm: 4.0,
    caloriesBurned: 180,
  });

  const goalAfterWalk = await GoalService.getGoalById(userA.id, runGoal.id);
  assert(goalAfterWalk?.currentValue === 0, "Walking activity (4km) does NOT increment running goal progress (strict isolation)");

  // Log a Run (15 km) -> 15 / 50 = 30% -> Should trigger 25% milestone!
  await ActivityService.logActivity(userA.id, {
    activityType: "RUN",
    runningType: "TEMPO",
    date: todayStr,
    movingDurationSeconds: 75 * 60,
    distanceKm: 15.0,
    caloriesBurned: 900,
  });

  const goalAfterRun = await GoalService.getGoalById(userA.id, runGoal.id);
  assert(goalAfterRun?.currentValue === 15, "Running activity (15km) immediately updates running goal to 15 km");
  assert(goalAfterRun?.progressPercentage === 30, "Progress percentage is accurately calculated as 30%");
  assert(goalAfterRun?.milestones.some((m) => m.percentage === 25) === true, "25% milestone was recognized and recorded");

  // Log another Run (12 km) -> 15 + 12 = 27 km -> 27 / 50 = 54% -> Should trigger 50% milestone!
  await ActivityService.logActivity(userA.id, {
    activityType: "RUN",
    runningType: "LONG",
    date: todayStr,
    movingDurationSeconds: 60 * 60,
    distanceKm: 12.0,
    caloriesBurned: 720,
  });

  const goalAfterRun2 = await GoalService.getGoalById(userA.id, runGoal.id);
  assert(goalAfterRun2?.currentValue === 27, "Cumulative running distance is 27 km");
  assert(goalAfterRun2?.progressPercentage === 54, "Progress percentage is 54%");
  assert(goalAfterRun2?.milestones.some((m) => m.percentage === 50) === true, "50% milestone was recognized");

  // Verify milestone deduplication (no duplicate 25% or 50% milestone records)
  const milestoneList = await pool.goalMilestone.findMany({ where: { goalId: runGoal.id } });
  assert(milestoneList.filter((m: any) => m.percentage === 25).length === 1, "25% milestone has exactly 1 deduplicated record");
  assert(milestoneList.filter((m: any) => m.percentage === 50).length === 1, "50% milestone has exactly 1 deduplicated record");

  // --- PART 3: NUTRITION & HYDRATION GOALS & CASCADE RECALCULATION ---
  console.log("\n--- PART 3: Nutrition & Hydration Goals with Edit/Delete Recalculation ---");

  // 1. Create Hydration Goal (Drink 2500ml for 5 days)
  const hydGoal = await GoalService.createGoal(userA.id, {
    name: "Hydration Streak 5 Days",
    category: "HYDRATION",
    goalType: "DAILY_TARGET_STREAK",
    targetValue: 5,
    unit: "days",
    startDate: todayStr,
    targetDate: targetDateStr,
    metadata: { dailyTargetMl: 2500 },
  });

  // Log 3000ml hydration for today
  await HydrationService.logHydration(userA.id, {
    date: todayStr,
    amountMl: 3000,
    beverageType: "WATER",
  });

  const hydGoalAfterLog = await GoalService.getGoalById(userA.id, hydGoal.id);
  assert(hydGoalAfterLog?.currentValue === 1, "Hydration goal progress is 1 / 5 days after reaching 3000ml daily target");

  // 2. Create Nutrition Goal (Hit 100g Protein for 3 days)
  const nutGoal = await GoalService.createGoal(userA.id, {
    name: "Protein Target 3 Days",
    category: "NUTRITION",
    goalType: "DAILY_TARGET_STREAK",
    targetValue: 3,
    unit: "days",
    startDate: todayStr,
    targetDate: targetDateStr,
    metadata: { nutrientKey: "protein", dailyTarget: 100 },
  });

  // Create high-protein food item (Chicken Breast: 100g -> 31g Protein)
  const chicken = await FoodService.createFood(userA.id, {
    name: "Chicken Breast",
    category: "PULSES_LEGUMES",
    servingSize: 100,
    servingUnit: "g",
    calories: 165,
    protein: 31,
    carbohydrates: 0,
    fat: 3.6,
  });

  // Log 400g Chicken Breast -> 4 * 31 = 124g Protein -> Meets 100g target
  const mealEntry = await NutritionService.logFoodToMeal(userA.id, {
    date: todayStr,
    mealType: "LUNCH",
    foodId: chicken.id,
    quantity: 400,
    quantityUnit: "g",
  });

  const nutGoalAfterLog = await GoalService.getGoalById(userA.id, nutGoal.id);
  assert(nutGoalAfterLog?.currentValue === 1, "Nutrition goal progress is 1 / 3 days (124g protein logged >= 100g)");

  // 3. EDIT Food Entry: Reduce quantity to 100g (31g Protein < 100g target) -> Goal must recalculate to 0 days!
  await NutritionService.updateMealEntry(userA.id, mealEntry.id, {
    quantity: 100,
    quantityUnit: "g",
  });

  const nutGoalAfterEdit = await GoalService.getGoalById(userA.id, nutGoal.id);
  assert(nutGoalAfterEdit?.currentValue === 0, "Nutrition goal dynamically recalculated to 0 days after meal edit reduced protein below threshold");

  // 4. Increase back to 400g
  await NutritionService.updateMealEntry(userA.id, mealEntry.id, {
    quantity: 400,
    quantityUnit: "g",
  });
  const nutGoalRestored = await GoalService.getGoalById(userA.id, nutGoal.id);
  assert(nutGoalRestored?.currentValue === 1, "Nutrition goal progress restored to 1 day");

  // 5. DELETE Food Entry -> Goal must revert to 0
  await NutritionService.deleteMealEntry(userA.id, mealEntry.id);
  const nutGoalAfterDelete = await GoalService.getGoalById(userA.id, nutGoal.id);
  assert(nutGoalAfterDelete?.currentValue === 0, "Nutrition goal reverted to 0 days after meal entry deletion (No stale ghost progress)");

  // --- PART 4: 100% COMPLETION & WORKOUT GOALS ---
  console.log("\n--- PART 4: 100% Completion State Transition & Workout Goals ---");

  // Finish remaining distance on running goal: 27 km current + 25 km run = 52 km >= 50 km target
  await ActivityService.logActivity(userA.id, {
    activityType: "RUN",
    runningType: "LONG",
    date: todayStr,
    movingDurationSeconds: 130 * 60,
    distanceKm: 25.0,
    caloriesBurned: 1500,
  });

  const completedRunGoal = await GoalService.getGoalById(userA.id, runGoal.id);
  assert(completedRunGoal?.currentValue === 52, "Total running distance is 52 km");
  assert(completedRunGoal?.progressPercentage === 100, "Progress percentage is capped at 100%");
  assert(completedRunGoal?.status === "COMPLETED", "Goal status automatically transitioned to COMPLETED");
  assert(completedRunGoal?.completedAt !== null, "Goal completedAt timestamp is recorded");

  // Create and test Workout Goal (Complete 2 Gym workouts)
  const workoutGoal = await GoalService.createGoal(userA.id, {
    name: "Complete 2 Gym Sessions",
    category: "WORKOUTS",
    goalType: "SESSION_COUNT",
    targetValue: 2,
    unit: "workouts",
    startDate: todayStr,
    targetDate: targetDateStr,
    metadata: { workoutLocation: "GYM" },
  });

  // Log 1 Home workout (should not count for GYM filter)
  await WorkoutService.createWorkoutSession(userA.id, {
    workoutType: "HOME_WORKOUT",
    name: "Home Abs",
    date: todayStr,
    durationSeconds: 30 * 60,
    exercises: [{ name: "Plank", sets: [{ setNumber: 1, durationSeconds: 60 }] }],
  });

  const wgAfterHome = await GoalService.getGoalById(userA.id, workoutGoal.id);
  assert(wgAfterHome?.currentValue === 0, "Home workout does not count for Gym-filtered workout goal");

  // Log 2 Gym workouts
  await WorkoutService.createWorkoutSession(userA.id, {
    workoutType: "GYM_WORKOUT",
    name: "Gym Push Day",
    date: todayStr,
    durationSeconds: 60 * 60,
    exercises: [{ name: "Bench Press", sets: [{ setNumber: 1, reps: 10, weightKg: 80 }] }],
  });
  await WorkoutService.createWorkoutSession(userA.id, {
    workoutType: "GYM_WORKOUT",
    name: "Gym Pull Day",
    date: todayStr,
    durationSeconds: 55 * 60,
    exercises: [{ name: "Deadlift", sets: [{ setNumber: 1, reps: 5, weightKg: 120 }] }],
  });

  const wgAfterGym = await GoalService.getGoalById(userA.id, workoutGoal.id);
  assert(wgAfterGym?.currentValue === 2, "Workout goal reached 2 / 2 gym sessions");
  assert(wgAfterGym?.status === "COMPLETED", "Workout goal transitioned to COMPLETED");

  // --- PART 5: ACHIEVEMENTS SYSTEM & UNLOCKS ---
  console.log("\n--- PART 5: Achievements System Evaluation & Unlocks ---");

  const achievements = await AchievementService.getUserAchievements(userA.id);
  assert(achievements.achievements.length >= 10, "User receives all system achievements");

  // Check FIRST_5K achievement (since Alice ran 15km and 25km)
  const first5k = achievements.achievements.find((a) => a.id === "FIRST_5K");
  assert(first5k?.isUnlocked === true, "FIRST_5K achievement is unlocked (Recorded 25km run >= 5km)");
  assert(first5k?.unlockedAt !== null, "FIRST_5K has valid unlockedAt timestamp");

  // Check DISTANCE_EXPLORER / RUNNING_100K (Alice ran 15 + 12 + 25 = 52 km)
  const run100k = achievements.achievements.find((a) => a.id === "RUNNING_100K");
  assert(run100k?.isUnlocked === false, "RUNNING_100K is currently locked");
  assert(run100k?.currentProgress === 52, "RUNNING_100K accurately tracks 52 km current progress");
  assert(run100k?.progressPercentage === 52, "RUNNING_100K shows 52% progress");

  // Check Total Points
  assert(achievements.totalPoints >= 50, "User accumulated points from unlocked achievements");

  // --- PART 6: CHALLENGES SYSTEM LIFECYCLE ---
  console.log("\n--- PART 6: Challenges System Lifecycle ---");

  // 1. Get available challenges
  const challenges = await ChallengeService.getChallenges(userA.id);
  assert(challenges.length >= 4, "Available system challenges are listed");

  // 2. Join 50K Running Month challenge
  const joinedChallenge = await ChallengeService.joinChallenge(userA.id, "CHALLENGE_50K_RUN");
  assert(joinedChallenge.isJoined === true, "User successfully joined 50K Running Challenge");
  assert(joinedChallenge.status === "COMPLETED" || joinedChallenge.status === "JOINED", "Challenge participation is recorded");

  // 3. Leave challenge
  await ChallengeService.leaveChallenge(userA.id, "CHALLENGE_7_DAY_HYDRATION");
  const challengesAfterLeave = await ChallengeService.getChallenges(userA.id);
  const hydrationChallenge = challengesAfterLeave.find((c) => c.id === "CHALLENGE_7_DAY_HYDRATION");
  assert(hydrationChallenge?.isJoined === false, "User successfully left challenge");

  // --- PART 7: MULTI-USER ISOLATION & SECURITY ---
  console.log("\n--- PART 7: Multi-User Security & Isolation ---");

  // User B creates a goal
  const bobGoal = await GoalService.createGoal(userB.id, {
    name: "Bob 100 km Running",
    category: "RUNNING",
    goalType: "CUMULATIVE_VALUE",
    targetValue: 100,
    unit: "km",
    startDate: todayStr,
    targetDate: targetDateStr,
  });

  // User A should NOT see Bob's goal in getGoals
  const aliceGoals = await GoalService.getGoals(userA.id);
  assert(!aliceGoals.goals.some((g) => g.id === bobGoal.id), "User A cannot see User B's goals in goal listing");

  // User A should NOT be able to get or update Bob's goal
  const aliceAttemptGetBob = await GoalService.getGoalById(userA.id, bobGoal.id);
  assert(aliceAttemptGetBob === null, "User A cannot access User B's goal by ID (Strict multi-user isolation)");

  let errorThrown = false;
  try {
    await GoalService.updateGoal(userA.id, bobGoal.id, { name: "Hacked Goal" });
  } catch {
    errorThrown = true;
  }
  assert(errorThrown, "User A cannot update User B's goal (Forbidden)");

  // --- PART 8: SMART NOTIFICATIONS INTEGRATION ---
  console.log("\n--- PART 8: Smart Notification Delivery ---");

  const notifications = await NotificationService.getNotifications(userA.id);
  assert(notifications.notifications.length > 0, "User A has received gamification notifications");

  const hasMilestoneOrCompleted = notifications.notifications.some(
    (n) => n.type === "GOAL_MILESTONE" || n.type === "GOAL_COMPLETED" || n.type === "ACHIEVEMENT_UNLOCKED"
  );
  assert(hasMilestoneOrCompleted, "Notification Center includes GOAL_MILESTONE, GOAL_COMPLETED, or ACHIEVEMENT_UNLOCKED events");

  // Clean up test entities
  try {
    await pool.goal.deleteMany({ where: { userId: userA.id } });
    await pool.goal.deleteMany({ where: { userId: userB.id } });
    await pool.userAchievement.deleteMany({ where: { userId: userA.id } });
    await pool.userAchievement.deleteMany({ where: { userId: userB.id } });
    await pool.challengeParticipant.deleteMany({ where: { userId: userA.id } });
    await pool.challengeParticipant.deleteMany({ where: { userId: userB.id } });
    await pool.notification.deleteMany({ where: { userId: userA.id } });
    await pool.user.deleteMany({ where: { id: userA.id } });
    await pool.user.deleteMany({ where: { id: userB.id } });
  } catch {}

  console.log("\n=======================================================");
  console.log(`=== PROMPT 23 TEST SUMMARY: ${passedCount} / ${passedCount + failedCount} PASSED ===`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Test Suite Error:", err);
  process.exit(1);
});
