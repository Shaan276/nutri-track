import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleSheetsService } from "@/lib/services/google-sheets/google-sheets.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/google-sheets/sync
 * Triggers on-demand synchronization of nutrition telemetry to the user's connected spreadsheet
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const result = await GoogleSheetsService.executeSync(session.user.id, {
      direction: body.direction || "PUSH_LOGS",
      dateRangeDays: body.dateRangeDays || 30,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("POST /api/google-sheets/sync error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to execute Google Sheets sync" },
      { status: 500 }
    );
  }
}
