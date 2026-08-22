import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ActivityService } from "@/lib/services/activity.service";
import { updateActivitySchema } from "@/lib/validations/activity";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

/**
 * PUT /api/activity/[id]
 * Updates an existing activity entry.
 */
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = updateActivitySchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid update data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const updated = await ActivityService.updateActivity(session.user.id, params.id, parseResult.data);

    return NextResponse.json({
      status: "success",
      message: "Activity updated successfully",
      entry: updated,
    });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Activity record not found" }, { status: 404 });
    }
    if (error.message === "UNAUTHORIZED_ACCESS") {
      return NextResponse.json({ error: "Forbidden: You cannot modify this activity record" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update activity record" }, { status: 500 });
  }
}

/**
 * DELETE /api/activity/[id]
 * Deletes an existing activity entry.
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ActivityService.deleteActivity(session.user.id, params.id);

    return NextResponse.json({
      status: "success",
      message: "Activity record removed successfully",
    });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Activity record not found" }, { status: 404 });
    }
    if (error.message === "UNAUTHORIZED_ACCESS") {
      return NextResponse.json({ error: "Forbidden: You cannot delete this activity record" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete activity record" }, { status: 500 });
  }
}
