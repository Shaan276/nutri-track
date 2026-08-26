import { QueryCategory } from "../../ai/query-classifier";

export interface AIDiagnosticEntry {
  id: string;
  timestamp: string;
  userId: string;
  conversationId: string;
  requestId: string;
  provider: string;
  model: string;
  queryCategory: QueryCategory;
  promptSnippet: string;
  fallbackUsed: boolean;
  retryUsed: boolean;
  latencyMs: number;
  success: boolean;
  validationStatus: "PASSED" | "RETRY_CORRECTED" | "FAILED";
  errorCategory?: string;
  responseLength: number;
  trace: {
    userMessageReceived: boolean;
    historyMessagesCount: number;
    personalizedContextLoaded: boolean;
    modelRequestCompleted: boolean;
    responseParsed: boolean;
    duplicateDetected: boolean;
    fallbackTriggered: boolean;
  };
}

export class AIDiagnosticsService {
  private static buffer: AIDiagnosticEntry[] = [];
  private static MAX_BUFFER_SIZE = 100;

  /**
   * Safely logs an AI request execution event in the diagnostics ring buffer
   */
  public static logDiagnostic(entry: Omit<AIDiagnosticEntry, "id" | "timestamp">): void {
    const fullEntry: AIDiagnosticEntry = {
      id: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...entry,
      promptSnippet:
        entry.promptSnippet.length > 80
          ? entry.promptSnippet.substring(0, 77) + "..."
          : entry.promptSnippet,
      trace: entry.trace || {
        userMessageReceived: true,
        historyMessagesCount: 0,
        personalizedContextLoaded: true,
        modelRequestCompleted: true,
        responseParsed: true,
        duplicateDetected: false,
        fallbackTriggered: entry.fallbackUsed,
      },
    };

    this.buffer.unshift(fullEntry);
    if (this.buffer.length > this.MAX_BUFFER_SIZE) {
      this.buffer.pop();
    }
  }

  /**
   * Retrieves the most recent AI diagnostic events for the Admin Panel
   */
  public static getRecentDiagnostics(limit: number = 30): AIDiagnosticEntry[] {
    return this.buffer.slice(0, limit);
  }

  /**
   * Retrieves aggregated AI query performance metrics
   */
  public static getMetricsSummary(): {
    totalRequests: number;
    successRate: number;
    avgLatencyMs: number;
    categoryBreakdown: Record<QueryCategory, number>;
  } {
    const total = this.buffer.length;
    if (total === 0) {
      return {
        totalRequests: 0,
        successRate: 100,
        avgLatencyMs: 0,
        categoryBreakdown: {
          GENERAL: 0,
          HEALTH_GENERAL: 0,
          HEALTH_PERSONALIZED: 0,
          NUTRI_TRACK_DATA: 0,
          ACTION_COMMAND: 0,
          CASUAL_CHAT: 0,
        },
      };
    }

    const successful = this.buffer.filter((b) => b.success).length;
    const avgLatency = Math.round(
      this.buffer.reduce((acc, b) => acc + b.latencyMs, 0) / total
    );

    const breakdown: Record<QueryCategory, number> = {
      GENERAL: 0,
      HEALTH_GENERAL: 0,
      HEALTH_PERSONALIZED: 0,
      NUTRI_TRACK_DATA: 0,
      ACTION_COMMAND: 0,
      CASUAL_CHAT: 0,
    };

    for (const item of this.buffer) {
      breakdown[item.queryCategory] = (breakdown[item.queryCategory] || 0) + 1;
    }

    return {
      totalRequests: total,
      successRate: Math.round((successful / total) * 100),
      avgLatencyMs: avgLatency,
      categoryBreakdown: breakdown,
    };
  }
}
