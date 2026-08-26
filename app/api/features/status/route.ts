import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FeatureAccessService } from "@/lib/services/admin/feature-access.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/features/status
 * Returns map of feature accessibility for the current authenticated user.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role || "USER";
    const userId = session?.user?.id;

    const allFeatures = await FeatureAccessService.getAllFeatures();

    const accessMap: Record<string, { status: string; allowed: boolean; name: string; route: string }> = {};

    for (const f of allFeatures) {
      const access = await FeatureAccessService.canUserAccess(f.route, role, userId);
      accessMap[f.key] = {
        status: f.status,
        allowed: access.allowed,
        name: f.name,
        route: f.route,
      };
    }

    return NextResponse.json({
      success: true,
      features: accessMap,
      role,
    });
  } catch (error: any) {
    console.error("GET /api/features/status error:", error);
    return NextResponse.json({ error: "Failed to load feature statuses" }, { status: 500 });
  }
}
