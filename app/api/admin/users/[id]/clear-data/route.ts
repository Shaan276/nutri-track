import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminService } from "@/lib/services/admin/admin.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const result = await AdminService.clearUserData(params.id, session.user.id);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Admin clear user data API error:", error);
    return NextResponse.json({ error: error.message || "Failed to clear user data" }, { status: 400 });
  }
}
