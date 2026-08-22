import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { IntegrationService } from "@/lib/services/integrations/integration.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/integrations
 * Lists all connected services for the authenticated user.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const integrations = await IntegrationService.getConnectedIntegrations(session.user.id);

    return NextResponse.json({
      status: "success",
      data: integrations,
    });
  } catch (error: any) {
    console.error("GET /api/integrations error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve connected integrations" },
      { status: 500 }
    );
  }
}
