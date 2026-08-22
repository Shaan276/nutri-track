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
    const { status, role, reason } = body;

    let updatedUser = null;
    if (status) {
      if (!["PENDING_APPROVAL", "APPROVED", "REJECTED", "SUSPENDED"].includes(status)) {
        return NextResponse.json({ error: "Invalid status value." }, { status: 400 });
      }
      updatedUser = await AdminService.updateUserStatus(session.user.id, params.id, status, reason);
    }

    if (role) {
      if (!["USER", "ADMIN"].includes(role)) {
        return NextResponse.json({ error: "Invalid role value." }, { status: 400 });
      }
      updatedUser = await AdminService.updateUserRole(session.user.id, params.id, role);
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Admin user status update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update user status" }, { status: 500 });
  }
}