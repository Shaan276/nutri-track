import { prisma, initializePostgresSchema } from "../lib/db";

async function main() {
  console.log("Initializing PostgreSQL schema...");
  await initializePostgresSchema();
  console.log("Schema initialized!");

  const health = await prisma.$queryRaw`SELECT 1`;
  console.log("Health check result:", health);

  // Test user creation
  const testEmail = `test_${Date.now()}@nutritrack.app`;
  const testUsername = `user_${Date.now()}`;
  const user = await prisma.user.create({
    data: {
      name: "Nutri User",
      username: testUsername,
      email: testEmail,
      passwordHash: "$2b$12$eXampleHashForTestingBcrypt1234567890",
    },
  });
  console.log("Created user successfully:", user.id, user.username, user.email);

  // Test user retrieval
  const fetched = await prisma.user.findUnique({
    where: { email: testEmail },
  });
  console.log("Fetched user by email:", fetched?.name, fetched?.email);

  // Test UserProfile upsert
  const profile = await prisma.userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      dateOfBirth: new Date("1995-06-15"),
      biologicalSex: "MALE",
      heightCm: 178.5,
      weightKg: 74.2,
      activityLevel: "MODERATELY_ACTIVE",
    },
    update: {},
  });
  console.log("Created UserProfile successfully:", profile.id, profile.activityLevel, profile.heightCm);

  // Test UserProfile fetch
  const fetchedProfile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
  });
  console.log("Fetched UserProfile:", fetchedProfile?.biologicalSex, fetchedProfile?.weightKg);
}

main().catch(console.error);
