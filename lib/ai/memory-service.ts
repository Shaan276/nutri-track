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
   * Scans user text for obvious recurring dietary/training preferences and stores them safely.
   */
  static async autoCapturePreferences(userId: string, userMessage: string): Promise<void> {
    const lower = userMessage.toLowerCase();

    const rules: Array<{ pattern: RegExp; content: string; category: CreateMemoryInput["category"] }> = [
      { pattern: /\b(i am|i'm|i am a)\s+vegetarian\b/i, content: "Prefers vegetarian dietary choices", category: "PREFERENCE" },
      { pattern: /\b(i am|i'm|i am a)\s+vegan\b/i, content: "Follows a vegan diet", category: "PREFERENCE" },
      { pattern: /\b(lactose|dairy)\s+(intolerant|free|allergy)\b/i, content: "Avoids dairy products (lactose sensitive)", category: "CONSTRAINT" },
      { pattern: /\b(gluten\s+free|celiac)\b/i, content: "Requires gluten-free foods", category: "CONSTRAINT" },
      { pattern: /\b(training for|preparing for)\s+(a\s+)?(marathon|half marathon|10k|5k)\b/i, content: "Training for a running distance event", category: "TRAINING" },
    ];

    for (const rule of rules) {
      if (rule.pattern.test(lower)) {
        await this.addMemory(userId, {
          category: rule.category,
          content: rule.content,
          importance: 3,
          source: "AUTO_DETECTED",
        }).catch(() => {});
      }
    }
  }
}
