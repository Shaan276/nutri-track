import { z } from "zod";

export type NutrientCategory = "MACRO" | "MINERAL" | "VITAMIN";

export type NutrientStatus = "LOW" | "NEEDS_ATTENTION" | "ON_TRACK" | "HIGH" | "UNAVAILABLE";

export interface NutrientDefinition {
  key: string;
  name: string;
  category: NutrientCategory;
  unit: "g" | "mg" | "µg" | "kcal";
  defaultTarget: number;
  description: string;
  foodSources: string;
}

export const NUTRIENT_DEFINITIONS: Record<string, NutrientDefinition> = {
  // Macronutrients
  calories: {
    key: "calories",
    name: "Calories",
    category: "MACRO",
    unit: "kcal",
    defaultTarget: 2000,
    description: "Total dietary energy intake",
    foodSources: "Grains, Nuts, Dairy, Fruits, Oils",
  },
  protein: {
    key: "protein",
    name: "Protein",
    category: "MACRO",
    unit: "g",
    defaultTarget: 120,
    description: "Essential for muscle synthesis and cellular repair",
    foodSources: "Eggs, Greek Yogurt, Lentils, Paneer, Chicken, Fish",
  },
  carbohydrates: {
    key: "carbohydrates",
    name: "Carbohydrates",
    category: "MACRO",
    unit: "g",
    defaultTarget: 250,
    description: "Primary energy substrate for cognitive and physical activity",
    foodSources: "Oats, Brown Rice, Sweet Potatoes, Fruits, Legumes",
  },
  fat: {
    key: "fat",
    name: "Fat",
    category: "MACRO",
    unit: "g",
    defaultTarget: 65,
    description: "Essential for hormone synthesis and fat-soluble vitamin absorption",
    foodSources: "Olive Oil, Avocados, Nuts, Seeds, Ghee",
  },
  fiber: {
    key: "fiber",
    name: "Dietary Fiber",
    category: "MACRO",
    unit: "g",
    defaultTarget: 30,
    description: "Crucial for gut microbiome, glycemic control, and satiety",
    foodSources: "Chia Seeds, Oats, Beans, Vegetables, Berries",
  },
  sugar: {
    key: "sugar",
    name: "Total Sugars",
    category: "MACRO",
    unit: "g",
    defaultTarget: 35,
    description: "Naturally occurring and added simple sugars",
    foodSources: "Whole Fruits, Milk, Dates, Honey",
  },

  // Minerals
  calcium: {
    key: "calcium",
    name: "Calcium",
    category: "MINERAL",
    unit: "mg",
    defaultTarget: 1000,
    description: "Bone density maintenance, vascular contraction, and nerve impulse transmission",
    foodSources: "Milk, Yogurt, Paneer, Sesame Seeds, Tofu, Spinach",
  },
  iron: {
    key: "iron",
    name: "Iron",
    category: "MINERAL",
    unit: "mg",
    defaultTarget: 18,
    description: "Core element of hemoglobin for systemic oxygen transport",
    foodSources: "Lentils, Spinach, Pumpkin Seeds, Tofu, Fortified Cereals",
  },
  magnesium: {
    key: "magnesium",
    name: "Magnesium",
    category: "MINERAL",
    unit: "mg",
    defaultTarget: 400,
    description: "Involved in >300 enzymatic reactions including ATP energy production",
    foodSources: "Almonds, Pumpkin Seeds, Spinach, Dark Chocolate, Black Beans",
  },
  potassium: {
    key: "potassium",
    name: "Potassium",
    category: "MINERAL",
    unit: "mg",
    defaultTarget: 3400,
    description: "Essential intracellular electrolyte regulating fluid balance and blood pressure",
    foodSources: "Bananas, Potatoes, Coconut Water, Lentils, Avocado",
  },
  sodium: {
    key: "sodium",
    name: "Sodium",
    category: "MINERAL",
    unit: "mg",
    defaultTarget: 2300,
    description: "Major extracellular electrolyte maintaining cellular osmotic equilibrium",
    foodSources: "Table Salt, Fermented Foods, Soups, Olives",
  },
  zinc: {
    key: "zinc",
    name: "Zinc",
    category: "MINERAL",
    unit: "mg",
    defaultTarget: 11,
    description: "Crucial for immune cell proliferation, DNA synthesis, and wound healing",
    foodSources: "Chickpeas, Pumpkin Seeds, Cashews, Whole Grains, Dairy",
  },
  phosphorus: {
    key: "phosphorus",
    name: "Phosphorus",
    category: "MINERAL",
    unit: "mg",
    defaultTarget: 700,
    description: "Integral component of bone mineral matrix and cellular phospholipids",
    foodSources: "Dairy, Lentils, Nuts, Seeds, Eggs, Grains",
  },
  copper: {
    key: "copper",
    name: "Copper",
    category: "MINERAL",
    unit: "mg",
    defaultTarget: 0.9,
    description: "Cofactor for ceruloplasmin in iron metabolism and collagen cross-linking",
    foodSources: "Cashews, Sunflower Seeds, Mushrooms, Dark Chocolate",
  },
  manganese: {
    key: "manganese",
    name: "Manganese",
    category: "MINERAL",
    unit: "mg",
    defaultTarget: 2.3,
    description: "Antioxidant protection as manganese superoxide dismutase cofactor",
    foodSources: "Oats, Brown Rice, Spinach, Pineapple, Almonds",
  },
  selenium: {
    key: "selenium",
    name: "Selenium",
    category: "MINERAL",
    unit: "µg",
    defaultTarget: 55,
    description: "Essential for glutathione peroxidase antioxidant defense and thyroid metabolism",
    foodSources: "Brazil Nuts, Sunflower Seeds, Mushrooms, Eggs, Oats",
  },

  // Vitamins
  vitaminA: {
    key: "vitaminA",
    name: "Vitamin A",
    category: "VITAMIN",
    unit: "µg",
    defaultTarget: 900,
    description: "Retinal vision, epithelial integrity, and immune regulation",
    foodSources: "Carrots, Sweet Potatoes, Spinach, Mango, Dairy",
  },
  vitaminC: {
    key: "vitaminC",
    name: "Vitamin C",
    category: "VITAMIN",
    unit: "mg",
    defaultTarget: 90,
    description: "Potent water-soluble antioxidant and collagen synthesis cofactor",
    foodSources: "Oranges, Bell Peppers, Amla, Guava, Kiwi, Broccoli",
  },
  vitaminD: {
    key: "vitaminD",
    name: "Vitamin D",
    category: "VITAMIN",
    unit: "µg",
    defaultTarget: 20,
    description: "Steroid hormone precursor facilitating intestinal calcium absorption",
    foodSources: "Fortified Milk, Sunlight, Egg Yolks, Mushrooms",
  },
  vitaminE: {
    key: "vitaminE",
    name: "Vitamin E",
    category: "VITAMIN",
    unit: "mg",
    defaultTarget: 15,
    description: "Lipid-soluble antioxidant protecting cell membranes from oxidative stress",
    foodSources: "Almonds, Sunflower Seeds, Olive Oil, Spinach, Avocado",
  },
  vitaminK: {
    key: "vitaminK",
    name: "Vitamin K",
    category: "VITAMIN",
    unit: "µg",
    defaultTarget: 120,
    description: "Essential cofactor for hepatic coagulation factors and osteocalcin carboxylation",
    foodSources: "Kale, Spinach, Broccoli, Cabbage, Green Peas",
  },
  vitaminB1: {
    key: "vitaminB1",
    name: "Vitamin B1 (Thiamine)",
    category: "VITAMIN",
    unit: "mg",
    defaultTarget: 1.2,
    description: "Pyruvate dehydrogenase coenzyme in carbohydrate oxidative metabolism",
    foodSources: "Whole Grains, Sunflower Seeds, Lentils, Nuts",
  },
  vitaminB2: {
    key: "vitaminB2",
    name: "Vitamin B2 (Riboflavin)",
    category: "VITAMIN",
    unit: "mg",
    defaultTarget: 1.3,
    description: "FAD and FMN redox cofactors for mitochondrial cellular respiration",
    foodSources: "Milk, Yogurt, Eggs, Almonds, Spinach, Mushrooms",
  },
  vitaminB3: {
    key: "vitaminB3",
    name: "Vitamin B3 (Niacin)",
    category: "VITAMIN",
    unit: "mg",
    defaultTarget: 16,
    description: "NAD and NADP cofactors in cellular glycolysis and DNA repair pathways",
    foodSources: "Peanuts, Brown Rice, Mushrooms, Lentils, Potatoes",
  },
  vitaminB5: {
    key: "vitaminB5",
    name: "Vitamin B5 (Pantothenic Acid)",
    category: "VITAMIN",
    unit: "mg",
    defaultTarget: 5,
    description: "Core structural element of Coenzyme A (CoA) in fatty acid beta-oxidation",
    foodSources: "Avocados, Mushrooms, Sunflower Seeds, Whole Grains, Dairy",
  },
  vitaminB6: {
    key: "vitaminB6",
    name: "Vitamin B6",
    category: "VITAMIN",
    unit: "mg",
    defaultTarget: 1.7,
    description: "Pyridoxal phosphate cofactor in amino acid transamination and neurotransmitter synthesis",
    foodSources: "Bananas, Chickpeas, Potatoes, Spinach, Fortified Cereals",
  },
  vitaminB7: {
    key: "vitaminB7",
    name: "Vitamin B7 (Biotin)",
    category: "VITAMIN",
    unit: "µg",
    defaultTarget: 30,
    description: "Carboxylase coenzyme in gluconeogenesis and branched-chain amino acid metabolism",
    foodSources: "Egg Yolks, Almonds, Sweet Potatoes, Spinach, Nuts",
  },
  vitaminB9: {
    key: "vitaminB9",
    name: "Vitamin B9 (Folate)",
    category: "VITAMIN",
    unit: "µg",
    defaultTarget: 400,
    description: "Single-carbon transfer donor essential for purine/pyrimidine DNA synthesis and erythropoiesis",
    foodSources: "Lentils, Spinach, Chickpeas, Asparagus, Avocado",
  },
  vitaminB12: {
    key: "vitaminB12",
    name: "Vitamin B12",
    category: "VITAMIN",
    unit: "µg",
    defaultTarget: 2.4,
    description: "Methylcobalamin cofactor for methionine synthase and myelin sheath maintenance",
    foodSources: "Milk, Curd, Paneer, Fortified Nutritional Yeast, Eggs",
  },
};

export const MACRO_KEYS = ["calories", "protein", "carbohydrates", "fat", "fiber", "sugar"];
export const MINERAL_KEYS = ["calcium", "iron", "magnesium", "potassium", "sodium", "zinc", "phosphorus", "copper", "manganese", "selenium"];
export const VITAMIN_KEYS = ["vitaminA", "vitaminC", "vitaminD", "vitaminE", "vitaminK", "vitaminB1", "vitaminB2", "vitaminB3", "vitaminB5", "vitaminB6", "vitaminB7", "vitaminB9", "vitaminB12"];

/**
 * Calculates percentage and non-medical tracking status for a given consumed amount vs target
 */
export function calculateNutrientStatus(
  consumedAmount: number | null | undefined,
  targetAmount: number
): {
  percentage: number | null;
  status: NutrientStatus;
  statusLabel: string;
  statusColor: string;
} {
  if (consumedAmount === null || consumedAmount === undefined) {
    return {
      percentage: null,
      status: "UNAVAILABLE",
      statusLabel: "No data available",
      statusColor: "#64748B", // Slate
    };
  }

  if (targetAmount <= 0) {
    return {
      percentage: 100,
      status: "ON_TRACK",
      statusLabel: "On track",
      statusColor: "#10B981", // Emerald
    };
  }

  const percentage = Math.round((consumedAmount / targetAmount) * 100);

  if (percentage < 50) {
    return {
      percentage,
      status: "LOW",
      statusLabel: "Low intake compared with target",
      statusColor: "#EF4444", // Rose
    };
  } else if (percentage < 80) {
    return {
      percentage,
      status: "NEEDS_ATTENTION",
      statusLabel: "Below target",
      statusColor: "#F59E0B", // Amber
    };
  } else if (percentage <= 119) {
    return {
      percentage,
      status: "ON_TRACK",
      statusLabel: "On track",
      statusColor: "#10B981", // Emerald
    };
  } else {
    return {
      percentage,
      status: "HIGH",
      statusLabel: "Above target",
      statusColor: "#06B6D4", // Cyan
    };
  }
}

/**
 * Validation schema for updating user nutrient targets
 */
export const updateNutrientTargetsSchema = z.object({
  calories: z.number().positive().optional().nullable(),
  protein: z.number().positive().optional().nullable(),
  carbohydrates: z.number().positive().optional().nullable(),
  fat: z.number().positive().optional().nullable(),
  fiber: z.number().positive().optional().nullable(),
  sugar: z.number().positive().optional().nullable(),
  calcium: z.number().positive().optional().nullable(),
  iron: z.number().positive().optional().nullable(),
  magnesium: z.number().positive().optional().nullable(),
  potassium: z.number().positive().optional().nullable(),
  sodium: z.number().positive().optional().nullable(),
  zinc: z.number().positive().optional().nullable(),
  phosphorus: z.number().positive().optional().nullable(),
  copper: z.number().positive().optional().nullable(),
  manganese: z.number().positive().optional().nullable(),
  selenium: z.number().positive().optional().nullable(),
  vitaminA: z.number().positive().optional().nullable(),
  vitaminC: z.number().positive().optional().nullable(),
  vitaminD: z.number().positive().optional().nullable(),
  vitaminE: z.number().positive().optional().nullable(),
  vitaminK: z.number().positive().optional().nullable(),
  vitaminB1: z.number().positive().optional().nullable(),
  vitaminB2: z.number().positive().optional().nullable(),
  vitaminB3: z.number().positive().optional().nullable(),
  vitaminB5: z.number().positive().optional().nullable(),
  vitaminB6: z.number().positive().optional().nullable(),
  vitaminB7: z.number().positive().optional().nullable(),
  vitaminB9: z.number().positive().optional().nullable(),
  vitaminB12: z.number().positive().optional().nullable(),
});

export type UpdateNutrientTargetsInput = z.infer<typeof updateNutrientTargetsSchema>;
