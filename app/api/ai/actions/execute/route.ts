import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NutriTrackActionBridge } from "@/lib/ai/action-bridge";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/actions/execute
 * Safely executes a structured action on behalf of the authenticated user,
 * applies domain updates transactionally, and creates an audit log.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const actionInput = body.action || body.actionString || body.payload || body;
    const source = body.source || "CHATGPT_ACTION";
    const confirmed = body.confirmed === true;

    // Validate first
    const validation = await NutriTrackActionBridge.validateAction(session.user.id, actionInput);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.errors.join("; "),
          validation,
        },
        { status: 400 }
      );
    }

    // Check confirmation requirement
    if (validation.requiresConfirmation && !confirmed) {
      return NextResponse.json(
        {
          success: false,
          requiresConfirmation: true,
          message: "This action requires explicit user confirmation before changes are applied.",
          validation,
        },
        { status: 200 }
      );
    }

    // Execute
    const result = await NutriTrackActionBridge.executeAction(session.user.id, validation.parsedAction, source);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || result.message,
          result,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("POST /api/ai/actions/execute error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute action" },
      { status: 500 }
    );
  }
}
