import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FeatureAccessService, FeatureAccessStatus } from "@/lib/services/admin/feature-access.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/features
 * Admin endpoint to list all registered app features, statuses, and audit trail.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const features = await FeatureAccessService.getAllFeatures();
    const auditLogs = await FeatureAccessService.getAuditLogs();

    return NextResponse.json({
      success: true,
      features,
      auditLogs,
    });
  } catch (error: any) {
    console.error("GET /api/admin/features error:", error);
    return NextResponse.json({ error: error.message || "Failed to load features" }, { status: 500 });
  }
}

/**
 * POST /api/admin/features
 * Admin endpoint to update feature access status.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
    }

    const body = await req.json();
    const { key, status, reason } = body;

    if (!key || !status) {
      return NextResponse.json({ error: "Feature 'key' and 'status' are required." }, { status: 400 });
    }

    const validStatuses: FeatureAccessStatus[] = ["LIVE", "COMING_SOON", "DISABLED", "ADMIN_ONLY", "BETA"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const result = await FeatureAccessService.updateFeatureStatus(
      key,
      status,
      session.user.id,
      reason
    );

    return NextResponse.json({
      success: true,
      message: `Feature '${result.feature.name}' updated to ${status}.`,
      feature: result.feature,
    });
  } catch (error: any) {
    console.error("POST /api/admin/features error:", error);
    return NextResponse.json({ error: error.message || "Failed to update feature status" }, { status: 500 });
  }
}
