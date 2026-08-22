import { prisma } from "../lib/db";
import { HealthContextService } from "../lib/services/health-context.service";

async function testSnapshot() {
  console.log("=== Testing HealthContextService ===");
  try {
    const user = await prisma.user.findFirst({
      where: { email: "piyushpilkhwal74@gmail.com" },
    });

    if (!user) {
      console.log("User not found!");
      return;
    }

    console.log("Found user:", user.id, user.email, user.name);

    const snapshot = await HealthContextService.getHealthSnapshot(user.id);
    console.log("Snapshot retrieved successfully:");
    console.log(JSON.stringify(snapshot, null, 2));
  } catch (err: any) {
    console.error("Error in HealthContextService:", err);
  } finally {
    await prisma.$disconnect();
  }
}

testSnapshot();
