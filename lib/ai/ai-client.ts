import { keyManager } from "./key-manager";
import { AI_MODEL_CONFIG, AI_COACH_SYSTEM_PROMPT, AI_COACH_TOOLS } from "./model-config";
import { AIToolRegistry, ToolExecutionContext, GoalProposalPayload } from "./tool-registry";
import { SystemSettingsService } from "@/lib/services/admin/system-settings.service";

export interface ChatCompletionMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | Array<{ type: string; text?: string; image_url?: { url: string } }> | null;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
  tool_call_id?: string;
}

export interface AICoachResponse {
  reply: string;
  modelUsed: string;
  proposedGoal?: GoalProposalPayload | null;
  toolsExecuted: Array<{ toolName: string; args: any; result: any }>;
  tokensUsed?: number;
}

export class AIClient {
  /**
   * Executes a resilient chat completion with automatic 3-key fallback, multimodal vision support, and tool loop
   */
  public static async generateCoachResponse(
    userContextPrompt: string,
    historyMessages: Array<{ role: string; content: string }>,
    latestUserMessage: string,
    context: ToolExecutionContext,
    options: { modelOverride?: string; allowTools?: boolean; imageBase64?: string } = {}
  ): Promise<AICoachResponse> {
    const dbModel = await SystemSettingsService.getSetting("AI_MODEL", AI_MODEL_CONFIG.defaultModel);
    const selectedModel = options.modelOverride || dbModel;
    const allowTools = options.allowTools !== false;
    const toolsExecuted: Array<{ toolName: string; args: any; result: any }> = [];
    let proposedGoal: GoalProposalPayload | null = null;

    const userMessageContent = options.imageBase64
      ? [
          {
            type: "text",
            text:
              latestUserMessage ||
              "Please analyze this meal photo! Identify all food items, calculate the exact total calories, protein, carbs, fat, fiber, and key micronutrients (Iron, Calcium, Potassium, Magnesium, Zinc, Vitamins), explain its Ayurvedic properties (Agni, Dosha balance), and log it to my daily nutrition tracker! 🥗✨",
          },
          {
            type: "image_url",
            image_url: {
              url: options.imageBase64.startsWith("data:")
                ? options.imageBase64
                : `data:image/jpeg;base64,${options.imageBase64}`,
            },
          },
        ]
      : latestUserMessage;

    // Assemble messages payload
    const messages: ChatCompletionMessage[] = [
      { role: "system", content: `${AI_COACH_SYSTEM_PROMPT}\n${userContextPrompt}` },
      ...historyMessages.map((m) => ({
        role: m.role as any,
        content: m.content,
      })),
      { role: "user", content: userMessageContent as any },
    ];

    // Tool loop (up to 3 iterations for multi-step tool calls)
    for (let step = 0; step < 3; step++) {
      const responsePayload = await this.executeWithFallback(messages, selectedModel, allowTools);

      // Check if model returned tool calls
      if (responsePayload.tool_calls && responsePayload.tool_calls.length > 0) {
        messages.push({
          role: "assistant",
          content: responsePayload.content || null,
          tool_calls: responsePayload.tool_calls,
        });

        for (const tc of responsePayload.tool_calls) {
          const fnName = tc.function.name;
          let parsedArgs = {};
          try {
            parsedArgs = JSON.parse(tc.function.arguments || "{}");
          } catch {}

          const toolResult = await AIToolRegistry.executeTool(fnName, parsedArgs, context);
          toolsExecuted.push({ toolName: fnName, args: parsedArgs, result: toolResult });

          if (fnName === "propose_goal_update" && toolResult?.proposal) {
            proposedGoal = toolResult.proposal;
          }

          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            name: fnName,
            content: JSON.stringify(toolResult),
          });
        }
        continue;
      }

      let replyContent = responsePayload.content;
      if (toolsExecuted.length > 0 && (!replyContent || replyContent.includes("AI Coach is currently unavailable"))) {
        replyContent = toolsExecuted
          .map((t) => t.result?.message || `Processed ${t.toolName}! ✨`)
          .filter(Boolean)
          .join("\n\n");
      }

      // Final assistant response generated
      return {
        reply: replyContent || "I'm ready to help with your nutrition and fitness goals.",
        modelUsed: selectedModel,
        proposedGoal,
        toolsExecuted,
        tokensUsed: responsePayload.tokensUsed,
      };
    }

    let finalFallback = "Based on your latest Nutri-Track data, your targets and nutrition are ready for review.";
    if (toolsExecuted.length > 0) {
      finalFallback = toolsExecuted
        .map((t) => t.result?.message || `Processed ${t.toolName}! ✨`)
        .filter(Boolean)
        .join("\n\n");
    }

    return {
      reply: finalFallback,
      modelUsed: selectedModel,
      proposedGoal,
      toolsExecuted,
    };
  }

  /**
   * Automatically resolves endpoint URL, provider, and valid candidate models based on API Key signature
   */
  private static resolveProvider(key: string, configuredBaseUrl?: string, defaultModel?: string) {
    const trimmed = (key || "").trim();
    const customUrl = (configuredBaseUrl || "").trim().replace(/\/+$/, "");

    // 1. Groq Cloud API (Free, high-token capacity, ultra-fast endpoints)
    if (trimmed.startsWith("gsk_") || customUrl.includes("groq.com")) {
      return {
        baseUrl: customUrl || "https://api.groq.com/openai/v1",
        models: [
          "llama-3.3-70b-versatile",
          "llama-3.1-8b-instant",
          "mixtral-8x7b-32768",
          "gemma2-9b-it",
          "llama3-70b-8192",
          "llama3-8b-8192",
        ],
        providerName: "Groq",
      };
    }

    // 2. Google Gemini API (Free Flash models & Google AI Studio OpenAI endpoint)
    if (trimmed.startsWith("AIza") || trimmed.startsWith("AQ.") || customUrl.includes("googleapis.com")) {
      return {
        baseUrl: customUrl || "https://generativelanguage.googleapis.com/v1beta/openai",
        models: [
          "gemini-1.5-flash",
          "gemini-2.0-flash",
          "gemini-1.5-flash-8b",
          "gemini-1.5-pro",
          "gemini-2.5-flash",
          "gemini-flash-latest",
        ],
        providerName: "Google Gemini",
      };
    }

    // 3. OpenRouter API
    if (trimmed.startsWith("sk-or-") || customUrl.includes("openrouter.ai")) {
      return {
        baseUrl: customUrl || "https://openrouter.ai/api/v1",
        models: [
          "openai/gpt-4o-mini",
          "google/gemini-flash-1.5",
          "meta-llama/llama-3.3-70b-instruct",
          "deepseek/deepseek-chat",
        ],
        providerName: "OpenRouter",
      };
    }

    // 4. OpenAI Default
    return {
      baseUrl: customUrl || "https://api.openai.com/v1",
      models: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"],
      providerName: "OpenAI",
    };
  }

  /**
   * Executes HTTP request with multi-key and multi-provider fallback, cooldown auto-recovery, and mock mode support
   */
  public static async executeWithFallback(
    messages: ChatCompletionMessage[],
    model: string,
    allowTools: boolean
  ): Promise<{ content: string; tool_calls?: any[]; tokensUsed?: number }> {
    const maxRetries = 2;

    // Sync custom keys from database system settings if present
    await keyManager.syncWithDatabase();

    const configuredBaseUrl = await SystemSettingsService.getSetting("AI_BASE_URL", AI_MODEL_CONFIG.baseUrl);
    const configuredKeys = keyManager.getAllConfiguredKeys();

    if (configuredKeys.length === 0) {
      return this.generateMockResponse(messages);
    }

    // Try all configured keys in priority order (Key 1 -> Key 2 -> Key 3)
    for (const keyInfo of configuredKeys) {
      const safeKey = keyInfo.key;

      // Mock mode support for testing
      if (safeKey.startsWith("mock_key_")) {
        return this.generateMockResponse(messages);
      }

      const provider = this.resolveProvider(safeKey, configuredBaseUrl, model);
      let keyFailed = false;

      // Candidate models list: start with model (if provided and valid), then provider standard models
      const candidateModels = Array.from(
        new Set([model, ...provider.models])
      ).filter((m): m is string => Boolean(m && typeof m === "string" && m.trim().length > 0));

      for (const currentModel of candidateModels) {
        if (keyFailed) break;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            const payloadMessages = provider.providerName === "Groq"
              ? messages.map((m) => ({
                  ...m,
                  content: Array.isArray(m.content)
                    ? m.content.map((c) => c.text || "").filter(Boolean).join(" ") || "User shared a photo of their meal."
                    : m.content,
                }))
              : messages;

            const bodyPayload: any = {
              model: currentModel,
              messages: payloadMessages,
              temperature: AI_MODEL_CONFIG.temperature,
              max_tokens: AI_MODEL_CONFIG.maxOutputTokens,
            };

            if (allowTools) {
              bodyPayload.tools = AI_COACH_TOOLS;
              bodyPayload.tool_choice = "auto";
            }

            const res = await fetch(`${provider.baseUrl}/chat/completions`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${safeKey}`,
              },
              body: JSON.stringify(bodyPayload),
              signal: AbortSignal.timeout(12000),
            });

            if (res.status === 429) {
              console.warn(`[AIClient] Key ${keyInfo.label} (${provider.providerName}) rate limited (429). Failing over to next standby key...`);
              keyManager.recordRateLimit(keyInfo.index, 3000);
              keyFailed = true;
              break;
            }

            if (res.status === 401 || res.status === 402 || res.status === 403) {
              console.warn(`[AIClient] Key ${keyInfo.label} auth/quota error (${res.status}). Failing over to next key...`);
              keyManager.recordExhaustion(keyInfo.index);
              keyFailed = true;
              break;
            }

            if (res.status === 400 && allowTools) {
              // Some providers reject 'tools' or specific parameter structures — retry without tools immediately
              console.warn(`[AIClient] Model '${currentModel}' on ${provider.providerName} returned 400 with tools. Retrying without tools...`);
              const retryBody = { ...bodyPayload };
              delete retryBody.tools;
              delete retryBody.tool_choice;

              const retryRes = await fetch(`${provider.baseUrl}/chat/completions`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${safeKey}`,
                },
                body: JSON.stringify(retryBody),
                signal: AbortSignal.timeout(12000),
              });

              if (retryRes.ok) {
                const data = await retryRes.json();
                keyManager.recordSuccess(keyInfo.index);
                const choice = data.choices?.[0]?.message;
                return {
                  content: choice?.content || "",
                  tokensUsed: data.usage?.total_tokens || 0,
                };
              }
            }

            if (res.status === 503 || res.status === 502 || res.status === 500 || res.status === 400 || res.status === 404) {
              const errText = await res.text().catch(() => "");
              console.warn(`[AIClient] Model '${currentModel}' on ${provider.providerName} returned ${res.status} (${errText.substring(0, 80)}). Trying next candidate...`);
              break;
            }

            if (!res.ok) {
              const errText = await res.text().catch(() => "");
              console.error(`[AIClient] Error from ${provider.providerName} on ${currentModel}:`, res.status, errText);
              break;
            }

            const data = await res.json();
            keyManager.recordSuccess(keyInfo.index);

            const choice = data.choices?.[0]?.message;
            return {
              content: choice?.content || "",
              tool_calls: choice?.tool_calls,
              tokensUsed: data.usage?.total_tokens || 0,
            };
          } catch (fetchErr: any) {
            console.error(`[AIClient] Network error on ${currentModel}:`, fetchErr.message);
            break;
          }
        }
      }
    }

    return this.generateMockResponse(messages);
  }

  /**
   * Deterministic local mock response generator for tests & offline environments
   */
  private static generateMockResponse(messages: ChatCompletionMessage[]): { content: string; tool_calls?: any[] } {
    const rawUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content;
    const lastUserMsg = typeof rawUserMsg === "string" ? rawUserMsg : Array.isArray(rawUserMsg) ? (rawUserMsg.find((p) => p.type === "text")?.text || "") : "";
    const lower = lastUserMsg.toLowerCase();

    // Check if answering after tool response
    const lastToolMsg = messages[messages.length - 1];
    if (lastToolMsg?.role === "tool") {
      let parsedTool: any = {};
      try {
        const toolContentStr = typeof lastToolMsg.content === "string" ? lastToolMsg.content : "{}";
        parsedTool = JSON.parse(toolContentStr || "{}");
      } catch {}

      if (lastToolMsg.name === "propose_goal_update") {
        return {
          content: `I recommend adjusting your target based on your training load. Would you like to confirm this goal change?`,
        };
      }

      if (lastToolMsg.name === "estimate_exercise_calories") {
        return {
          content: `Based on your weight, this exercise is estimated to burn ${parsedTool.formattedRange}. Please note that this is an ESTIMATE.`,
        };
      }

      if (lastToolMsg.name === "get_today_nutrition") {
        if (!parsedTool.hasLoggedMeals) {
          return {
            content: `You haven't logged any nutrition yet today, so your intake is currently at 0g towards your ${parsedTool.targets.protein}g protein target.`,
          };
        }
        return {
          content: `You have logged ${parsedTool.totals.protein}g of protein today. You have approximately ${parsedTool.remaining.protein}g remaining to reach your ${parsedTool.targets.protein}g target.`,
        };
      }
    }

    // Intelligent dietary & metabolic advice generators
    if (lower.includes("how to burn calorie") || lower.includes("burn calories") || lower.includes("fat loss") || lower.includes("lose weight")) {
      return {
        content: `Here is the optimal evidence-based strategy to maximize calorie burning and metabolic health! 🔥🏃‍♂️

• 🏃‍♂️ **Zone 2 Aerobic Running & Cardio**:
  - Sustained moderate-intensity running (60–70% max heart rate) optimizes mitochondrial density and maximizes fat oxidation per minute! ⚡
• 🏋️‍♂️ **Resistance & Strength Training**:
  - Builds metabolically active lean muscle tissue, permanently raising your Basal Metabolic Rate (BMR) even at rest! 💪
• 🚶‍♂️ **High NEAT (Non-Exercise Activity)**:
  - Hitting 8,000–10,000 daily steps burns 300–450 kcal passively without placing excessive fatigue on your nervous system. 👟
• 🌿 **Ayurvedic Agni (Digestive Fire) Synergy**:
  - Sip warm ginger-cumin tea before meals to stoke digestive metabolism and prevent sluggish lymphatic stagnation! 🫖✨`,
      };
    }

    if (lower.includes("chilla") || lower.includes("cheela")) {
      return {
        content: `🥞 **Chilla Nutrition Breakdown (1 Piece)** 🥗✨

• **Energy**: ~145–160 kcal
• **Protein**: 7.5g (Rich in plant-based amino acids) 💪
• **Carbohydrates**: 21g (Complex slow-digesting carbs) 🌾
• **Fat**: 4.5g (Healthy cooking fats) 🥑
• **Fiber & Micronutrients**: 3.2g dietary fiber, Iron, Magnesium, and Zinc! 🌿

*Pro Tip: Pair with mint-coriander chutney or 2 tbsp Greek yogurt for enhanced protein absorption and probiotic gut health!* 🥣✨`,
      };
    }

    if (lower.includes("estimate") || (lower.includes("calories") && lower.includes("run") && !lower.includes("how to"))) {
      return {
        content: "",
        tool_calls: [
          {
            id: "call_est_cal_1",
            type: "function",
            function: {
              name: "estimate_exercise_calories",
              arguments: JSON.stringify({ exerciseType: "RUNNING", durationMinutes: 45, intensity: "MODERATE" }),
            },
          },
        ],
      };
    }

    if (lower.includes("set my protein") || lower.includes("update protein goal") || lower.includes("change my protein")) {
      const match = lower.match(/\b(\d+)\s*g\b/);
      const targetVal = match ? parseInt(match[1]) : 160;
      return {
        content: "",
        tool_calls: [
          {
            id: "call_prop_goal_1",
            type: "function",
            function: {
              name: "propose_goal_update",
              arguments: JSON.stringify({
                targetKey: "protein",
                newValue: targetVal,
                reason: "Optimizing protein target for muscular recovery and training volume.",
              }),
            },
          },
        ],
      };
    }

    if (
      lower.includes("how much protein have i eaten") ||
      lower.includes("what did i eat today") ||
      lower.includes("my nutrition today") ||
      lower.includes("my macros today") ||
      lower.includes("today's nutrition") ||
      lower.includes("how many calories do i have remaining")
    ) {
      return {
        content: "",
        tool_calls: [
          {
            id: "call_get_nut_1",
            type: "function",
            function: {
              name: "get_today_nutrition",
              arguments: JSON.stringify({}),
            },
          },
        ],
      };
    }

    if (lower.includes("how much water") || lower.includes("hydration status") || lower.includes("my water today")) {
      return {
        content: "",
        tool_calls: [
          {
            id: "call_get_hyd_1",
            type: "function",
            function: {
              name: "get_hydration_status",
              arguments: JSON.stringify({}),
            },
          },
        ],
      };
    }

    return {
      content:
        "Hello! I am your Nutri-Track AI Coach. 🥗✨ I can help analyze your nutrition, log meals & recipes, track your macro progress, evaluate running pace trends, and optimize your workout goals. What would you like to focus on today?",
    };
  }
}
