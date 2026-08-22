import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminService } from "@/lib/services/admin/admin.service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const metrics = await AdminService.getAdminMetrics();
    return NextResponse.json({ success: true, metrics });
  } catch (error: any) {
    console.error("Admin metrics API error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch admin metrics" }, { status: 500 });
  }
}
