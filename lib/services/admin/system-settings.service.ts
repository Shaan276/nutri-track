import { prisma } from "@/lib/db";
import { SystemSettingCategory } from "@prisma/client";

export interface SystemSettingItem {
  key: string;
  value: string;
  category: SystemSettingCategory;
  description: string;
  isSecret: boolean;
  maskedValue?: string;
  updatedAt?: string;
}

export const SYSTEM_SETTING_DEFINITIONS: Record<
  string,
  { category: SystemSettingCategory; description: string; isSecret: boolean; defaultVal: string }
> = {
  // AI Settings
  OPENAI_API_KEY: {
    category: "AI",
    description: "Primary OpenAI API Key used for AI Coach reasoning, suggestions & weekly plans",
    isSecret: true,
    defaultVal: "",
  },
  OPENAI_API_KEY_FALLBACK_1: {
    category: "AI",
    description: "Secondary Backup OpenAI API Key for automated failover on rate limits (429)",
    isSecret: true,
    defaultVal: "",
  },
  OPENAI_API_KEY_FALLBACK_2: {
    category: "AI",
    description: "Tertiary Backup OpenAI API Key for maximum high-availability failover",
    isSecret: true,
    defaultVal: "",
  },
  AI_MODEL: {
    category: "AI",
    description: "Primary AI model identifier (e.g. gpt-4o-mini, gpt-4o, claude-3-5-sonnet)",
    isSecret: false,
    defaultVal: "gpt-4o-mini",
  },
  AI_REASONING_MODEL: {
    category: "AI",
    description: "Advanced model used for complex weekly planning and comprehensive deep audits",
    isSecret: false,
    defaultVal: "gpt-4o",
  },
  AI_BASE_URL: {
    category: "AI",
    description: "Custom OpenAI compatible API base endpoint URL",
    isSecret: false,
    defaultVal: "https://api.openai.com/v1",
  },
  GENERAL_AI_RULES: {
    category: "AI",
    description: "General AI Coaching Rules & Principles (Ayurveda first, modern science synergy, empathy, exact macros, hydration)",
    isSecret: false,
    defaultVal: `1. Short, Point-Wise & Maximum Emojis: Always keep answers concise, short, and structured in punchy bullet points (zero long paragraphs), using maximum lively and fun emojis (🥗, 🍗, 🏃‍♂️, ✨, 💪, 💧, 🌿, 🔬, ⚡, 🥑, 🥞, 🌟).
2. Ayurveda-First Priority: Always prioritize authentic Ayurvedic principles first (Ahara Rasas/6 tastes, Agni/digestive fire, Dosha balance: Vata/Pitta/Kapha, Viruddha Ahara/incompatible foods, and seasonal eating/Ritucharya), followed immediately by modern evidence-based sports & nutritional science.
3. Exact Nutritional Data: Always calculate and output specific calories, protein (g), carbs (g), fats (g), key minerals (Iron, Calcium, Potassium, Magnesium, Zinc), and vitamins in crisp bullet points with every meal recommendation or recipe log.
4. Holistic Recovery & Hydration: Integrate hydration balance, electrolyte replenishment, and active recovery routines.`,
  },

  // Integrations Settings
  STRAVA_CLIENT_ID: {
    category: "INTEGRATIONS",
    description: "Strava API Application Client ID for activity synchronization",
    isSecret: false,
    defaultVal: "",
  },
  STRAVA_CLIENT_SECRET: {
    category: "INTEGRATIONS",
    description: "Strava API Application Client Secret for OAuth token exchanges",
    isSecret: true,
    defaultVal: "",
  },
  GOOGLE_CLIENT_ID: {
    category: "INTEGRATIONS",
    description: "Google Cloud Console OAuth 2.0 Web Client ID",
    isSecret: false,
    defaultVal: "",
  },
  GOOGLE_CLIENT_SECRET: {
    category: "INTEGRATIONS",
    description: "Google Cloud Console OAuth 2.0 Client Secret",
    isSecret: true,
    defaultVal: "",
  },
  NEXT_PUBLIC_GOOGLE_SHEETS_TEMPLATE_URL: {
    category: "INTEGRATIONS",
    description: "Public Master Google Sheets spreadsheet template link for nutrition logs",
    isSecret: false,
    defaultVal:
      "https://docs.google.com/spreadsheets/d/19EFB0ufPY8YHNbLp0PTwrJuFJJVz_6lz-ofau3TSxsY/edit?gid=0#gid=0",
  },

  // Security & Registration Settings
  REGISTRATION_AUTO_APPROVE: {
    category: "SECURITY",
    description: "Automatically grant APPROVED status to all newly registered users without admin gate",
    isSecret: false,
    defaultVal: "false",
  },
  SYSTEM_ANNOUNCEMENT: {
    category: "GENERAL",
    description: "Global announcement banner broadcasted across all user dashboards (leave blank to disable)",
    isSecret: false,
    defaultVal: "",
  },
  MAINTENANCE_MODE: {
    category: "GENERAL",
    description: "Display maintenance warning banner to users",
    isSecret: false,
    defaultVal: "false",
  },
};

export class SystemSettingsService {
  private static cache: Record<string, { value: string; timestamp: number }> = {};
  private static CACHE_TTL_MS = 30000; // 30 seconds

  /**
   * Retrieves a single system setting value dynamically.
   * Priority: Database SystemSetting -> process.env -> Default Definition.
   */
  static async getSetting(key: string, fallback?: string): Promise<string> {
    const cached = this.cache[key];
    const now = Date.now();
    if (cached && now - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.value;
    }

    const pool = prisma as any;
    const delegate = pool.systemSettings || pool.systemSetting;
    try {
      if (delegate && typeof delegate.findUnique === "function") {
        const record = await delegate.findUnique({ where: { key } });
        if (record && record.value !== undefined && record.value !== null && record.value !== "") {
          this.cache[key] = { value: record.value, timestamp: now };
          return record.value;
        }
      }
    } catch {
      // Fallback gracefully on query error
    }

    // Check environment variable
    if (process.env[key] !== undefined && process.env[key] !== "") {
      const val = process.env[key]!;
      this.cache[key] = { value: val, timestamp: now };
      return val;
    }

    // Default fallback definition
    const def = SYSTEM_SETTING_DEFINITIONS[key];
    const finalVal = fallback !== undefined ? fallback : def ? def.defaultVal : "";
    this.cache[key] = { value: finalVal, timestamp: now };
    return finalVal;
  }

  /**
   * Retrieves all system settings for the Admin Management Panel with masked secrets.
   */
  static async getAllSettingsForAdmin(): Promise<SystemSettingItem[]> {
    const pool = prisma as any;
    const delegate = pool.systemSettings || pool.systemSetting;
    const dbRecords = delegate && typeof delegate.findMany === "function" ? await delegate.findMany() : [];
    const dbMap = new Map<string, any>(dbRecords.map((r: any) => [r.key, r]));

    const results: SystemSettingItem[] = [];

    for (const [key, def] of Object.entries(SYSTEM_SETTING_DEFINITIONS)) {
      const dbRec = dbMap.get(key);
      const rawVal =
        dbRec && dbRec.value !== ""
          ? dbRec.value
          : process.env[key] !== undefined && process.env[key] !== ""
          ? process.env[key]!
          : def.defaultVal;

      let maskedValue = rawVal;
      if (def.isSecret && rawVal) {
        if (rawVal.length > 8) {
          maskedValue = `${rawVal.substring(0, 4)}••••••••${rawVal.substring(rawVal.length - 4)}`;
        } else {
          maskedValue = "••••••••";
        }
      }

      results.push({
        key,
        value: rawVal,
        category: def.category,
        description: def.description,
        isSecret: def.isSecret,
        maskedValue,
        updatedAt: dbRec?.updatedAt ? new Date(dbRec.updatedAt).toISOString() : undefined,
      });
    }

    return results;
  }

  /**
   * Updates or creates a system setting in the database and flushes local cache.
   */
  static async updateSetting(key: string, value: string, adminUserId: string) {
    const pool = prisma as any;
    const delegate = pool.systemSettings || pool.systemSetting;
    const def = SYSTEM_SETTING_DEFINITIONS[key];
    const category = def ? def.category : "GENERAL";
    const isSecret = def ? def.isSecret : false;
    const description = def ? def.description : null;

    const updated = await delegate.upsert({
      where: { key },
      create: {
        key,
        value,
        category,
        description,
        isSecret,
        updatedByAdminId: adminUserId,
      },
      update: {
        value,
        updatedByAdminId: adminUserId,
      },
    });

    // Invalidate cache
    delete this.cache[key];
    return updated;
  }

  /**
   * Batch updates a collection of system settings.
   */
  static async batchUpdateSettings(
    settings: Array<{ key: string; value: string }>,
    adminUserId: string
  ) {
    const results = [];
    for (const item of settings) {
      if (item.value.includes("••••••••")) {
        // Value wasn't edited by admin, skip updating secret with masked placeholder
        continue;
      }
      const updated = await this.updateSetting(item.key, item.value, adminUserId);
      results.push(updated);
    }
    return results;
  }

  /**
   * Clears the in-memory cache
   */
  static clearCache(): void {
    this.cache = {};
  }

  /**
   * Tests AI Key connectivity with multi-provider detection (Gemini, Groq, OpenRouter, OpenAI) and automatic standby fallback testing.
   */
  static async testAIConnection(
    apiKey?: string,
    model?: string,
    baseUrl?: string,
    fallbackKey1?: string,
    fallbackKey2?: string
  ): Promise<{ success: boolean; latencyMs?: number; message: string; model?: string; provider?: string }> {
    const keysToTry: Array<{ key: string; label: string; isPrimary: boolean }> = [];

    const primaryKey = (apiKey && apiKey.trim()) || (await this.getSetting("OPENAI_API_KEY")) || process.env.OPENAI_API_KEY;
    if (primaryKey && primaryKey.trim()) {
      keysToTry.push({ key: primaryKey.trim(), label: "Primary Key", isPrimary: true });
    }

    const fb1 = (fallbackKey1 && fallbackKey1.trim()) || (await this.getSetting("OPENAI_API_KEY_FALLBACK_1"));
    if (fb1 && fb1.trim() && !keysToTry.some(k => k.key === fb1.trim())) {
      keysToTry.push({ key: fb1.trim(), label: "Standby Fallback #1", isPrimary: false });
    }

    const fb2 = (fallbackKey2 && fallbackKey2.trim()) || (await this.getSetting("OPENAI_API_KEY_FALLBACK_2"));
    if (fb2 && fb2.trim() && !keysToTry.some(k => k.key === fb2.trim())) {
      keysToTry.push({ key: fb2.trim(), label: "Standby Fallback #2", isPrimary: false });
    }

    if (keysToTry.length === 0) {
      return {
        success: false,
        message: "No AI API key configured in Primary or Fallback settings.",
      };
    }

    const resolveProvider = (rawKey: string, customBaseUrl?: string, customModel?: string) => {
      const trimmed = rawKey.trim();
      if (trimmed.startsWith("gsk_") || (customBaseUrl && customBaseUrl.includes("groq.com"))) {
        const groqModels = ["openai/gpt-oss-120b", "groq/compound-mini", "openai/gpt-oss-20b", "qwen/qwen3.6-27b"];
        const models = customModel && groqModels.includes(customModel)
          ? Array.from(new Set([customModel, ...groqModels]))
          : groqModels;
        return {
          providerName: "Groq Cloud",
          endpoint: `${(customBaseUrl && customBaseUrl.includes("groq.com") ? customBaseUrl : "https://api.groq.com/openai/v1").replace(/\/+$/, "")}/chat/completions`,
          models,
        };
      }
      if (trimmed.startsWith("AIza") || trimmed.startsWith("AQ.") || (customBaseUrl && customBaseUrl.includes("googleapis.com"))) {
        const geminiModels = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro", "gemini-2.5-flash"];
        const models = customModel && geminiModels.includes(customModel)
          ? Array.from(new Set([customModel, ...geminiModels]))
          : geminiModels;
        return {
          providerName: "Google Gemini",
          endpoint: `${(customBaseUrl && customBaseUrl.includes("googleapis.com") ? customBaseUrl : "https://generativelanguage.googleapis.com/v1beta/openai").replace(/\/+$/, "")}/chat/completions`,
          models,
        };
      }
      if (trimmed.startsWith("sk-or-") || (customBaseUrl && customBaseUrl.includes("openrouter.ai"))) {
        const routerModels = ["openai/gpt-4o-mini", "google/gemini-flash-1.5", "meta-llama/llama-3.3-70b-instruct"];
        const models = customModel && customModel.includes("/")
          ? Array.from(new Set([customModel, ...routerModels]))
          : routerModels;
        return {
          providerName: "OpenRouter",
          endpoint: "https://openrouter.ai/api/v1/chat/completions",
          models,
        };
      }
      const openaiModels = ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"];
      const models = customModel && openaiModels.includes(customModel)
        ? Array.from(new Set([customModel, ...openaiModels]))
        : openaiModels;
      return {
        providerName: "OpenAI",
        endpoint: `${(customBaseUrl || "https://api.openai.com/v1").replace(/\/+$/, "")}/chat/completions`,
        models,
      };
    };

    let lastError = "All AI API keys failed.";
    let lastLatency = 0;
    let hadRateLimit = false;

    for (const keyItem of keysToTry) {
      const { key, label, isPrimary } = keyItem;

      if (key.startsWith("mock_") || key.startsWith("test_")) {
        return {
          success: true,
          latencyMs: 110,
          message: `${label} verified successfully (Sandbox Mock Mode).`,
          model: model || "mock-engine",
          provider: "Sandbox",
        };
      }

      const configuredBaseUrl = baseUrl || (await this.getSetting("AI_BASE_URL"));
      const provider = resolveProvider(key, configuredBaseUrl, model);

      for (const targetModel of provider.models) {
        const startTime = Date.now();
        try {
          const res = await fetch(provider.endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${key}`,
            },
            body: JSON.stringify({
              model: targetModel,
              messages: [{ role: "user", content: "ping" }],
              max_tokens: 5,
            }),
            signal: AbortSignal.timeout(7000),
          });

          lastLatency = Date.now() - startTime;

          if (res.ok) {
            const prefix = hadRateLimit && !isPrimary
              ? `Primary key hit rate limit (429), but ${label} (${provider.providerName} • ${targetModel}) is ACTIVE and responded in ${lastLatency}ms! 🛡️⚡`
              : `${label} (${provider.providerName} • ${targetModel}) connected successfully in ${lastLatency}ms! ⚡`;

            return {
              success: true,
              latencyMs: lastLatency,
              message: prefix,
              model: targetModel,
              provider: provider.providerName,
            };
          }

          const errorData = await res.json().catch(() => ({}));
          const errMsg = errorData.error?.message || `HTTP Error ${res.status}: ${res.statusText}`;
          lastError = `${label} (${provider.providerName}): ${errMsg}`;

          if (res.status === 429) {
            hadRateLimit = true;
            // Try next model for this provider first before failing over to next key
            continue;
          }

          if (res.status === 404 || res.status === 400 || res.status === 500 || res.status === 502 || res.status === 503) {
            // Model unsupported on this API version or temporary server error, try next candidate model
            continue;
          }

          if (res.status === 401 || res.status === 402 || res.status === 403) {
            // Invalid key / quota exhausted, break to next key
            break;
          }
        } catch (fetchErr: any) {
          lastLatency = Date.now() - startTime;
          lastError = `${label} network error: ${fetchErr.message || "Unknown error"}`;
          continue;
        }
      }
    }

    return {
      success: false,
      latencyMs: lastLatency,
      message: lastError,
    };
  }
}
