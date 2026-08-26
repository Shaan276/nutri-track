import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NutriTrackActionBridge } from "@/lib/ai/action-bridge";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/actions/parse
 * Parses and validates an action payload or text string without modifying the database.
 * Returns the parsed schema, diffs, and confirmation requirement.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const actionInput = body.action || body.actionString || body.payload || body;

    const validation = await NutriTrackActionBridge.validateAction(session.user.id, actionInput);

    return NextResponse.json({
      success: validation.isValid,
      validation,
    });
  } catch (error: any) {
    console.error("POST /api/ai/actions/parse error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse action" },
      { status: 400 }
    );
  }
}
