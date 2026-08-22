import { prisma } from "../lib/db";

async function cleanupTrashUsers() {
  console.log("\n================================================================================");
  console.log("🧹 CLEANING UP TRASH / TEST USERS FROM DATABASE");
  console.log("================================================================================\n");

  const pool = prisma as any;
  const allUsers = await pool.user.findMany();

  console.log(`Found ${allUsers.length} total users in database.`);

  const trashUsers = allUsers.filter((u: any) => {
    // Preserve primary admin account
    if (u.email === "piyushpilkhwal74@gmail.com" || u.username === "shaan276") {
      return false;
    }

    // Match test user patterns
    const isTest =
      u.email.includes("example.com") ||
      u.email.includes("test") ||
      u.email.includes("coach_") ||
      u.email.includes("audit") ||
      u.email.includes("alice_") ||
      u.email.includes("bob_") ||
      u.username.includes("coach_") ||
      u.username.includes("audit") ||
      u.username.includes("alice_") ||
      u.username.includes("bob_") ||
      u.username.includes("admin_1787") ||
      u.id.startsWith("test_") ||
      u.id.startsWith("audit_") ||
      u.id.startsWith("cuid_1787");

    return isTest;
  });

  console.log(`Identified ${trashUsers.length} trash/test users to purge.\n`);

  for (const u of trashUsers) {
    console.log(`  🗑️ Purging: "${u.name}" (${u.email} / ${u.username}) [${u.id}]`);
    try {
      if (typeof pool.mealLog?.deleteMany === "function") await pool.mealLog.deleteMany({ where: { userId: u.id } });
      if (typeof pool.hydrationLog?.deleteMany === "function") await pool.hydrationLog.deleteMany({ where: { userId: u.id } });
      if (typeof pool.activityLog?.deleteMany === "function") await pool.activityLog.deleteMany({ where: { userId: u.id } });
      if (typeof pool.workoutSession?.deleteMany === "function") await pool.workoutSession.deleteMany({ where: { userId: u.id } });
      if (typeof pool.weeklyPlan?.deleteMany === "function") await pool.weeklyPlan.deleteMany({ where: { userId: u.id } });
      if (typeof pool.food?.deleteMany === "function") await pool.food.deleteMany({ where: { userId: u.id } });
      await pool.user.delete({ where: { id: u.id } });
    } catch (err: any) {
      console.error(`  ⚠️ Could not delete ${u.id}:`, err.message);
    }
  }

  const remainingUsers = await pool.user.findMany();
  console.log("\n================================================================================");
  console.log(`✅ CLEANUP COMPLETE: ${remainingUsers.length} genuine user(s) remaining in database:`);
  for (const ru of remainingUsers) {
    console.log(`  ⭐ ${ru.name} (${ru.email} / ${ru.username}) - Role: ${ru.role} - Status: ${ru.accountStatus}`);
  }
  console.log("================================================================================\n");
}

cleanupTrashUsers();
