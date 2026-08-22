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
    try {
      if (typeof pool.systemSetting?.findUnique === "function") {
        const record = await pool.systemSetting.findUnique({ where: { key } });
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
    const dbRecords = await pool.systemSetting.findMany();
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
    const def = SYSTEM_SETTING_DEFINITIONS[key];
    const category = def ? def.category : "GENERAL";
    const isSecret = def ? def.isSecret : false;
    const description = def ? def.description : null;

    const updated = await pool.systemSetting.upsert({
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
   * Tests OpenAI API Key connectivity and returns round-trip latency.
   */
  static async testAIConnection(
    apiKey?: string,
    model?: string,
    baseUrl?: string
  ): Promise<{ success: boolean; latencyMs?: number; message: string; model?: string }> {
    const resolvedKey = apiKey || (await this.getSetting("OPENAI_API_KEY"));
    const resolvedModel = model || (await this.getSetting("AI_MODEL", "gpt-4o-mini"));
    const resolvedBaseUrl = baseUrl || (await this.getSetting("AI_BASE_URL", "https://api.openai.com/v1"));

    if (!resolvedKey || resolvedKey.trim() === "") {
      return {
        success: false,
        message: "No OpenAI API key provided or configured in settings.",
      };
    }

    if (resolvedKey.startsWith("mock_") || resolvedKey.startsWith("test_")) {
      return {
        success: true,
        latencyMs: 120,
        message: "Sandbox test API key verified successfully.",
        model: resolvedModel,
      };
    }

    const startTime = Date.now();
    try {
      const endpoint = `${resolvedBaseUrl.replace(/\/+$/, "")}/chat/completions`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resolvedKey}`,
        },
        body: JSON.stringify({
          model: resolvedModel,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5,
        }),
      });

      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData.error?.message || `HTTP Error ${res.status}: ${res.statusText}`;
        return {
          success: false,
          latencyMs,
          message: `OpenAI rejected credentials: ${errMsg}`,
        };
      }

      return {
        success: true,
        latencyMs,
        message: `Connected successfully! Response received in ${latencyMs}ms.`,
        model: resolvedModel,
      };
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - startTime,
        message: `Network connection failed: ${err.message || "Unknown error"}`,
      };
    }
  }
}
