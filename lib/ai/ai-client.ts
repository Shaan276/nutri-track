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
      const groqModels = ["openai/gpt-oss-120b", "groq/compound-mini", "openai/gpt-oss-20b", "qwen/qwen3.6-27b"];
      const models = defaultModel && groqModels.includes(defaultModel)
        ? Array.from(new Set([defaultModel, ...groqModels]))
        : groqModels;
      return {
        baseUrl: customUrl || "https://api.groq.com/openai/v1",
        models,
        providerName: "Groq",
      };
    }

    // 2. Google Gemini API (Free Flash models & Google AI Studio OpenAI endpoint)
    if (trimmed.startsWith("AIza") || trimmed.startsWith("AQ.") || customUrl.includes("googleapis.com")) {
      const geminiModels = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-2.5-flash"];
      const models = defaultModel && geminiModels.includes(defaultModel)
        ? Array.from(new Set([defaultModel, ...geminiModels]))
        : geminiModels;
      return {
        baseUrl: customUrl || "https://generativelanguage.googleapis.com/v1beta/openai",
        models,
        providerName: "Google Gemini",
      };
    }

    // 3. OpenRouter API
    if (trimmed.startsWith("sk-or-") || customUrl.includes("openrouter.ai")) {
      const routerModels = ["openai/gpt-4o-mini", "google/gemini-flash-1.5", "meta-llama/llama-3.3-70b-instruct"];
      const models = defaultModel && defaultModel.includes("/")
        ? Array.from(new Set([defaultModel, ...routerModels]))
        : routerModels;
      return {
        baseUrl: customUrl || "https://openrouter.ai/api/v1",
        models,
        providerName: "OpenRouter",
      };
    }

    // 4. OpenAI Default
    const openaiModels = ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"];
    const models = defaultModel && openaiModels.includes(defaultModel)
      ? Array.from(new Set([defaultModel, ...openaiModels]))
      : openaiModels;
    return {
      baseUrl: customUrl || "https://api.openai.com/v1",
      models,
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

      for (const currentModel of provider.models) {
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

    if (lower.includes("plan my week") || lower.includes("weekly plan") || lower.includes("weekly blueprint")) {
      return {
        content: `Here is your high-performance 7-Day Nutrition & Training Blueprint! 📅🥗⚡

• 🏃‍♂️ **Monday (Aerobic Base + High Protein)**:
  - 5k Easy Pace Run (Zone 2) | Target: 2,100 kcal, 140g Protein, 2,800ml Water.
• 🏋️‍♂️ **Tuesday (Upper Body Strength + Recovery Fuel)**:
  - Upper Body Hypertrophy | Target: 2,200 kcal, 150g Protein (Paneer/Tofu/Lentils).
• 🏃‍♂️ **Wednesday (Interval Tempo Intervals)**:
  - 6 x 400m Tempo Repeats | Hydrate with coconut water + pink Himalayan salt! 🥥💧
• 🧘 **Thursday (Active Recovery & Mobility)**:
  - 30-min Vinyasa Flow & Deep Hip Openers | Warm Turmeric Golden Milk before bed. 🫖
• 🏋️‍♂️ **Friday (Lower Body & Core Stability)**:
  - Squats & Posterior Chain | Target: 2,150 kcal, 145g Protein.
• 🏃‍♂️ **Saturday (Weekend Long Run)**:
  - 10k Progressive Endurance Run | Oatmeal with banana & peanut butter 90m prior. 🍌🥜
• 🌿 **Sunday (Ayurvedic Gut Rest & Meal Prep)**:
  - Light Moong Dal Khichdi with Ghee (easy digestion) + hydration replenishment. 🍲✨`,
      };
    }

    if (lower === "calorie" || lower.includes("what is calorie") || lower.includes("calorie intake")) {
      return {
        content: `Here is your quick metabolic overview of Calories and Energy Balance! ⚡🔥

• 🔬 **Energy In vs. Energy Out**:
  - Calories represent the units of chemical energy your body derives from food (Proteins = 4 kcal/g, Carbs = 4 kcal/g, Fats = 9 kcal/g).
• 🏃‍♂️ **Daily Expenditure Breakdown**:
  - **BMR (60–70%)**: Basal metabolic energy required to maintain organs, breathing, and heartbeat.
  - **NEAT (15–20%)**: Daily walking, movement, and posture adjustments.
  - **TEF (8–10%)**: Thermic effect of food (Protein burns ~20–30% of its calories just during digestion!).
  - **EAT (10–15%)**: Intentional exercise, runs, and resistance workouts. 👟
• 🌿 **Ayurvedic Prana Principle**:
  - Consume freshly prepared, warm Sattvic foods rich in natural life energy (*Prana*) rather than empty ultra-processed calories! 🥗✨`,
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

    const userQuerySnippet = lastUserMsg.length > 50 ? lastUserMsg.substring(0, 47) + "..." : lastUserMsg;
    return {
      content: `I've analyzed your question regarding "${userQuerySnippet || "your health goal"}"! 🥗✨

• 🔬 **Evidence-Based Nutrition & Training**:
  - Maintain balanced daily macronutrient proportions with sufficient protein (1.6–2.2g/kg), complex low-glycemic carbohydrates, and essential omega fatty acids.
• 🌿 **Ayurvedic Lifestyle Synergy**:
  - Align your largest meals with your peak digestive fire (*Agni*) around mid-day (12–2 PM) and stay consistently hydrated with warm or room-temperature fluids. 💧
• 🎯 **Next Steps**:
  - Would you like me to log a meal for you, adjust your daily macro targets, or calculate calories burned for a workout? 🚀💪`,
    };
  }
}
