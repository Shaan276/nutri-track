import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SystemSettingsService } from "@/lib/services/admin/system-settings.service";
import { z } from "zod";

export const dynamic = "force-dynamic";

const testAISchema = z.object({
  apiKey: z.string().optional(),
  model: z.string().optional(),
  baseUrl: z.string().optional(),
});

/**
 * POST /api/admin/settings/test-ai
 * Tests OpenAI API Key connectivity and reports response latency.
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = testAISchema.safeParse(body);
    const data = parsed.success ? parsed.data : {};

    const result = await SystemSettingsService.testAIConnection(
      data.apiKey,
      data.model,
      data.baseUrl
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("AI connection test failed:", error);
    return NextResponse.json({ success: false, message: error.message || "Failed to test AI connection" }, { status: 500 });
  }
}
