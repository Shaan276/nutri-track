import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleSheetsConnectionService } from "@/lib/services/google-sheets/google-sheets.connection.service";
import { connectSpreadsheetSchema } from "@/lib/validations/google-sheets";

export const dynamic = "force-dynamic";

/**
 * GET /api/google-sheets/connection
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await GoogleSheetsConnectionService.getConnection(session.user.id);
    return NextResponse.json({ success: true, data: connection });
  } catch (err: any) {
    console.error("GET /api/google-sheets/connection error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch Google Sheets connection" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/google-sheets/connection
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = connectSpreadsheetSchema.parse(body);

    const connection = await GoogleSheetsConnectionService.connectSpreadsheet(
      session.user.id,
      validated.spreadsheetUrl,
      validated.sheetTitle
    );

    return NextResponse.json({ success: true, data: connection });
  } catch (err: any) {
    console.error("POST /api/google-sheets/connection error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to connect Google Spreadsheet" },
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/google-sheets/connection
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await GoogleSheetsConnectionService.disconnectSpreadsheet(session.user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    console.error("DELETE /api/google-sheets/connection error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to disconnect Google Spreadsheet" },
      { status: 500 }
    );
  }
}
