import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleSheetsService } from "@/lib/services/google-sheets/google-sheets.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/google-sheets/test
 * Validates and tests the connected Google Spreadsheet or Webhook URL.
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await GoogleSheetsService.testConnection(session.user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("POST /api/google-sheets/test error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to test spreadsheet connection" },
      { status: 500 }
    );
  }
}
