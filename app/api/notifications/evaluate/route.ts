import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SmartReminderService } from "@/lib/services/smart-reminder.service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await SmartReminderService.evaluateReminders(session.user.id);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error("POST /api/notifications/evaluate error:", error);
    return NextResponse.json({ error: error.message || "Failed to evaluate reminders" }, { status: 500 });
  }
}