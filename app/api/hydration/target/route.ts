import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { HydrationService } from "@/lib/services/hydration.service";
import { updateHydrationGoalSchema } from "@/lib/validations/hydration";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/hydration/target
 * Updates the user's personalized daily hydration target (ml).
 */
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = updateHydrationGoalSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid target volume";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const updatedProfile = await HydrationService.updateHydrationTarget(session.user.id, parseResult.data.targetMl);

    return NextResponse.json({
      status: "success",
      message: "Daily hydration goal updated successfully",
      targetMl: updatedProfile.dailyHydrationTargetMl,
    });
  } catch (error: any) {
    console.error("PATCH /api/hydration/target error:", error);
    return NextResponse.json({ error: "Failed to update hydration target" }, { status: 500 });
  }
}
