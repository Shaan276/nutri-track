import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NotificationService } from "@/lib/services/notification.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await NotificationService.markAllAsRead(session.user.id);
    return NextResponse.json({ success: true, count: result.count });
  } catch (error: any) {
    console.error("POST /api/notifications/mark-all-read error:", error);
    return NextResponse.json({ error: error.message || "Failed to mark all as read" }, { status: 500 });
  }
}