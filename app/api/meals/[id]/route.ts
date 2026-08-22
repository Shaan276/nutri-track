import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NutritionService } from "@/lib/services/nutrition.service";
import { updateMealEntrySchema } from "@/lib/validations/meal";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

/**
 * PUT /api/meals/[id]
 * Updates quantity or meal type of a logged meal entry.
 */
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parseResult = updateMealEntrySchema.safeParse(body);

    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || "Invalid update data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const updated = await NutritionService.updateMealEntry(session.user.id, params.id, parseResult.data);

    return NextResponse.json({
      status: "success",
      message: "Meal entry updated successfully",
      entry: updated,
    });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Meal entry not found" }, { status: 404 });
    }
    if (error.message === "UNAUTHORIZED_ACCESS") {
      return NextResponse.json({ error: "Forbidden: You cannot modify this meal entry" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update meal entry" }, { status: 500 });
  }
}

/**
 * DELETE /api/meals/[id]
 * Removes a logged food entry from a meal.
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await NutritionService.deleteMealEntry(session.user.id, params.id);

    return NextResponse.json({
      status: "success",
      message: "Meal entry removed successfully",
    });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Meal entry not found" }, { status: 404 });
    }
    if (error.message === "UNAUTHORIZED_ACCESS") {
      return NextResponse.json({ error: "Forbidden: You cannot delete this meal entry" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to delete meal entry" }, { status: 500 });
  }
}
