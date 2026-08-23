import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminService } from "@/lib/services/admin/admin.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
    }

    const result = await AdminService.clearAllSystemFoodDatabase(session.user.id);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/admin/clear-food-database error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clear system food database" },
      { status: 500 }
    );
  }
}
