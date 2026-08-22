import { Pool } from "pg";

const NEON_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_zvjlA8fZOWm7@ep-small-union-avwsvu5b-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require";

const STANDARD_FOODS = [
  // RAW INGREDIENTS
  {
    name: "Raw Besan (Gram Flour)",
    category: "PULSES_LEGUMES",
    servingSize: 100,
    servingUnit: "g",
    calories: 387,
    protein: 22.4,
    carbohydrates: 57.8,
    fat: 6.7,
    notes: "Raw ingredient per 100g",
    isSystemFood: true,
  },
  {
    name: "Raw Aata (Whole Wheat Flour)",
    category: "GRAINS_CEREALS",
    servingSize: 100,
    servingUnit: "g",
    calories: 340,
    protein: 13.2,
    carbohydrates: 72.0,
    fat: 2.5,
    notes: "Raw ingredient per 100g",
    isSystemFood: true,
  },
  {
    name: "Raw Soya Chunks (Nutrela)",
    category: "PULSES_LEGUMES",
    servingSize: 100,
    servingUnit: "g",
    calories: 345,
    protein: 52.0,
    carbohydrates: 33.0,
    fat: 0.5,
    notes: "Raw ingredient per 100g (High Protein 52%)",
    isSystemFood: true,
  },
  {
    name: "Raw Rolled Oats",
    category: "GRAINS_CEREALS",
    servingSize: 100,
    servingUnit: "g",
    calories: 389,
    protein: 16.9,
    carbohydrates: 66.3,
    fat: 6.9,
    notes: "Raw ingredient per 100g",
    isSystemFood: true,
  },
  {
    name: "Raw Paneer (Cottage Cheese)",
    category: "DAIRY",
    servingSize: 100,
    servingUnit: "g",
    calories: 265,
    protein: 18.3,
    carbohydrates: 3.4,
    fat: 20.8,
    notes: "Raw dairy per 100g",
    isSystemFood: true,
  },
  {
    name: "Raw Chicken Breast (Skinless)",
    category: "OTHER",
    servingSize: 100,
    servingUnit: "g",
    calories: 120,
    protein: 22.5,
    carbohydrates: 0.0,
    fat: 2.6,
    notes: "Raw meat per 100g",
    isSystemFood: true,
  },
  {
    name: "Raw White Rice (Basmati)",
    category: "GRAINS_CEREALS",
    servingSize: 100,
    servingUnit: "g",
    calories: 358,
    protein: 6.8,
    carbohydrates: 79.2,
    fat: 0.6,
    notes: "Raw uncooked rice per 100g",
    isSystemFood: true,
  },
  {
    name: "Raw Moong Dal (Split Green Gram)",
    category: "PULSES_LEGUMES",
    servingSize: 100,
    servingUnit: "g",
    calories: 347,
    protein: 24.0,
    carbohydrates: 60.0,
    fat: 1.2,
    notes: "Raw lentils per 100g",
    isSystemFood: true,
  },
  {
    name: "Raw Eggs (Whole, Large)",
    category: "OTHER",
    servingSize: 100,
    servingUnit: "g",
    calories: 143,
    protein: 12.6,
    carbohydrates: 0.8,
    fat: 9.5,
    notes: "Raw whole egg per 100g (approx 2 large eggs)",
    isSystemFood: true,
  },
  {
    name: "Mustard Oil / Cooking Oil",
    category: "OILS_FATS",
    servingSize: 100,
    servingUnit: "g",
    calories: 884,
    protein: 0.0,
    carbohydrates: 0.0,
    fat: 100.0,
    notes: "Pure cooking oil per 100g",
    isSystemFood: true,
  },
  {
    name: "Desi Ghee (Clarified Butter)",
    category: "OILS_FATS",
    servingSize: 100,
    servingUnit: "g",
    calories: 900,
    protein: 0.0,
    carbohydrates: 0.0,
    fat: 100.0,
    notes: "Pure clarified butter per 100g",
    isSystemFood: true,
  },
  {
    name: "Whey Protein Powder",
    category: "SUPPLEMENTS",
    servingSize: 100,
    servingUnit: "g",
    calories: 400,
    protein: 80.0,
    carbohydrates: 6.7,
    fat: 5.0,
    notes: "Whey concentrate/isolate per 100g",
    isSystemFood: true,
  },

  // COOKED DISHES & PREPARED FOODS
  {
    name: "Cooked White Rice",
    category: "GRAINS_CEREALS",
    servingSize: 100,
    servingUnit: "g",
    calories: 130,
    protein: 2.7,
    carbohydrates: 28.2,
    fat: 0.3,
    notes: "Cooked rice per 100g",
    isSystemFood: true,
  },
  {
    name: "Boiled Egg (Whole, Large)",
    category: "OTHER",
    servingSize: 100,
    servingUnit: "g",
    calories: 155,
    protein: 13.0,
    carbohydrates: 1.1,
    fat: 10.6,
    notes: "Hard boiled eggs per 100g (~2 eggs = 100g, 155 kcal)",
    isSystemFood: true,
  },
  {
    name: "Cooked Chicken Breast",
    category: "OTHER",
    servingSize: 100,
    servingUnit: "g",
    calories: 165,
    protein: 31.0,
    carbohydrates: 0.0,
    fat: 3.6,
    notes: "Cooked/grilled chicken breast per 100g",
    isSystemFood: true,
  },
  {
    name: "Plain Roti / Chapati",
    category: "GRAINS_CEREALS",
    servingSize: 100,
    servingUnit: "g",
    calories: 297,
    protein: 9.0,
    carbohydrates: 60.0,
    fat: 1.5,
    notes: "Cooked chapati per 100g (1 standard roti ≈ 25g, ~74 kcal)",
    isSystemFood: true,
  },
  {
    name: "Cooked Yellow Dal (Tadka)",
    category: "PULSES_LEGUMES",
    servingSize: 100,
    servingUnit: "g",
    calories: 110,
    protein: 5.5,
    carbohydrates: 16.0,
    fat: 2.8,
    notes: "Cooked dal soup per 100g",
    isSystemFood: true,
  },
];

async function seedFoods() {
  console.log("\n================================================================================");
  console.log("🌾 SEEDING RAW & COOKED STAPLE FOODS INTO NEON POSTGRESQL");
  console.log("================================================================================\n");

  const pool = new Pool({
    connectionString: NEON_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();

    for (const food of STANDARD_FOODS) {
      const id = `sys_food_${food.name.toLowerCase().replace(/[^a-z0-9]/g, "_").substring(0, 30)}`;
      
      await client.query(
        `INSERT INTO foods (id, user_id, name, category, serving_size, serving_unit, calories, protein, carbohydrates, fat, is_system_food, is_favorite, created_at, updated_at)
         VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           calories = EXCLUDED.calories,
           protein = EXCLUDED.protein,
           carbohydrates = EXCLUDED.carbohydrates,
           fat = EXCLUDED.fat,
           updated_at = CURRENT_TIMESTAMP`,
        [
          id,
          food.name,
          food.category,
          food.servingSize,
          food.servingUnit,
          food.calories,
          food.protein,
          food.carbohydrates,
          food.fat,
          food.isSystemFood,
        ]
      );
      console.log(`  ✓ ${food.name} (Cal: ${food.calories}, P: ${food.protein}g, C: ${food.carbohydrates}g, F: ${food.fat}g per 100g)`);
    }

    client.release();
    console.log("\n================================================================================");
    console.log("✅ ALL RAW & COOKED FOODS SEEDED SUCCESSFULLY!");
    console.log("================================================================================\n");
  } catch (err: any) {
    console.error("❌ Seeding failed:", err.message);
  } finally {
    await pool.end();
  }
}

seedFoods();
