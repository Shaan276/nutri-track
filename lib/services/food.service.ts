import { prisma } from "@/lib/db";
import { FoodInput, FoodCategory } from "@/lib/validations/food";

export interface GetFoodsOptions {
  userId: string;
  search?: string;
  category?: FoodCategory;
  status?: "active" | "archived" | "all";
  favoritesOnly?: boolean;
}

export class FoodService {
  /**
   * Retrieves foods available to the user (their private foods + system foods)
   */
  static async getUserFoods(options: GetFoodsOptions) {
    const { userId, search, category, status = "active", favoritesOnly } = options;

    const where: any = {
      OR: [{ userId }, { isSystemFood: true }],
    };

    // Filter by archived status
    if (status === "active") {
      where.isArchived = false;
    } else if (status === "archived") {
      where.isArchived = true;
    }

    // Filter by favorite
    if (favoritesOnly) {
      where.isFavorite = true;
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by search query
    if (search && search.trim()) {
      const term = search.trim();
      where.AND = [
        {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { brand: { contains: term, mode: "insensitive" } },
            { category: { contains: term, mode: "insensitive" } },
          ],
        },
      ];
    }

    const foods = await prisma.food.findMany({
      where,
      orderBy: [{ isFavorite: "desc" }, { createdAt: "desc" }],
    });

    return foods;
  }

  /**
   * Retrieves a single food item ensuring authorization
   */
  static async getFoodById(foodId: string, userId: string) {
    const food = await prisma.food.findUnique({
      where: { id: foodId },
    });

    if (!food) return null;

    // Authorization check: User can only access their private food or global system foods
    if (food.userId && food.userId !== userId && !food.isSystemFood) {
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    return food;
  }

  /**
   * Creates a private food entry for the authenticated user
   */
  static async createFood(userId: string, data: FoodInput) {
    const valOrNull = (v: any) => (v !== undefined && v !== null ? v : null);

    const validCategories = [
      "FRUITS",
      "VEGETABLES",
      "GRAINS_CEREALS",
      "PULSES_LEGUMES",
      "DAIRY",
      "NUTS_SEEDS",
      "OILS_FATS",
      "BEVERAGES",
      "SNACKS",
      "SWEETS",
      "SUPPLEMENTS",
      "OTHER",
    ];
    const categoryStr = String(data.category || "").toUpperCase();
    const safeCategory = validCategories.includes(categoryStr) ? (categoryStr as any) : "OTHER";

    return prisma.food.create({
      data: {
        userId,
        name: data.name,
        category: safeCategory,
        brand: data.brand || null,
        barcode: data.barcode || null,
        servingSize: data.servingSize,
        servingUnit: data.servingUnit,
        calories: data.calories || 0,
        protein: data.protein || 0,
        carbohydrates: data.carbohydrates || 0,
        fat: data.fat || 0,
        fiber: data.fiber || 0,
        sugar: data.sugar || 0,
        // Minerals
        calcium: valOrNull(data.calcium),
        iron: valOrNull(data.iron),
        magnesium: valOrNull(data.magnesium),
        potassium: valOrNull(data.potassium),
        sodium: valOrNull(data.sodium),
        zinc: valOrNull(data.zinc),
        phosphorus: valOrNull((data as any).phosphorus),
        copper: valOrNull((data as any).copper),
        manganese: valOrNull((data as any).manganese),
        selenium: valOrNull((data as any).selenium),
        // Vitamins
        vitaminA: valOrNull(data.vitaminA),
        vitaminC: valOrNull(data.vitaminC),
        vitaminD: valOrNull(data.vitaminD),
        vitaminE: valOrNull((data as any).vitaminE),
        vitaminK: valOrNull((data as any).vitaminK),
        vitaminB1: valOrNull((data as any).vitaminB1),
        vitaminB2: valOrNull((data as any).vitaminB2),
        vitaminB3: valOrNull((data as any).vitaminB3),
        vitaminB5: valOrNull((data as any).vitaminB5),
        vitaminB6: valOrNull((data as any).vitaminB6),
        vitaminB7: valOrNull((data as any).vitaminB7),
        vitaminB9: valOrNull((data as any).vitaminB9),
        vitaminB12: valOrNull(data.vitaminB12),
        water: data.water || 0,
        notes: data.notes || null,
        isFavorite: data.isFavorite || false,
        isArchived: false,
        isSystemFood: false,
      },
    });
  }

  /**
   * Updates an existing food entry with strict ownership verification
   */
  static async updateFood(foodId: string, userId: string, data: Partial<FoodInput>) {
    const existing = await prisma.food.findUnique({
      where: { id: foodId },
    });

    if (!existing) {
      throw new Error("NOT_FOUND");
    }

    // Disallow editing system foods or other users' foods
    if (existing.isSystemFood || existing.userId !== userId) {
      throw new Error("UNAUTHORIZED_ACCESS");
    }

    return prisma.food.update({
      where: { id: foodId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.brand !== undefined && { brand: data.brand || null }),
        ...(data.barcode !== undefined && { barcode: data.barcode || null }),
        ...(data.servingSize !== undefined && { servingSize: data.servingSize }),
        ...(data.servingUnit !== undefined && { servingUnit: data.servingUnit }),
        ...(data.calories !== undefined && { calories: data.calories }),
        ...(data.protein !== undefined && { protein: data.protein }),
        ...(data.carbohydrates !== undefined && { carbohydrates: data.carbohydrates }),
        ...(data.fat !== undefined && { fat: data.fat }),
        ...(data.fiber !== undefined && { fiber: data.fiber }),
        ...(data.sugar !== undefined && { sugar: data.sugar }),
        ...(data.calcium !== undefined && { calcium: data.calcium }),
        ...(data.iron !== undefined && { iron: data.iron }),
        ...(data.magnesium !== undefined && { magnesium: data.magnesium }),
        ...(data.potassium !== undefined && { potassium: data.potassium }),
        ...(data.sodium !== undefined && { sodium: data.sodium }),
        ...(data.zinc !== undefined && { zinc: data.zinc }),
        ...((data as any).phosphorus !== undefined && { phosphorus: (data as any).phosphorus }),
        ...((data as any).copper !== undefined && { copper: (data as any).copper }),
        ...((data as any).manganese !== undefined && { manganese: (data as any).manganese }),
        ...((data as any).selenium !== undefined && { selenium: (data as any).selenium }),
        ...(data.vitaminA !== undefined && { vitaminA: data.vitaminA }),
        ...(data.vitaminC !== undefined && { vitaminC: data.vitaminC }),
        ...(data.vitaminD !== undefined && { vitaminD: data.vitaminD }),
        ...((data as any).vitaminE !== undefined && { vitaminE: (data as any).vitaminE }),
        ...((data as any).vitaminK !== undefined && { vitaminK: (data as any).vitaminK }),
        ...((data as any).vitaminB1 !== undefined && { vitaminB1: (data as any).vitaminB1 }),
        ...((data as any).vitaminB2 !== undefined && { vitaminB2: (data as any).vitaminB2 }),
        ...((data as any).vitaminB3 !== undefined && { vitaminB3: (data as any).vitaminB3 }),
        ...((data as any).vitaminB5 !== undefined && { vitaminB5: (data as any).vitaminB5 }),
        ...((data as any).vitaminB6 !== undefined && { vitaminB6: (data as any).vitaminB6 }),
        ...((data as any).vitaminB7 !== undefined && { vitaminB7: (data as any).vitaminB7 }),
        ...((data as any).vitaminB9 !== undefined && { vitaminB9: (data as any).vitaminB9 }),
        ...(data.vitaminB12 !== undefined && { vitaminB12: data.vitaminB12 }),
        ...(data.water !== undefined && { water: data.water }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        ...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
      },
    });
  }

  /**
   * Archives a food item
   */
  static async archiveFood(foodId: string, userId: string) {
    const existing = await prisma.food.findUnique({
      where: { id: foodId },
    });

    if (!existing) throw new Error("NOT_FOUND");
    if (existing.userId !== userId) throw new Error("UNAUTHORIZED_ACCESS");

    return prisma.food.update({
      where: { id: foodId },
      data: { isArchived: true },
    });
  }

  /**
   * Restores an archived food item
   */
  static async restoreFood(foodId: string, userId: string) {
    const existing = await prisma.food.findUnique({
      where: { id: foodId },
    });

    if (!existing) throw new Error("NOT_FOUND");
    if (existing.userId !== userId) throw new Error("UNAUTHORIZED_ACCESS");

    return prisma.food.update({
      where: { id: foodId },
      data: { isArchived: false },
    });
  }

  /**
   * Toggles the favorite status of a food
   */
  static async toggleFavorite(foodId: string, userId: string) {
    const existing = await prisma.food.findUnique({
      where: { id: foodId },
    });

    if (!existing) throw new Error("NOT_FOUND");
    if (existing.userId !== userId) throw new Error("UNAUTHORIZED_ACCESS");

    return prisma.food.update({
      where: { id: foodId },
      data: { isFavorite: !existing.isFavorite },
    });
  }

  /**
   * Deletes a food item permanently
   */
  static async deleteFood(foodId: string, userId: string) {
    const existing = await prisma.food.findUnique({
      where: { id: foodId },
    });

    if (!existing) throw new Error("NOT_FOUND");
    if (existing.userId !== userId) throw new Error("UNAUTHORIZED_ACCESS");

    return prisma.food.delete({
      where: { id: foodId },
    });
  }
}
