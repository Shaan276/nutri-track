import { keyManager } from "./key-manager";
import { AI_MODEL_CONFIG, AI_COACH_SYSTEM_PROMPT, AI_COACH_TOOLS } from "./model-config";
import { AIToolRegistry, ToolExecutionContext, GoalProposalPayload } from "./tool-registry";

export interface ChatCompletionMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
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
   * Executes a resilient chat completion with automatic 3-key fallback and tool loop
   */
  public static async generateCoachResponse(
    userContextPrompt: string,
    historyMessages: Array<{ role: string; content: string }>,
    latestUserMessage: string,
    context: ToolExecutionContext,
    options: { modelOverride?: string; allowTools?: boolean } = {}
  ): Promise<AICoachResponse> {
    const selectedModel = options.modelOverride || AI_MODEL_CONFIG.defaultModel;
    const allowTools = options.allowTools !== false;
    const toolsExecuted: Array<{ toolName: string; args: any; result: any }> = [];
    let proposedGoal: GoalProposalPayload | null = null;

    // Assemble messages payload
    const messages: ChatCompletionMessage[] = [
      { role: "system", content: `${AI_COACH_SYSTEM_PROMPT}\n${userContextPrompt}` },
      ...historyMessages.map((m) => ({
        role: m.role as any,
        content: m.content,
      })),
      { role: "user", content: latestUserMessage },
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
        // Continue loop to allow model to synthesize final answer from tool results
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
   * Executes HTTP request with 3-key fallback, cooldown handling, and mock mode support
   */
  private static async executeWithFallback(
    messages: ChatCompletionMessage[],
    model: string,
    allowTools: boolean
  ): Promise<{ content: string; tool_calls?: any[]; tokensUsed?: number }> {
    const maxRetries = 3;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const activeKeyInfo = keyManager.getActiveKey();

      if (!activeKeyInfo) {
        // All developer keys exhausted or unavailable
        return {
          content:
            "The AI Coach service is temporarily operating at peak capacity across all API developer keys. Please try again in a few moments or log your metrics directly in your journal.",
        };
      }

      // Check if we are in mock mode (used for local testing / test suites)
      if (activeKeyInfo.key.startsWith("mock_key_")) {
        return this.generateMockResponse(messages);
      }

      try {
        const bodyPayload: any = {
          model,
          messages,
          temperature: AI_MODEL_CONFIG.temperature,
          max_tokens: AI_MODEL_CONFIG.maxOutputTokens,
        };

        if (allowTools) {
          bodyPayload.tools = AI_COACH_TOOLS;
          bodyPayload.tool_choice = "auto";
        }

        const res = await fetch(`${AI_MODEL_CONFIG.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${activeKeyInfo.key}`,
          },
          body: JSON.stringify(bodyPayload),
        });

        if (res.status === 429) {
          console.warn(`[AIClient] Key ${activeKeyInfo.label} rate limited (HTTP 429). Rotating to standby key...`);
          keyManager.recordRateLimit(activeKeyInfo.index);
          continue; // Retry with next key in priority
        }

        if (res.status === 401 || res.status === 402 || res.status === 403) {
          console.warn(`[AIClient] Key ${activeKeyInfo.label} quota/auth error (${res.status}). Marking unavailable...`);
          keyManager.recordExhaustion(activeKeyInfo.index);
          continue; // Retry with next key in priority
        }

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          console.error(`[AIClient] Error from ${activeKeyInfo.label}:`, res.status, errText);
          keyManager.recordRateLimit(activeKeyInfo.index, 30000); // 30s brief cooldown
          continue;
        }

        const data = await res.json();
        keyManager.recordSuccess(activeKeyInfo.index);

        const choice = data.choices?.[0]?.message;
        return {
          content: choice?.content || "",
          tool_calls: choice?.tool_calls,
          tokensUsed: data.usage?.total_tokens,
        };
      } catch (err: any) {
        console.error(`[AIClient] Network exception on key ${activeKeyInfo.label}:`, err.message);
        keyManager.recordRateLimit(activeKeyInfo.index, 30000);
      }
    }

    return {
      content:
        "The AI Coach is currently unavailable. Please verify your internet connection or try again in a few moments.",
    };
  }

  /**
   * Deterministic local mock response generator for tests & offline environments
   */
  private static generateMockResponse(messages: ChatCompletionMessage[]): { content: string; tool_calls?: any[] } {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const systemPrompt = messages.find((m) => m.role === "system")?.content || "";
    const lower = lastUserMsg.toLowerCase();

    // Check if answering after tool response
    const lastToolMsg = messages[messages.length - 1];
    if (lastToolMsg?.role === "tool") {
      let parsedTool: any = {};
      try {
        parsedTool = JSON.parse(lastToolMsg.content || "{}");
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
