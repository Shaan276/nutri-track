import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { IntegrationService } from "@/lib/services/integrations/integration.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/integrations/google-fit/disconnect
 * Disconnects and removes Google Fit integration records.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await IntegrationService.disconnectIntegration(session.user.id, "GOOGLE_FIT" as any);
    return NextResponse.json({ success: true, message: "Disconnected successfully" });
  } catch (err: any) {
    console.error("POST /api/integrations/google-fit/disconnect error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to disconnect Google Fit" },
      { status: 500 }
    );
  }
}
