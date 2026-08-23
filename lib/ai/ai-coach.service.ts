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

    // Check if user has an active goal configured
    const userProfile = await prisma.userProfile.findUnique({ where: { userId } });
    const goalText = userProfile?.primaryGoal
      ? `reach your ${userProfile.primaryGoal.toLowerCase().replace(/_/g, " ")} goals`
      : "set up your personalized nutrition and fitness blueprint";

    // Add welcoming message with goal discovery
    await (prisma as any).aiMessage.create({
      data: {
        conversationId: created.id,
        role: "assistant",
        content:
          `Hello! I am your Nutri-Track AI Coach — your autonomous partner in nutrition, performance, and recovery! 🌟💪\n\n• I'm connected directly to your real-time meals, hydration, runs, workouts, and Dynamic Nutrition.\n• How can I help you ${goalText} today? ✨`,
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
      executedActions: aiResult.toolsExecuted.map((t) => ({
        toolName: t.toolName,
        message: t.result?.message || `Processed ${t.toolName}! ✨`,
        success: t.result?.success !== false,
      })),
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
    targetKeyOrPackage: string | Record<string, any>,
    newValue?: number
  ): Promise<{ success: boolean; message: string; updatedSettings: any }> {
    const currentSettings = await UserSettingsService.getUserSettings(userId);

    const profileData = { ...currentSettings.profile };
    const nutritionGoals = { ...currentSettings.nutritionGoals };

    if (typeof targetKeyOrPackage === "object") {
      // Full goals package proposal confirmation
      const pkg = targetKeyOrPackage;
      if (pkg.calories !== undefined) nutritionGoals.calories = Number(pkg.calories);
      if (pkg.protein !== undefined) nutritionGoals.protein = Number(pkg.protein);
      if (pkg.carbohydrates !== undefined || pkg.carbs !== undefined) nutritionGoals.carbohydrates = Number(pkg.carbohydrates ?? pkg.carbs);
      if (pkg.fat !== undefined || pkg.fats !== undefined) nutritionGoals.fat = Number(pkg.fat ?? pkg.fats);
      if (pkg.fiber !== undefined) nutritionGoals.fiber = Number(pkg.fiber);
      if (pkg.dailyHydrationTargetMl !== undefined || pkg.hydrationMl !== undefined) {
        profileData.dailyHydrationTargetMl = Number(pkg.dailyHydrationTargetMl ?? pkg.hydrationMl);
      }
      if (pkg.dailyStepTarget !== undefined || pkg.steps !== undefined) {
        profileData.dailyStepTarget = Number(pkg.dailyStepTarget ?? pkg.steps);
      }
      if (pkg.primaryGoal) {
        profileData.primaryGoal = String(pkg.primaryGoal) as any;
      }

      const updated = await UserSettingsService.updateUserSettings(userId, {
        profile: profileData,
        nutritionGoals,
      });

      // Mark AI Assessment as COMPLETED via AIMemory
      const existingMem = await (prisma as any).aiMemory.findFirst({
        where: { userId, category: "ASSESSMENT_STATUS" },
      }).catch(() => null);

      if (existingMem) {
        await (prisma as any).aiMemory.update({
          where: { id: existingMem.id },
          data: { content: "COMPLETED", updatedAt: new Date() },
        }).catch(() => {});
      } else {
        await (prisma as any).aiMemory.create({
          data: {
            userId,
            category: "ASSESSMENT_STATUS",
            content: "COMPLETED",
            importance: 5,
            source: "SYSTEM",
          },
        }).catch(() => {});
      }

      return {
        success: true,
        message: "Successfully applied your personalized health & nutrition blueprint! 🎯✨",
        updatedSettings: updated,
      };
    }

    const targetKey = String(targetKeyOrPackage);
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
      message: `Successfully updated your ${targetKey} target to ${newValue}! 🎯✨`,
      updatedSettings: updated,
    };
  }

  /**
   * Starts or resumes an interactive all-in-one health assessment for the user.
   */
  static async startOrResumeAssessment(userId: string): Promise<{
    conversationId: string;
    isFreshStart: boolean;
    messages: any[];
  }> {
    const todayStr = new Date().toISOString().split("T")[0];
    const { HealthContextService } = await import("@/lib/services/health-context.service");
    const snapshot = await HealthContextService.getHealthSnapshot(userId, todayStr);

    // Find or create assessment conversation
    let conv = await (prisma as any).aiConversation.findFirst({
      where: { userId, title: "Health & Goal Assessment" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    let isFreshStart = false;

    if (!conv) {
      conv = await (prisma as any).aiConversation.create({
        data: {
          userId,
          title: "Health & Goal Assessment",
        },
        include: { messages: true },
      });
      isFreshStart = true;
    }

    // If conversation is empty, generate initial comprehensive assessment greeting
    if (conv.messages.length === 0) {
      isFreshStart = true;
      const p = snapshot.profile;
      let existingStats = "";
      let biometricsPreamble = "";
      let missingBiometricsQuestion = "";

      if (p.heightCm && p.weightKg) {
        existingStats = `• 📊 **Current Profile**: ${p.heightCm} cm | ${p.weightKg} kg${p.bmr && p.tdee ? ` (BMR: ${p.bmr} kcal | TDEE: ${p.tdee} kcal)` : ""}\n• 🎯 **Current Targets**: ${snapshot.nutrition.calorieTarget ? `${snapshot.nutrition.calorieTarget} kcal | ${snapshot.nutrition.proteinTarget}g Protein | ${snapshot.hydration.targetMl}ml Water` : "Pending Assessment"}`;
        biometricsPreamble = `I've already analyzed your biometric data and activity records so you won't need to repeat anything I already know:\n\n${existingStats}`;
      } else {
        existingStats = `• 📊 **Current Profile**: Height & Weight not entered yet\n• 🎯 **Current Targets**: Pending health assessment`;
        biometricsPreamble = `Welcome! Let's build your personalized nutrition, training, and recovery blueprint from scratch: 🎯✨`;
        missingBiometricsQuestion = `0. 📏 **Biometrics (Height & Current Weight)**\n   • What is your height (in cm) and current weight (in kg)? (Also biological sex & age if not yet entered!)\n\n`;
      }

      const initialMessage = `Alright ${p.name || "friend"}! 😄 ${biometricsPreamble}\n\nTo build your personalized nutrition, training, and recovery blueprint, let's look at your key lifestyle details together: 🎯✨\n\n${missingBiometricsQuestion}1. 🎯 **Primary Goal & Priority**\n   • What is your top focus right now? (Fat Loss, Muscle Gain, Weight Maintenance, Running Performance, Strength, Better Health)\n\n2. 📏 **Specific Target & Timeline**\n   • What is your goal target (e.g. target weight, 5k/10k run goal) and preferred timeline?\n\n3. 🏠 **Living Situation**\n   • Where do you currently live? (With Family, Living Alone, Hostel / Dormitory, Shared Flat)\n\n4. 🕒 **Daily Routine & Activity**\n   • What is your typical day like? (Desk job, standing, walking commute, general movement)\n\n5. 🥗 **Food Environment & Control**\n   • Who cooks your meals? Any dietary preferences (Vegetarian, Vegan, Eggetarian), foods you dislike, or budget limits?\n\n6. 💤 **Sleep & Recovery**\n   • Average hours of sleep per night and overall sleep quality?\n\n7. 🏃‍♂️ **Training Priorities**\n   • Favorite activities? (Running, Gym Lifting, Home Workouts, Walking, HIIT)\n\n8. ⚠️ **Important Constraints**\n   • Any past injuries, schedule limits, or food restrictions I should factor in?\n\n💡 *Feel free to type your answers, speak with voice 🎙️, or select the interactive questionnaire chips! Once answered, I will immediately calculate and propose your custom calorie, macro, and hydration blueprint!* 🚀🔥`;

      const welcomeMsg = await (prisma as any).aiMessage.create({
        data: {
          conversationId: conv.id,
          role: "assistant",
          content: initialMessage,
          metadata: JSON.stringify({ isAssessmentGreeting: true }),
        },
      });

      conv.messages = [welcomeMsg];
    }

    // Set persistent assessment status to IN_PROGRESS if not already completed
    const existingStatus = await (prisma as any).aiMemory.findFirst({
      where: { userId, category: "ASSESSMENT_STATUS" },
    }).catch(() => null);

    if (!existingStatus || existingStatus.content !== "COMPLETED") {
      await AIMemoryService.setOrReplaceTopicMemory(userId, "ASSESSMENT_STATUS", "IN_PROGRESS", 5);
    }

    return {
      conversationId: conv.id,
      isFreshStart,
      messages: conv.messages.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        metadata: m.metadata ? (typeof m.metadata === "string" ? JSON.parse(m.metadata) : m.metadata) : null,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }
}
