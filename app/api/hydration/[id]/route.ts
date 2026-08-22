import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { HydrationService } from "@/lib/services/hydration.service";
import { updateHydrationSchema } from "@/lib/validations/hydration";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

/**
 * PUT /api/hydration/[id]
 * Updates amount, beverage type, time, or notes of an existing hydration entry.
 */
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = updateHydrationSchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid update data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const updated = await HydrationService.updateHydration(session.user.id, params.id, parseResult.data);

    return NextResponse.json({
      status: "success",
      message: "Hydration entry updated successfully",
      entry: updated,
    });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Hydration entry not found" }, { status: 404 });
    }
    if (error.message === "UNAUTHORIZED_ACCESS") {
      return NextResponse.json({ error: "Forbidden: You cannot modify this hydration entry" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update hydration entry" }, { status: 500 });
  }
}

/**
 * DELETE /api/hydration/[id]
 * Permanently removes a hydration entry.
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await HydrationService.deleteHydration(session.user.id, params.id);

    return NextResponse.json({
      status: "success",
      message: "Hydration entry removed successfully",
    });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Hydration entry not found" }, { status: 404 });
    }
    if (error.message === "UNAUTHORIZED_ACCESS") {
      return NextResponse.json({ error: "Forbidden: You cannot delete this hydration entry" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete hydration entry" }, { status: 500 });
  }
}
