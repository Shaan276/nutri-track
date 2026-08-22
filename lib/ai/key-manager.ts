import { SystemSettingsService } from "@/lib/services/admin/system-settings.service";

export type KeyStatus = "HEALTHY" | "NEAR_LIMIT" | "COOLDOWN" | "UNAVAILABLE";

export interface KeyState {
  index: number;
  label: string;
  hasKey: boolean;
  status: KeyStatus;
  cooldownUntil: number | null;
  consecutiveErrors: number;
  totalRequests: number;
  lastUsedAt: number | null;
}

export class AIKeyManager {
  private static instance: AIKeyManager;
  private keyStates: KeyState[] = [];
  private cooldownDurationMs = 5 * 60 * 1000; // 5 minutes cooldown on 429
  private mockMode = false;

  private constructor() {
    this.initializeKeys();
  }

  public static getInstance(): AIKeyManager {
    if (!AIKeyManager.instance) {
      AIKeyManager.instance = new AIKeyManager();
    }
    return AIKeyManager.instance;
  }

  /**
   * Initializes or re-reads keys from environment variables
   */
  public initializeKeys(): void {
    const rawKeys = [
      process.env.AI_API_KEY_1 || process.env.OPENAI_API_KEY || process.env.AI_API_KEY || "",
      process.env.AI_API_KEY_2 || process.env.OPENAI_API_KEY_FALLBACK_1 || "",
      process.env.AI_API_KEY_3 || process.env.OPENAI_API_KEY_FALLBACK_2 || "",
    ];

    this.keyStates = rawKeys.map((key, idx) => ({
      index: idx,
      label: `AI_API_KEY_${idx + 1}`,
      hasKey: this.mockMode || (!!key && key.trim().length > 0),
      status: this.mockMode || (!!key && key.trim().length > 0) ? "HEALTHY" : "UNAVAILABLE",
      cooldownUntil: null,
      consecutiveErrors: 0,
      totalRequests: 0,
      lastUsedAt: null,
    }));
  }

  /**
   * Retrieves the raw key for a given index strictly on the server side.
   * NEVER pass this key to the client or log it.
   */
  private getRawKey(index: number): string {
    if (this.mockMode) {
      return `mock_key_tier_${index + 1}`;
    }
    if (index === 0) {
      return process.env.AI_API_KEY_1 || process.env.OPENAI_API_KEY || process.env.AI_API_KEY || "";
    }
    if (index === 1) {
      return process.env.AI_API_KEY_2 || "";
    }
    if (index === 2) {
      return process.env.AI_API_KEY_3 || "";
    }
    return "";
  }

  /**
   * Selects the highest-priority healthy key available.
   * Checks cooldown expiration and returns the active key info.
   */
  public getActiveKey(): { key: string; index: number; label: string } | null {
    const now = Date.now();

    // 1. Recover keys whose cooldown has expired
    for (const state of this.keyStates) {
      if (state.status === "COOLDOWN" && state.cooldownUntil && now >= state.cooldownUntil) {
        state.status = "HEALTHY";
        state.cooldownUntil = null;
        state.consecutiveErrors = 0;
      }
    }

    // 2. Select in strict priority order: Key 1 -> Key 2 -> Key 3
    for (let i = 0; i < this.keyStates.length; i++) {
      const state = this.keyStates[i];
      if ((state.hasKey || this.mockMode) && (state.status === "HEALTHY" || state.status === "NEAR_LIMIT")) {
        const rawKey = this.getRawKey(i);
        if (rawKey || this.mockMode) {
          state.totalRequests += 1;
          state.lastUsedAt = now;
          return {
            key: rawKey,
            index: i,
            label: state.label,
          };
        }
      }
    }

    return null;
  }

  /**
   * Records a successful request for a key
   */
  public recordSuccess(index: number): void {
    if (this.keyStates[index]) {
      this.keyStates[index].consecutiveErrors = 0;
      if (this.keyStates[index].status === "COOLDOWN") {
        this.keyStates[index].status = "HEALTHY";
      }
    }
  }

  /**
   * Records a 429 Rate Limit or Quota Exhaustion response and enters cooldown
   */
  public recordRateLimit(index: number, customCooldownMs?: number): void {
    if (this.keyStates[index]) {
      const state = this.keyStates[index];
      const duration = customCooldownMs || this.cooldownDurationMs;
      state.status = "COOLDOWN";
      state.cooldownUntil = Date.now() + duration;
      state.consecutiveErrors += 1;
      console.warn(`[AIKeyManager] ${state.label} placed in cooldown for ${Math.round(duration / 1000)}s.`);
    }
  }

  /**
   * Records key exhaustion (e.g. invalid key or quota completely exhausted)
   */
  public recordExhaustion(index: number): void {
    if (this.keyStates[index]) {
      this.keyStates[index].status = "UNAVAILABLE";
      console.warn(`[AIKeyManager] ${this.keyStates[index].label} marked UNAVAILABLE.`);
    }
  }

  /**
   * Returns sanitized telemetry for admin monitoring (keys are masked).
   */
  public getStatusSummary(): Array<Omit<KeyState, "cooldownUntil"> & { isCooldown: boolean; remainingCooldownSeconds: number }> {
    const now = Date.now();
    return this.keyStates.map((state) => {
      const isCooldown = state.status === "COOLDOWN" && !!state.cooldownUntil && now < state.cooldownUntil;
      const remainingSeconds = isCooldown && state.cooldownUntil ? Math.max(0, Math.round((state.cooldownUntil - now) / 1000)) : 0;

      return {
        index: state.index,
        label: state.label,
        hasKey: state.hasKey,
        status: isCooldown ? "COOLDOWN" : state.status,
        consecutiveErrors: state.consecutiveErrors,
        totalRequests: state.totalRequests,
        lastUsedAt: state.lastUsedAt,
        isCooldown,
        remainingCooldownSeconds: remainingSeconds,
      };
    });
  }

  /**
   * Enables or disables mock mode for automated testing without real API tokens
   */
  public setMockMode(enabled: boolean): void {
    this.mockMode = enabled;
    if (enabled) {
      this.keyStates.forEach((s) => {
        s.hasKey = true;
        s.status = "HEALTHY";
        s.cooldownUntil = null;
      });
    } else {
      this.initializeKeys();
    }
  }

  /**
   * Resets all key states back to initial healthy state
   */
  public resetStates(): void {
    this.initializeKeys();
  }
}

export const keyManager = AIKeyManager.getInstance();
