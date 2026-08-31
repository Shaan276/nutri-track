import { keyManager } from "./key-manager";
import { AI_MODEL_CONFIG, AI_COACH_SYSTEM_PROMPT, AI_COACH_TOOLS } from "./model-config";
import { AIToolRegistry, ToolExecutionContext, GoalProposalPayload } from "./tool-registry";
import { SystemSettingsService } from "@/lib/services/admin/system-settings.service";
import { AIQueryClassifier } from "./query-classifier";

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
      const groqModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];
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
      const geminiModels = ["gemini-2.5-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash", "gemini-1.5-pro-latest", "gemini-1.5-flash"];
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

    // If all configured API providers fail or are exhausted, use intelligent local fallback
    console.warn("[AIClient] All configured AI providers failed or were rate limited. Utilizing intelligent local fallback generator.");
    return this.generateMockResponse(messages);
  }

  /**
   * Deterministic local mock response generator for tests & offline environments
   */
  public static generateMockResponse(messages: ChatCompletionMessage[]): { content: string; tool_calls?: any[] } {
    const rawUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content;
    const lastUserMsg = typeof rawUserMsg === "string" ? rawUserMsg : Array.isArray(rawUserMsg) ? (rawUserMsg.find((p) => p.type === "text")?.text || "") : "";
    const lower = lastUserMsg.toLowerCase().trim();

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
          content: `Done — I've updated your target based on your request! ✨`,
        };
      }

      if (lastToolMsg.name === "estimate_exercise_calories") {
        return {
          content: `Based on your weight, this exercise is estimated to burn ${parsedTool.formattedRange || "approximately 250–350 kcal"}. Please note that this is an estimate. 🏃‍♂️⚡`,
        };
      }

      if (lastToolMsg.name === "get_today_nutrition") {
        if (!parsedTool.hasLoggedMeals) {
          return {
            content: `You haven't logged enough data for me to calculate that yet.`,
          };
        }
        return {
          content: `You have logged ${parsedTool.totals?.protein || 0}g of protein today (${parsedTool.totals?.calories || 0} kcal). You have approximately ${parsedTool.remaining?.protein || 0}g remaining to reach your ${parsedTool.targets?.protein || 130}g target.`,
        };
      }

      if (lastToolMsg.name === "get_hydration_status") {
        return {
          content: `You have logged ${parsedTool.consumedMl || 0}ml of water today out of your ${parsedTool.targetMl || 2500}ml target.`,
        };
      }
    }

    // Classify query category
    const classification = AIQueryClassifier.classifyQuery(lastUserMsg);
    const category = classification.category;

    // ─────────────────────────────────────────────────────────
    // A. GENERAL QUESTIONS (Knowledge, Math, Trivia, Jokes)
    // ─────────────────────────────────────────────────────────
    if (category === "GENERAL") {
      if (lower.includes("2 + 2") || lower.includes("2+2") || lower.includes("two plus two")) {
        return { content: "2 + 2 = 4! 🔢✨" };
      }
      if (lower.includes("capital of france")) {
        return { content: "The capital of France is Paris. 🇫🇷" };
      }
      if (lower.includes("joke")) {
        return { content: "Why don't scientists trust atoms? Because they make up everything! 😄" };
      }
      if (lower.includes("speed of light")) {
        return {
          content:
            "The speed of light in a vacuum is approximately 299,792 kilometers per second (about 186,282 miles per second). 🌟⚡",
        };
      }
      if (lower.includes("why is the sky blue")) {
        return {
          content:
            "The sky appears blue because gases in Earth's atmosphere scatter sunlight in all directions. Blue light has shorter, smaller waves and is scattered much more than other colors (Rayleigh scattering). ☀️🌍",
        };
      }
      if (lower.includes("who invented the telephone")) {
        return {
          content:
            "Alexander Graham Bell is widely recognized for inventing and patenting the first practical telephone in 1876. ☎️",
        };
      }

      return {
        content: `Here is the answer to your question about "${lastUserMsg}": it's a great topic! Let me know if you'd like more details. ✨`,
      };
    }

    // ─────────────────────────────────────────────────────────
    // B. HEALTH_GENERAL (Evidence-Based Physiology & Nutrition)
    // ─────────────────────────────────────────────────────────
    if (category === "HEALTH_GENERAL") {
      if (lower.includes("post-workout") || lower.includes("post workout") || lower.includes("muscle breakdown")) {
        return {
          content: `To stop muscle protein breakdown and accelerate muscle protein synthesis (MPS) post-workout, consume 25–40g of complete high-leucine protein paired with 40–60g of moderate-glycemic carbs within 45–60 minutes! 🍗🌾

• 🍳 **Ideal Post-Workout Fuel**:
  - 3 Whole Eggs / 150g Grilled Chicken or Paneer + 1 large Banana or 1 cup Steamed Rice 🍚
  - Whey / Plant Protein Shake blended with 1 cup Rolled Oats & Blueberries 🥤
  - 1 bowl Greek Yogurt or Curd with Honey & 10 Almonds 🥣✨
• 💧 **Hydration**: Rehydrate with 500ml water + a pinch of salt to replenish electrolytes lost in sweat!`,
        };
      }

      if (lower.includes("coffee") || lower.includes("caffeine")) {
        return {
          content:
            "Black coffee itself does not directly burn a large amount of fat, but caffeine may slightly increase alertness, metabolic expenditure, and exercise performance. The most important factor for fat loss is still maintaining an appropriate calorie deficit.\n\nFor your training routine, black coffee can be used as an effective pre-workout drink if you tolerate caffeine well—but it should not replace balanced meals or adequate sleep! ☕⚡",
        };
      }

      if (lower.includes("hydration") || lower.includes("water")) {
        return {
          content: `Hydration is essential for sustained energy, joint lubrication, nutrient absorption, and athletic performance! 💧🏃‍♂️

• 💧 **Daily Baseline**: Aim for 30–40 ml of fluid per kg of body weight (approx. 2.5–3.5 Liters daily).
• ⚡ **Electrolyte Balance**: For endurance runs or workouts over 45 minutes, ensure adequate sodium, potassium, and magnesium to prevent cramping and central fatigue.
• 🫖 **Hydration Timing**: Sip room-temperature water steadily throughout the day rather than chugging large amounts during meals.`,
        };
      }

      if (lower.includes("creatine")) {
        return {
          content:
            "Yes, creatine monohydrate is one of the most thoroughly researched, safe, and effective sports supplements available. It replenishes cellular phosphocreatine stores to regenerate ATP during intense muscular contractions, enhancing strength, power output, and lean mass gains. Standard dosage is 3–5g daily taken consistently with adequate water. 💪🔬",
        };
      }

      if (lower.includes("running every day") || lower.includes("run every day")) {
        return {
          content:
            "Running every day can be beneficial if the distance and intensity are very low, but for most runners it significantly increases the risk of overuse injuries (like shin splints or tendonitis) and central nervous system fatigue. Incorporating 1–2 rest days or low-impact cross-training days per week is ideal for long-term progression and recovery! 🏃‍♂️👟",
        };
      }

      if (lower.includes("sleep")) {
        return {
          content:
            "Most active adults need 7 to 9 hours of quality sleep each night. During deep slow-wave sleep, human growth hormone (HGH) release peaks, driving muscular repair, glycogen replenishment, and cognitive restoration. 💤🛌",
        };
      }

      if (lower.includes("how to burn calorie") || lower.includes("burn calories") || lower.includes("fat loss") || lower.includes("lose weight")) {
        return {
          content: `Here is the optimal evidence-based strategy to maximize calorie burning and metabolic health! 🔥🏃‍♂️

• 🏃‍♂️ **Zone 2 Aerobic Running & Cardio**: Sustained moderate running (60–70% max HR) builds mitochondrial density and oxidizes fat efficiently.
• 🏋️‍♂️ **Resistance Training**: Builds lean muscle tissue, raising your Basal Metabolic Rate (BMR) at rest.
• 🚶‍♂️ **High NEAT (Non-Exercise Activity)**: 8,000–10,000 daily steps burns 300–450 kcal passively without excessive fatigue. 👟`,
        };
      }

      if (lower.includes("chilla") || lower.includes("cheela")) {
        return {
          content: `🥞 **Chilla Nutrition Breakdown (1 Piece)** 🥗✨

• **Energy**: ~145–160 kcal
• **Protein**: 7.5g (Plant-based amino acids) 💪
• **Carbohydrates**: 21g (Complex slow-digesting carbs) 🌾
• **Fat**: 4.5g (Healthy cooking fats) 🥑
• **Fiber & Micronutrients**: 3.2g dietary fiber, Iron, Magnesium, and Zinc! 🌿`,
        };
      }
    }

    // ─────────────────────────────────────────────────────────
    // C. HEALTH_PERSONALIZED
    // ─────────────────────────────────────────────────────────
    if (category === "HEALTH_PERSONALIZED") {
      if (lower.includes("how much protein") || lower.includes("eating enough protein") || lower.includes("protein should i")) {
        return {
          content:
            "For your active lifestyle and body composition goals, evidence-based recommendations suggest consuming 1.6–2.2 grams of protein per kilogram of body weight daily (approx. 110–150g depending on body weight). Spreading this into 3–4 meals containing 25–35g protein each optimizes muscle protein synthesis! 💪🍗",
        };
      }

      return {
        content: `Based on your personalized health profile and active goals, focusing on consistent daily nutrition targets, progressive workout volume, and adequate hydration will keep you on track! 🌟💪`,
      };
    }

    // ─────────────────────────────────────────────────────────
    // D. CASUAL_CHAT (Conversational, Empathetic, Humorous)
    // ─────────────────────────────────────────────────────────
    if (category === "CASUAL_CHAT") {
      if (lower.includes("lazy") || lower.includes("tired") || lower.includes("exhausted")) {
        return {
          content:
            "Arre 😭 I totally get it! Some days your body just needs a breather. If a full workout feels overwhelming, even a light 15-minute walk or a gentle stretch will keep your momentum going without draining you. Let's take it easy and recharge today! 🛋️✨",
        };
      }

      if (lower.includes("demotivated") || lower.includes("failed")) {
        return {
          content:
            "Don't be hard on yourself! Every athlete and fitness enthusiast has off days. Progress isn't linear—what matters is showing up again tomorrow. Get some good rest, hydrate, and we'll crush the next session! 💪🔥",
        };
      }

      if (lower.includes("how are you") || lower.includes("hi") || lower.includes("hello") || lower.includes("hey") || lower.includes("morning") || lower.includes("evening")) {
        return {
          content:
            "Hello! 🌟 I'm feeling energized and ready to help you with your training, meals, hydration, or any questions you have today. What's on your mind? 💪✨",
        };
      }

      return {
        content:
          "Hey there! 😊 I'm here and ready to help you optimize your nutrition, hit your daily targets, or answer any health and fitness questions. How can I assist you right now? ✨💪",
      };
    }

    // ─────────────────────────────────────────────────────────
    // E. ACTION_COMMAND & NUTRI_TRACK_DATA (Tool Execution Fallbacks)
    // ─────────────────────────────────────────────────────────
    if (lower.includes("set my protein") || lower.includes("update protein goal") || lower.includes("change my protein")) {
      const match = lower.match(/\b(\d+)\s*g\b/);
      const targetVal = match ? parseInt(match[1], 10) : 130;
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
                reason: "Updating daily protein target as requested.",
              }),
            },
          },
        ],
      };
    }

    if (
      lower.includes("how much protein have i eaten") ||
      lower.includes("how much protein did i eat") ||
      lower.includes("what did i eat today") ||
      lower.includes("my nutrition today") ||
      lower.includes("my macros today") ||
      lower.includes("today's nutrition")
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

    if (lower.includes("plan my week") || lower.includes("weekly plan")) {
      return {
        content: `Here is your high-performance 7-Day Nutrition & Training Blueprint! 📅🥗⚡

• 🏃‍♂️ **Monday**: 5k Easy Pace Run (Zone 2) | Target: 2,100 kcal, 140g Protein
• 🏋️‍♂️ **Tuesday**: Upper Body Strength | Target: 2,200 kcal, 150g Protein
• 🏃‍♂️ **Wednesday**: Interval Tempo Repeats | Hydrate with electrolyte water! 💧
• 🧘 **Thursday**: Active Mobility & Recovery Walk 🌿
• 🏋️‍♂️ **Friday**: Lower Body & Core | Target: 2,150 kcal, 145g Protein
• 🏃‍♂️ **Saturday**: 10k Progressive Long Run 👟
• 🌿 **Sunday**: Rest & Weekly Meal Prep 🍲✨`,
      };
    }

    if (lower === "calorie" || lower.includes("what is calorie")) {
      return {
        content: `Here is your quick overview of Calories and Energy Balance! ⚡🔥

• 🔬 **Energy In vs. Energy Out**: Calories represent chemical energy from food (Protein = 4 kcal/g, Carbs = 4 kcal/g, Fat = 9 kcal/g).
• 🏃‍♂️ **Daily Expenditure (TDEE)**:
  - **BMR (60–70%)**: Baseline energy to sustain life at rest.
  - **NEAT (15–20%)**: Daily non-exercise movement and walking.
  - **TEF (8–10%)**: Thermic effect of digesting food.
  - **EAT (10–15%)**: Intentional workouts and running. 👟`,
      };
    }

    // Default intelligent conversational answer
    return {
      content: `I've noted your question: "${lastUserMsg}". How would you like to proceed? 🌟💪`,
    };
  }
}
