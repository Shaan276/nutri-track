import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminService } from "@/lib/services/admin/admin.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/users/[id]/password
 * Allows authorized administrators to change an existing user's password.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { password } = body;

    if (!password || password.trim().length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    const result = await AdminService.updateUserPassword(session.user.id, params.id, password.trim());

    return NextResponse.json({
      success: true,
      message: "Password updated successfully.",
      result,
    });
  } catch (error: any) {
    console.error("Admin change user password error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user password" },
      { status: 500 }
    );
  }
}
