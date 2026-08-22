import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminService } from "@/lib/services/admin/admin.service";

export const dynamic = "force-dynamic";

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const deleted = await AdminService.removePreApproval(params.id);
    return NextResponse.json({ success: true, entry: deleted });
  } catch (error: any) {
    console.error("Admin pre-approval delete error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete pre-approval" }, { status: 500 });
  }
}