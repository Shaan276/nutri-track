import { prisma } from "@/lib/db";
import { AIContextBuilder } from "./context-builder";
import { AIClient, AICoachResponse } from "./ai-client";
import { AIMemoryService } from "./memory-service";
import { UserSettingsService } from "@/lib/services/user-settings.service";

export interface ConversationSummaryItem {
  id: string;
  title: string;
  lastMessageAt: string;
  createdAt: string;
  messageCount: number;
}

export interface ConversationDetailResponse {
  id: string;
  title: string;
  lastMessageAt: string;
  createdAt: string;
  messages: Array<{
    id: string;
    role: string;
    content: string;
    metadata?: any;
    createdAt: string;
  }>;
}

export class AICoachService {
  /**
   * Retrieves or creates the default / latest conversation for a user
   */
  static async getOrCreateDefaultConversation(userId: string): Promise<string> {
    const latest = await (prisma as any).aiConversation.findFirst({
      where: { userId },
      orderBy: { lastMessageAt: "desc" },
    });

    if (latest) {
      return latest.id;
    }

    const created = await (prisma as any).aiConversation.create({
      data: {
        userId,
        title: "Nutri-Track Coach",
      },
    });

    // Add welcoming message
    await (prisma as any).aiMessage.create({
      data: {
        conversationId: created.id,
        role: "assistant",
        content:
          "Hello! I am your Nutri-Track AI Coach. I'm connected directly to your logged nutrition, hydration, runs, and workouts. How can I help you reach your goals today?",
      },
    });

    return created.id;
  }

  /**
   * Retrieves all conversation threads for the authenticated user
   */
  static async getUserConversations(userId: string): Promise<ConversationSummaryItem[]> {
    const convs = await (prisma as any).aiConversation.findMany({
      where: { userId },
      include: { messages: true },
    });

    return convs.map((c: any) => ({
      id: c.id,
      title: c.title || "New Conversation",
      lastMessageAt: c.lastMessageAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
      messageCount: (c.messages || []).length,
    }));
  }

  /**
   * Retrieves messages for a specific conversation with strict ownership verification
   */
  static async getConversation(
    userId: string,
    conversationId: string
  ): Promise<ConversationDetailResponse> {
    const conv = await (prisma as any).aiConversation.findUnique({
      where: { id: conversationId },
      include: { messages: true },
    });

    if (!conv) {
      throw new Error("Conversation not found");
    }

    if (conv.userId !== userId) {
      throw new Error("Unauthorized: Access denied to this conversation");
    }

    return {
      id: conv.id,
      title: conv.title,
      lastMessageAt: conv.lastMessageAt.toISOString(),
      createdAt: conv.createdAt.toISOString(),
      messages: (conv.messages || []).map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        metadata: m.metadata ? (typeof m.metadata === "string" ? JSON.parse(m.metadata) : m.metadata) : null,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  /**
   * Creates a new conversation thread for the user
   */
  static async createConversation(userId: string, title?: string): Promise<ConversationSummaryItem> {
    const created = await (prisma as any).aiConversation.create({
      data: {
        userId,
        title: title || "New Conversation",
      },
    });

    return {
      id: created.id,
      title: created.title,
      lastMessageAt: created.lastMessageAt.toISOString(),
      createdAt: created.createdAt.toISOString(),
      messageCount: 0,
    };
  }

  /**
   * Deletes a conversation thread with strict user ownership verification
   */
  static async deleteConversation(userId: string, conversationId: string): Promise<boolean> {
    const conv = await (prisma as any).aiConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conv) {
      throw new Error("Conversation not found");
    }

    if (conv.userId !== userId) {
      throw new Error("Unauthorized: You do not own this conversation");
    }

    await (prisma as any).aiConversation.delete({
      where: { id: conversationId },
    });

    return true;
  }

  /**
   * Processes a user message, runs tools, captures preferences, and persists assistant reply
   */
  static async processMessage(
    userId: string,
    conversationId: string,
    messageText: string,
    imageBase64?: string
  ): Promise<{
    userMessage: any;
    assistantMessage: any;
    proposedGoal?: any;
    conversationTitle?: string;
  }> {
    const cleanText = (messageText || "").trim();
    const promptText = cleanText || (imageBase64 ? "📸 [Attached Food Image for Nutrition Analysis]" : "");
    if (!promptText) throw new Error("Message or food image cannot be empty");

    // 1. Verify conversation ownership
    const conv = await (prisma as any).aiConversation.findUnique({
      where: { id: conversationId },
      include: { messages: true },
    });

    if (!conv) {
      throw new Error("Conversation not found");
    }

    if (conv.userId !== userId) {
      throw new Error("Unauthorized access to conversation");
    }

    // 2. Persist user message
    const userMsg = await (prisma as any).aiMessage.create({
      data: {
        conversationId,
        role: "user",
        content: promptText,
        metadata: imageBase64 ? JSON.stringify({ hasImage: true }) : null,
      },
    });

    // 3. Auto-detect user preferences and save to memory in background
    if (cleanText) {
      AIMemoryService.autoCapturePreferences(userId, cleanText).catch(() => {});
    }

    let aiResult: AICoachResponse;
    try {
      // 4. Build 4-layer personalized context grounded in PostgreSQL
      const assembled = await AIContextBuilder.buildContext(userId, conversationId, promptText);

      // 5. Generate AI Coach Response with key rotation, multimodal vision, & tool calling
      aiResult = await AIClient.generateCoachResponse(
        assembled.systemPrompt,
        assembled.recentMessages,
        promptText,
        { userId },
        { imageBase64 }
      );
    } catch (genErr: any) {
      console.error("[AICoachService] Error generating response:", genErr);
      aiResult = {
        reply: "I ran into a temporary hiccup processing your request. Please try again! 🥗✨",
        modelUsed: "fallback",
        toolsExecuted: [],
      };
    }

    // 6. Save assistant message with metadata
    const metadataObj = {
      modelUsed: aiResult.modelUsed,
      toolsExecuted: aiResult.toolsExecuted.map((t) => t.toolName),
      proposedGoal: aiResult.proposedGoal || null,
      tokensUsed: aiResult.tokensUsed || null,
    };

    let finalReply = aiResult.reply;

    // If tools were executed, but LLM response returned unavailable fallback, use the tool execution message directly!
    if (aiResult.toolsExecuted.length > 0 && finalReply.includes("AI Coach is currently unavailable")) {
      finalReply = aiResult.toolsExecuted
        .map((t) => t.result?.message || `Processed ${t.toolName}! ✨`)
        .filter(Boolean)
        .join("\n\n");
    }

    const assistantMsg = await (prisma as any).aiMessage.create({
      data: {
        conversationId,
        role: "assistant",
        content: finalReply,
        metadata: JSON.stringify(metadataObj),
      },
    });

    // 7. Update conversation title if first user message
    let updatedTitle = conv.title;
    if (conv.title === "New Conversation" || conv.title === "Nutri-Track Coach") {
      const generatedTitle = cleanText.length > 35 ? cleanText.substring(0, 32) + "..." : cleanText;
      await (prisma as any).aiConversation.update({
        where: { id: conversationId },
        data: { title: generatedTitle },
      });
      updatedTitle = generatedTitle;
    }

    return {
      userMessage: {
        id: userMsg.id,
        role: userMsg.role,
        content: userMsg.content,
        createdAt: userMsg.createdAt.toISOString(),
      },
      assistantMessage: {
        id: assistantMsg.id,
        role: assistantMsg.role,
        content: assistantMsg.content,
        metadata: metadataObj,
        createdAt: assistantMsg.createdAt.toISOString(),
      },
      proposedGoal: aiResult.proposedGoal || null,
      conversationTitle: updatedTitle,
    };
  }

  /**
   * Executes a confirmed goal update requested by the user from chat UI
   */
  static async confirmGoalUpdate(
    userId: string,
    targetKey: string,
    newValue: number
  ): Promise<{ success: boolean; message: string; updatedSettings: any }> {
    const currentSettings = await UserSettingsService.getUserSettings(userId);

    const profileData = { ...currentSettings.profile };
    const nutritionGoals = { ...currentSettings.nutritionGoals };

    const macroKeys = ["calories", "protein", "carbohydrates", "fat", "fiber", "sugar"];
    if (macroKeys.includes(targetKey)) {
      (nutritionGoals as any)[targetKey] = Number(newValue);
    } else {
      (profileData as any)[targetKey] = Number(newValue);
    }

    const updated = await UserSettingsService.updateUserSettings(userId, {
      profile: profileData,
      nutritionGoals,
    });

    return {
      success: true,
      message: `Successfully updated your ${targetKey} target to ${newValue}!`,
      updatedSettings: updated,
    };
  }
}
