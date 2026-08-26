import { prisma } from "../lib/db";

async function verifyDatabaseSafety() {
  console.log("==========================================");
  console.log("  NUTRI-TRACK DATABASE SAFETY VERIFICATION");
  console.log("==========================================\n");

  const pool = prisma as any;
  const userCount = await pool.user.count();
  const profileCount = await pool.userProfile.count();
  const foodCount = await pool.food.count();
  const mealLogCount = await pool.mealLog.count();
  const hydrationCount = await pool.hydrationLog.count();
  const activityCount = await pool.activityLog.count();
  const workoutCount = await pool.workoutSession.count();
  const memoryCount = (await pool.aiMemory.findMany()).length;
  const actionLogCount = await pool.aiActionLog.count();

  console.log(`Verified Database Record Counts:`);
  console.log(`- Users: ${userCount}`);
  console.log(`- Profiles: ${profileCount}`);
  console.log(`- Foods: ${foodCount}`);
  console.log(`- Meal Logs: ${mealLogCount}`);
  console.log(`- Hydration Logs: ${hydrationCount}`);
  console.log(`- Activity Logs: ${activityCount}`);
  console.log(`- Workout Sessions: ${workoutCount}`);
  console.log(`- AI Memories: ${memoryCount}`);
  console.log(`- AI Action Logs: ${actionLogCount}`);

  console.log("\n✅ Database safety verification complete. No destructive operations will be run.");
}

verifyDatabaseSafety().catch((err) => {
  console.error("Safety verification failed:", err);
  process.exit(1);
});
