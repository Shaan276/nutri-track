import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FoodService } from "@/lib/services/food.service";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

/**
 * PATCH /api/foods/[id]/favorite
 * Toggle favorite status on a food item.
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await FoodService.toggleFavorite(params.id, session.user.id);

    return NextResponse.json({
      status: "success",
      message: `Food item ${updated.isFavorite ? "added to" : "removed from"} favorites`,
      isFavorite: updated.isFavorite,
      food: updated,
    });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Food item not found" }, { status: 404 });
    }
    if (error.message === "UNAUTHORIZED_ACCESS") {
      return NextResponse.json({ error: "Forbidden: You cannot modify this food item" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to update favorite status" }, { status: 500 });
  }
}
