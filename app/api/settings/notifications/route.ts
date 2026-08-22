import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NotificationService } from "@/lib/services/notification.service";
import { updateNotificationPreferencesSchema } from "@/lib/validations/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const preferences = await NotificationService.getPreferences(session.user.id);
    return NextResponse.json({ preferences });
  } catch (error: any) {
    console.error("GET /api/settings/notifications error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch notification preferences" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateNotificationPreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid preference payload", details: parsed.error }, { status: 400 });
    }

    const preferences = await NotificationService.updatePreferences(session.user.id, parsed.data);
    return NextResponse.json({ success: true, preferences });
  } catch (error: any) {
    console.error("PUT /api/settings/notifications error:", error);
    return NextResponse.json({ error: error.message || "Failed to update notification preferences" }, { status: 500 });
  }
}