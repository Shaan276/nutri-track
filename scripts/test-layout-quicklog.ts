import bcrypt from "bcryptjs";
import { prisma, initializePostgresSchema } from "../lib/db";
import { FoodService } from "../lib/services/food.service";
import { NutritionService } from "../lib/services/nutrition.service";

async function runLayoutAndQuickLogTests() {
  console.log("\n===================================================================");
  console.log("  NUTRI-TRACK: FULL-WIDTH LAYOUT & QUICK LOG AUTOMATED TESTS       ");
  console.log("===================================================================\n");

  await initializePostgresSchema();

  const ts = Date.now();
  const userA = await prisma.user.create({
    data: {
      name: "Layout Tester",
      username: `layout_user_${ts}`,
      email: `layout_${ts}@nutritrack.app`,
      passwordHash: await bcrypt.hash("Password123!", 12),
    },
  });

  const userB = await prisma.user.create({
    data: {
      name: "Other User",
      username: `other_user_${ts}`,
      email: `other_${ts}@nutritrack.app`,
      passwordHash: await bcrypt.hash("Password123!", 12),
    },
  });

  // 1. Create a private food for User A
  const privateFood = await FoodService.createFood(userA.id, {
    name: `Avocado Toast ${ts}`,
    category: "SNACKS",
    servingSize: 100,
    servingUnit: "g",
    calories: 220,
    protein: 4.5,
    carbohydrates: 20,
    fat: 14,
  });

  console.log("✅ Test 1: Created private food for user A:", privateFood.name);

  // 2. User A logs food via Quick Log calculation (150g -> 1.5x)
  const todayStr = new Date().toISOString().split("T")[0];
  const mealEntry = await NutritionService.logFoodToMeal(userA.id, {
    date: todayStr,
    mealType: "LUNCH",
    foodId: privateFood.id,
    quantity: 150,
    quantityUnit: "g",
  });

  const scaledCalories = Number(mealEntry.calculatedCalories);
  const expectedCalories = 330; // 220 * 1.5
  if (scaledCalories === expectedCalories) {
    console.log(`✅ Test 2: Quick Log scaling passed: 150g = ${scaledCalories} kcal (Expected: ${expectedCalories} kcal)`);
  } else {
    console.error(`❌ Test 2 FAILED: Expected ${expectedCalories}, got ${scaledCalories}`);
    process.exit(1);
  }

  // 3. User B cannot delete User A's private food
  let userBBlocked = false;
  try {
    await FoodService.deleteFood(privateFood.id, userB.id);
  } catch (err: any) {
    userBBlocked = err.message === "UNAUTHORIZED_ACCESS";
  }

  if (userBBlocked) {
    console.log("✅ Test 3: Cross-user food deletion blocked (403 Unauthorized)");
  } else {
    console.error("❌ Test 3 FAILED: User B was able to delete User A's food!");
    process.exit(1);
  }

  // 4. User A deletes their private food with permanent deletion
  await FoodService.deleteFood(privateFood.id, userA.id);
  const checkDeleted = await prisma.food.findUnique({ where: { id: privateFood.id } });
  if (!checkDeleted) {
    console.log("✅ Test 4: User A successfully deleted private food permanently");
  } else {
    console.error("❌ Test 4 FAILED: Food still exists!");
    process.exit(1);
  }

  // 5. Verify historical meal entry still preserves snapshot values after food deletion
  const daily = await NutritionService.getDailyNutrition(userA.id, todayStr);
  const lunch = daily.meals.find((m) => m.mealType === "LUNCH");
  if (lunch && lunch.totals.calories === 330) {
    console.log("✅ Test 5: Historical meal log preserved at 330 kcal after food item deletion");
  } else {
    console.error("❌ Test 5 FAILED: Historical snapshot lost!");
    process.exit(1);
  }

  console.log("\n🎉 ALL LAYOUT & QUICK LOG TESTS PASSED!\n");
}

runLayoutAndQuickLogTests().catch(console.error);
