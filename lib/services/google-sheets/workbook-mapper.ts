import { COMPLETE_NUTRIENT_TAXONOMY, NutrientDefinition } from "@/lib/validations/nutrient-taxonomy";

/**
 * Workbook Sheet Schemas matching the Google Sheets Nutrition Coach Template
 */
export const WORKBOOK_SHEET_SCHEMAS = {
  FOOD_LOG: {
    sheetName: "Food Log",
    headers: [
      "Entry ID",
      "User ID",
      "DateTime",
      "Date",
      "Meal",
      "Food ID",
      "Food Name",
      "Quantity",
      "Unit",
      "Brand",
      "Notes",
      "Source",
      "Calories",
      "Protein",
      "Carbohydrates",
      "Net Carbohydrates",
      "Fat",
      "Saturated Fat",
      "Monounsaturated Fat",
      "Polyunsaturated Fat",
      "Omega-3",
      "Omega-6",
      "Trans Fat",
      "Sugar",
      "Added Sugar",
      "Fibre",
      "Water",
      "Record Status",
    ],
  },
  MICRONUTRIENTS: {
    sheetName: "Micronutrients",
    headers: [
      "Entry ID",
      "User ID",
      "Date",
      "Food ID",
      "Food Name",
      "Quantity",
      "Unit",
      "Vitamin A",
      "Vitamin B1",
      "Vitamin B2",
      "Vitamin B3",
      "Vitamin B5",
      "Vitamin B6",
      "Vitamin B7",
      "Vitamin B9",
      "Vitamin B12",
      "Vitamin C",
      "Vitamin D",
      "Vitamin E",
      "Vitamin K",
      "Calcium",
      "Iron",
      "Magnesium",
      "Phosphorus",
      "Potassium",
      "Sodium",
      "Zinc",
      "Copper",
      "Manganese",
      "Selenium",
      "Chromium",
      "Molybdenum",
      "Iodine",
    ],
  },
  AMINO_ACIDS: {
    sheetName: "Amino Acids",
    headers: [
      "Entry ID",
      "User ID",
      "Date",
      "Food ID",
      "Food Name",
      "Quantity",
      "Unit",
      "Histidine",
      "Isoleucine",
      "Leucine",
      "Lysine",
      "Methionine",
      "Phenylalanine",
      "Threonine",
      "Tryptophan",
      "Valine",
      "Arginine",
      "Cysteine",
      "Glutamine",
      "Glycine",
      "Proline",
      "Tyrosine",
    ],
  },
  OTHER_NUTRIENTS: {
    sheetName: "Other Nutrients",
    headers: [
      "Entry ID",
      "User ID",
      "Date",
      "Food ID",
      "Food Name",
      "Quantity",
      "Unit",
      "Choline",
      "Cholesterol",
      "Beta Carotene",
      "Lutein",
      "Zeaxanthin",
      "Lycopene",
      "Ash",
    ],
  },
  DAILY_SUMMARY: {
    sheetName: "Daily Summary",
    headers: [
      "Date",
      "Day",
      "Week Start",
      "Month",
      "Calories",
      "Protein",
      "Carbohydrates",
      "Net Carbohydrates",
      "Fat",
      "Saturated Fat",
      "Monounsaturated Fat",
      "Polyunsaturated Fat",
      "Omega-3",
      "Omega-6",
      "Trans Fat",
      "Sugar",
      "Added Sugar",
      "Fibre",
      "Water",
      "Vitamin A",
      "Vitamin B1",
      "Vitamin B2",
      "Vitamin B3",
      "Vitamin B5",
      "Vitamin B6",
      "Vitamin B7",
      "Vitamin B9",
      "Vitamin B12",
      "Vitamin C",
      "Vitamin D",
      "Vitamin E",
      "Vitamin K",
      "Calcium",
      "Iron",
      "Magnesium",
      "Phosphorus",
      "Potassium",
      "Sodium",
      "Zinc",
      "Copper",
      "Manganese",
      "Selenium",
      "Chromium",
      "Molybdenum",
      "Iodine",
      "Histidine",
      "Isoleucine",
      "Leucine",
      "Lysine",
      "Methionine",
      "Phenylalanine",
      "Threonine",
      "Tryptophan",
      "Valine",
      "Arginine",
      "Cysteine",
      "Glutamine",
      "Glycine",
      "Proline",
      "Tyrosine",
      "Choline",
      "Cholesterol",
      "Beta Carotene",
      "Lutein",
      "Zeaxanthin",
      "Lycopene",
      "Ash",
    ],
  },
  FOOD_DATABASE: {
    sheetName: "Food Database",
    headers: [
      "Food ID",
      "Food Name",
      "Brand",
      "Serving Size",
      "Serving Unit",
      "Source",
      "Active",
      "Calories",
      "Protein",
      "Carbohydrates",
      "Net Carbohydrates",
      "Fat",
      "Saturated Fat",
      "Monounsaturated Fat",
      "Polyunsaturated Fat",
      "Omega-3",
      "Omega-6",
      "Trans Fat",
      "Sugar",
      "Added Sugar",
      "Fibre",
      "Water",
      "Vitamin A",
      "Vitamin B1",
      "Vitamin B2",
      "Vitamin B3",
      "Vitamin B5",
      "Vitamin B6",
      "Vitamin B7",
      "Vitamin B9",
      "Vitamin B12",
      "Vitamin C",
      "Vitamin D",
      "Vitamin E",
      "Vitamin K",
      "Calcium",
      "Iron",
      "Magnesium",
      "Phosphorus",
      "Potassium",
      "Sodium",
      "Zinc",
      "Copper",
      "Manganese",
      "Selenium",
      "Chromium",
      "Molybdenum",
      "Iodine",
      "Histidine",
      "Isoleucine",
      "Leucine",
      "Lysine",
      "Methionine",
      "Phenylalanine",
      "Threonine",
      "Tryptophan",
      "Valine",
      "Arginine",
      "Cysteine",
      "Glutamine",
      "Glycine",
      "Proline",
      "Tyrosine",
      "Choline",
      "Cholesterol",
      "Beta Carotene",
      "Lutein",
      "Zeaxanthin",
      "Lycopene",
      "Ash",
    ],
  },
  NUTRITION_TARGETS: {
    sheetName: "Nutrition Targets",
    headers: [
      "Nutrient Key",
      "Nutrient",
      "Category",
      "Unit",
      "Daily Target",
      "Upper Limit",
      "Target Type",
      "Notes",
    ],
  },
  NUTRIENT_DICTIONARY: {
    sheetName: "Nutrient Dictionary",
    headers: [
      "Nutrient Key",
      "Nutrient",
      "Category",
      "Unit",
      "Target Type",
      "Active",
    ],
  },
};

/**
 * Bi-directional Data Mapping & Transformation Engine
 */
export class WorkbookMapper {
  /**
   * Transforms Nutri-Track logged meal entries into Food Log 28-column row format
   */
  static mapMealEntriesToFoodLogRows(mealEntries: any[]): (string | number)[][] {
    return mealEntries.map((entry) => {
      const food = entry.food || {};
      const log = entry.mealLog || {};
      const ratio = food.servingSize ? Number(entry.quantity) / Number(food.servingSize) : 1;

      const val = (n: any) => (n !== undefined && n !== null ? Number(Number(n * ratio).toFixed(2)) : 0);

      const carbs = val(food.carbohydrates);
      const fiber = val(food.fiber);
      const netCarbs = Math.max(0, Number((carbs - fiber).toFixed(2)));

      return [
        entry.id,
        log.userId || "",
        entry.createdAt ? new Date(entry.createdAt).toISOString() : new Date().toISOString(),
        log.date || "",
        log.mealType || "SNACK",
        food.id || "",
        food.name || "Unknown Food",
        Number(entry.quantity) || 0,
        entry.quantityUnit || food.servingUnit || "g",
        food.brand || "",
        entry.notes || "",
        "Nutri-Track App",
        val(food.calories),
        val(food.protein),
        carbs,
        netCarbs,
        val(food.fat),
        val(food.saturatedFat),
        val(food.monounsaturatedFat),
        val(food.polyunsaturatedFat),
        val(food.omega3),
        val(food.omega6),
        val(food.transFat),
        val(food.sugar),
        val(food.addedSugar),
        fiber,
        val(food.water),
        "READY",
      ];
    });
  }

  /**
   * Transforms Nutri-Track meal entries into Micronutrients 33-column row format
   */
  static mapMealEntriesToMicronutrientRows(mealEntries: any[]): (string | number)[][] {
    return mealEntries.map((entry) => {
      const food = entry.food || {};
      const log = entry.mealLog || {};
      const ratio = food.servingSize ? Number(entry.quantity) / Number(food.servingSize) : 1;
      const val = (n: any) => (n !== undefined && n !== null ? Number(Number(n * ratio).toFixed(2)) : 0);

      return [
        entry.id,
        log.userId || "",
        log.date || "",
        food.id || "",
        food.name || "Unknown Food",
        Number(entry.quantity) || 0,
        entry.quantityUnit || food.servingUnit || "g",
        val(food.vitaminA),
        val(food.vitaminB1),
        val(food.vitaminB2),
        val(food.vitaminB3),
        val(food.vitaminB5),
        val(food.vitaminB6),
        val(food.vitaminB7),
        val(food.vitaminB9),
        val(food.vitaminB12),
        val(food.vitaminC),
        val(food.vitaminD),
        val(food.vitaminE),
        val(food.vitaminK),
        val(food.calcium),
        val(food.iron),
        val(food.magnesium),
        val(food.phosphorus),
        val(food.potassium),
        val(food.sodium),
        val(food.zinc),
        val(food.copper),
        val(food.manganese),
        val(food.selenium),
        val(food.chromium),
        val(food.molybdenum),
        val(food.iodine),
      ];
    });
  }

  /**
   * Transforms Nutri-Track meal entries into Amino Acids 22-column row format
   */
  static mapMealEntriesToAminoAcidRows(mealEntries: any[]): (string | number)[][] {
    return mealEntries.map((entry) => {
      const food = entry.food || {};
      const log = entry.mealLog || {};
      const ratio = food.servingSize ? Number(entry.quantity) / Number(food.servingSize) : 1;
      const val = (n: any) => (n !== undefined && n !== null ? Number(Number(n * ratio).toFixed(2)) : 0);

      return [
        entry.id,
        log.userId || "",
        log.date || "",
        food.id || "",
        food.name || "Unknown Food",
        Number(entry.quantity) || 0,
        entry.quantityUnit || food.servingUnit || "g",
        val(food.histidine),
        val(food.isoleucine),
        val(food.leucine),
        val(food.lysine),
        val(food.methionine),
        val(food.phenylalanine),
        val(food.threonine),
        val(food.tryptophan),
        val(food.valine),
        val(food.arginine),
        val(food.cysteine),
        val(food.glutamine),
        val(food.glycine),
        val(food.proline),
        val(food.tyrosine),
      ];
    });
  }

  /**
   * Transforms Nutri-Track meal entries into Other Nutrients 14-column row format
   */
  static mapMealEntriesToOtherNutrientRows(mealEntries: any[]): (string | number)[][] {
    return mealEntries.map((entry) => {
      const food = entry.food || {};
      const log = entry.mealLog || {};
      const ratio = food.servingSize ? Number(entry.quantity) / Number(food.servingSize) : 1;
      const val = (n: any) => (n !== undefined && n !== null ? Number(Number(n * ratio).toFixed(2)) : 0);

      return [
        entry.id,
        log.userId || "",
        log.date || "",
        food.id || "",
        food.name || "Unknown Food",
        Number(entry.quantity) || 0,
        entry.quantityUnit || food.servingUnit || "g",
        val(food.choline),
        val(food.cholesterol),
        val(food.betaCarotene),
        val(food.lutein),
        val(food.zeaxanthin),
        val(food.lycopene),
        val(food.ash),
      ];
    });
  }

  /**
   * Transforms daily aggregates into Daily Summary 67-column row format
   */
  static mapDailySummaryRows(dailyRecords: any[]): (string | number)[][] {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return dailyRecords.map((record) => {
      const dateObj = new Date(record.date);
      const dayName = days[dateObj.getDay()] || "";
      const monthName = dateObj.toLocaleString("en-US", { month: "short", year: "numeric" });

      // Calculate start of week (Sunday)
      const weekStart = new Date(dateObj);
      weekStart.setDate(dateObj.getDate() - dateObj.getDay());
      const weekStartStr = weekStart.toISOString().split("T")[0];

      const val = (n: any) => (n !== undefined && n !== null ? Number(Number(n).toFixed(2)) : 0);

      const carbs = val(record.carbohydrates || record.carbs);
      const fiber = val(record.fiber);
      const netCarbs = Math.max(0, Number((carbs - fiber).toFixed(2)));

      return [
        record.date,
        dayName,
        weekStartStr,
        monthName,
        val(record.calories),
        val(record.protein),
        carbs,
        netCarbs,
        val(record.fat),
        val(record.saturatedFat),
        val(record.monounsaturatedFat),
        val(record.polyunsaturatedFat),
        val(record.omega3),
        val(record.omega6),
        val(record.transFat),
        val(record.sugar),
        val(record.addedSugar),
        fiber,
        val(record.water),
        val(record.vitaminA),
        val(record.vitaminB1),
        val(record.vitaminB2),
        val(record.vitaminB3),
        val(record.vitaminB5),
        val(record.vitaminB6),
        val(record.vitaminB7),
        val(record.vitaminB9),
        val(record.vitaminB12),
        val(record.vitaminC),
        val(record.vitaminD),
        val(record.vitaminE),
        val(record.vitaminK),
        val(record.calcium),
        val(record.iron),
        val(record.magnesium),
        val(record.phosphorus),
        val(record.potassium),
        val(record.sodium),
        val(record.zinc),
        val(record.copper),
        val(record.manganese),
        val(record.selenium),
        val(record.chromium),
        val(record.molybdenum),
        val(record.iodine),
        val(record.histidine),
        val(record.isoleucine),
        val(record.leucine),
        val(record.lysine),
        val(record.methionine),
        val(record.phenylalanine),
        val(record.threonine),
        val(record.tryptophan),
        val(record.valine),
        val(record.arginine),
        val(record.cysteine),
        val(record.glutamine),
        val(record.glycine),
        val(record.proline),
        val(record.tyrosine),
        val(record.choline),
        val(record.cholesterol),
        val(record.betaCarotene),
        val(record.lutein),
        val(record.zeaxanthin),
        val(record.lycopene),
        val(record.ash),
      ];
    });
  }

  /**
   * Transforms Nutri-Track Food database records into Food Database 70-column row format
   */
  static mapFoodsToFoodDatabaseRows(foods: any[]): (string | number)[][] {
    return foods.map((food) => {
      const val = (n: any) => (n !== undefined && n !== null ? Number(Number(n).toFixed(2)) : 0);
      const carbs = val(food.carbohydrates);
      const fiber = val(food.fiber);
      const netCarbs = Math.max(0, Number((carbs - fiber).toFixed(2)));

      return [
        food.id,
        food.name || "Unnamed Food",
        food.brand || "",
        Number(food.servingSize) || 100,
        food.servingUnit || "g",
        food.isSystemFood ? "System Food Database" : "User Custom Food",
        food.isArchived ? "ARCHIVED" : "ACTIVE",
        val(food.calories),
        val(food.protein),
        carbs,
        netCarbs,
        val(food.fat),
        val(food.saturatedFat),
        val(food.monounsaturatedFat),
        val(food.polyunsaturatedFat),
        val(food.omega3),
        val(food.omega6),
        val(food.transFat),
        val(food.sugar),
        val(food.addedSugar),
        fiber,
        val(food.water),
        val(food.vitaminA),
        val(food.vitaminB1),
        val(food.vitaminB2),
        val(food.vitaminB3),
        val(food.vitaminB5),
        val(food.vitaminB6),
        val(food.vitaminB7),
        val(food.vitaminB9),
        val(food.vitaminB12),
        val(food.vitaminC),
        val(food.vitaminD),
        val(food.vitaminE),
        val(food.vitaminK),
        val(food.calcium),
        val(food.iron),
        val(food.magnesium),
        val(food.phosphorus),
        val(food.potassium),
        val(food.sodium),
        val(food.zinc),
        val(food.copper),
        val(food.manganese),
        val(food.selenium),
        val(food.chromium),
        val(food.molybdenum),
        val(food.iodine),
        val(food.histidine),
        val(food.isoleucine),
        val(food.leucine),
        val(food.lysine),
        val(food.methionine),
        val(food.phenylalanine),
        val(food.threonine),
        val(food.tryptophan),
        val(food.valine),
        val(food.arginine),
        val(food.cysteine),
        val(food.glutamine),
        val(food.glycine),
        val(food.proline),
        val(food.tyrosine),
        val(food.choline),
        val(food.cholesterol),
        val(food.betaCarotene),
        val(food.lutein),
        val(food.zeaxanthin),
        val(food.lycopene),
        val(food.ash),
      ];
    });
  }

  /**
   * Maps Nutrient Dictionary to 6-column sheet rows
   */
  static mapNutrientDictionaryRows(): (string | number | boolean)[][] {
    return COMPLETE_NUTRIENT_TAXONOMY.map((n) => [
      n.key,
      n.name,
      n.category.charAt(0) + n.category.slice(1).toLowerCase(),
      n.unit,
      n.targetType.charAt(0) + n.targetType.slice(1).toLowerCase(),
      true,
    ]);
  }

  /**
   * Maps user's nutrition targets to Nutrition Targets 8-column sheet rows
   */
  static mapTargetsToNutritionTargetRows(userTargets?: Record<string, number>): (string | number | null)[][] {
    return COMPLETE_NUTRIENT_TAXONOMY.map((n) => {
      const customVal = userTargets ? userTargets[n.key] : undefined;
      const targetVal = customVal !== undefined ? customVal : n.defaultDailyTarget || null;

      return [
        n.key,
        n.name,
        n.category.charAt(0) + n.category.slice(1).toLowerCase(),
        n.unit,
        targetVal,
        n.defaultUpperLimit || null,
        n.targetType.charAt(0) + n.targetType.slice(1).toLowerCase(),
        n.description,
      ];
    });
  }
}
