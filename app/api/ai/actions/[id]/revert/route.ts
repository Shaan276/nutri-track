import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NutriTrackActionBridge } from "@/lib/ai/action-bridge";

export const dynamic = "force-dynamic";

/**
 * POST /api/ai/actions/[id]/revert
 * Reverts a previously executed action using its stored previous state snapshot.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Action log ID is required" }, { status: 400 });
    }

    const result = await NutriTrackActionBridge.revertAction(session.user.id, id);

    return NextResponse.json({
      success: true,
      result,
      message: result.message,
    });
  } catch (error: any) {
    console.error("POST /api/ai/actions/[id]/revert error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to revert action" },
      { status: 400 }
    );
  }
}
