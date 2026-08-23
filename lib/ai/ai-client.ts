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

      // Final assistant response generated
      return {
        reply: responsePayload.content || "I'm ready to help with your nutrition and fitness goals.",
        modelUsed: selectedModel,
        proposedGoal,
        toolsExecuted,
        tokensUsed: responsePayload.tokensUsed,
      };
    }

    return {
      reply: "Based on your latest Nutri-Track data, your targets and nutrition are ready for review.",
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
    if (trimmed.startsWith("gsk_")) {
      return {
        baseUrl: "https://api.groq.com/openai/v1",
        models: Array.from(new Set(["openai/gpt-oss-120b", "openai/gpt-oss-20b", "groq/compound-mini", defaultModel].filter(Boolean))),
        providerName: "Groq",
      };
    }

    // 2. Google Gemini API (Free Flash models)
    if (trimmed.startsWith("AIza") || trimmed.startsWith("AQ.") || customUrl.includes("googleapis.com")) {
      return {
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
        models: Array.from(new Set([
          "gemini-flash-latest",
          "gemini-3.1-flash-lite",
          "gemini-2.5-flash",
          "gemini-3.5-flash-lite",
          defaultModel,
        ].filter(Boolean))),
        providerName: "Google Gemini",
      };
    }

    // 3. OpenRouter API
    if (trimmed.startsWith("sk-or-") || customUrl.includes("openrouter.ai")) {
      return {
        baseUrl: "https://openrouter.ai/api/v1",
        models: Array.from(new Set([defaultModel || "openai/gpt-4o-mini", "openai/gpt-4o-mini", "google/gemini-2.5-flash", "meta-llama/llama-3.3-70b-instruct"].filter(Boolean))),
        providerName: "OpenRouter",
      };
    }

    // 4. OpenAI Default
    return {
      baseUrl: customUrl || "https://api.openai.com/v1",
      models: Array.from(new Set([defaultModel || "gpt-4o-mini", "gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"].filter(Boolean))),
      providerName: "OpenAI",
    };
  }

  /**
   * Executes HTTP request with multi-key and multi-provider fallback, cooldown auto-recovery, and mock mode support
   */
  private static async executeWithFallback(
    messages: ChatCompletionMessage[],
    model: string,
    allowTools: boolean
  ): Promise<{ content: string; tool_calls?: any[]; tokensUsed?: number }> {
    const maxRetries = 2;

    // Sync custom keys from database system settings if present
    await keyManager.syncWithDatabase();

    const configuredBaseUrl = await SystemSettingsService.getSetting("AI_BASE_URL", AI_MODEL_CONFIG.baseUrl);

    // Try all available keys in priority order
    for (let keyIdx = 0; keyIdx < 3; keyIdx++) {
      const activeKeyInfo = keyManager.getActiveKey();
      if (!activeKeyInfo) break;

      const safeKey = activeKeyInfo.key;

      // Mock mode support for testing
      if (safeKey.startsWith("mock_key_")) {
        return this.generateMockResponse(messages);
      }

      const provider = this.resolveProvider(safeKey, configuredBaseUrl, model);
      let keyExhausted = false;

      for (const currentModel of provider.models) {
        if (keyExhausted) break;

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
            });

            if (res.status === 429) {
              console.warn(`[AIClient] Rate limited on ${provider.providerName}. Failing over immediately to next standby key...`);
              keyManager.recordExhaustion(activeKeyInfo.index);
              keyExhausted = true;
              break;
            }

            if (res.status === 401 || res.status === 402 || res.status === 403) {
              console.warn(`[AIClient] Key ${activeKeyInfo.label} quota/auth error (${res.status}). Failing over to next key...`);
              keyManager.recordExhaustion(activeKeyInfo.index);
              keyExhausted = true;
              break;
            }

            // If model is temporarily overloaded (503/502/500/400/404), fail over to next model immediately
            if (res.status === 503 || res.status === 502 || res.status === 500 || res.status === 400 || res.status === 404) {
              const errText = await res.text().catch(() => "");
              console.warn(`[AIClient] Model '${currentModel}' temporary error (${res.status}: ${errText.substring(0, 100)}). Failing over to next model...`);
              break;
            }

            if (!res.ok) {
              const errText = await res.text().catch(() => "");
              console.error(`[AIClient] Error from ${provider.providerName} on ${currentModel}:`, res.status, errText);
              break;
            }

            const data = await res.json();
            keyManager.recordSuccess(activeKeyInfo.index);

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

    return {
      content:
        "🤖 AI Coach is currently unavailable at the moment. Please configure an active AI key in the Admin Settings (/admin/settings) or contact the administrator. In the meantime, you can log your meals, hydration, workouts, and runs directly on your Dashboard!",
    };
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

    // Mock tool calling triggers
    if (lower.includes("estimate") || (lower.includes("calories") && lower.includes("run"))) {
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

    if (lower.includes("protein") || lower.includes("calorie") || lower.includes("macro") || lower.includes("eat")) {
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

    if (lower.includes("water") || lower.includes("hydration") || lower.includes("drink")) {
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
        "Hello! I am your Nutri-Track AI Coach. I can help analyze your nutrition, track your macro progress, evaluate running pace trends, and optimize your workout goals. What would you like to focus on today?",
    };
  }
}
