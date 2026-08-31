import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SystemSettingsService } from "@/lib/services/admin/system-settings.service";
import { AIKeyManager } from "@/lib/ai/key-manager";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/diagnostics
 * Returns live AI engine diagnostic metrics:
 * Active Provider, Active Model, Key Status, Fallbacks, and Connection Health.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const keyMgr = AIKeyManager.getInstance();
    await keyMgr.syncWithDatabase();

    const [activeModel, baseUrl] = await Promise.all([
      SystemSettingsService.getSetting("AI_MODEL", "gemini-2.5-flash"),
      SystemSettingsService.getSetting("AI_BASE_URL", ""),
    ]);

    const connectionTest = await SystemSettingsService.testAIConnection();
    const configuredKeys = keyMgr.getAllConfiguredKeys();

    return NextResponse.json({
      success: true,
      diagnostics: {
        activeProvider: connectionTest.provider || "Auto-Detected",
        activeModel: connectionTest.model || activeModel,
        apiStatus: connectionTest.success ? "HEALTHY" : "FAILED",
        latencyMs: connectionTest.latencyMs || null,
        message: connectionTest.message,
        baseUrl: baseUrl || "Default Provider Endpoint",
        configuredKeysCount: configuredKeys.length,
        standbyFallbacks: configuredKeys.filter(k => k.index > 0).map(k => ({
          label: k.label,
          index: k.index,
          isConfigured: true,
        })),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/diagnostics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve diagnostics." },
      { status: 500 }
    );
  }
}
