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
  usagePercent: number; // 0 to 100% capacity usage
  lastUsedAt: number | null;
}

export class AIKeyManager {
  private static instance: AIKeyManager;
  private keyStates: KeyState[] = [];
  private cooldownDurationMs = 3 * 1000; // 3 seconds cooldown on 429
  private mockMode = false;
  private customKeys: Record<number, string> = {};

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
   * Initializes or re-reads keys from environment variables and in-memory cache
   */
  public initializeKeys(): void {
    const rawKeys = [
      this.customKeys[0] || process.env.AI_API_KEY_1 || process.env.OPENAI_API_KEY || process.env.AI_API_KEY || "",
      this.customKeys[1] || process.env.AI_API_KEY_2 || process.env.OPENAI_API_KEY_FALLBACK_1 || "",
      this.customKeys[2] || process.env.AI_API_KEY_3 || process.env.OPENAI_API_KEY_FALLBACK_2 || "",
    ];

    this.keyStates = rawKeys.map((key, idx) => ({
      index: idx,
      label: `AI_API_KEY_${idx + 1}`,
      hasKey: this.mockMode || (!!key && key.trim().length > 0),
      status: this.mockMode || (!!key && key.trim().length > 0) ? "HEALTHY" : "UNAVAILABLE",
      cooldownUntil: null,
      consecutiveErrors: 0,
      totalRequests: 0,
      usagePercent: 0,
      lastUsedAt: null,
    }));
  }

  /**
   * Sets a dynamic custom key at runtime (e.g. from Admin Settings)
   */
  public setCustomKey(index: number, key: string): void {
    this.customKeys[index] = key;
    if (this.keyStates[index]) {
      this.keyStates[index].hasKey = !!key && key.trim().length > 0;
      this.keyStates[index].status = key && key.trim().length > 0 ? "HEALTHY" : "UNAVAILABLE";
    }
  }

  /**
   * Retrieves the raw key for a given index strictly on the server side.
   * Checks runtime custom keys first, then environment variables.
   */
  public getRawKey(index: number): string {
    if (this.mockMode) {
      return `mock_key_tier_${index + 1}`;
    }
    if (this.customKeys[index]) {
      return this.customKeys[index];
    }
    if (index === 0) {
      return process.env.AI_API_KEY_1 || process.env.OPENAI_API_KEY || process.env.AI_API_KEY || "";
    }
    if (index === 1) {
      return process.env.AI_API_KEY_2 || process.env.OPENAI_API_KEY_FALLBACK_1 || "";
    }
    if (index === 2) {
      return process.env.AI_API_KEY_3 || process.env.OPENAI_API_KEY_FALLBACK_2 || "";
    }
    return "";
  }

  /**
   * Asynchronously synchronizes keys from database SystemSettingsService if available
   */
  public async syncWithDatabase(): Promise<void> {
    try {
      const [k1, k2, k3] = await Promise.all([
        SystemSettingsService.getSetting("OPENAI_API_KEY").catch(() => null),
        SystemSettingsService.getSetting("OPENAI_API_KEY_FALLBACK_1").catch(() => null),
        SystemSettingsService.getSetting("OPENAI_API_KEY_FALLBACK_2").catch(() => null),
      ]);

      if (k1) this.setCustomKey(0, k1);
      if (k2) this.setCustomKey(1, k2);
      if (k3) this.setCustomKey(2, k3);
    } catch {
      // Safe fallback
    }
  }

  /**
   * Selects the highest-priority healthy key available.
   * If Key 1 usage > 90%, preemptively rotates to Key 2 (and Key 3) before hitting hard limit!
   */
  public getActiveKey(): { key: string; index: number; label: string } | null {
    const now = Date.now();

    // 1. Recover keys whose cooldown has expired
    for (const state of this.keyStates) {
      if (state.status === "COOLDOWN" && state.cooldownUntil && now >= state.cooldownUntil) {
        state.status = "HEALTHY";
        state.cooldownUntil = null;
        state.consecutiveErrors = 0;
        state.usagePercent = Math.max(0, state.usagePercent - 30); // reset usage pressure on recovery
      }
    }

    // 2. Select in strict priority order:
    // If a key has usage >= 90% (NEAR_LIMIT) and a subsequent healthy key exists, fall back preemptively!
    for (let i = 0; i < this.keyStates.length; i++) {
      const state = this.keyStates[i];
      const rawKey = this.getRawKey(i);
      const isKeyPresent = (state.hasKey || this.mockMode || !!rawKey);

      if (isKeyPresent && state.status !== "COOLDOWN" && state.status !== "UNAVAILABLE") {
        // Preemptive >90% Hard Limit Fallback Check
        if (state.usagePercent >= 90 && i < this.keyStates.length - 1) {
          const nextState = this.keyStates[i + 1];
          const nextRaw = this.getRawKey(i + 1);
          if ((nextState.hasKey || !!nextRaw) && nextState.status === "HEALTHY") {
            console.log(`[AIKeyManager] Key ${state.label} is at ${state.usagePercent}% capacity (>90%). Preemptively failing over to ${nextState.label}...`);
            nextState.totalRequests += 1;
            nextState.lastUsedAt = now;
            return {
              key: nextRaw || this.getRawKey(i + 1),
              index: i + 1,
              label: nextState.label,
            };
          }
        }

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

    // 3. Resilient Fallback: If all keys are marked in cooldown/exhausted but a valid raw key exists, auto-recover immediately!
    for (let i = 0; i < this.keyStates.length; i++) {
      const raw = this.getRawKey(i);
      if (raw && raw.trim().length > 0) {
        const state = this.keyStates[i];
        state.status = "HEALTHY";
        state.cooldownUntil = null;
        state.consecutiveErrors = 0;
        state.totalRequests += 1;
        state.lastUsedAt = now;
        return {
          key: raw,
          index: i,
          label: state.label,
        };
      }
    }

    if (this.mockMode) {
      return { key: "mock_key_tier_1", index: 0, label: "AI_API_KEY_1" };
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
   * Records capacity or token usage pressure for a key (0-100%)
   */
  public recordUsage(index: number, percent: number): void {
    if (this.keyStates[index]) {
      this.keyStates[index].usagePercent = Math.min(100, Math.max(0, percent));
      if (this.keyStates[index].usagePercent >= 90) {
        this.keyStates[index].status = "NEAR_LIMIT";
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
      state.usagePercent = 100;
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
      this.keyStates[index].usagePercent = 100;
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
        usagePercent: state.usagePercent,
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
