import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminService } from "@/lib/services/admin/admin.service";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { status, adminResponse } = body;
    if (!status) {
      return NextResponse.json({ error: "Status is required." }, { status: 400 });
    }

    const updated = await AdminService.updateFeatureRequest(
      session.user.id,
      params.id,
      status,
      adminResponse
    );

    return NextResponse.json({ success: true, featureRequest: updated });
  } catch (error: any) {
    console.error("Admin feature request update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update feature request" }, { status: 500 });
  }
}