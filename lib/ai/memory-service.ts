import { prisma } from "@/lib/db";

export interface CreateMemoryInput {
  category?: "PREFERENCE" | "NUTRITION" | "TRAINING" | "GOAL" | "CONSTRAINT" | "GENERAL";
  content: string;
  importance?: number;
  source?: string;
}

export class AIMemoryService {
  /**
   * Retrieves all saved memories for a specific user with strict isolation.
   */
  static async getUserMemories(userId: string) {
    return (prisma as any).aiMemory.findMany({
      where: { userId },
      orderBy: { importance: "desc" },
    });
  }

  /**
   * Saves a new memory for a user.
   */
  static async addMemory(userId: string, input: CreateMemoryInput) {
    const content = input.content.trim();
    if (!content) throw new Error("Memory content cannot be empty");

    // Prevent duplicate exact memories
    const existing = await (prisma as any).aiMemory.findMany({ where: { userId } });
    const isDuplicate = existing.some((m: any) => m.content.toLowerCase() === content.toLowerCase());
    if (isDuplicate) return null;

    return (prisma as any).aiMemory.create({
      data: {
        userId,
        category: input.category || "GENERAL",
        content,
        importance: input.importance || 1,
        source: input.source || "USER_STATED",
      },
    });
  }

  /**
   * Updates an existing memory with strict user ownership verification.
   */
  static async updateMemory(
    userId: string,
    memoryId: string,
    input: { content?: string; category?: CreateMemoryInput["category"]; importance?: number }
  ) {
    const memory = await (prisma as any).aiMemory.findUnique({
      where: { id: memoryId },
    });

    if (!memory) throw new Error("Memory not found");
    if (memory.userId !== userId) throw new Error("Unauthorized access to memory");

    return (prisma as any).aiMemory.update({
      where: { id: memoryId },
      data: {
        content: input.content?.trim(),
        category: input.category,
        importance: input.importance,
      },
    });
  }

  /**
   * Deletes a memory with strict user ownership verification.
   */
  static async deleteMemory(userId: string, memoryId: string) {
    const memory = await (prisma as any).aiMemory.findUnique({
      where: { id: memoryId },
    });

    if (!memory) throw new Error("Memory not found");
    if (memory.userId !== userId) throw new Error("Unauthorized access to memory");

    return (prisma as any).aiMemory.delete({
      where: { id: memoryId },
    });
  }

  /**
   * Clears all AI memories for a user.
   */
  static async clearAllMemories(userId: string): Promise<number> {
    const res = await (prisma as any).aiMemory.deleteMany({
      where: { userId },
    });
    return res.count || 0;
  }

  /**
   * Sets or updates a single-topic memory (e.g., living situation, primary goal, diet style),
   * replacing older contradictory memories cleanly.
   */
  static async setOrReplaceTopicMemory(
    userId: string,
    topicKey: "LIVING_SITUATION" | "PRIMARY_GOAL" | "DIETARY_PREFERENCE" | "TRAINING_PREFERENCE" | "SLEEP_ROUTINE" | "CONSTRAINTS" | "ASSESSMENT_STATUS",
    content: string,
    importance: number = 4
  ) {
    const trimmed = content.trim();
    if (!trimmed) return null;

    // Check if an existing memory for this category or topic pattern exists
    const existing = await (prisma as any).aiMemory.findFirst({
      where: {
        userId,
        category: topicKey,
      },
    });

    if (existing) {
      return (prisma as any).aiMemory.update({
        where: { id: existing.id },
        data: {
          category: topicKey,
          content: trimmed,
          importance,
          updatedAt: new Date(),
        },
      });
    }

    return (prisma as any).aiMemory.create({
      data: {
        userId,
        category: topicKey,
        content: trimmed,
        importance,
        source: "AI_ASSESSMENT",
      },
    });
  }

  /**
   * Scans user text for obvious recurring dietary, lifestyle, living situation, and training preferences and stores them safely.
   */
  static async autoCapturePreferences(userId: string, userMessage: string): Promise<void> {
    const lower = userMessage.toLowerCase();

    // 1. Dietary and Allergy Rules
    const dietaryRules: Array<{ pattern: RegExp; content: string; category: CreateMemoryInput["category"] }> = [
      { pattern: /\b(i am|i'm|i am a)\s+vegetarian\b/i, content: "Prefers vegetarian dietary choices", category: "PREFERENCE" },
      { pattern: /\b(i am|i'm|i am a)\s+vegan\b/i, content: "Follows a strict vegan diet", category: "PREFERENCE" },
      { pattern: /\b(i am|i'm|i am a)\s+eggetarian\b/i, content: "Follows an eggetarian diet (eats eggs & dairy, no meat)", category: "PREFERENCE" },
      { pattern: /\b(lactose|dairy)\s+(intolerant|free|allergy)\b/i, content: "Avoids dairy products (lactose sensitive)", category: "CONSTRAINT" },
      { pattern: /\b(gluten\s+free|celiac)\b/i, content: "Requires gluten-free foods", category: "CONSTRAINT" },
      { pattern: /\b(peanut|nut)\s+allergy\b/i, content: "Severe nut allergy - exclude all nuts and peanuts", category: "CONSTRAINT" },
      { pattern: /\b(training for|preparing for)\s+(a\s+)?(marathon|half marathon|10k|5k)\b/i, content: "Training for a running distance event", category: "TRAINING" },
    ];

    for (const rule of dietaryRules) {
      if (rule.pattern.test(lower)) {
        await this.addMemory(userId, {
          category: rule.category,
          content: rule.content,
          importance: 3,
          source: "AUTO_DETECTED",
        }).catch(() => {});
      }
    }

    // 2. Living Situation Rules (Single-Topic replacement)
    if (/\b(live in a hostel|living in hostel|hostel mess|dormitory|dorm food)\b/i.test(lower)) {
      await this.setOrReplaceTopicMemory(
        userId,
        "LIVING_SITUATION",
        "Lives in a Hostel / Dormitory (Eats mess food with limited cooking facilities. Needs practical high-protein additions like milk, curd, paneer, soy, eggs, and fruits).",
        4
      ).catch(() => {});
    } else if (/\b(live alone|living alone|stay alone|staying alone|cook for myself|bachelor)\b/i.test(lower)) {
      await this.setOrReplaceTopicMemory(
        userId,
        "LIVING_SITUATION",
        "Lives Alone (Responsible for grocery shopping, cooking, cleaning, and meal prep. Consider active household time and quick preparation options).",
        4
      ).catch(() => {});
    } else if (/\b(live with family|living with family|live with parents|home cooked meals|family meals)\b/i.test(lower)) {
      await this.setOrReplaceTopicMemory(
        userId,
        "LIVING_SITUATION",
        "Lives with Family (Shares traditional family meals with partial control over recipes. Emphasize portion adjustment and smart additions over demanding separate cooking).",
        4
      ).catch(() => {});
    }
  }
}
