import bcrypt from "bcryptjs";
import { prisma, initializePostgresSchema } from "../lib/db";
import { foodInputSchema } from "../lib/validations/food";
import { FoodService } from "../lib/services/food.service";

async function runPrompt4Tests() {
  console.log("\n===================================================================");
  console.log("  NUTRI-TRACK PROMPT 4: DATABASE & FOOD DATABASE TEST SUITE        ");
  console.log("===================================================================\n");

  const results: { id: number; name: string; status: "PASS" | "FAIL"; details: string }[] = [];

  await initializePostgresSchema();

  // -------------------------------------------------------------
  // Test 1: Real PostgreSQL Connection
  // -------------------------------------------------------------
  try {
    const rawRes = await prisma.$queryRaw`SELECT 1 as alive`;
    if (rawRes && Array.isArray(rawRes) && rawRes.length > 0) {
      results.push({
        id: 1,
        name: "Real PostgreSQL Database Connection",
        status: "PASS",
        details: "PostgreSQL engine active and responding to SELECT queries",
      });
    } else {
      results.push({
        id: 1,
        name: "Real PostgreSQL Database Connection",
        status: "FAIL",
        details: "Query did not return alive status",
      });
    }
  } catch (err: any) {
    results.push({ id: 1, name: "Real PostgreSQL Database Connection", status: "FAIL", details: err.message });
  }

  // -------------------------------------------------------------
  // Test 2: Prisma Query Execution (Users & Foods)
  // -------------------------------------------------------------
  try {
    const userCount = await prisma.user.findUnique({ where: { id: "test_probe" } });
    const foodCount = await prisma.food.findMany({ where: { isArchived: false } });
    results.push({
      id: 2,
      name: "Prisma Query Execution",
      status: "PASS",
      details: `Successfully executed queries across User and Food tables (Food records found: ${foodCount.length})`,
    });
  } catch (err: any) {
    results.push({ id: 2, name: "Prisma Query Execution", status: "FAIL", details: err.message });
  }

  // Create two distinct users for multi-tenant testing
  const ts = Date.now();
  const userAEmail = `user_a_${ts}@nutritrack.app`;
  const userBEmail = `user_b_${ts}@nutritrack.app`;
  const pwHash = await bcrypt.hash("TestPassword123!", 12);

  const userA = await prisma.user.create({
    data: { name: "User A", username: `usera_${ts}`, email: userAEmail, passwordHash: pwHash },
  });

  const userB = await prisma.user.create({
    data: { name: "User B", username: `userb_${ts}`, email: userBEmail, passwordHash: pwHash },
  });

  // -------------------------------------------------------------
  // Test 3: User Persistence
  // -------------------------------------------------------------
  try {
    const fetchA = await prisma.user.findUnique({ where: { id: userA.id } });
    if (fetchA && fetchA.email === userAEmail) {
      results.push({
        id: 3,
        name: "User Account Persistence",
        status: "PASS",
        details: `User A persisted (ID: ${userA.id}, Email: ${fetchA.email})`,
      });
    } else {
      results.push({ id: 3, name: "User Account Persistence", status: "FAIL", details: "User not found" });
    }
  } catch (err: any) {
    results.push({ id: 3, name: "User Account Persistence", status: "FAIL", details: err.message });
  }

  let foodAId = "";

  // -------------------------------------------------------------
  // Test 4: Food Creation with Reference Serving & Decimals
  // -------------------------------------------------------------
  try {
    const rawFoodData = {
      name: "Fresh Cavendish Banana",
      category: "FRUITS" as const,
      brand: "Chiquita",
      barcode: "012345678901",
      servingSize: 100,
      servingUnit: "g",
      calories: 89.0,
      protein: 1.1,
      carbohydrates: 22.8,
      fat: 0.3,
      fiber: 2.6,
      sugar: 12.2,
      potassium: 358.0,
      vitaminC: 8.7,
      isFavorite: false,
    };

    const validated = foodInputSchema.parse(rawFoodData);
    const createdFood = await FoodService.createFood(userA.id, validated);
    foodAId = createdFood.id;

    if (
      createdFood &&
      createdFood.name === "Fresh Cavendish Banana" &&
      Number(createdFood.protein) === 1.1 &&
      Number(createdFood.calories) === 89.0
    ) {
      results.push({
        id: 4,
        name: "Food Creation & Reference Serving",
        status: "PASS",
        details: `Created '${createdFood.name}' (89 kcal, 1.1g protein per 100g) with Decimal precision`,
      });
    } else {
      results.push({ id: 4, name: "Food Creation & Reference Serving", status: "FAIL", details: "Values mismatch" });
    }
  } catch (err: any) {
    results.push({ id: 4, name: "Food Creation & Reference Serving", status: "FAIL", details: err.message });
  }

  // -------------------------------------------------------------
  // Test 5: Food Update
  // -------------------------------------------------------------
  try {
    const updated = await FoodService.updateFood(foodAId, userA.id, {
      protein: 1.2,
      notes: "Ripe organic banana with rich potassium",
    });

    if (updated && Number(updated.protein) === 1.2 && updated.notes?.includes("organic")) {
      results.push({
        id: 5,
        name: "Food Update Verification",
        status: "PASS",
        details: `Updated protein to ${updated.protein}g and notes persisted`,
      });
    } else {
      results.push({ id: 5, name: "Food Update Verification", status: "FAIL", details: "Update failed" });
    }
  } catch (err: any) {
    results.push({ id: 5, name: "Food Update Verification", status: "FAIL", details: err.message });
  }

  // -------------------------------------------------------------
  // Test 6: Food Search
  // -------------------------------------------------------------
  try {
    const searchByName = await FoodService.getUserFoods({ userId: userA.id, search: "Cavendish" });
    const searchByBrand = await FoodService.getUserFoods({ userId: userA.id, search: "Chiquita" });

    if (searchByName.length >= 1 && searchByBrand.length >= 1) {
      results.push({
        id: 6,
        name: "Food Search by Name & Brand",
        status: "PASS",
        details: `Search matched ${searchByName.length} items for 'Cavendish' and ${searchByBrand.length} for 'Chiquita'`,
      });
    } else {
      results.push({ id: 6, name: "Food Search by Name & Brand", status: "FAIL", details: "Search failed to match" });
    }
  } catch (err: any) {
    results.push({ id: 6, name: "Food Search by Name & Brand", status: "FAIL", details: err.message });
  }

  // -------------------------------------------------------------
  // Test 7: Category Filtering
  // -------------------------------------------------------------
  try {
    const fruitFoods = await FoodService.getUserFoods({ userId: userA.id, category: "FRUITS" });
    const dairyFoods = await FoodService.getUserFoods({ userId: userA.id, category: "DAIRY" });

    const allFruit = fruitFoods.every((f) => f.category === "FRUITS");

    if (allFruit && fruitFoods.length >= 1) {
      results.push({
        id: 7,
        name: "Category Filtering",
        status: "PASS",
        details: `Category 'FRUITS' returned ${fruitFoods.length} items correctly filtered`,
      });
    } else {
      results.push({ id: 7, name: "Category Filtering", status: "FAIL", details: "Category filter incorrect" });
    }
  } catch (err: any) {
    results.push({ id: 7, name: "Category Filtering", status: "FAIL", details: err.message });
  }

  // -------------------------------------------------------------
  // Test 8: Favorite Toggle & Filter
  // -------------------------------------------------------------
  try {
    const faved = await FoodService.toggleFavorite(foodAId, userA.id);
    const favoritesList = await FoodService.getUserFoods({ userId: userA.id, favoritesOnly: true });

    if (faved.isFavorite && favoritesList.some((f) => f.id === foodAId)) {
      results.push({
        id: 8,
        name: "Favorite Toggle & Filter",
        status: "PASS",
        details: `Item successfully marked as favorite and retrieved via favoritesOnly filter`,
      });
    } else {
      results.push({ id: 8, name: "Favorite Toggle & Filter", status: "FAIL", details: "Favorite toggle failed" });
    }
  } catch (err: any) {
    results.push({ id: 8, name: "Favorite Toggle & Filter", status: "FAIL", details: err.message });
  }

  // -------------------------------------------------------------
  // Test 9: Archive Food
  // -------------------------------------------------------------
  try {
    const archived = await FoodService.archiveFood(foodAId, userA.id);
    const activeList = await FoodService.getUserFoods({ userId: userA.id, status: "active" });
    const archivedList = await FoodService.getUserFoods({ userId: userA.id, status: "archived" });

    const hiddenFromActive = !activeList.some((f) => f.id === foodAId);
    const inArchived = archivedList.some((f) => f.id === foodAId);

    if (archived.isArchived && hiddenFromActive && inArchived) {
      results.push({
        id: 9,
        name: "Archive Food Functionality",
        status: "PASS",
        details: `Food safely archived (hidden from active view, visible in archived view)`,
      });
    } else {
      results.push({ id: 9, name: "Archive Food Functionality", status: "FAIL", details: "Archive check failed" });
    }
  } catch (err: any) {
    results.push({ id: 9, name: "Archive Food Functionality", status: "FAIL", details: err.message });
  }

  // -------------------------------------------------------------
  // Test 10: Restore Food
  // -------------------------------------------------------------
  try {
    const restored = await FoodService.restoreFood(foodAId, userA.id);
    const activeList = await FoodService.getUserFoods({ userId: userA.id, status: "active" });

    if (!restored.isArchived && activeList.some((f) => f.id === foodAId)) {
      results.push({
        id: 10,
        name: "Restore Food Functionality",
        status: "PASS",
        details: `Food successfully restored back to active status`,
      });
    } else {
      results.push({ id: 10, name: "Restore Food Functionality", status: "FAIL", details: "Restore failed" });
    }
  } catch (err: any) {
    results.push({ id: 10, name: "Restore Food Functionality", status: "FAIL", details: err.message });
  }

  // -------------------------------------------------------------
  // Test 11: Cross-User Security Isolation (Unauthorized Access Prevention)
  // -------------------------------------------------------------
  try {
    // User B tries to view User A's private food
    let userBCannotRead = false;
    try {
      await FoodService.getFoodById(foodAId, userB.id);
    } catch (err: any) {
      userBCannotRead = err.message === "UNAUTHORIZED_ACCESS";
    }

    // User B tries to update User A's private food
    let userBCannotEdit = false;
    try {
      await FoodService.updateFood(foodAId, userB.id, { name: "Hacked Banana" });
    } catch (err: any) {
      userBCannotEdit = err.message === "UNAUTHORIZED_ACCESS";
    }

    // User B tries to archive User A's private food
    let userBCannotArchive = false;
    try {
      await FoodService.archiveFood(foodAId, userB.id);
    } catch (err: any) {
      userBCannotArchive = err.message === "UNAUTHORIZED_ACCESS";
    }

    // User B's list should not contain User A's private food
    const userBList = await FoodService.getUserFoods({ userId: userB.id });
    const userBListIsolated = !userBList.some((f) => f.id === foodAId);

    if (userBCannotRead && userBCannotEdit && userBCannotArchive && userBListIsolated) {
      results.push({
        id: 11,
        name: "Cross-User Data Isolation & Security",
        status: "PASS",
        details: `Strict server-side authorization: User B blocked from viewing, editing, or archiving User A's private foods`,
      });
    } else {
      results.push({
        id: 11,
        name: "Cross-User Data Isolation & Security",
        status: "FAIL",
        details: `Security check failed (read: ${userBCannotRead}, edit: ${userBCannotEdit}, archive: ${userBCannotArchive})`,
      });
    }
  } catch (err: any) {
    results.push({ id: 11, name: "Cross-User Data Isolation & Security", status: "FAIL", details: err.message });
  }

  // -------------------------------------------------------------
  // Test 12: Zod Validation Error Rejection
  // -------------------------------------------------------------
  try {
    const invalidInputs = [
      { name: "A", servingSize: 100, servingUnit: "g" }, // Name too short
      { name: "Apple", servingSize: 0, servingUnit: "g" }, // Serving size 0
      { name: "Apple", servingSize: 100, servingUnit: "g", calories: -10 }, // Negative calories
      { name: "Apple", servingSize: 100, servingUnit: "g", protein: -2 }, // Negative protein
    ];

    let allRejected = true;
    for (const invalid of invalidInputs) {
      const parsed = foodInputSchema.safeParse(invalid);
      if (parsed.success) {
        allRejected = false;
        break;
      }
    }

    if (allRejected) {
      results.push({
        id: 12,
        name: "Zod Server-Side Validation Rejection",
        status: "PASS",
        details: "Invalid payloads (short name, zero serving size, negative macros) safely rejected",
      });
    } else {
      results.push({ id: 12, name: "Zod Server-Side Validation Rejection", status: "FAIL", details: "Validation missed invalid data" });
    }
  } catch (err: any) {
    results.push({ id: 12, name: "Zod Server-Side Validation Rejection", status: "FAIL", details: err.message });
  }

  // Output test results
  console.log("----------------------------------------------------------------------------------");
  console.log("TEST # | STATUS | TEST NAME | DETAILS");
  console.log("----------------------------------------------------------------------------------");
  for (const res of results) {
    const icon = res.status === "PASS" ? "✅ PASS" : "❌ FAIL";
    console.log(`${res.id.toString().padStart(2, " ")} | ${icon} | ${res.name} -> ${res.details}`);
  }
  console.log("----------------------------------------------------------------------------------\n");

  const allPassed = results.every((r) => r.status === "PASS");
  if (allPassed && results.length === 12) {
    console.log("🎉 ALL 12 DATABASE & FOOD DATABASE FUNCTIONAL TESTS PASSED!\n");
  } else {
    console.error("❌ SOME TESTS FAILED!\n");
    process.exit(1);
  }
}

runPrompt4Tests().catch(console.error);
