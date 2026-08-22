import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NotificationService } from "@/lib/services/notification.service";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notification = await NotificationService.markAsRead(session.user.id, params.id);
    return NextResponse.json({ success: true, notification });
  } catch (error: any) {
    console.error("PATCH /api/notifications/[id] error:", error);
    const status = error.message?.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json({ error: error.message || "Failed to update notification" }, { status });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notification = await NotificationService.deleteNotification(session.user.id, params.id);
    return NextResponse.json({ success: true, notification });
  } catch (error: any) {
    console.error("DELETE /api/notifications/[id] error:", error);
    const status = error.message?.includes("Unauthorized") ? 403 : 500;
    return NextResponse.json({ error: error.message || "Failed to delete notification" }, { status });
  }
}