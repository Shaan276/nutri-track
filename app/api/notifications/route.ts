import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NotificationService } from "@/lib/services/notification.service";
import { getNotificationsQuerySchema } from "@/lib/validations/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = getNotificationsQuerySchema.safeParse({
      category: searchParams.get("category") || undefined,
      isRead: searchParams.get("isRead") || undefined,
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query parameters", details: parsed.error }, { status: 400 });
    }

    const result = await NotificationService.getNotifications(session.user.id, parsed.data);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch notifications" }, { status: 500 });
  }
}