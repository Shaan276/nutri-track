import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminService } from "@/lib/services/admin/admin.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const userId = searchParams.get("userId") || undefined;

    const featureRequests = await AdminService.getFeatureRequests({ status, userId });
    return NextResponse.json({ success: true, featureRequests });
  } catch (error: any) {
    console.error("Admin feature requests list error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch feature requests" }, { status: 500 });
  }
}